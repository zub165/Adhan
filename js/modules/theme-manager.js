// Theme Manager Module
class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'Light',
                icon: '☀️',
                colors: {
                    '--primary-color': '#4CAF50',
                    '--secondary-color': '#2196F3',
                    '--background-color': '#ffffff',
                    '--card-bg': '#ffffff',
                    '--text-primary': '#333333',
                    '--text-secondary': '#666666',
                    '--border-color': '#e0e0e0',
                    '--shadow-color': 'rgba(0, 0, 0, 0.1)',
                    '--highlight-color': '#4CAF50',
                    '--prayer-card-active': '#e8f5e9'
                }
            },
            dark: {
                name: 'Dark',
                icon: '🌙',
                colors: {
                    '--primary-color': '#81c784',
                    '--secondary-color': '#64b5f6',
                    '--background-color': '#121212',
                    '--card-bg': '#1e1e1e',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#b0b0b0',
                    '--border-color': '#333333',
                    '--shadow-color': 'rgba(0, 0, 0, 0.3)',
                    '--highlight-color': '#81c784',
                    '--prayer-card-active': '#1b5e20'
                }
            },
            desert: {
                name: 'Desert',
                icon: '🕌',
                colors: {
                    '--primary-color': '#d4ac0d',
                    '--secondary-color': '#b8860b',
                    '--background-color': '#f7e9d7',
                    '--card-bg': '#ffffff',
                    '--text-primary': '#5d4037',
                    '--text-secondary': '#8d6e63',
                    '--border-color': '#d7ccc8',
                    '--shadow-color': 'rgba(93, 64, 55, 0.1)',
                    '--highlight-color': '#ffd700',
                    '--prayer-card-active': '#fff8e1'
                }
            },
            emerald: {
                name: 'Emerald',
                icon: '💠',
                colors: {
                    '--primary-color': '#2e7d32',
                    '--secondary-color': '#00796b',
                    '--background-color': '#e8f5e9',
                    '--card-bg': '#ffffff',
                    '--text-primary': '#1b5e20',
                    '--text-secondary': '#388e3c',
                    '--border-color': '#c8e6c9',
                    '--shadow-color': 'rgba(46, 125, 50, 0.1)',
                    '--highlight-color': '#00c853',
                    '--prayer-card-active': '#b9f6ca'
                }
            },
            azure: {
                name: 'Azure',
                icon: '🌊',
                colors: {
                    '--primary-color': '#1976d2',
                    '--secondary-color': '#0288d1',
                    '--background-color': '#e3f2fd',
                    '--card-bg': '#ffffff',
                    '--text-primary': '#0d47a1',
                    '--text-secondary': '#1565c0',
                    '--border-color': '#bbdefb',
                    '--shadow-color': 'rgba(25, 118, 210, 0.1)',
                    '--highlight-color': '#2196f3',
                    '--prayer-card-active': '#b3e5fc'
                }
            },
            ramadan: {
                name: 'Ramadan',
                icon: '🌙',
                colors: {
                    '--primary-color': '#c17900',
                    '--secondary-color': '#ff9800',
                    '--background-color': '#fff3e0',
                    '--card-bg': '#ffffff',
                    '--text-primary': '#e65100',
                    '--text-secondary': '#f57c00',
                    '--border-color': '#ffe0b2',
                    '--shadow-color': 'rgba(255, 152, 0, 0.1)',
                    '--highlight-color': '#ffd54f',
                    '--prayer-card-active': '#fff8e1'
                }
            },
            night: {
                name: 'Night',
                icon: '✨',
                colors: {
                    '--primary-color': '#5c6bc0',
                    '--secondary-color': '#3f51b5',
                    '--background-color': '#1a237e',
                    '--card-bg': '#283593',
                    '--text-primary': '#e8eaf6',
                    '--text-secondary': '#c5cae9',
                    '--border-color': '#3949ab',
                    '--shadow-color': 'rgba(92, 107, 192, 0.3)',
                    '--highlight-color': '#7986cb',
                    '--prayer-card-active': '#303f9f'
                }
            },
            calligraphy: {
                name: 'Calligraphy',
                icon: '📜',
                colors: {
                    '--primary-color': '#000000',
                    '--secondary-color': '#424242',
                    '--background-color': '#f5f5f5',
                    '--card-bg': '#ffffff',
                    '--text-primary': '#212121',
                    '--text-secondary': '#616161',
                    '--border-color': '#bdbdbd',
                    '--shadow-color': 'rgba(0, 0, 0, 0.1)',
                    '--highlight-color': '#757575',
                    '--prayer-card-active': '#eeeeee'
                }
            }
        };
    }

    initialize() {
        console.log('🎨 Initializing theme manager...');
        this.createThemeSelector();
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
        
        // Add event listener for theme toggle button
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
                this.applyTheme(nextTheme);
            });
        }
        console.log('✅ Theme manager initialized with theme:', savedTheme);
    }

    createThemeSelector() {
        const themePanel = document.createElement('div');
        themePanel.className = 'theme-panel';
        themePanel.innerHTML = `
            <div class="theme-panel-header">
                <h3>Themes</h3>
                <button class="theme-panel-toggle">×</button>
            </div>
            <div class="theme-grid">
                ${Object.entries(this.themes).map(([id, theme]) => `
                    <button class="theme-option" data-theme="${id}">
                        <span class="theme-icon">${theme.icon}</span>
                        <span class="theme-name">${theme.name}</span>
                    </button>
                `).join('')}
            </div>
        `;

        document.body.appendChild(themePanel);

        // Add event listeners
        const toggle = document.querySelector('.theme-panel-toggle');
        toggle?.addEventListener('click', () => {
            themePanel.classList.toggle('collapsed');
        });

        document.querySelectorAll('.theme-option').forEach(button => {
            button.addEventListener('click', (e) => {
                const themeId = e.currentTarget.dataset.theme;
                this.applyTheme(themeId);
            });
        });

        // Add theme switcher button to header
        const header = document.querySelector('header');
        if (header) {
            const themeButton = document.createElement('button');
            themeButton.className = 'theme-switcher-btn';
            themeButton.innerHTML = '🎨';
            themeButton.addEventListener('click', () => {
                themePanel.classList.toggle('collapsed');
            });
            header.appendChild(themeButton);
        }
    }

    applyTheme(themeId) {
        const theme = this.themes[themeId];
        if (!theme) return;

        // Apply colors
        Object.entries(theme.colors).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });

        // Update active state
        document.querySelectorAll('.theme-option').forEach(button => {
            button.classList.toggle('active', button.dataset.theme === themeId);
        });

        // Save preference
        localStorage.setItem('theme', themeId);

        // Update body attribute
        document.documentElement.setAttribute('data-theme', themeId);

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: themeId } }));
    }
}

export default ThemeManager; 