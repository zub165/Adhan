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
            
            // Initialize theme manager
            this.themeManager = new ThemeManager();
            this.themeManager.initialize();
            console.log('Theme manager initialized');
            
            // Load Adhan library
            await this.loadAdhanLibrary();
            
            // Get user location
            await this.initializeLocation();
            console.log('Location initialized with coordinates:', this.coordinates);
            
            // Initialize Qibla compass with coordinates
            this.qiblaCompass = new QiblaCompass();
            this.qiblaCompass.initialize();
            if (this.coordinates) {
                this.qiblaCompass.showStaticDirection(this.coordinates.latitude, this.coordinates.longitude);
            }
            console.log('Qibla compass initialized');
            
            // Initialize Adhan player
            this.adhanPlayer = new AdhanPlayer();
            await this.scanQaris();
            console.log('Adhan player initialized');
            
            // Initialize prayer calculation with location
            if (this.coordinates) {
                this.prayerCalculation = new PrayerCalculation();
                // Connect Adhan player to prayer calculation
                this.prayerCalculation.setAdhanPlayer(this.adhanPlayer);
                await this.prayerCalculation.initialize(this.coordinates);
                console.log('Prayer calculation initialized');
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start periodic updates
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
        const prayers = ['tahajjud', 'suhoor', 'fajr', 'ishraq', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        prayers.forEach(prayer => {
            const select = document.getElementById(`${prayer}QariSelect`);
            if (select) {
                console.log(`Updating Qari selector for ${prayer}`);
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
                    option.textContent = this.formatQariName(qari);
                    select.appendChild(option);
                });
                
                // Set saved preference
                const savedQari = localStorage.getItem(`${prayer}Qari`) || 'default';
                select.value = savedQari;
                
                // Add change event listener
                select.addEventListener('change', (e) => {
                    const selectedQari = e.target.value;
                    localStorage.setItem(`${prayer}Qari`, selectedQari);
                    console.log(`Selected Qari for ${prayer}: ${selectedQari}`);
                });
            } else {
                console.warn(`Selector for ${prayer} not found`);
            }
        });
    }
    
    formatQariName(qari) {
        // Special cases
        const specialNames = {
            'islamcan-18': 'IslamCan (18 Qaris)',
            'islamcan': 'IslamCan',
            'Local': 'Local Adhan',
            'madina': 'Madinah',
            'madinah': 'Madinah',
            'makkah': 'Makkah',
            'default': 'Default'
        };

        if (specialNames[qari]) {
            return specialNames[qari];
        }

        // Format regular names (e.g., "al-ghamdi" -> "Al-Ghamdi")
        return qari.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    setupEventListeners() {
        // Add refresh location button event listener
        if (this.refreshButton) {
            this.refreshButton.addEventListener('click', async () => {
                if (this.isUpdating) return;
                
                this.isUpdating = true;
                this.refreshButton.disabled = true;
                
                try {
                    // Clear saved coordinates to force new detection
                    localStorage.removeItem('latitude');
                    localStorage.removeItem('longitude');
                    localStorage.removeItem('savedLocation');
                    
                    // Get fresh location
                    await this.initializeLocation();
                    
                    // Update Qibla compass with new coordinates
                    if (this.qiblaCompass && this.coordinates) {
                        this.qiblaCompass.showStaticDirection(this.coordinates.latitude, this.coordinates.longitude);
                    }
                    
                    // Update prayer times with new coordinates
                    if (this.prayerCalculation && this.coordinates) {
                        await this.prayerCalculation.updateCoordinates(
                            this.coordinates.latitude,
                            this.coordinates.longitude
                        );
                    }
                    
                    console.log('Location refreshed successfully');
                } catch (error) {
                    console.error('Error refreshing location:', error);
                    this.showError('Failed to update location. Please try again.');
                } finally {
                    this.isUpdating = false;
                    this.refreshButton.disabled = false;
                }
            });
        }
        
        // Add refresh Qari button event listener
        if (this.qariRefreshButton) {
            this.qariRefreshButton.addEventListener('click', async () => {
                if (this.isUpdating) return;
                
                this.isUpdating = true;
                this.qariRefreshButton.disabled = true;
                
                try {
                    await this.scanQaris();
                    console.log('Qaris refreshed successfully');
                } catch (error) {
                    console.error('Error refreshing Qaris:', error);
                    this.showError('Failed to refresh Qaris. Please try again.');
                } finally {
                    this.isUpdating = false;
                    this.qariRefreshButton.disabled = false;
                }
            });
        }
    }

    startPeriodicUpdates() {
        // Update prayer times every minute
        setInterval(() => {
            if (this.prayerCalculation) {
                this.prayerCalculation.recalculatePrayerTimes();
            }
        }, 60000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Remove any existing error messages
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
        
        // Add new error message
        if (this.locationInfo) {
            this.locationInfo.parentNode.insertBefore(errorDiv, this.locationInfo.nextSibling);
        } else {
            document.body.appendChild(errorDiv);
        }
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppInitializer();
    app.initialize();
});

export default AppInitializer;
