/**
 * Root Application Core Orchestration Engine Bootstrapper
 */
document.addEventListener('DOMContentLoaded', () => {
    AppRouterEngine.init();
    ThemeManagementEngine.init();
    
    // Core structural domain runtime bootstrap initialization sequencing calls
    TasksModule.init();
    CalendarModule.init();
    ShoppingModule.init();
    RemindersEngine.init();
    
    // Perform preliminary statistical aggregation calculations
    AnalyticsEngine.recalculateMetrics();
    RewardsEngine.syncUI();

    // Start live clock intervals pipeline
    CoreClockEngine.start();
});

/**
 * Single-Page Client-Side View Navigation Engine Routing Framework
 */
const AppRouterEngine = {
    init() {
        const menuItems = document.querySelectorAll('.menu-item');
        const mobileToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetViewId = item.getAttribute('data-target');
                this.switchActiveView(targetViewId, item);
                
                // Close sidebar on mobile after clicking an option
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('open');
                }
            });
        });

        // Setup shortcut hyperlink bindings on sub views
        document.querySelectorAll('.view-switch-shortcut').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetViewId = link.getAttribute('data-target');
                const matchingMenuItem = document.querySelector(`.menu-item[data-target="${targetViewId}"]`);
                this.switchActiveView(targetViewId, matchingMenuItem);
            });
        });

        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    },

    switchActiveView(viewId, activeMenuItemNode) {
        // Toggle view container visibilities
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        const targetPanel = document.getElementById(viewId);
        if (targetPanel) targetPanel.classList.add('active');

        // Toggle active styling on navigation items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        if (activeMenuItemNode) activeMenuItemNode.classList.add('active');
    }
};

/**
 * System Live Time Synchronization Engine
 */
const CoreClockEngine = {
    start() {
        const dateTarget = document.getElementById('header-date');
        const timeTarget = document.getElementById('header-time');

        const updateClock = () => {
            const now = new Date();
            
            // Format options constraints
            if(dateTarget) dateTarget.textContent = now.toLocaleDateString(undefined, { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            if(timeTarget) timeTarget.textContent = now.toLocaleTimeString();
        };

        updateClock();
        setInterval(updateClock, 1000);
    }
};

/**
 * Global Look & Feel Styles Switcher Driver
 */
const ThemeManagementEngine = {
    init() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => this.toggleThemeState());
        this.applyThemeState(StorageEngine.getData(StorageEngine.KEYS.THEME) || 'light');
    },

    toggleThemeState() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.applyThemeState(nextTheme);
        StorageEngine.setData(StorageEngine.KEYS.THEME, nextTheme);
    },

    applyThemeState(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        const sunIcon = document.getElementById('theme-icon-sun');
        const moonIcon = document.getElementById('theme-icon-moon');

        if (theme === 'dark') {
            sunIcon?.classList.remove('hidden');
            moonIcon?.classList.add('hidden');
        } else {
            sunIcon?.classList.add('hidden');
            moonIcon?.classList.remove('hidden');
        }
    }
};