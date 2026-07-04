// Chrome Extension Content Script
// Injects the floating event reminder widget into the page

(function () {
    'use strict';

    const STORAGE_KEY = 'events';
    let events = [];
    let editingId = null;
    let selectedColor = '#3b82f6';
    let isPanelOpen = false;
    let savedTop = 20;

    // Initialize
    function init() {
        loadEvents();
        createWidget();
        startChecking();
    }

    // Load events from storage
    function loadEvents() {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            events = result.events || [];
            renderEvents();
            updateMarquee();
            updateBadge();
        });
    }

    // Save events
    function saveEvents() {
        chrome.storage.local.set({ [STORAGE_KEY]: events });
    }

    // Create the floating widget
    function createWidget() {
        const widget = document.createElement('div');
        widget.id = 'event-reminder-widget';
        widget.innerHTML = `
            <!-- Toggle button (always visible, attached to panel) -->
            <button id="reminder-toggle-btn" title="打开/关闭事件提醒器">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                <span id="reminder-badge" style="display:none;">0</span>
            </button>

            <!-- Main Panel -->
            <div id="reminder-panel">
                <div class="panel-header">
                    <h2>🔔 事件提醒器</h2>
                    <p class="subtitle"></p>
                    <div class="panel-toolbar">
                        <button id="btn-export">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                            </svg>
                            导出
                        </button>
                        <button id="btn-import">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                            </svg>
                            导入
                        </button>
                        <input type="file" id="importFile" accept=".json" style="display:none">
                    </div>
                </div>

                <div class="marquee-container">
                    <div class="marquee-bar">
                        <span class="marquee-label">今日提醒</span>
                        <div class="marquee-wrapper">
                            <div class="marquee-content" id="marqueeContent">
                                <span class="empty-marquee">暂无待触发事件</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button class="add-btn" id="btn-add">
                    <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    添加新事件
                </button>

                <div class="events-list" id="eventsList"></div>
            </div>

            <!-- Modal -->
            <div class="modal-overlay" id="modalOverlay">
                <div class="modal">
                    <h2 id="modalTitle">添加新事件</h2>

                    <div class="form-group">
                        <label>事件标题</label>
                        <input type="text" id="eventTitle" placeholder="输入事件标题">
                    </div>

                    <div class="form-group">
                        <label>描述（可选）</label>
                        <textarea id="eventDesc" rows="2" placeholder="输入事件描述"></textarea>
                    </div>

                    <div class="form-group">
                        <label>提醒时间</label>
                        <input type="time" id="eventTime">
                    </div>

                    <div class="form-group">
                        <label>重复频率</label>
                        <select id="eventRepeat">
                            <option value="once">仅一次</option>
                            <option value="daily" selected>每天</option>
                            <option value="weekly">每周</option>
                            <option value="monthly">每月</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>颜色标签</label>
                        <div class="color-picker" id="colorPicker">
                            <div class="color-option selected" data-color="#3b82f6" style="background: #3b82f6;"></div>
                            <div class="color-option" data-color="#10b981" style="background: #10b981;"></div>
                            <div class="color-option" data-color="#f59e0b" style="background: #f59e0b;"></div>
                            <div class="color-option" data-color="#ef4444" style="background: #ef4444;"></div>
                            <div class="color-option" data-color="#8b5cf6" style="background: #8b5cf6;"></div>
                            <div class="color-option" data-color="#ec4899" style="background: #ec4899;"></div>
                            <div class="color-option" data-color="#06b6d4" style="background: #06b6d4;"></div>
                            <div class="color-option" data-color="#84cc16" style="background: #84cc16;"></div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button class="btn btn-secondary" id="btn-modal-cancel">取消</button>
                        <button class="btn btn-primary" id="btn-modal-save">保存</button>
                    </div>
                </div>
            </div>

            <!-- In-page notification -->
            <div class="in-page-notification" id="inPageNotification">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span id="notificationText"></span>
            </div>
        `;

        document.body.appendChild(widget);

        // Load saved position
        chrome.storage.local.get(['widgetTop'], (result) => {
            if (typeof result.widgetTop === 'number') {
                savedTop = result.widgetTop;
            } else {
                savedTop = 20;
            }
            applyPosition();
        });

        // Setup all event listeners (no inline onclick)
        setupEventListeners();

        // Listen for updates from background
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'EVENTS_UPDATED') {
                loadEvents();
            }
        });
    }

    function applyPosition() {
        const widget = document.getElementById('event-reminder-widget');
        if (!widget) return;

        widget.style.position = 'fixed';
        widget.style.top = savedTop + 'px';
        widget.style.right = '0';
        widget.style.left = 'auto';
        widget.style.bottom = 'auto';
        widget.style.transform = 'none';
    }

    function savePosition() {
        chrome.storage.local.set({ widgetTop: savedTop });
    }

    function setupEventListeners() {
        const toggleBtn = document.getElementById('reminder-toggle-btn');
        const panel = document.getElementById('reminder-panel');
        const modalOverlay = document.getElementById('modalOverlay');
        const importFile = document.getElementById('importFile');

        // Toggle panel open/close
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isPanelOpen = !isPanelOpen;
            panel.classList.toggle('open', isPanelOpen);
            toggleBtn.classList.toggle('active', isPanelOpen);
            // When panel is closed, show detached style (standalone button)
            toggleBtn.classList.toggle('detached', !isPanelOpen);
        });

        // Set initial detached state
        toggleBtn.classList.add('detached');

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (isPanelOpen &&
                !panel.contains(e.target) &&
                !toggleBtn.contains(e.target) &&
                !modalOverlay.contains(e.target)) {
                isPanelOpen = false;
                panel.classList.remove('open');
                toggleBtn.classList.remove('active');
            }
        });

        // === Vertical drag for the toggle button ===
        let isDragging = false;
        let dragStartY = 0;
        let dragStartTop = 0;

        toggleBtn.addEventListener('mousedown', (e) => {
            // Only drag on left mouse button, and not on the badge
            if (e.button !== 0) return;
            isDragging = true;
            dragStartY = e.clientY;
            dragStartTop = savedTop;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const delta = e.clientY - dragStartY;
            const newTop = Math.max(0, Math.min(dragStartTop + delta, window.innerHeight - 60));
            savedTop = newTop;
            applyPosition();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                savePosition();
            }
        });

        // Toolbar: export
        document.getElementById('btn-export').addEventListener('click', handleExport);

        // Toolbar: import
        document.getElementById('btn-import').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // Import file
        importFile.addEventListener('change', handleImport);

        // Add button
        document.getElementById('btn-add').addEventListener('click', () => {
            openModal(null);
        });

        // Color picker
        document.getElementById('colorPicker').addEventListener('click', (e) => {
            const option = e.target.closest('.color-option');
            if (option) {
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                selectedColor = option.dataset.color;
            }
        });

        // Modal: cancel
        document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);

        // Modal: save
        document.getElementById('btn-modal-save').addEventListener('click', saveEvent);

        // Modal overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
                if (isPanelOpen) {
                    isPanelOpen = false;
                    panel.classList.remove('open');
                    toggleBtn.classList.remove('active');
                }
            }
            if (e.key === 'n' && (e.ctrlKey || e.metaKey) && !e.target.matches('input, textarea')) {
                e.preventDefault();
                openModal(null);
            }
        });
    }

    // Render events list
    function renderEvents() {
        const list = document.getElementById('eventsList');
        if (!list) return;

        if (events.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <svg class="empty-state-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <h3>暂无事件</h3>
                    <p>点击上方按钮添加你的第一个提醒</p>
                </div>
            `;
            return;
        }

        const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

        list.innerHTML = sortedEvents.map(event => `
            <div class="event-card" style="border-left-color: ${event.color};">
                <div class="event-header">
                    <div style="flex:1;min-width:0;">
                        <div class="event-title">
                            ${escapeHtml(event.title)}
                            ${event.triggered ? '<span class="triggered-badge">已触发</span>' : ''}
                        </div>
                        ${event.description ? `<div class="event-desc">${escapeHtml(event.description)}</div>` : ''}
                        <div class="event-meta">
                            <span class="event-badge">
                                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                ${event.time}
                            </span>
                            <span class="event-badge">
                                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                </svg>
                                ${getRepeatText(event.repeat)}
                            </span>
                        </div>
                    </div>
                    <div class="event-actions">
                        <button class="action-btn toggle ${event.enabled ? '' : 'disabled'}" data-id="${event.id}" data-action="toggle" title="${event.enabled ? '暂停' : '启用'}">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                ${event.enabled
            ? '<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M8 9l4 3-4 3"/>'
            : '<path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/>'
        }
                            </svg>
                        </button>
                        <button class="action-btn edit" data-id="${event.id}" data-action="edit" title="编辑">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete" data-id="${event.id}" data-action="delete" title="删除">
                            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Use event delegation for action buttons
        list.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                if (action === 'toggle') {
                    toggleEvent(id);
                } else if (action === 'edit') {
                    editEvent(id);
                } else if (action === 'delete') {
                    deleteEvent(id);
                }
            });
        });
    }

    // Update marquee
    function updateMarquee() {
        const marquee = document.getElementById('marqueeContent');
        if (!marquee) return;

        const enabledEvents = events.filter(e => e.enabled);

        if (enabledEvents.length === 0) {
            marquee.innerHTML = '<span class="empty-marquee">暂无待触发事件</span>';
            return;
        }

        const items = enabledEvents.map(e =>
            `<span class="marquee-item">⏰ ${e.time} - ${escapeHtml(e.title)}</span>`
        ).join('');

        marquee.innerHTML = items + items;
    }

    // Update badge count
    function updateBadge() {
        const badge = document.getElementById('reminder-badge');
        if (!badge) return;

        const count = events.filter(e => e.enabled && !e.triggered).length;
        if (count > 0) {
            badge.style.display = 'flex';
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            badge.style.display = 'none';
        }
    }

    // Start checking reminders
    function startChecking() {
        setInterval(() => {
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5);
            const currentSecond = now.getSeconds();

            if (currentSecond <= 2) {
                events.forEach(event => {
                    if (!event.enabled || event.triggered) return;

                    if (event.time === currentTime) {
                        const today = getTodayDate();
                        const shouldTrigger =
                            event.repeat === 'daily' ||
                            event.date === today ||
                            (event.repeat === 'weekly' && isWeeklyMatch(event.date, today)) ||
                            (event.repeat === 'monthly' && isMonthlyMatch(event.date, today));

                        if (shouldTrigger) {
                            triggerEvent(event);
                        }
                    }
                });
            }
        }, 1000);
    }

    function triggerEvent(event) {
        event.triggered = true;
        saveEvents();
        showNotification(event.title, event.description);
        renderEvents();
        updateMarquee();
        updateBadge();

        if (event.repeat === 'daily') {
            setTimeout(() => {
                event.triggered = false;
                saveEvents();
            }, 1000 * 60 * 60 * 24);
        }
    }

    // Show in-page notification
    function showNotification(title, description) {
        const notif = document.getElementById('inPageNotification');
        const text = document.getElementById('notificationText');
        if (!notif || !text) return;

        text.textContent = title + (description ? ` - ${description}` : '');
        notif.classList.add('show');

        setTimeout(() => {
            notif.classList.remove('show');
        }, 5000);
    }

    // Modal functions
    function openModal(eventId) {
        editingId = eventId || null;
        const modal = document.getElementById('modalOverlay');
        const title = document.getElementById('modalTitle');
        const titleInput = document.getElementById('eventTitle');
        const descInput = document.getElementById('eventDesc');
        const timeInput = document.getElementById('eventTime');
        const repeatSelect = document.getElementById('eventRepeat');

        if (eventId) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                title.textContent = '编辑事件';
                titleInput.value = event.title;
                descInput.value = event.description || '';
                timeInput.value = event.time;
                repeatSelect.value = event.repeat;
                selectColorByHex(event.color);
            }
        } else {
            title.textContent = '添加新事件';
            titleInput.value = '';
            descInput.value = '';
            timeInput.value = '';
            repeatSelect.value = 'daily';
            selectColorByHex('#3b82f6');
        }

        modal.classList.add('active');
        titleInput.focus();
    }

    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        editingId = null;
    }

    function saveEvent() {
        const title = document.getElementById('eventTitle').value.trim();
        const desc = document.getElementById('eventDesc').value.trim();
        const time = document.getElementById('eventTime').value;
        const repeat = document.getElementById('eventRepeat').value;

        if (!title) {
            showToast('请输入事件标题');
            return;
        }
        if (!time) {
            showToast('请选择提醒时间');
            return;
        }

        if (editingId) {
            const event = events.find(e => e.id === editingId);
            if (event) {
                event.title = title;
                event.description = desc;
                event.time = time;
                event.repeat = repeat;
                event.color = selectedColor;
            }
        } else {
            events.push({
                id: generateId(),
                title,
                description: desc,
                time,
                date: getTodayDate(),
                repeat,
                color: selectedColor,
                enabled: true,
                triggered: false
            });
        }

        saveEvents();
        renderEvents();
        updateMarquee();
        updateBadge();
        closeModal();
        showToast(editingId ? '事件已更新' : '事件已添加');
    }

    function editEvent(id) {
        openModal(id);
    }

    function deleteEvent(id) {
        if (confirm('确定要删除这个事件吗？')) {
            events = events.filter(e => e.id !== id);
            saveEvents();
            renderEvents();
            updateMarquee();
            updateBadge();
            showToast('事件已删除');
        }
    }

    function toggleEvent(id) {
        const event = events.find(e => e.id === id);
        if (event) {
            event.enabled = !event.enabled;
            saveEvents();
            renderEvents();
            updateMarquee();
            updateBadge();
        }
    }

    // Export
    function handleExport() {
        const dataStr = JSON.stringify(events, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `events_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('数据已导出');
    }

    // Import
    function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const imported = JSON.parse(ev.target.result);
                if (!Array.isArray(imported)) throw new Error('Invalid format');

                if (confirm(`确定要导入 ${imported.length} 个事件吗？这将覆盖当前所有数据。`)) {
                    events = imported;
                    saveEvents();
                    renderEvents();
                    updateMarquee();
                    updateBadge();
                    showToast(`成功导入 ${imported.length} 个事件`);
                }
            } catch (err) {
                showToast('导入失败：文件格式错误');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // Toast
    function showToast(message) {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.getElementById('event-reminder-widget').appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Utility functions
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    function getRepeatText(repeat) {
        const texts = { 'once': '仅一次', 'daily': '每天', 'weekly': '每周', 'monthly': '每月' };
        return texts[repeat] || repeat;
    }

    function isWeeklyMatch(eventDate, today) {
        return new Date(eventDate).getDay() === new Date(today).getDay();
    }

    function isMonthlyMatch(eventDate, today) {
        return new Date(eventDate).getDate() === new Date(today).getDate();
    }

    function selectColorByHex(hex) {
        selectedColor = hex;
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.color === hex) opt.classList.add('selected');
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
