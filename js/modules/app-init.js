// App Initialization Module
import PrayerCalculation from './prayer-calculation.js';
import AdhanPlayer from './adhan-player.js';
import IslamicCalendar from './islamic-calendar.js';
import QiblaCompass from './qibla-compass.js';
import ThemeManager from './theme-manager.js';
import { initializeDSTSettings, getDSTAdjustment } from './dst-handler.js';
import { getCoordinates, formatCoordinates } from '../utils/location.js';
import { loadAdhan } from './adhan-init.js';

class App {
    constructor() {
        this.prayerCalculation = null;
        this.adhanPlayer = null;
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
            console.log('Initializing theme manager...');
            this.themeManager = new ThemeManager();
            this.themeManager.initialize();
            console.log('✅ Theme manager initialized with theme: light');

            console.log('Initializing core components...');
            await this.initializeCoreComponents();
            console.log('✅ Core components initialized');

            // Initialize prayer calculation after Adhan.js is loaded
            await this.initializePrayerCalculation();
        } catch (error) {
            console.error('Error during app initialization:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    async initializeCoreComponents() {
        // Load Adhan.js first
        await loadAdhan();
        
        // Initialize AdhanPlayer
        this.adhanPlayer = new AdhanPlayer();
        
        // Get user's location
        await this.getUserLocation();
    }

    async initializePrayerCalculation() {
        try {
            if (!this.coordinates) {
                throw new Error('Location coordinates not available');
            }

            this.prayerCalculation = new PrayerCalculation();
            this.prayerCalculation.setAdhanPlayer(this.adhanPlayer);
            await this.prayerCalculation.initialize(this.coordinates);
        } catch (error) {
            console.error('Error initializing prayer calculation:', error);
            throw error;
        }
    }

    async getUserLocation() {
        try {
            const position = await this.getCurrentPosition();
            this.coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                elevation: position.coords.altitude || 0
            };
            console.log('✅ Location obtained:', this.coordinates);
        } catch (error) {
            console.error('Error getting location:', error);
            // Use default coordinates (Makkah)
            this.coordinates = {
                latitude: 21.4225,
                longitude: 39.8262,
                elevation: 0
            };
            console.log('⚠️ Using default location (Makkah)');
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
});
