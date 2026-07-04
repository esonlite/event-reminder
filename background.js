// Background service worker for Chrome extension
// Handles alarms and notifications

chrome.runtime.onInstalled.addListener(() => {
    console.log('事件提醒器已安装');
    // 初始化默认数据
    chrome.storage.local.get(['events'], (result) => {
        if (!result.events) {
            const defaultEvents = [
                {
                    id: generateId(),
                    title: '每日站会',
                    description: '团队每日进度同步会议',
                    time: '09:30',
                    date: getTodayDate(),
                    repeat: 'daily',
                    color: '#3b82f6',
                    enabled: true,
                    triggered: false
                },
                {
                    id: generateId(),
                    title: '午餐时间',
                    description: '记得按时吃饭',
                    time: '12:00',
                    date: getTodayDate(),
                    repeat: 'daily',
                    color: '#10b981',
                    enabled: true,
                    triggered: false
                }
            ];
            chrome.storage.local.set({ events: defaultEvents });
        }
    });
});

// 每分钟检查一次提醒
chrome.alarms.create('checkReminders', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkReminders') {
        checkAndTriggerReminders();
    }
});

function checkAndTriggerReminders() {
    chrome.storage.local.get(['events'], (result) => {
        if (!result.events) return;
        
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);
        const today = getTodayDate();
        
        let updated = false;
        const events = result.events;
        
        events.forEach(event => {
            if (!event.enabled || event.triggered) return;
            
            if (event.time === currentTime) {
                const shouldTrigger = 
                    event.repeat === 'daily' ||
                    event.date === today ||
                    (event.repeat === 'weekly' && isWeeklyMatch(event.date, today)) ||
                    (event.repeat === 'monthly' && isMonthlyMatch(event.date, today));
                
                if (shouldTrigger) {
                    event.triggered = true;
                    updated = true;
                    
                    // 发送通知
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon128.png',
                        title: '⏰ 事件提醒',
                        message: event.title + (event.description ? `\n${event.description}` : ''),
                        priority: 2
                    });
                    
                    // 每天重复的事件在第二天重置
                    if (event.repeat === 'daily') {
                        setTimeout(() => {
                            chrome.storage.local.get(['events'], (res) => {
                                const evts = res.events || [];
                                const idx = evts.findIndex(e => e.id === event.id);
                                if (idx !== -1) {
                                    evts[idx].triggered = false;
                                    chrome.storage.local.set({ events: evts });
                                }
                            });
                        }, 1000 * 60 * 60 * 24);
                    }
                }
            }
        });
        
        if (updated) {
            chrome.storage.local.set({ events });
            // 通知 content script 更新
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, { type: 'EVENTS_UPDATED' });
                });
            });
        }
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function isWeeklyMatch(eventDate, today) {
    return new Date(eventDate).getDay() === new Date(today).getDay();
}

function isMonthlyMatch(eventDate, today) {
    return new Date(eventDate).getDate() === new Date(today).getDate();
}
