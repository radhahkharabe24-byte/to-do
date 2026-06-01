/**
 * View 3 Module Driver Engine - Master Calendar Interface
 */
const CalendarModule = {
    currentDisplayDate: new Date(),
    selectedDateStr: new Date().toISOString().split('T')[0],

    init() {
        this.bindEvents();
        this.renderCalendarStructure();
        this.renderFocusedScheduleList();
    },

    bindEvents() {
        const prevBtn = document.getElementById('calendar-prev-month-btn');
        const nextBtn = document.getElementById('calendar-next-month-btn');

        if(prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDisplayDate.setMonth(this.currentDisplayDate.getMonth() - 1);
                this.renderCalendarStructure();
            });
        }
        if(nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDisplayDate.setMonth(this.currentDisplayDate.getMonth() + 1);
                this.renderCalendarStructure();
            });
        }
    },

    /**
     * Builds monthly block grid arrays and renders them safely
     */
    renderCalendarStructure() {
        const grid = document.getElementById('calendar-days-grid-target');
        const label = document.getElementById('calendar-month-year-display');
        if (!grid || !label) return;

        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];

        const year = this.currentDisplayDate.getFullYear();
        const month = this.currentDisplayDate.getMonth();

        // Format calendar localized presentation texts
        label.textContent = this.currentDisplayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

        grid.innerHTML = '';

        // Matrix processing constraints: Determine starting day offset indexes
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

        // 1. Injected placeholder padding boxes for days of previous months
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day-cell inactive';
            grid.appendChild(emptyCell);
        }

        // 2. Main processing matrix generation tracking days within requested viewport parameters
        const todayStr = new Date().toISOString().split('T')[0];

        for (let day = 1; day <= totalDaysInMonth; day++) {
            const cell = document.createElement('div');
            cell.className = 'calendar-day-cell';
            
            const currentCellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            cell.innerHTML = `
                <span class="day-num">${day}</span>
                <div class="cell-dots-row"></div>
            `;

            // Active cell condition mapping markers
            if (currentCellDateStr === todayStr) cell.classList.add('today');
            if (currentCellDateStr === this.selectedDateStr) cell.classList.add('selected');

            // Render operational task dots inside daily blocks
            const dayTasks = tasks.filter(t => t.dueDate === currentCellDateStr);
            const dotsContainer = cell.querySelector('.cell-dots-row');
            
            dayTasks.slice(0, 3).forEach(task => {
                const dot = document.createElement('span');
                dot.className = `calendar-dot ${task.priority}`;
                dotsContainer.appendChild(dot);
            });

            cell.addEventListener('click', () => {
                // Clear active selected status across matrix nodes
                document.querySelectorAll('.calendar-day-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                this.selectedDateStr = currentCellDateStr;
                this.renderFocusedScheduleList();
            });

            grid.appendChild(cell);
        }
    },

    /**
     * Renders detailed summary lists mapping tasks assigned for the highlighted day
     */
    renderFocusedScheduleList() {
        const container = document.getElementById('schedule-focused-list-target');
        const label = document.getElementById('schedule-focused-date-label');
        if (!container) return;

        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        
        // Pretty print selected tracking label definitions string formats
        const conversionOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
        const parsedDate = new Date(this.selectedDateStr + 'T00:00:00');
        if(label) label.textContent = `Schedule: ${parsedDate.toLocaleDateString(undefined, conversionOptions)}`;

        container.innerHTML = '';
        const targetDayTasks = tasks.filter(t => t.dueDate === this.selectedDateStr);

        if (targetDayTasks.length === 0) {
            container.innerHTML = `<p class="empty-state">No tasks scheduled for this date.</p>`;
            return;
        }

        targetDayTasks.forEach(task => {
            const block = document.createElement('div');
            block.className = `mini-task-item p-${task.priority}`;
            block.style.borderLeft = `4px solid var(--${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'primary'})`;
            block.innerHTML = `
                <div class="mini-task-meta">
                    <h4 style="${task.completed ? 'text-decoration:line-through;opacity:0.6;' : ''}">${this.escapeHTML(task.title)}</h4>
                    <span>Category: ${task.category} | Status: ${task.completed ? 'Complete' : 'Pending'}</span>
                </div>
            `;
            container.appendChild(block);
        });
    },

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }
};