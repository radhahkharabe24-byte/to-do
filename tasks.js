/**
 * View 2 Module Driver Engine - Operational Tasks Component
 */
const TasksModule = {
    init() {
        this.bindEvents();
        this.renderTasksGrid();
        this.renderMiniDashboardView();
    },

    bindEvents() {
        const openBtn = document.getElementById('open-task-modal-btn');
        const closeBtn = document.getElementById('close-task-modal-btn');
        const cancelBtn = document.getElementById('cancel-task-modal-btn');
        const overlay = document.getElementById('task-modal-overlay');
        const form = document.getElementById('task-submission-form');

        // Toolbar dynamic filters inputs change mapping triggers
        const searchInput = document.getElementById('task-search-input');
        const fStatus = document.getElementById('task-filter-status');
        const fPriority = document.getElementById('task-filter-priority');
        const fCategory = document.getElementById('task-filter-category');
        const fSort = document.getElementById('task-sort-by');

        if(openBtn) openBtn.addEventListener('click', () => this.openEditorModal());
        if(closeBtn) closeBtn.addEventListener('click', () => this.closeEditorModal());
        if(cancelBtn) cancelBtn.addEventListener('click', () => this.closeEditorModal());
        
        if(form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.commitFormSubmission();
            });
        }

        const filterTrigger = () => this.renderTasksGrid();
        if(searchInput) searchInput.addEventListener('input', filterTrigger);
        if(fStatus) fStatus.addEventListener('change', filterTrigger);
        if(fPriority) fPriority.addEventListener('change', filterTrigger);
        if(fCategory) fCategory.addEventListener('change', filterTrigger);
        if(fSort) fSort.addEventListener('change', filterTrigger);
    },

    openEditorModal(existingTask = null) {
        const overlay = document.getElementById('task-modal-overlay');
        const titleLabel = document.getElementById('task-modal-title');
        const form = document.getElementById('task-submission-form');
        
        form.reset();
        document.getElementById('task-form-id-field').value = '';

        // Constrain calendar inputs boundary minimum dynamically to today
        const todayStr = new Date().toISOString().split('T')[0];
        document.getElementById('task-form-date').min = todayStr;

        if (existingTask) {
            titleLabel.textContent = "Modify Architecture Record";
            document.getElementById('task-form-id-field').value = existingTask.id;
            document.getElementById('task-form-title').value = existingTask.title;
            document.getElementById('task-form-desc').value = existingTask.description;
            document.getElementById('task-form-category').value = existingTask.category;
            document.getElementById('task-form-priority').value = existingTask.priority;
            document.getElementById('task-form-date').value = existingTask.dueDate;
            document.getElementById('task-form-time').value = existingTask.reminderTime || '';
        } else {
            titleLabel.textContent = "Create Operational Task Entry";
            document.getElementById('task-form-date').value = todayStr;
        }

        overlay.classList.add('open');
    },

    closeEditorModal() {
        document.getElementById('task-modal-overlay').classList.remove('open');
    },

    commitFormSubmission() {
        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        
        const idField = document.getElementById('task-form-id-field').value;
        const title = document.getElementById('task-form-title').value;
        const description = document.getElementById('task-form-desc').value;
        const category = document.getElementById('task-form-category').value;
        const priority = document.getElementById('task-form-priority').value;
        const dueDate = document.getElementById('task-form-date').value;
        const reminderTime = document.getElementById('task-form-time').value;

        if (idField) {
            // Edit execution pass flow
            const index = tasks.findIndex(t => t.id === idField);
            if (index !== -1) {
                tasks[index] = {
                    ...tasks[index],
                    title, description, category, priority, dueDate, reminderTime,
                    // Clear reminder flags if reminder time was changed during editing
                    reminderFired: tasks[index].reminderTime === reminderTime ? tasks[index].reminderFired : false
                };
            }
        } else {
            // New entry allocation flow
            const newTask = {
                id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 5),
                title, description, category, priority, dueDate, reminderTime,
                completed: false, completionDate: null, reminderFired: false, overdue: false
            };
            tasks.push(newTask);
        }

        StorageEngine.setData(StorageEngine.KEYS.TASKS, tasks);
        this.closeEditorModal();
        
        // Refresh component views
        this.renderTasksGrid();
        this.renderMiniDashboardView();
        AnalyticsEngine.recalculateMetrics();
        if (typeof CalendarModule !== 'undefined' && typeof CalendarModule.renderCalendarStructure === 'function') {
            CalendarModule.renderCalendarStructure();
        }
    },

    toggleTaskCompletion(id) {
        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        const idx = tasks.findIndex(t => t.id === id);
        
        if (idx !== -1) {
            const status = !tasks[idx].completed;
            tasks[idx].completed = status;
            tasks[idx].completionDate = status ? new Date().toISOString().split('T')[0] : null;
            
            if (status) {
                RewardsEngine.awardPointsForTask(tasks[idx].priority);
                RewardsEngine.maintainStreakSequence();
                this.evaluateBonusDayThreshold(tasks);
            }

            StorageEngine.setData(StorageEngine.KEYS.TASKS, tasks);
            
            // Refresh views
            this.renderTasksGrid();
            this.renderMiniDashboardView();
            AnalyticsEngine.recalculateMetrics();
            if (typeof CalendarModule !== 'undefined' && typeof CalendarModule.renderCalendarStructure === 'function') {
                CalendarModule.renderCalendarStructure();
            }
        }
    },

    /**
     * Checks if all current tasks are complete to trigger a bonus points reward
     */
    evaluateBonusDayThreshold(tasks) {
        const todayStr = new Date().toISOString().split('T')[0];
        const activeToday = tasks.filter(t => t.dueDate === todayStr);
        if (activeToday.length > 0 && activeToday.every(t => t.completed)) {
            RewardsEngine.awardBonusPoints(50); // Daily bonus points allocation
            RemindersEngine.triggerInAppPopupModal("Daily Bonus Rested!", "Completed all tasks scheduled for today! +50 XP bonus points unlocked.");
        }
    },

    deleteTaskRecord(id) {
        let tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        tasks = tasks.filter(t => t.id !== id);
        StorageEngine.setData(StorageEngine.KEYS.TASKS, tasks);

        this.renderTasksGrid();
        this.renderMiniDashboardView();
        AnalyticsEngine.recalculateMetrics();
        if (typeof CalendarModule !== 'undefined' && typeof CalendarModule.renderCalendarStructure === 'function') {
            CalendarModule.renderCalendarStructure();
        }
    },

    /**
     * Filters, sorts, and renders the dynamic operational cards grid
     */
    renderTasksGrid() {
        const grid = document.getElementById('tasks-render-grid');
        if (!grid) return;

        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        
        // Extract filter configurations from DOM selectors
        const searchVal = document.getElementById('task-search-input')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('task-filter-status')?.value || 'all';
        const priorityFilter = document.getElementById('task-filter-priority')?.value || 'all';
        const categoryFilter = document.getElementById('task-filter-category')?.value || 'all';
        const sortBy = document.getElementById('task-sort-by')?.value || 'dueDate-asc';

        // Apply filtering processing chain
        let processed = tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchVal) || t.description.toLowerCase().includes(searchVal);
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'completed' && t.completed) || (statusFilter === 'pending' && !t.completed);
            const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
            const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });

        // Apply sorting processing chain
        processed.sort((a, b) => {
            if (sortBy === 'dueDate-asc') return new Date(a.dueDate) - new Date(b.dueDate);
            if (sortBy === 'dueDate-desc') return new Date(b.dueDate) - new Date(a.dueDate);
            if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
            if (sortBy === 'priority-desc') {
                const weight = { high: 3, medium: 2, low: 1 };
                return weight[b.priority] - weight[a.priority];
            }
            return 0;
        });

        grid.innerHTML = '';

        if (processed.length === 0) {
            grid.innerHTML = `<p class="empty-state">No matching structural records found in scope.</p>`;
            return;
        }

        processed.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card-node p-${task.priority} ${task.completed ? 'status-completed' : ''}`;
            card.innerHTML = `
                <div>
                    <div class="task-node-header">
                        <h4 class="task-node-title">${this.escapeHTML(task.title)}</h4>
                        <span class="category-tag">${task.category}</span>
                    </div>
                    <p class="task-node-body-desc">${this.escapeHTML(task.description || 'No detailed architectural description available.')}</p>
                </div>
                <div class="task-node-meta-row">
                    <span class="date-block ${task.overdue && !task.completed ? 'text-danger' : ''}">
                        🗓️ ${task.dueDate} ${task.reminderTime ? '@ ' + task.reminderTime : ''}
                        ${task.overdue && !task.completed ? ' (OVERDUE)' : ''}
                    </span>
                    <div class="task-card-actions">
                        <button class="icon-btn toggle-comp-btn" title="Toggle Status">
                            ${task.completed ? '↩️' : '✅'}
                        </button>
                        <button class="icon-btn edit-btn" title="Modify Record">✏️</button>
                        <button class="icon-btn delete-btn" title="Purge Record">❌</button>
                    </div>
                </div>
            `;

            // Bind individual card operations natively to avoid global pollution
            card.querySelector('.toggle-comp-btn').addEventListener('click', () => this.toggleTaskCompletion(task.id));
            card.querySelector('.edit-btn').addEventListener('click', () => this.openEditorModal(task));
            card.querySelector('.delete-btn').addEventListener('click', () => this.deleteTaskRecord(task.id));

            grid.appendChild(card);
        });
    },

    renderMiniDashboardView() {
        const target = document.getElementById('dash-high-priority-tasks');
        if (!target) return;

        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        const highPriorityPending = tasks.filter(t => !t.completed && t.priority === 'high');

        target.innerHTML = '';
        if (highPriorityPending.length === 0) {
            target.innerHTML = `<p class="empty-state">No urgent tasks found.</p>`;
            return;
        }

        highPriorityPending.slice(0, 4).forEach(t => {
            const item = document.createElement('div');
            item.className = 'mini-task-item';
            item.innerHTML = `
                <div class="mini-task-meta">
                    <h4>${this.escapeHTML(t.title)}</h4>
                    <span>Due: ${t.dueDate}</span>
                </div>
            `;
            target.appendChild(item);
        });
    },

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
};