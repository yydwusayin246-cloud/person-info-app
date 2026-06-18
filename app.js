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

        // 首次创建或版本升级时触发
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                // 建立索引，方便按姓名快速搜索
                store.createIndex('name', 'name', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            // 监听连接关闭事件（如用户清除浏览器数据），重置 Promise 以便下次重新连接
            db.onclose = () => {
                _dbPromise = null;
            };
            resolve(db);
        };

        request.onerror = (event) => {
            _dbPromise = null; // 失败时重置，允许重试
            console.error('❌ IndexedDB 打开失败:', event.target.error);
            reject(event.target.error);
        };
    });

    return _dbPromise;
}

// ==================== 数据 CRUD 操作（全部基于 IndexedDB） ====================

/** 获取所有人员信息 */
async function getPeople() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    } catch (err) {
        console.error('❌ 读取数据失败:', err);
        return [];
    }
}

/** 保存人员信息（新增或更新，以 id 为键） */
async function savePerson(person) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(person); // put = 存在则更新，不存在则新增

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/** 删除人员 */
async function deletePersonFromDB(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
}

/** 批量保存人员（单事务，用于高性能导入） */
async function batchSavePeople(people) {
    if (!people || people.length === 0) return 0;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        transaction.onerror = () => { reject(transaction.error); };
        transaction.onabort = () => { reject(new Error('批量保存事务被中止')); };
        transaction.oncomplete = () => { resolve(people.length); };

        people.forEach(person => {
            store.put(person);
        });
    });
}

/** 替换全部数据（用于导入-替换模式） */
async function replaceAllPeople(people) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // 事务级别错误处理
        transaction.onerror = () => {
            reject(transaction.error);
        };
        transaction.onabort = () => {
            reject(new Error('事务被中止'));
        };

        // 清空旧数据
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
            // 写入新数据
            people.forEach(person => {
                store.put(person);
            });
        };
        clearRequest.onerror = () => {
            reject(clearRequest.error);
        };

        transaction.oncomplete = () => {
            resolve(people.length);
        };
    });
}

// ==================== 首次运行：从旧版 localStorage 迁移数据 ====================

async function migrateFromLocalStorage() {
    try {
        // 检查是否有旧数据
        const oldData = localStorage.getItem(OLD_STORAGE_KEY);
        if (!oldData) return; // 没有旧数据，无需迁移

        const people = JSON.parse(oldData);
        if (!Array.isArray(people) || people.length === 0) return;

        // 检查 IndexedDB 是否已有数据（避免重复迁移）
        const existing = await getPeople();
        if (existing.length > 0) {
            // 已有数据，清除 localStorage 旧标记，不再迁移
            localStorage.removeItem(OLD_STORAGE_KEY);
            return;
        }

        // 将旧数据写入 IndexedDB
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        let migratedCount = 0;
        people.forEach(person => {
            store.put(person);
            migratedCount++;
        });

        await new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        });

        // 迁移成功后清除旧数据
        localStorage.removeItem(OLD_STORAGE_KEY);
        console.log(`✅ 已从 localStorage 迁移 ${migratedCount} 条数据到手机本地数据库`);
    } catch (err) {
        console.error('⚠️ 数据迁移失败:', err);
        // 迁移失败不阻塞应用启动
    }
}

// ==================== 应用初始化 ====================

document.addEventListener('DOMContentLoaded', async () => {
    // 先尝试迁移旧数据，再初始化应用
    await migrateFromLocalStorage();
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
    // 只选中带有 data-screen 属性的导航按钮，排除安装按钮等
    const navBtns = document.querySelectorAll('.nav-btn[data-screen]');
    const screens = document.querySelectorAll('.screen');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.dataset.screen;
            if (!screenId) return; // 安全兜底

            // 离开输入界面时，清除编辑状态
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

    // 编辑模式下点击"取消编辑"按钮
    const resetBtn = form.querySelector('button[type="reset"]');
    resetBtn.addEventListener('click', (e) => {
        if (form.dataset.editId) {
            e.preventDefault();
            cancelEdit();
            // 切换到列表界面
            document.querySelector('[data-screen="list"]').click();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 判断是编辑模式还是新增模式
        const isEditing = !!form.dataset.editId;
        const personId = isEditing ? parseInt(form.dataset.editId) : Date.now();

        const person = {
            id: personId,
            name: document.getElementById('name').value.trim(),
            shopLevel: document.getElementById('shop-level').value,
            skillLevel: document.getElementById('skill-level').value,
            age: document.getElementById('age').value,
            personality: document.getElementById('personality').value,
            willingness: document.getElementById('willingness').value,
            wechat: document.getElementById('wechat').value.trim(),
        };

        // 验证必填字段
        if (!person.name) { alert('请输入姓名！'); return; }
        if (!person.shopLevel) { alert('请选择店铺挡位！'); return; }
        if (!person.skillLevel) { alert('请选择行业熟练程度！'); return; }
        if (!person.age) { alert('请选择年龄！'); return; }
        if (!person.personality) { alert('请选择性格特点！'); return; }
        if (!person.willingness) { alert('请选择意愿程度！'); return; }

        // 保存到手机本地数据库
        await savePerson(person);

        // 清理编辑状态
        form.reset();
        delete form.dataset.editId;
        restoreEditUI();

        // 提示并跳转
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
    const age = document.getElementById('search-age').value;
    const shop = document.getElementById('search-shop').value;
    const skill = document.getElementById('search-skill').value;
    const personality = document.getElementById('search-personality').value;
    const willingness = document.getElementById('search-willingness').value;

    let results = await getPeople();

    if (name) results = results.filter(p => p.name.toLowerCase().includes(name));
    if (age) results = results.filter(p => p.age === age);
    if (shop) results = results.filter(p => p.shopLevel === shop);
    if (skill) results = results.filter(p => p.skillLevel === skill);
    if (personality) results = results.filter(p => p.personality === personality);
    if (willingness) results = results.filter(p => p.willingness === willingness);

    displaySearchResults(results);
}

function clearSearchFilters() {
    document.getElementById('search-name').value = '';
    document.getElementById('search-age').value = '';
    document.getElementById('search-shop').value = '';
    document.getElementById('search-skill').value = '';
    document.getElementById('search-personality').value = '';
    document.getElementById('search-willingness').value = '';
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
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(person.name)}</td>
            <td>${escapeHtml(person.shopLevel) || '—'}</td>
            <td>${escapeHtml(person.skillLevel) || '—'}</td>
            <td>${escapeHtml(person.age) || '—'}</td>
            <td>${escapeHtml(person.personality) || '—'}</td>
            <td>${escapeHtml(person.willingness) || '—'}</td>
            <td>${escapeHtml(person.wechat) || '—'}</td>
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
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(person.name)}</td>
            <td>${escapeHtml(person.shopLevel) || '—'}</td>
            <td>${escapeHtml(person.skillLevel) || '—'}</td>
            <td>${escapeHtml(person.age) || '—'}</td>
            <td>${escapeHtml(person.personality) || '—'}</td>
            <td>${escapeHtml(person.willingness) || '—'}</td>
            <td>${escapeHtml(person.wechat) || '—'}</td>
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
    alert('✅ 记录已删除！');
}

// ==================== 编辑人员 ====================

/** 取消编辑状态，清空表单并恢复 UI */
function cancelEdit() {
    const form = document.getElementById('input-form');
    if (form.dataset.editId) {
        form.reset();
        delete form.dataset.editId;
        restoreEditUI();
    }
}

/** 进入编辑模式的 UI 变化 */
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

/** 恢复新增模式的 UI */
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

    document.getElementById('name').value = person.name;
    document.getElementById('shop-level').value = person.shopLevel;
    document.getElementById('skill-level').value = person.skillLevel;
    document.getElementById('age').value = person.age;
    document.getElementById('personality').value = person.personality;
    document.getElementById('willingness').value = person.willingness;
    document.getElementById('wechat').value = person.wechat;

    const form = document.getElementById('input-form');
    form.dataset.editId = id;

    // 更新 UI 为编辑模式
    setEditUI();

    document.querySelector('[data-screen="input"]').click();
    window.scrollTo(0, 0);
}

// ==================== 备份 & 恢复（基于 IndexedDB） ====================

/** 导出数据为 JSON 文件并下载到手机 */
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

/** 从 JSON 文件导入数据 */
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
                // 直接替换：清空后批量写入
                await replaceAllPeople(importObj.data);
                alert(`✅ 数据已替换！共导入 ${count} 条记录。`);
            } else {
                // 合并模式：以 id 去重，保留已有数据优先（单事务批量写入）
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
        } catch (err) {
            console.error('导入失败:', err);
            alert('❌ 无法解析文件，请确保选择的是 JSON 格式的备份文件。');
        }
    };
    reader.readAsText(file);

    // 清空 input，允许重复选择同一文件
    event.target.value = '';
}

/** 触发文件选择框（由"📥 恢复"按钮调用） */
function triggerImport() {
    document.getElementById('import-file-input').click();
}

// ==================== 调试：在控制台暴露数据查看接口 ====================
// 在浏览器控制台中输入以下命令：
//   await __db.list()     查看所有数据
//   await __db.count()    查看数据条数
//   await __db.clear()    清空所有数据（危险操作）
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
                request.onerror = () => { reject(request.error); };
            });
        }
    };
}
