// App Initialization Module
import PrayerCalculation from './prayer-calculation.js';
import AdhanPlayer from './adhan-player.js';
import IslamicCalendar from './islamic-calendar.js';
import QiblaCompass from './qibla-compass.js';
import ThemeManager from './theme-manager.js';
import { initializeDSTSettings, getDSTAdjustment } from './dst-handler.js';
import { getCoordinates, formatCoordinates } from '../utils/location.js';
import { loadAdhan } from './adhan-init.js';

class AppInitializer {
    constructor() {
        console.log('🌍 Initializing application...');
        this.prayerCalculation = null;
        this.adhanPlayer = null;
        this.islamicCalendar = null;
        this.qiblaCompass = null;
        this.themeManager = null;
        this.locationInfo = document.getElementById('location-info');
        this.locationCoords = document.getElementById('location-coords');
        this.refreshButton = document.getElementById('refresh-location');
        this.qariRefreshButton = document.getElementById('refresh-qari');
        this.coordinates = null;
        this.isUpdating = false;
        this.moonPhases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];
    }

    async initialize() {
        try {
            console.log('Starting app initialization...');
            
            // Initialize Islamic Calendar first
            this.islamicCalendar = new IslamicCalendar();
            console.log('Islamic Calendar initialized');
            
            // Update calendar display immediately
            this.islamicCalendar.updateCalendarDisplay();
            console.log('Initial calendar display updated');
            
            // Set up periodic updates for the calendar
            setInterval(() => {
                this.islamicCalendar.updateCalendarDisplay();
            }, 60000); // Update every minute
            
            // Continue with other initializations...
            await this.loadAdhanLibrary();
            await this.initializeLocation();
            await this.initializeComponents();
            this.setupEventListeners();
            this.initializeHeaderComponents();
            this.startPeriodicUpdates();
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    async loadAdhanLibrary() {
        try {
            await loadAdhan();
            console.log('✅ Adhan library loaded');
        } catch (error) {
            console.error('Error loading Adhan library:', error);
        }
    }

    async initializeLocation() {
        try {
            this.locationInfo.classList.add('loading');
            this.locationCoords.textContent = 'Loading location...';

            this.coordinates = await getCoordinates();
            
            if (this.coordinates) {
                this.locationCoords.textContent = formatCoordinates(this.coordinates);
                this.locationInfo.classList.remove('loading');
                return true;
            } else {
                throw new Error('No coordinates received');
            }
        } catch (error) {
            console.error('Error setting up location:', error);
            this.showError('Unable to get location. Using default location (Makkah).');
            this.locationInfo.classList.remove('loading');
            this.locationCoords.textContent = 'Using Default: Makkah';
            this.coordinates = { latitude: 21.3891, longitude: 39.8579 }; // Makkah coordinates
            return false;
        }
    }

    async initializeComponents() {
        try {
            this.qiblaCompass = new QiblaCompass();
            this.qiblaCompass.initialize(); // Initialize the compass
            this.themeManager = new ThemeManager();
            this.themeManager.initialize(); // Initialize theme manager
            console.log('✅ Core components initialized');
            
            // 4. Initialize Adhan player and scan for Qaris
            this.adhanPlayer = new AdhanPlayer();
            await this.scanQaris();
            console.log('✅ Adhan player initialized');
            
            // 5. Initialize prayer calculation with location
            if (this.coordinates) {
                this.prayerCalculation = new PrayerCalculation();
                // Connect Adhan player to prayer calculation
                this.prayerCalculation.setAdhanPlayer(this.adhanPlayer);
                await this.prayerCalculation.initialize(this.coordinates);
                console.log('✅ Prayer calculation initialized');
                
                // Update Qibla direction with coordinates
                this.qiblaCompass.showStaticDirection(this.coordinates.latitude, this.coordinates.longitude);
            }
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }

    async scanQaris() {
        try {
            const qaris = await this.adhanPlayer.scanAvailableQaris();
            this.updateQariSelectors(qaris);
            return true;
        } catch (error) {
            console.error('Error scanning Qaris:', error);
            this.showError('Failed to scan Qari audio files.');
            return false;
        }
    }

    updateQariSelectors(qaris) {
        const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        prayers.forEach(prayer => {
            const select = document.getElementById(`${prayer}QariSelect`);
            if (select) {
                // Clear existing options
                select.innerHTML = '';
                
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = 'default';
                defaultOption.textContent = 'Default';
                select.appendChild(defaultOption);
                
                // Add available qaris
                qaris.forEach(qari => {
                    const option = document.createElement('option');
                    option.value = qari;
                    option.textContent = qari.charAt(0).toUpperCase() + qari.slice(1);
                    select.appendChild(option);
                });
                
                // Set saved preference
                const savedQari = localStorage.getItem(`${prayer}Qari`) || 'default';
                select.value = savedQari;
            }
        });
    }

    initializeHeaderComponents() {
        try {
            if (!this.islamicCalendar) {
                this.islamicCalendar = new IslamicCalendar();
            }
            
            // Force an immediate update of the calendar display
        this.islamicCalendar.updateCalendarDisplay();
            
            // Update Qibla direction if we have coordinates
            if (this.coordinates && this.qiblaCompass) {
                this.qiblaCompass.showStaticDirection(this.coordinates.latitude, this.coordinates.longitude);
            }
        } catch (error) {
            console.error('Error initializing header components:', error);
        }
    }

    setupEventListeners() {
        // Location refresh
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', async () => {
                if (this.isUpdating) return;
                this.isUpdating = true;
                this.refreshButton.classList.add('updating');
                
                try {
                    await this.initializeLocation();
                    if (this.coordinates && this.prayerCalculation) {
                        await this.prayerCalculation.calculatePrayerTimes(this.coordinates);
                    }
                } catch (error) {
                    console.error('Error refreshing location:', error);
                    this.showError('Failed to refresh location.');
                } finally {
                    this.isUpdating = false;
                    this.refreshButton.classList.remove('updating');
                }
            });
        }

        // Qari refresh
        if (this.qariRefreshButton) {
            this.qariRefreshButton.addEventListener('click', async () => {
                if (this.isUpdating) return;
                this.isUpdating = true;
                this.qariRefreshButton.classList.add('updating');
                
                try {
                    await this.scanQaris();
                } catch (error) {
                    console.error('Error refreshing Qaris:', error);
                    this.showError('Failed to refresh Qari list.');
                } finally {
                    this.isUpdating = false;
                    this.qariRefreshButton.classList.remove('updating');
                }
            });
        }

        // Prayer time play/stop buttons
        document.querySelectorAll('.play-adhan').forEach(button => {
            button.addEventListener('click', async (e) => {
                const prayerCard = e.target.closest('.prayer-card');
                if (prayerCard) {
                    const prayerName = prayerCard.dataset.prayer;
                    console.log(`🕌 Play button clicked for ${prayerName}`);
                    
                    try {
                        // Disable play button and enable stop button
                        const playButton = prayerCard.querySelector('.play-adhan');
                        const stopButton = prayerCard.querySelector('.stop-adhan');
                        playButton.disabled = true;
                        stopButton.disabled = false;
                        
                        // Play the adhan
                        await this.adhanPlayer.playAzan(prayerName);
                    } catch (error) {
                        console.error('❌ Error playing Adhan:', error);
                        this.showError('Failed to play Adhan');
                        
                        // Reset button states
                        this.resetAdhanButtons();
                    }
                }
            });
        });

        document.querySelectorAll('.stop-adhan').forEach(button => {
            button.addEventListener('click', async (e) => {
                const prayerCard = e.target.closest('.prayer-card');
                if (prayerCard) {
                    const prayerName = prayerCard.dataset.prayer;
                    console.log(`🕌 Stop button clicked for ${prayerName}`);
                    
                    try {
                        await this.adhanPlayer.stopAzan();
                        this.resetAdhanButtons();
                    } catch (error) {
                        console.error('❌ Error stopping Adhan:', error);
                        this.showError('Failed to stop Adhan');
                    }
                }
            });
        });

        // Settings changes
        this.setupSettingsListeners();
    }

    setupSettingsListeners() {
        // Calculation method
        const calculationMethodSelect = document.getElementById('calculationMethod');
        if (calculationMethodSelect) {
            // Set initial value from localStorage
            const savedMethod = localStorage.getItem('calculationMethod') || 'MuslimWorldLeague';
            calculationMethodSelect.value = savedMethod;
            
            calculationMethodSelect.addEventListener('change', async (e) => {
                try {
                    const newMethod = e.target.value;
                    console.log('Calculation method changed to:', newMethod);
                    
                    if (this.prayerCalculation && this.coordinates) {
                        // Update the calculation method
                        this.prayerCalculation.calculationMethod = newMethod;
                        localStorage.setItem('calculationMethod', newMethod);
                        
                        // Force recalculation with current coordinates
                        console.log('Recalculating prayer times with new method:', newMethod);
                        await this.prayerCalculation.calculatePrayerTimes({
                            latitude: this.coordinates.latitude,
                            longitude: this.coordinates.longitude
                        });
                    }
                } catch (error) {
                    console.error('Error updating calculation method:', error);
                    this.showError('Failed to update calculation method');
                }
            });
        }

        // Madhab
        document.querySelectorAll('input[name="madhab"]').forEach(radio => {
            radio.addEventListener('change', async (e) => {
                try {
                    const newMadhab = e.target.value;
                    console.log('Madhab changed to:', newMadhab);
                    localStorage.setItem('madhab', newMadhab);
                    
                    if (this.prayerCalculation && this.coordinates) {
                        this.prayerCalculation.madhab = newMadhab;
                        console.log('Recalculating prayer times with new madhab...');
                        await this.prayerCalculation.calculatePrayerTimes(this.coordinates);
                    }
                } catch (error) {
                    console.error('Error updating madhab:', error);
                    this.showError('Failed to update madhab settings');
                }
            });
        });

        // DST
        document.querySelectorAll('input[name="dst"]').forEach(radio => {
            radio.addEventListener('change', async (e) => {
                try {
                    const newMode = e.target.value;
                    localStorage.setItem('dstMode', newMode);
                    console.log('DST mode changed to:', newMode);
                    
                    // Initialize DST settings with new mode
                    await initializeDSTSettings();
                    
                    // Recalculate prayer times if available
                    if (this.coordinates && this.prayerCalculation) {
                        await this.prayerCalculation.calculatePrayerTimes(this.coordinates);
                    }
                    
                    // Update DST status display
                    this.updateDSTStatus();
                } catch (error) {
                    console.error('Error updating DST settings:', error);
                    this.showError('Failed to update DST settings');
                }
            });
        });

        // Notification permission
        document.getElementById('notificationBanner')?.addEventListener('click', () => {
            this.adhanPlayer.requestNotificationPermission();
        });

        // Theme change event
        window.addEventListener('themechange', (e) => {
            const theme = e.detail.theme;
            // Update UI elements that need theme-specific adjustments
            this.updateUIForTheme(theme);
        });

        // Prayer notifications toggle
        const notificationToggle = document.getElementById('prayerNotifications');
        if (notificationToggle) {
            // Set initial state
            notificationToggle.checked = localStorage.getItem('prayerNotifications') === 'true';
            
            notificationToggle.addEventListener('change', async (e) => {
                const enabled = e.target.checked;
                localStorage.setItem('prayerNotifications', enabled);
                
                if (enabled && Notification.permission !== 'granted') {
                    await this.requestNotificationPermission();
                }
                
                // Recalculate prayer times to update notification schedule
                if (this.prayerCalculation && this.coordinates) {
                    await this.prayerCalculation.calculatePrayerTimes(this.coordinates);
                }
            });
        }
    }

    updateUIForTheme(theme) {
        // Update prayer cards
        document.querySelectorAll('.prayer-card').forEach(card => {
            card.classList.remove('light', 'dark', 'desert', 'emerald', 'azure', 'ramadan', 'night', 'calligraphy');
            card.classList.add(theme);
        });

        // Update moon phase display
        const moonPhase = document.querySelector('.moon-phase-container');
        if (moonPhase) {
            moonPhase.classList.remove('light', 'dark', 'desert', 'emerald', 'azure', 'ramadan', 'night', 'calligraphy');
            moonPhase.classList.add(theme);
        }

        // Update Qibla compass
        const compass = document.querySelector('.qibla-compass');
        if (compass) {
            compass.classList.remove('light', 'dark', 'desert', 'emerald', 'azure', 'ramadan', 'night', 'calligraphy');
            compass.classList.add(theme);
        }

        // Special handling for Ramadan theme
        document.body.classList.toggle('ramadan-mode', theme === 'ramadan');
    }

    startPeriodicUpdates() {
        // Update prayer times every hour
        setInterval(async () => {
            try {
                await this.initializeLocation();
            } catch (error) {
                console.error('Error in periodic prayer time update:', error);
            }
        }, 3600000); // 1 hour

        // Update Islamic date and moon phase every hour
        setInterval(() => {
            try {
                this.initializeHeaderComponents();
            } catch (error) {
                console.error('Error in periodic header update:', error);
            }
        }, 3600000); // 1 hour

        // Update DST status daily
        setInterval(() => {
            try {
            this.updateDSTStatus();
            } catch (error) {
                console.error('Error in periodic DST update:', error);
            }
        }, 86400000); // 24 hours
    }

    updateDSTStatus() {
        const dstStatus = document.getElementById('dstStatus');
        if (dstStatus) {
            const adjustment = getDSTAdjustment();
            dstStatus.textContent = adjustment ? 'Active (+1 hour)' : 'Inactive';
        }
    }

    showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error';
        errorContainer.textContent = message;

        const closeButton = document.createElement('button');
        closeButton.className = 'error-close';
        closeButton.textContent = '×';
        closeButton.onclick = () => errorContainer.remove();

        errorContainer.appendChild(closeButton);
        document.body.appendChild(errorContainer);

        setTimeout(() => {
            errorContainer.classList.add('show');
        }, 100);

        setTimeout(() => {
            errorContainer.classList.remove('show');
            setTimeout(() => errorContainer.remove(), 300);
        }, 5000);
    }

    setupNotifications() {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        // If permission not asked yet
        if (Notification.permission === 'default') {
            const notificationBanner = document.getElementById('notificationBanner');
            if (notificationBanner) {
                notificationBanner.style.display = 'block';
                notificationBanner.addEventListener('click', () => {
                    this.requestNotificationPermission();
                });
            }
        }
    }

    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
                const banner = document.getElementById('notificationBanner');
                if (banner) banner.style.display = 'none';
                
                // Recalculate prayer times to schedule notifications
                if (this.prayerCalculation && this.coordinates) {
                    await this.prayerCalculation.calculatePrayerTimes(this.coordinates);
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    resetAdhanButtons() {
        // Enable all play buttons and disable all stop buttons
        document.querySelectorAll('.play-adhan').forEach(button => {
            button.disabled = false;
        });
        document.querySelectorAll('.stop-adhan').forEach(button => {
            button.disabled = true;
        });
    }
}

// Single initialization point
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppInitializer();
    app.initialize().catch(error => {
        console.error('Failed to initialize application:', error);
    });
});
