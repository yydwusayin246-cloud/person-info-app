// ==================== IndexedDB 数据库（数据存在手机本地） ====================
const DB_NAME = 'PersonInfoDB';
const DB_VERSION = 1;
const STORE_NAME = 'people';
const OLD_STORAGE_KEY = 'personInfoData'; // 旧版 localStorage 键名，用于首次迁移

/** HTML 转义，防止 XSS 攻击 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 打开 IndexedDB 数据库（单例复用连接）
 * 数据库文件存储在手机/浏览器的本地文件系统中，不会被系统随意清理
 */
let _dbPromise = null;

function openDB() {
    if (_dbPromise) return _dbPromise;

    _dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            db.onclose = () => {
                _dbPromise = null;
            };
            resolve(db);
        };

        request.onerror = (event) => {
            _dbPromise = null;
            console.error('❌ IndexedDB 打开失败:', event.target.error);
            reject(event.target.error);
        };
    });

    return _dbPromise;
}

// ==================== 数据 CRUD 操作（全部基于 IndexedDB） ====================

async function getPeople() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('❌ 读取数据失败:', err);
        return [];
    }
}

async function savePerson(person) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(person);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function deletePersonFromDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/** 批量保存人员（单事务，高性能导入） */
async function batchSavePeople(people) {
    if (!people || people.length === 0) return 0;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error('批量保存事务被中止'));
        transaction.oncomplete = () => resolve(people.length);
        people.forEach(person => store.put(person));
    });
}

/** 替换全部数据（用于导入-替换模式） */
async function replaceAllPeople(people) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error('事务被中止'));
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => people.forEach(person => store.put(person));
        clearRequest.onerror = () => reject(clearRequest.error);
        transaction.oncomplete = () => resolve(people.length);
    });
}

// ==================== OPFS 自动备份（手机本地文件） ====================

const BACKUP_FILENAME = 'person_info_backup.json';

/** 获取 OPFS 备份目录 */
async function getBackupDir() {
    const root = await navigator.storage.getDirectory();
    return root;
}

/** 自动备份：每次数据变更后调用，写入 OPFS 固定文件 */
async function autoBackup() {
    try {
        const people = await getPeople();
        const backupData = {
            version: 2,
            updatedAt: new Date().toISOString(),
            totalCount: people.length,
            data: people
        };
        const root = await getBackupDir();
        const fileHandle = await root.getFileHandle(BACKUP_FILENAME, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(backupData, null, 2));
        await writable.close();
        console.log('✅ 自动备份完成 (' + people.length + ' 条)');
    } catch (err) {
        console.warn('⚠️ 自动备份失败（不影响使用）:', err.message);
    }
}

/** 从 OPFS 恢复备份（如 IndexedDB 被清空时使用） */
async function restoreFromBackup() {
    try {
        const root = await getBackupDir();
        const fileHandle = await root.getFileHandle(BACKUP_FILENAME);
        const file = await fileHandle.getFile();
        const text = await file.text();
        const backup = JSON.parse(text);
        if (backup.data && Array.isArray(backup.data) && backup.data.length > 0) {
            return backup;
        }
    } catch (err) {
        // 文件不存在是正常的（首次使用）
    }
    return null;
}

// ==================== 首次运行：从旧版 localStorage 迁移数据 ====================

async function migrateFromLocalStorage() {
    try {
        const oldData = localStorage.getItem(OLD_STORAGE_KEY);
        if (!oldData) return;
        const people = JSON.parse(oldData);
        if (!Array.isArray(people) || people.length === 0) return;
        const existing = await getPeople();
        if (existing.length > 0) {
            localStorage.removeItem(OLD_STORAGE_KEY);
            return;
        }
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        let migratedCount = 0;
        people.forEach(person => { store.put(person); migratedCount++; });
        await new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
        localStorage.removeItem(OLD_STORAGE_KEY);
        console.log(`✅ 已从 localStorage 迁移 ${migratedCount} 条数据到手机本地数据库`);
    } catch (err) {
        console.error('⚠️ 数据迁移失败:', err);
    }
}

// ==================== 应用初始化 ====================

document.addEventListener('DOMContentLoaded', async () => {
    await migrateFromLocalStorage();
    // IndexedDB 为空时尝试从 OPFS 恢复
    const people = await getPeople();
    if (people.length === 0) {
        const backup = await restoreFromBackup();
        if (backup && backup.data.length > 0) {
            await replaceAllPeople(backup.data);
            const restoredDate = new Date(backup.updatedAt).toLocaleString('zh-CN');
            console.log('🔄 已从 OPFS 备份恢复 ' + backup.data.length + ' 条数据 (备份时间: ' + restoredDate + ')');
        }
    }
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupFormHandler();
    setupSearchHandler();
    refreshList();
}

// ==================== 设置导航 ====================

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn[data-screen]');
    const screens = document.querySelectorAll('.screen');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.dataset.screen;
            if (!screenId) return;

            if (screenId !== 'input') {
                cancelEdit();
            }

            navBtns.forEach(b => b.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetScreen = document.getElementById(`${screenId}-screen`);
            if (targetScreen) {
                targetScreen.classList.add('active');
            }

            if (screenId === 'list') {
                refreshList();
            }
        });
    });
}

// ==================== 设置表单提交（统一处理新增和编辑） ====================

function setupFormHandler() {
    const form = document.getElementById('input-form');

    // 备注字数统计
    const noteField = document.getElementById('note');
    const noteCount = document.getElementById('note-count');
    if (noteField && noteCount) {
        noteField.addEventListener('input', () => {
            noteCount.textContent = noteField.value.length;
        });
    }

    const resetBtn = form.querySelector('button[type="reset"]');
    resetBtn.addEventListener('click', (e) => {
        if (form.dataset.editId) {
            e.preventDefault();
            cancelEdit();
            document.querySelector('[data-screen="list"]').click();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isEditing = !!form.dataset.editId;
        const personId = isEditing ? parseInt(form.dataset.editId) : Date.now();

        // 收集多选 checkbox 值
        const shopLevel = Array.from(document.querySelectorAll('input[name="shopLevel"]:checked'))
            .map(cb => cb.value).join('、');
        const address = Array.from(document.querySelectorAll('input[name="address"]:checked'))
            .map(cb => cb.value).join('、');
        const shopType = Array.from(document.querySelectorAll('input[name="shopType"]:checked'))
            .map(cb => cb.value).join('、');

        const person = {
            id: personId,
            name: document.getElementById('name').value.trim(),
            shopLevel: shopLevel,
            skillLevel: document.getElementById('skill-level').value,
            address: address,
            shopType: shopType,
            willingness: document.getElementById('willingness').value,
            note: document.getElementById('note').value.trim(),
        };

        if (!person.name) { alert('请输入姓名！'); return; }
        if (!person.shopLevel) { alert('请选择店铺挡位！'); return; }
        if (!person.skillLevel) { alert('请选择行业熟练程度！'); return; }
        if (!person.willingness) { alert('请选择意愿程度！'); return; }

        await savePerson(person);
        autoBackup(); // 自动备份到 OPFS（不阻塞 UI）

        form.reset();
        delete form.dataset.editId;
        restoreEditUI();
        // 重置字符计数
        document.getElementById('note-count').textContent = '0';

        alert(isEditing ? '✅ 信息已更新！' : '✅ 信息已保存！');

        setTimeout(() => {
            document.querySelector('[data-screen="list"]').click();
        }, 500);
    });
}

// ==================== 搜索功能 ====================

function setupSearchHandler() {
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('clear-search-btn').addEventListener('click', clearSearchFilters);
}

async function performSearch() {
    const name = document.getElementById('search-name').value.trim().toLowerCase();
    const skill = document.getElementById('search-skill').value;
    const willingness = document.getElementById('search-willingness').value;

    // 收集多选 checkbox 值
    const shopList = Array.from(document.querySelectorAll('input[name="searchShop"]:checked'))
        .map(cb => cb.value);
    const addrList = Array.from(document.querySelectorAll('input[name="searchAddress"]:checked'))
        .map(cb => cb.value);
    const typeList = Array.from(document.querySelectorAll('input[name="searchShopType"]:checked'))
        .map(cb => cb.value);

    let results = await getPeople();

    if (name) results = results.filter(p => p.name.toLowerCase().includes(name));
    if (skill) results = results.filter(p => p.skillLevel === skill);
    if (willingness) results = results.filter(p => p.willingness === willingness);

    // 多选字段：匹配任一选中值即通过 (OR 逻辑)
    if (shopList.length > 0) {
        results = results.filter(p => shopList.some(v => p.shopLevel && p.shopLevel.includes(v)));
    }
    if (addrList.length > 0) {
        results = results.filter(p => addrList.some(v => p.address && p.address.includes(v)));
    }
    if (typeList.length > 0) {
        results = results.filter(p => typeList.some(v => p.shopType && p.shopType.includes(v)));
    }

    displaySearchResults(results);
}

function clearSearchFilters() {
    document.getElementById('search-name').value = '';
    document.getElementById('search-skill').value = '';
    document.getElementById('search-willingness').value = '';
    // 清空所有多选 checkbox
    document.querySelectorAll('input[name="searchShop"], input[name="searchAddress"], input[name="searchShopType"]')
        .forEach(cb => { cb.checked = false; });
    document.getElementById('search-results').style.display = 'none';
    document.getElementById('no-results').style.display = 'none';
}

function displaySearchResults(results) {
    const resultsDiv = document.getElementById('search-results');
    const noResultsDiv = document.getElementById('no-results');
    const tbody = document.getElementById('search-table-body');
    const resultCount = document.getElementById('result-count');

    if (results.length === 0) {
        resultsDiv.style.display = 'none';
        noResultsDiv.style.display = 'block';
        return;
    }

    resultsDiv.style.display = 'block';
    noResultsDiv.style.display = 'none';
    resultCount.textContent = results.length;
    tbody.innerHTML = '';

    results.forEach((person, index) => {
        const row = document.createElement('tr');
        const willClass = getWillingnessClass(person.willingness);
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(person.name)}</td>
            <td>${escapeHtml(person.shopLevel) || '—'}</td>
            <td>${escapeHtml(person.skillLevel) || '—'}</td>
            <td>${escapeHtml(person.address) || '—'}</td>
            <td>${escapeHtml(person.shopType) || '—'}</td>
            <td><span class="will-tag ${willClass}">${escapeHtml(person.willingness) || '—'}</span></td>
            <td class="note-cell">${escapeHtml(person.note) || '—'}</td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== 列表显示 ====================

async function refreshList() {
    const people = await getPeople();
    const tbody = document.getElementById('table-body');
    const totalCount = document.getElementById('total-count');

    totalCount.textContent = people.length;

    if (people.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-message">暂无数据，请先在"输入信息"页面添加</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    people.forEach((person, index) => {
        const row = document.createElement('tr');
        const willClass = getWillingnessClass(person.willingness);
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(person.name)}</td>
            <td>${escapeHtml(person.shopLevel) || '—'}</td>
            <td>${escapeHtml(person.skillLevel) || '—'}</td>
            <td>${escapeHtml(person.address) || '—'}</td>
            <td>${escapeHtml(person.shopType) || '—'}</td>
            <td><span class="will-tag ${willClass}">${escapeHtml(person.willingness) || '—'}</span></td>
            <td class="note-cell">${escapeHtml(person.note) || '—'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-edit" onclick="editPerson(${person.id})">✏️ 编辑</button>
                    <button class="btn btn-danger" onclick="deletePerson(${person.id})">🗑️ 删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== 删除人员 ====================

async function deletePerson(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    await deletePersonFromDB(id);
    await refreshList();
    autoBackup(); // 自动备份
    alert('✅ 记录已删除！');
}

/** 意愿程度对应的颜色 CSS 类名 */
function getWillingnessClass(value) {
    const map = {
        '未联系': 'will-gray',
        '意愿低': 'will-purple',
        '洽谈中': 'will-orange',
        '意愿高': 'will-blue',
        '已签约': 'will-green'
    };
    return map[value] || '';
}

// ==================== 编辑人员 ====================

function cancelEdit() {
    const form = document.getElementById('input-form');
    if (form.dataset.editId) {
        form.reset();
        delete form.dataset.editId;
        restoreEditUI();
    }
}

function setEditUI() {
    const heading = document.querySelector('#input-screen h2');
    const submitBtn = document.querySelector('#input-form button[type="submit"]');
    const resetBtn = document.querySelector('#input-form button[type="reset"]');
    const form = document.getElementById('input-form');

    if (heading) {
        heading.textContent = '✏️ 编辑人员信息';
        heading.style.color = '#E91E63';
    }
    if (submitBtn) {
        submitBtn.textContent = '💾 更新';
        submitBtn.style.background = '#E91E63';
    }
    if (resetBtn) {
        resetBtn.textContent = '❌ 取消编辑';
        resetBtn.style.background = '#ff6b6b';
        resetBtn.style.color = 'white';
    }
    form.classList.add('editing');
}

function restoreEditUI() {
    const heading = document.querySelector('#input-screen h2');
    const submitBtn = document.querySelector('#input-form button[type="submit"]');
    const resetBtn = document.querySelector('#input-form button[type="reset"]');
    const form = document.getElementById('input-form');

    if (heading) {
        heading.textContent = '📝 输入人员信息';
        heading.style.color = '#333';
    }
    if (submitBtn) {
        submitBtn.textContent = '✅ 保存';
        submitBtn.style.background = '';
    }
    if (resetBtn) {
        resetBtn.textContent = '🔄 清空';
        resetBtn.style.background = '';
        resetBtn.style.color = '';
    }
    form.classList.remove('editing');
}

async function editPerson(id) {
    const people = await getPeople();
    const person = people.find(p => p.id === id);

    if (!person) {
        alert('未找到该记录');
        return;
    }

    // 文本/单选字段
    document.getElementById('name').value = person.name;
    document.getElementById('skill-level').value = person.skillLevel;
    document.getElementById('willingness').value = person.willingness;
    document.getElementById('note').value = person.note || '';
    document.getElementById('note-count').textContent = (person.note || '').length;

    // 多选 checkbox — 店铺挡位
    const shopValues = (person.shopLevel || '').split('、');
    document.querySelectorAll('input[name="shopLevel"]').forEach(cb => {
        cb.checked = shopValues.includes(cb.value);
    });

    // 多选 checkbox — 地址
    const addrValues = (person.address || '').split('、');
    document.querySelectorAll('input[name="address"]').forEach(cb => {
        cb.checked = addrValues.includes(cb.value);
    });

    // 多选 checkbox — 店铺种类
    const typeValues = (person.shopType || '').split('、');
    document.querySelectorAll('input[name="shopType"]').forEach(cb => {
        cb.checked = typeValues.includes(cb.value);
    });

    const form = document.getElementById('input-form');
    form.dataset.editId = id;

    setEditUI();

    document.querySelector('[data-screen="input"]').click();
    window.scrollTo(0, 0);
}

// ==================== 备份 & 恢复（基于 IndexedDB） ====================

async function exportData() {
    const people = await getPeople();
    if (people.length === 0) {
        alert('⚠️ 当前没有数据可以备份！');
        return;
    }

    const exportObj = {
        version: 2,
        exportedAt: new Date().toISOString(),
        totalCount: people.length,
        data: people
    };

    const jsonStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `人员信息备份_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`✅ 备份成功！文件已下载到手机（${people.length} 条记录）\n\n💡 请将文件保存到安全的位置，如：\n  - 手机"文件管理"文件夹\n  - 发送到微信"文件传输助手"\n  - 保存到云盘`);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importObj = JSON.parse(e.target.result);

            if (!importObj.data || !Array.isArray(importObj.data)) {
                alert('❌ 文件格式不正确！请选择通过"💾 备份"功能导出的 JSON 文件。');
                return;
            }

            const count = importObj.data.length;
            const exportedDate = importObj.exportedAt
                ? new Date(importObj.exportedAt).toLocaleString('zh-CN')
                : '未知';

            const action = confirm(
                `📥 发现备份文件：\n` +
                `  - 备份时间：${exportedDate}\n` +
                `  - 记录数量：${count} 条\n\n` +
                `请选择操作：\n` +
                `  【确定】替换当前所有数据\n` +
                `  【取消】合并到现有数据（不覆盖）`
            );

            if (action) {
                await replaceAllPeople(importObj.data);
                alert(`✅ 数据已替换！共导入 ${count} 条记录。`);
            } else {
                const existing = await getPeople();
                const existingIds = new Set(existing.map(p => p.id));
                const newItems = importObj.data.filter(p => !existingIds.has(p.id));
                if (newItems.length > 0) {
                    await batchSavePeople(newItems);
                }
                const merged = await getPeople();
                alert(`✅ 数据已合并！新增 ${newItems.length} 条记录（共 ${merged.length} 条）。`);
            }

            await refreshList();
            autoBackup(); // 导入后自动备份
        } catch (err) {
            console.error('导入失败:', err);
            alert('❌ 无法解析文件，请确保选择的是 JSON 格式的备份文件。');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function triggerImport() {
    document.getElementById('import-file-input').click();
}

// ==================== 调试接口 ====================
if (typeof window !== 'undefined') {
    window.__db = {
        list: getPeople,
        count: async () => (await getPeople()).length,
        clear: async () => {
            if (!confirm('⚠️ 确定要清空所有本地数据吗？此操作不可恢复！')) return;
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();
                request.onsuccess = () => { resolve(); alert('✅ 数据已清空'); };
                request.onerror = () => reject(request.error);
            });
        }
    };
}
