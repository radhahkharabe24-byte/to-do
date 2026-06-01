/**
 * Gamification Core Reward System Logic Engine
 */
const RewardsEngine = {
    // Structural static achievement definition schema map
    BADGES: [
        { id: 'first_task', name: 'Initiate Core', desc: 'Complete your initial operational entry record.', icon: '🎯' },
        { id: 'five_tasks', name: 'Hyper Active', desc: 'Achieve 5 cumulative task execution signatures.', icon: '🚀' },
        { id: 'high_priority', name: 'Crisis Controller', desc: 'Successfully finish a high severity task record.', icon: '⚡' },
        { id: 'streak_3', name: 'Tri-Day Discipline', desc: 'Secure an uninterrupted 3-day efficiency streak.', icon: '🔥' },
        { id: 'procurer', name: 'Acquisition Officer', desc: 'Fulfill an addition tracking item inside shopping ledger.', icon: '🛒' }
    ],

    getProfile() {
        return StorageEngine.getData(StorageEngine.KEYS.REWARDS);
    },

    saveProfile(profile) {
        StorageEngine.setData(StorageEngine.KEYS.REWARDS, profile);
        this.syncUI();
    },

    /**
     * Evaluates XP values to calculate structural profile rank levels
     */
    calculateLevel(points) {
        // Level curve boundary constant mapping formula: Level = floor(points / 100) + 1
        return Math.floor(points / 100) + 1;
    },

    /**
     * Processes execution point modifications
     */
    awardPointsForTask(priority) {
        let pointsToAward = 5; // Default low execution constant
        if (priority === 'medium') pointsToAward = 8;
        if (priority === 'high') pointsToAward = 10;

        const profile = this.getProfile();
        profile.points += pointsToAward;
        
        this.saveProfile(profile);
        this.evaluateTriggerChecks();
    },

    awardBonusPoints(amount) {
        const profile = this.getProfile();
        profile.points += amount;
        this.saveProfile(profile);
    },

    /**
     * Checks requirements to unlock new badges
     */
    evaluateTriggerChecks() {
        const profile = this.getProfile();
        const tasks = StorageEngine.getData(StorageEngine.KEYS.TASKS) || [];
        const completedCount = tasks.filter(t => t.completed).length;
        const shopping = StorageEngine.getData(StorageEngine.KEYS.SHOPPING) || [];
        const purchasedCount = shopping.filter(s => s.purchased).length;

        let modified = false;

        const checkUnlock = (badgeId) => {
            if (!profile.unlockedBadges.includes(badgeId)) {
                profile.unlockedBadges.push(badgeId);
                modified = true;
                this.triggerSuccessAnimation(badgeId);
            }
        };

        // Condition rules mapping engine validation loops
        if (completedCount >= 1) checkUnlock('first_task');
        if (completedCount >= 5) checkUnlock('five_tasks');
        if (purchasedCount >= 1) checkUnlock('procurer');
        if (profile.streak >= 3) checkUnlock('streak_3');
        
        const finishedHigh = tasks.some(t => t.completed && t.priority === 'high');
        if (finishedHigh) checkUnlock('high_priority');

        if (modified) {
            this.saveProfile(profile);
        }
    },

    /**
     * Updates daily tracking streaks based on activity dates
     */
    maintainStreakSequence() {
        const profile = this.getProfile();
        const todayStr = new Date().toDateString();
        
        if (profile.lastCompletionDate) {
            const lastDate = new Date(profile.lastCompletionDate);
            const todayDate = new Date(todayStr);
            const diffTime = Math.abs(todayDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // Perfect chronological progression sequence verified
                profile.streak += 1;
                profile.lastCompletionDate = todayStr;
            } else if (diffDays > 1) {
                // Sequence continuity violation, reset counter metrics
                profile.streak = 1;
                profile.lastCompletionDate = todayStr;
            }
        } else {
            // Uninitialized profile configuration fallback state
            profile.streak = 1;
            profile.lastCompletionDate = todayStr;
        }
        this.saveProfile(profile);
    },

    triggerSuccessAnimation(badgeId) {
        const badgeObj = this.BADGES.find(b => b.id === badgeId);
        if (!badgeObj) return;

        const notice = document.createElement('div');
        notice.className = 'badge-toast-alert';
        notice.innerHTML = `
            <div style="font-size:2rem">${badgeObj.icon}</div>
            <div>
                <strong style="color:#facc15">Achievement Unlocked!</strong>
                <div>${badgeObj.name}</div>
            </div>
        `;
        document.body.appendChild(notice);
        
        setTimeout(() => notice.classList.add('visible'), 100);
        setTimeout(() => {
            notice.classList.remove('visible');
            setTimeout(() => notice.remove(), 400);
        }, 4000);
    },

    /**
     * Synchronizes point metrics, experience bars, and level text across panels
     */
    syncUI() {
        const profile = this.getProfile();
        const currentLevel = this.calculateLevel(profile.points);
        const xpInCurrentLevel = profile.points % 100;

        // Global sidebar widgets updates
        const lvlBadge = document.getElementById('profile-level-badge');
        const xpDisplay = document.getElementById('profile-xp-display');
        const xpBar = document.getElementById('profile-xp-bar');
        const streakText = document.getElementById('streak-count');

        if (lvlBadge) lvlBadge.textContent = `Lv. ${currentLevel}`;
        if (xpDisplay) xpDisplay.textContent = `${xpInCurrentLevel} / 100 XP`;
        if (xpBar) xpBar.style.width = `${xpInCurrentLevel}%`;
        if (streakText) streakText.textContent = profile.streak;

        // Synchronization check safeguards for complementary dashboard widgets
        const dPoints = document.getElementById('dash-total-points');
        const dLvl = document.getElementById('dash-user-level');
        if (dPoints) dPoints.textContent = profile.points;
        if (dLvl) dLvl.textContent = `Level ${currentLevel}`;
    }
};

// Add standard CSS classes for achievement unlocking alerts dynamically
const styleNode = document.createElement('style');
styleNode.textContent = `
    .badge-toast-alert {
        position: fixed; bottom: 20px; right: 20px; background: #0f172a; color: #fff;
        padding: 1rem 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 1rem;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); border: 2px solid #facc15;
        transform: translateY(100px); opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 9999;
    }
    .badge-toast-alert.visible { transform: translateY(0); opacity: 1; }
`;
document.head.appendChild(styleNode);