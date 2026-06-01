/**
 * Statistical Aggregation & Math Analytics Optimization Engine
 */
const AnalyticsEngine = {
    
    /**
     * Re-aggregates internal values to update metric widgets across panels
     */
    recalculateMetrics() {
        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        const profile = RewardsEngine.getProfile();

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        
        // Completion rate calculation with division safety safeguard
        const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Current calendar tracking periods comparisons
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        const finishedToday = tasks.filter(t => t.completed && t.completionDate === todayStr).length;
        
        // Dynamic operational definitions for week constraints range
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        const finishedThisWeek = tasks.filter(t => {
            if (!t.completed || !t.completionDate) return false;
            return new Date(t.completionDate) >= oneWeekAgo;
        }).length;

        // Current monthly calendar constraint boundaries filtering
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const finishedThisMonth = tasks.filter(t => t.completed && t.completionDate && t.completionDate.startsWith(currentMonthStr)).length;

        // Computes peak operational tracking day velocity
        const velocityMap = {};
        tasks.forEach(t => {
            if (t.completed && t.completionDate) {
                velocityMap[t.completionDate] = (velocityMap[t.completionDate] || 0) + 1;
            }
        });

        let peakDay = "None";
        let maxCount = 0;
        Object.keys(velocityMap).forEach(day => {
            if (velocityMap[day] > maxCount) {
                maxCount = velocityMap[day];
                peakDay = day;
            }
        });

        this.updateDOMWidgets({
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            rate: rate,
            today: finishedToday,
            week: finishedThisWeek,
            month: finishedThisMonth,
            peak: peakDay,
            points: profile.points
        });
    },

    updateDOMWidgets(m) {
        // Dashboard Tab elements updates
        const dRate = document.getElementById('dash-completion-rate');
        const dPend = document.getElementById('dash-pending-count');
        if (dRate) dRate.textContent = `${m.rate}%`;
        if (dPend) dPend.textContent = m.pending;

        // Analytics Tab View element targets
        const heroRate = document.getElementById('analytics-completion-rate-hero');
        const heroBar = document.getElementById('analytics-completion-bar-hero');
        if (heroRate) heroRate.textContent = `${m.rate}%`;
        if (heroBar) heroBar.style.width = `${m.rate}%`;

        // Direct metric data mapping interfaces
        const elScore = document.getElementById('an-metric-score');
        const elToday = document.getElementById('an-metric-today');
        const elWeek = document.getElementById('an-metric-week');
        const elMonth = document.getElementById('an-metric-month');
        const elPeak = document.getElementById('an-metric-peak-day');
        const elPending = document.getElementById('an-metric-pending');

        if (elScore) elScore.textContent = m.points;
        if (elToday) elToday.textContent = m.today;
        if (elWeek) elWeek.textContent = m.week;
        if (elMonth) elMonth.textContent = m.month;
        if (elPeak) elPeak.textContent = elPeak.textContent = (m.peak !== "None") ? this.formatCompactDate(m.peak) : "None";
        if (elPending) elPending.textContent = m.pending;

        this.renderAchievementMatrices();
    },

    formatCompactDate(dateStr) {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    },

    /**
     * Injects system badges cleanly across overview panels
     */
    renderAchievementMatrices() {
        const profile = RewardsEngine.getProfile();
        const unlockedList = profile.unlockedBadges || [];

        const dashContainer = document.getElementById('dash-achievements-container');
        const fullMatrixContainer = document.getElementById('analytics-badges-full-matrix');

        if (dashContainer) {
            dashContainer.innerHTML = '';
            RewardsEngine.BADGES.forEach(badge => {
                const isUnlocked = unlockedList.includes(badge.id);
                const node = document.createElement('div');
                node.className = `badge-lock-node ${isUnlocked ? 'unlocked' : ''}`;
                node.title = `${badge.name}: ${badge.desc}`;
                node.innerHTML = `
                    <div class="badge-icon-frame">${isUnlocked ? badge.icon : '🔒'}</div>
                    <span>${badge.name}</span>
                `;
                dashContainer.appendChild(node);
            });
        }

        if (fullMatrixContainer) {
            fullMatrixContainer.innerHTML = '';
            RewardsEngine.BADGES.forEach(badge => {
                const isUnlocked = unlockedList.includes(badge.id);
                const block = document.createElement('div');
                block.className = `badge-expanded-card ${isUnlocked ? 'unlocked' : ''}`;
                block.innerHTML = `
                    <div class="big-icon">${isUnlocked ? badge.icon : '🔒'}</div>
                    <h4>${badge.name}</h4>
                    <p>${badge.desc}</p>
                `;
                fullMatrixContainer.appendChild(block);
            });
        }
    }
};