/**
 * LocalStorage Isolated Data Interface Engine
 */
const StorageEngine = {
    KEYS: {
        TASKS: 'zenith_tasks',
        SHOPPING: 'zenith_shopping',
        REWARDS: 'zenith_rewards',
        THEME: 'zenith_theme'
    },

    /**
     * Initializes default data structures into disk space if absent
     */
    init() {
        if (!localStorage.getItem(this.KEYS.TASKS)) {
            localStorage.setItem(this.KEYS.TASKS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.SHOPPING)) {
            localStorage.setItem(this.KEYS.SHOPPING, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.REWARDS)) {
            const defaultRewards = {
                points: 0,
                streak: 0,
                lastCompletionDate: null,
                unlockedBadges: []
            };
            localStorage.setItem(this.KEYS.REWARDS, JSON.stringify(defaultRewards));
        }
        if (!localStorage.getItem(this.KEYS.THEME)) {
            localStorage.setItem(this.KEYS.THEME, 'light');
        }
    },

    getData(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (e) {
            console.error("Data fetch violation serialization fault:", e);
            return null;
        }
    },

    setData(key, payload) {
        try {
            localStorage.setItem(key, JSON.stringify(payload));
            return true;
        } catch (e) {
            console.error("Data commit violation serialization fault:", e);
            return false;
        }
    }
};

// Auto boot database layer immediately on inclusion parsing
StorageEngine.init();