// 数据存储键
const STORAGE_KEY = 'personInfoData';

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// 应用初始化
function initializeApp() {
    // 设置导航按钮事件监听
    setupNavigation();

    // 设置表单提交
    setupFormHandler();

    // 设置意愿程度滑块
    setupWillingnessSlider();

    // 设置搜索功能
    setupSearchHandler();

    // 初始化列表显示
    refreshList();
}

// 设置导航
function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const screens = document.querySelectorAll('.screen');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.dataset.screen;

            // 移除所有激活状态
            navBtns.forEach(b => b.classList.remove('active'));
            screens.forEach(s => s.classList.remove('active'));

            // 激活选中的导航和屏幕
            btn.classList.add('active');
            document.getElementById(`${screenId}-screen`).classList.add('active');

            // 刷新列表数据
            if (screenId === 'list') {
                refreshList();
            }
        });
    });
}

// 设置表单提交
function setupFormHandler() {
    const form = document.getElementById('input-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const person = {
            id: Date.now(),
            name: document.getElementById('name').value.trim(),
            shopLevel: document.getElementById('shop-level').value.trim(),
            skillLevel: document.getElementById('skill-level').value,
            age: document.getElementById('age').value,
            personality: document.getElementById('personality').value.trim(),
            willingness: document.getElementById('willingness').value,
            wechat: document.getElementById('wechat').value.trim(),
        };

        // 验证必填字段
        if (!person.name) {
            alert('请输入姓名！');
            return;
        }

        // 保存数据
        savePerson(person);

        // 重置表单
        form.reset();
        document.getElementById('willingness-value').textContent = '50%';

        // 显示成功消息
        alert('✅ 信息已保存！');

        // 自动跳转到列表界面
        setTimeout(() => {
            document.querySelector('[data-screen="list"]').click();
        }, 500);
    });
}

// 设置意愿程度滑块
function setupWillingnessSlider() {
    const slider = document.getElementById('willingness');
    const valueDisplay = document.getElementById('willingness-value');

    slider.addEventListener('input', (e) => {
        valueDisplay.textContent = e.target.value + '%';
    });
}

// 设置搜索功能
function setupSearchHandler() {
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-search-btn');

    searchBtn.addEventListener('click', performSearch);
    clearBtn.addEventListener('click', clearSearchFilters);
}

// 执行搜索
function performSearch() {
    const name = document.getElementById('search-name').value.trim().toLowerCase();
    const age = document.getElementById('search-age').value.trim();
    const shop = document.getElementById('search-shop').value.trim().toLowerCase();
    const skill = document.getElementById('search-skill').value;

    const people = getPeople();
    let results = people;

    // 按姓名过滤
    if (name) {
        results = results.filter(p => p.name.toLowerCase().includes(name));
    }

    // 按年龄过滤
    if (age) {
        results = results.filter(p => p.age === age);
    }

    // 按店铺挡位过滤
    if (shop) {
        results = results.filter(p => p.shopLevel.toLowerCase().includes(shop));
    }

    // 按行业熟练程度过滤
    if (skill) {
        results = results.filter(p => p.skillLevel === skill);
    }

    // 显示搜索结果
    displaySearchResults(results);
}

// 清空搜索条件
function clearSearchFilters() {
    document.getElementById('search-name').value = '';
    document.getElementById('search-age').value = '';
    document.getElementById('search-shop').value = '';
    document.getElementById('search-skill').value = '';

    document.getElementById('search-results').style.display = 'none';
    document.getElementById('no-results').style.display = 'none';
}

// 显示搜索结果
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
            <td>${person.name}</td>
            <td>${person.shopLevel || '—'}</td>
            <td>${person.skillLevel || '—'}</td>
            <td>${person.age || '—'}</td>
            <td>${person.personality || '—'}</td>
            <td>${person.willingness}%</td>
            <td>${person.wechat || '—'}</td>
        `;
        tbody.appendChild(row);
    });
}

// 刷新列表
function refreshList() {
    const people = getPeople();
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
            <td>${person.name}</td>
            <td>${person.shopLevel || '—'}</td>
            <td>${person.skillLevel || '—'}</td>
            <td>${person.age || '—'}</td>
            <td>${person.personality || '—'}</td>
            <td>${person.willingness}%</td>
            <td>${person.wechat || '—'}</td>
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

// 保存人员信息
function savePerson(person) {
    const people = getPeople();
    
    // 检查是否是编辑（ID 存在）
    const existingIndex = people.findIndex(p => p.id === person.id);
    if (existingIndex !== -1) {
        // 编辑现有记录
        people[existingIndex] = person;
    } else {
        // 新增记录
        people.push(person);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(people));
}

// 获取所有人员
function getPeople() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 删除人员
function deletePerson(id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }

    const people = getPeople();
    const filtered = people.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    refreshList();
    alert('✅ 记录已删除！');
}

// 编辑人员
function editPerson(id) {
    const people = getPeople();
    const person = people.find(p => p.id === id);

    if (!person) {
        alert('未找到该记录');
        return;
    }

    // 填充表单
    document.getElementById('name').value = person.name;
    document.getElementById('shop-level').value = person.shopLevel;
    document.getElementById('skill-level').value = person.skillLevel;
    document.getElementById('age').value = person.age;
    document.getElementById('personality').value = person.personality;
    document.getElementById('willingness').value = person.willingness;
    document.getElementById('wechat').value = person.wechat;

    // 更新滑块显示
    document.getElementById('willingness-value').textContent = person.willingness + '%';

    // 修改表单提交按钮
    const form = document.getElementById('input-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // 设置表单 ID 用于识别编辑
    form.dataset.editId = id;

    // 切换到输入界面
    document.querySelector('[data-screen="input"]').click();

    // 滚动到顶部
    window.scrollTo(0, 0);
}

// 扩展表单提交处理以支持编辑
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('input-form');
    const originalSubmit = form.onsubmit;

    form.addEventListener('submit', function(e) {
        if (this.dataset.editId) {
            e.preventDefault();

            const personId = parseInt(this.dataset.editId);
            const person = {
                id: personId,
                name: document.getElementById('name').value.trim(),
                shopLevel: document.getElementById('shop-level').value.trim(),
                skillLevel: document.getElementById('skill-level').value,
                age: document.getElementById('age').value,
                personality: document.getElementById('personality').value.trim(),
                willingness: document.getElementById('willingness').value,
                wechat: document.getElementById('wechat').value.trim(),
            };

            if (!person.name) {
                alert('请输入姓名！');
                return;
            }

            savePerson(person);
            form.reset();
            delete form.dataset.editId;
            document.getElementById('willingness-value').textContent = '50%';

            alert('✅ 信息已更新！');

            setTimeout(() => {
                document.querySelector('[data-screen="list"]').click();
            }, 500);
        }
    });
});
