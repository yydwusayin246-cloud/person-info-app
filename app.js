// 数据存储键
const STORAGE_KEY = 'personInfoData';

// 排序状态: null, 'asc', 'desc'
let currentSort = { field: null, order: null };

// 年龄排序映射
const AGE_ORDER = { '30以下': 0, '30-40': 1, '40-50': 2, '50-60': 3, '60-70': 4, '70及以上': 5 };
// 意愿排序映射
const WILLINGNESS_ORDER = { '非常低': 0, '较低': 1, '一般': 2, '较高': 3, '非常高': 4 };

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// 应用初始化
function initializeApp() {
    setupNavigation();
    setupFormHandler();
    setupSearchHandler();
    refreshList();
}

// 设置导航
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn[data-screen]');
    const screens = document.querySelectorAll('.screen');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.dataset.screen;
            navBtns.forEach(b => b.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${screenId}-screen`).classList.add('active');
            if (screenId === 'list') {
                refreshList();
            }
        });
    });
}

// 从表单构建 person 对象
function buildPersonFromForm(id) {
    return {
        id: id,
        name: document.getElementById('name').value.trim(),
        shopLevel: document.getElementById('shop-level').value,
        skillLevel: document.getElementById('skill-level').value,
        age: document.getElementById('age').value,
        personality: document.getElementById('personality').value,
        willingness: document.getElementById('willingness').value,
        wechat: document.getElementById('wechat').value.trim(),
        followStatus: document.getElementById('follow-status').value,
        notes: document.getElementById('notes').value.trim(),
    };
}

// 验证必填字段
function validatePerson(person) {
    if (!person.name) { alert('请输入姓名！'); return false; }
    if (!person.shopLevel) { alert('请选择店铺挡位！'); return false; }
    if (!person.skillLevel) { alert('请选择行业熟练程度！'); return false; }
    if (!person.age) { alert('请选择年龄！'); return false; }
    if (!person.personality) { alert('请选择性格特点！'); return false; }
    if (!person.willingness) { alert('请选择意愿程度！'); return false; }
    return true;
}

// 设置表单提交（新增和编辑共用）
function setupFormHandler() {
    const form = document.getElementById('input-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const isEdit = !!form.dataset.editId;
        const personId = isEdit ? parseInt(form.dataset.editId) : Date.now();
        const person = buildPersonFromForm(personId);

        if (!validatePerson(person)) return;

        savePerson(person);
        form.reset();
        if (isEdit) delete form.dataset.editId;

        alert(isEdit ? '✅ 信息已更新！' : '✅ 信息已保存！');

        setTimeout(() => {
            document.querySelector('[data-screen="list"]').click();
        }, 500);
    });
}

// ==================== 排序 ====================

function toggleSort(field) {
    if (currentSort.field === field) {
        if (currentSort.order === 'asc') {
            currentSort.order = 'desc';
        } else if (currentSort.order === 'desc') {
            currentSort.order = null;
            currentSort.field = null;
        }
    } else {
        currentSort.field = field;
        currentSort.order = 'asc';
    }
    refreshList();
}

function getSortedPeople() {
    let people = getPeople();
    if (!currentSort.field || !currentSort.order) return people;

    const orderMap = currentSort.field === 'age' ? AGE_ORDER : WILLINGNESS_ORDER;
    const field = currentSort.field;
    const multiplier = currentSort.order === 'asc' ? 1 : -1;

    return [...people].sort((a, b) => {
        const va = orderMap[a[field]] ?? 99;
        const vb = orderMap[b[field]] ?? 99;
        return (va - vb) * multiplier;
    });
}

function updateSortArrows() {
    const ageArrow = document.getElementById('sort-age');
    const willArrow = document.getElementById('sort-willingness');
    const sortInfo = document.getElementById('sort-info');

    if (ageArrow) ageArrow.textContent = currentSort.field === 'age' ? (currentSort.order === 'asc' ? ' ▲' : ' ▼') : '';
    if (willArrow) willArrow.textContent = currentSort.field === 'willingness' ? (currentSort.order === 'asc' ? ' ▲' : ' ▼') : '';

    if (sortInfo) {
        if (currentSort.field && currentSort.order) {
            const label = currentSort.field === 'age' ? '年龄' : '意愿';
            const dir = currentSort.order === 'asc' ? '↑顺序' : '↓倒序';
            sortInfo.textContent = ` | 按${label}${dir}`;
        } else {
            sortInfo.textContent = '';
        }
    }
}

// 获取跟进状态对应的样式类
function getStatusClass(status) {
    const map = {
        '未联系': 'status-gray',
        '已联系意向低': 'status-orange',
        '沟通中': 'status-blue',
        '已签约': 'status-green',
    };
    return map[status] || '';
}

// HTML 转义
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==================== 列表 & CRUD ====================

function refreshList() {
    const people = getSortedPeople();
    const tbody = document.getElementById('table-body');
    const totalCount = document.getElementById('total-count');

    totalCount.textContent = people.length;
    updateSortArrows();

    if (people.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-message">暂无数据，请先在"输入信息"页面添加</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    people.forEach((person, index) => {
        const statusClass = getStatusClass(person.followStatus);
        const notesShort = person.notes ? (person.notes.length > 15 ? escHtml(person.notes.slice(0, 15)) + '...' : escHtml(person.notes)) : '—';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escHtml(person.name)}</td>
            <td>${escHtml(person.shopLevel) || '—'}</td>
            <td>${escHtml(person.skillLevel) || '—'}</td>
            <td>${escHtml(person.age) || '—'}</td>
            <td>${escHtml(person.personality) || '—'}</td>
            <td>${escHtml(person.willingness) || '—'}</td>
            <td>${escHtml(person.wechat) || '—'}</td>
            <td><span class="status-badge ${statusClass}">${escHtml(person.followStatus) || '—'}</span></td>
            <td class="notes-cell" title="${escHtml(person.notes || '')}">${notesShort}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-edit" onclick="editPerson(${person.id})">✏️</button>
                    <button class="btn btn-danger" onclick="deletePerson(${person.id})">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function savePerson(person) {
    const people = getPeople();
    const existingIndex = people.findIndex(p => p.id === person.id);
    if (existingIndex !== -1) {
        people[existingIndex] = person;
    } else {
        people.push(person);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}

function getPeople() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function deletePerson(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    const people = getPeople();
    const filtered = people.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    refreshList();
    alert('✅ 记录已删除！');
}

function editPerson(id) {
    const people = getPeople();
    const person = people.find(p => p.id === id);
    if (!person) { alert('未找到该记录'); return; }

    document.getElementById('name').value = person.name;
    document.getElementById('shop-level').value = person.shopLevel;
    document.getElementById('skill-level').value = person.skillLevel;
    document.getElementById('age').value = person.age;
    document.getElementById('personality').value = person.personality;
    document.getElementById('willingness').value = person.willingness;
    document.getElementById('wechat').value = person.wechat || '';
    document.getElementById('follow-status').value = person.followStatus || '';
    document.getElementById('notes').value = person.notes || '';

    const form = document.getElementById('input-form');
    form.dataset.editId = id;

    document.querySelector('[data-screen="input"]').click();
    window.scrollTo(0, 0);
}

// ==================== 多选搜索 ====================

function getCheckedValues(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return [];
    const checks = group.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checks).map(c => c.value);
}

function setupSearchHandler() {
    document.getElementById('search-btn').addEventListener('click', performSearch);
    document.getElementById('clear-search-btn').addEventListener('click', clearSearchFilters);
}

function performSearch() {
    const name = document.getElementById('search-name').value.trim().toLowerCase();
    const ages = getCheckedValues('search-age-group');
    const shops = getCheckedValues('search-shop-group');
    const skills = getCheckedValues('search-skill-group');
    const personalities = getCheckedValues('search-personality-group');
    const willingnesses = getCheckedValues('search-willingness-group');
    const statuses = getCheckedValues('search-status-group');

    let results = getPeople();

    if (name) {
        results = results.filter(p => p.name.toLowerCase().includes(name));
    }
    if (ages.length > 0) {
        results = results.filter(p => ages.includes(p.age));
    }
    if (shops.length > 0) {
        results = results.filter(p => shops.includes(p.shopLevel));
    }
    if (skills.length > 0) {
        results = results.filter(p => skills.includes(p.skillLevel));
    }
    if (personalities.length > 0) {
        results = results.filter(p => personalities.includes(p.personality));
    }
    if (willingnesses.length > 0) {
        results = results.filter(p => willingnesses.includes(p.willingness));
    }
    if (statuses.length > 0) {
        results = results.filter(p => statuses.includes(p.followStatus));
    }

    displaySearchResults(results);
}

function clearSearchFilters() {
    document.getElementById('search-name').value = '';
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(cb => cb.checked = false);
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
        const statusClass = getStatusClass(person.followStatus);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escHtml(person.name)}</td>
            <td>${escHtml(person.shopLevel) || '—'}</td>
            <td>${escHtml(person.skillLevel) || '—'}</td>
            <td>${escHtml(person.age) || '—'}</td>
            <td>${escHtml(person.personality) || '—'}</td>
            <td>${escHtml(person.willingness) || '—'}</td>
            <td>${escHtml(person.wechat) || '—'}</td>
            <td><span class="status-badge ${statusClass}">${escHtml(person.followStatus) || '—'}</span></td>
            <td class="notes-cell">${escHtml(person.notes) || '—'}</td>
        </tr>
        tbody.appendChild(row);
    });
}

// ==================== 备份 & 恢复 ====================

function exportData() {
    const people = getPeople();
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

    alert(`✅ 备份成功！文件已下载（${people.length} 条记录）\n\n💡 请将文件保存到安全的位置，如：\n  - 手机"文件管理"文件夹\n  - 发送到微信"文件传输助手"\n  - 保存到云盘`);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
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
                localStorage.setItem(STORAGE_KEY, JSON.stringify(importObj.data));
                alert(`✅ 数据已替换！共导入 ${count} 条记录。`);
            } else {
                const existing = getPeople();
                const existingIds = new Set(existing.map(p => p.id));
                const newItems = importObj.data.filter(p => !existingIds.has(p.id));
                const merged = [...existing, ...newItems];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                alert(`✅ 数据已合并！新增 ${newItems.length} 条记录（共 ${merged.length} 条）。`);
            }

            refreshList();
        } catch (err) {
            alert('❌ 无法解析文件，请确保选择的是 JSON 格式的备份文件。');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function triggerImport() {
    document.getElementById('import-file-input').click();
}
