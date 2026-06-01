/**
 * System Notification Core Engine & Time Comparison Scheduler
 */
const RemindersEngine = {
    hasPermission: false,

    init() {
        this.verifyPermissionsState();
        this.startPollEngine();
        
        const btn = document.getElementById('notif-permission-btn');
        if (btn) {
            btn.addEventListener('click', () => this.requestSystemPermissions());
        }
    },

    verifyPermissionsState() {
        if (!("Notification" in window)) {
            this.hasPermission = false;
            this.togglePermissionButtonVisibility(false);
            return;
        }
        if (Notification.permission === "granted") {
            this.hasPermission = true;
            this.togglePermissionButtonVisibility(false);
        } else {
            this.hasPermission = false;
            this.togglePermissionButtonVisibility(true);
        }
    },

    requestSystemPermissions() {
        if (!("Notification" in window)) return;
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                this.hasPermission = true;
                this.togglePermissionButtonVisibility(false);
                this.triggerBannerNotice("System Alerts Enabled", "You will now receive desktop task reminders.");
            }
        });
    },

    togglePermissionButtonVisibility(shouldShow) {
        const btn = document.getElementById('notif-permission-btn');
        if (btn) {
            if (shouldShow) btn.classList.remove('hidden');
            else btn.classList.add('hidden');
        }
    },

    /**
     * Polls the system every 30 seconds to check for task reminders
     */
    startPollEngine() {
        setInterval(() => {
            this.executeRemindersEvaluationPass();
        }, 30000); // 30-second checking intervals
    },

    executeRemindersEvaluationPass() {
        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        const now = new Date();
        const currentLocalDate = now.toISOString().split('T')[0];
        
        // Format local hours match strings matches framework formats: "HH:MM"
        const currentLocalTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        let statusAltered = false;

        tasks.forEach(task => {
            if (task.completed) return;

            // 1. Time reminder threshold match verification evaluation rule
            if (task.dueDate === currentLocalDate && task.reminderTime === currentLocalTime && !task.reminderFired) {
                this.triggerBannerNotice(`Reminder: ${task.title}`, `Category: ${task.category} | Priority: ${task.priority}`);
                task.reminderFired = true;
                statusAltered = true;
            }

            // 2. Overdue tracking assignment conversion verification check rule
            if (!task.overdue) {
                const taskDateBoundary = new Date(task.dueDate + 'T23:59:59');
                if (now > taskDateBoundary) {
                    task.overdue = true;
                    statusAltered = true;
                }
            }
        });

        if (statusAltered) {
            StorageEngine.setData(StorageEngine.KEYS.TASKS, tasks);
            // Dynamic task instances re-render cascade call safe-guards checking
            if (typeof TasksModule !== 'undefined' && typeof TasksModule.renderTasksGrid === 'function') {
                TasksModule.renderTasksGrid();
            }
        }
    },

    triggerBannerNotice(title, text) {
        if (this.hasPermission) {
            new Notification(title, { body: text, icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>' });
        }
        this.triggerInAppPopupModal(title, text);
    },

    triggerInAppPopupModal(title, text) {
        const popup = document.createElement('div');
        popup.className = 'inapp-alert-modal-popup';
        popup.innerHTML = `
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem">
                <span style="color:var(--warning)">🔔</span>
                <strong style="font-size:0.95rem">${title}</strong>
            </div>
            <div style="font-size:0.85rem;color:var(--text-muted)">${text}</div>
            <button class="popup-dismiss-btn">Dismiss</button>
        `;
        document.body.appendChild(popup);

        popup.querySelector('.popup-dismiss-btn').addEventListener('click', () => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 300);
        });

        setTimeout(() => popup.classList.add('show'), 50);
    }
};

// Insert presentation classes for application modal alerts dynamically
const styleNodePopup = document.createElement('style');
styleNodePopup.textContent = `
    .inapp-alert-modal-popup {
        position: fixed; top: 20px; left: 50%; transform: translate(-50%, -100px);
        background: var(--bg-surface); color: var(--text-main); padding: 1rem; border-radius: 12px;
        box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); width: 100%; max-width: 320px;
        opacity: 0; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 10000;
    }
    .inapp-alert-modal-popup.show { transform: translate(-50%, 0); opacity: 1; }
    .popup-dismiss-btn { background: var(--primary); color:#fff; border:none; padding:0.3rem 0.6rem; font-size:0.75rem; border-radius:4px; margin-top:0.5rem; float:right; cursor:pointer;}
`;
document.head.appendChild(styleNodePopup);