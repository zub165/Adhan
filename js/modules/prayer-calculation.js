import { loadAdhan } from './adhan-init.js';
import { getDSTAdjustment } from './dst-handler.js';

class PrayerCalculation {
    constructor() {
        this.calculationMethod = localStorage.getItem('calculationMethod') || 'ISNA';
        this.madhab = localStorage.getItem('madhab') || 'Shafi';
        this.coordinates = null;
        this.prayerTimes = null;
        this.lastCalculation = null;
        this.notificationTimeout = null;
        this.adhanPlayer = null;
        
        // Prayer angle configurations
        this.angles = {
            fajr: -18, // Dawn twilight begins
            sunrise: -0.833, // Sun's upper limb touches horizon
            dhuhr: 0, // Sun crosses meridian
            maghrib: -0.833, // Sun's upper limb touches horizon
            isha: -18 // Night twilight ends
        };
        
        // Initialize DST status
        this.dstAdjustment = this.getDSTAdjustment();
        
        // Add event listeners for settings changes
        document.addEventListener('DOMContentLoaded', () => {
            // Listen for calculation method changes
            const methodSelect = document.querySelector('select[name="calculationMethod"]');
            if (methodSelect) {
                methodSelect.addEventListener('change', (e) => {
                    this.calculationMethod = e.target.value;
                    localStorage.setItem('calculationMethod', this.calculationMethod);
                    this.recalculatePrayerTimes();
                });
            }
            
            // Listen for madhab changes
            const madhabInputs = document.querySelectorAll('input[name="madhab"]');
            madhabInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    this.madhab = e.target.value;
                    localStorage.setItem('madhab', this.madhab);
                    this.recalculatePrayerTimes();
                });
            });
        });
    }

    setAdhanPlayer(player) {
        this.adhanPlayer = player;
    }

    async initialize(coordinates) {
        try {
            console.log('Initializing prayer calculation module...');
            
            if (!coordinates) {
                throw new Error('Coordinates are required for initialization');
            }

            // Load saved settings
            this.loadSettings();
            
            this.coordinates = coordinates;
            await this.calculatePrayerTimes(coordinates);
            console.log('✅ Prayer calculation module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing prayer calculation:', error);
            throw error;
        }
    }

    loadSettings() {
        // Load calculation method
        const savedMethod = localStorage.getItem('calculationMethod');
        if (savedMethod && window.Adhan.CalculationMethod[savedMethod]) {
            this.calculationMethod = savedMethod;
            const methodSelect = document.querySelector('select[name="calculationMethod"]');
            if (methodSelect) {
                methodSelect.value = savedMethod;
            }
        }

        // Load madhab
        const savedMadhab = localStorage.getItem('madhab');
        if (savedMadhab) {
            this.madhab = savedMadhab;
            const madhabInput = document.querySelector(`input[name="madhab"][value="${savedMadhab}"]`);
            if (madhabInput) {
                madhabInput.checked = true;
            }
        }
    }

    // Convert degrees to radians
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // Convert radians to degrees
    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    // Calculate sun's declination with higher precision
    getSunDeclination(date) {
        const D = date.getDate();
        const M = date.getMonth() + 1;
        const Y = date.getFullYear();

        // Calculate Julian Day
        const JD = 367 * Y - Math.floor(7 * (Y + Math.floor((M + 9) / 12)) / 4) +
            Math.floor(275 * M / 9) + D - 730531.5;

        // Calculate solar parameters
        const L0 = 280.46646 + 0.9856474 * JD; // Mean longitude
        const M0 = 357.52911 + 0.9856003 * JD; // Mean anomaly
        const Lambda = L0 + 1.915 * Math.sin(this.toRadians(M0)) + 0.020 * Math.sin(this.toRadians(2 * M0));
        
        return 23.439 - 0.0000004 * JD * Math.sin(this.toRadians(Lambda));
    }

    // Calculate equation of time with higher precision
    getEquationOfTime(date) {
        const D = date.getDate();
        const M = date.getMonth() + 1;
        const Y = date.getFullYear();

        // Calculate Julian Day
        const JD = 367 * Y - Math.floor(7 * (Y + Math.floor((M + 9) / 12)) / 4) +
            Math.floor(275 * M / 9) + D - 730531.5;

        const L0 = 280.46646 + 0.9856474 * JD;
        const M0 = 357.52911 + 0.9856003 * JD;
        const e = 0.016708634 - JD * 0.000000001236;
        
        const E = M0 + e * Math.sin(this.toRadians(M0)) * (1 + e * Math.cos(this.toRadians(M0)));
        const Lambda = L0 + 1.915 * Math.sin(this.toRadians(M0)) + 0.020 * Math.sin(this.toRadians(2 * M0));
        
        const R = 1.00014 - 0.01671 * Math.cos(this.toRadians(M0)) - 0.00014 * Math.cos(this.toRadians(2 * M0));
        const Alpha = Lambda - 2.466 * Math.sin(this.toRadians(2 * Lambda)) + 0.053 * Math.sin(this.toRadians(4 * Lambda));
        
        return (L0 - Alpha) * 4;
    }

    // Calculate prayer time with refined altitude calculations
    calculatePrayerTime(date, latitude, longitude, angle) {
        try {
            const φ = this.toRadians(latitude);
            const δ = this.toRadians(this.getSunDeclination(date));
            
            // Calculate standard altitude for given angle
            let h0 = angle;
            
            // Atmospheric refraction corrections
            if (angle === this.angles.sunrise || angle === this.angles.maghrib) {
                // Add atmospheric refraction and sun's semidiameter
                h0 -= 0.833 + 0.0347 * Math.sqrt(this.coordinates.elevation || 0);
            }
            
            const h = this.toRadians(h0);

            // Calculate hour angle
            let cosH = (Math.sin(h) - Math.sin(φ) * Math.sin(δ)) / (Math.cos(φ) * Math.cos(δ));
            
            if (Math.abs(cosH) > 1) {
                // Handle polar cases
                if (angle < 0) {
                    // Sun never reaches the angle - use closest approximation
                    cosH = angle > -18 ? -1 : 1;
                } else {
                    console.warn(`Prayer time calculation not valid for this latitude (${latitude}) and date`);
                    return null;
                }
            }

            const H = this.toDegrees(Math.acos(cosH));
            
            // Get equation of time and timezone offset
            const EoT = this.getEquationOfTime(date);
            const timezone = -date.getTimezoneOffset() / 60;
            
            // Calculate local time
            let T = 12 + (angle < 0 ? -H : H) / 15 - longitude / 15 - EoT / 60 + timezone;
            
            // Ensure time is within valid range
            while (T < 0) T += 24;
            while (T >= 24) T -= 24;
            
            // Convert to Date object with proper handling of day boundaries
            const hours = Math.floor(T);
            const minutes = Math.floor((T - hours) * 60);
            const seconds = Math.floor(((T - hours) * 60 - minutes) * 60);
            
            const prayerTime = new Date(date);
            prayerTime.setHours(hours, minutes, seconds, 0);
            
            // Adjust day if time crosses midnight
            if (hours < 6 && date.getHours() > 18) {
                prayerTime.setDate(prayerTime.getDate() + 1);
            }
            
            return prayerTime;
        } catch (error) {
            console.error('Error in calculatePrayerTime:', error);
            return null;
        }
    }

    // Add DST adjustment method
    getDSTAdjustment() {
        try {
            // Check if DST is in effect
            const jan = new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset();
            const jul = new Date(new Date().getFullYear(), 6, 1).getTimezoneOffset();
            const isDST = Math.max(jan, jul) !== new Date().getTimezoneOffset();
            
            // Return 1 if DST is in effect, 0 otherwise
            return isDST ? 1 : 0;
        } catch (error) {
            console.warn('Error determining DST:', error);
            return 0;
        }
    }

    // Calculate Asr time based on madhab
    calculateAsrTime(date, latitude, longitude) {
        try {
            const φ = this.toRadians(latitude);
            const δ = this.toRadians(this.getSunDeclination(date));
            
            // Calculate solar noon
            const EoT = this.getEquationOfTime(date);
            const timezone = -date.getTimezoneOffset() / 60;
            const solarNoon = 12 - longitude / 15 - EoT / 60 + timezone;
            
            // Calculate solar altitude at noon
            const solarAlt = Math.asin(Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ));
            
            // Shadow length ratio based on madhab
            const shadowRatio = this.madhab.toLowerCase() === 'hanafi' ? 2 : 1;
            
            // Calculate Asr angle
            const t = Math.atan(1 / (shadowRatio + Math.tan(solarAlt)));
            const asrAngle = this.toDegrees(Math.PI / 2 - t);
            
            return this.calculatePrayerTime(date, latitude, longitude, asrAngle);
        } catch (error) {
            console.error('Error calculating Asr time:', error);
            return null;
        }
    }

    async calculatePrayerTimes(coordinates) {
        try {
            if (!coordinates) {
                throw new Error('Coordinates are required for prayer calculation');
            }

            console.log('Calculating prayer times for coordinates:', coordinates);
            
            const date = new Date();
            const { latitude, longitude } = coordinates;
            
            // Store coordinates for later use
            this.coordinates = coordinates;
            
            // First try to get times from API
            try {
                const timezoneOffset = -date.getTimezoneOffset() / 60;
                console.log('Timezone offset:', timezoneOffset);
                
                const apiTimes = await this.fetchPrayerTimesFromAPI(coordinates, timezoneOffset);
                
                if (apiTimes && Object.keys(apiTimes).length >= 5) {
                    console.log('Using API prayer times');
                    
                    // Update class properties
                    this.prayerTimes = apiTimes;
                    this.lastCalculation = date;
                    
                    // Update UI
                    await this.updatePrayerTimesUI(apiTimes);
                    
                    return apiTimes;
                } else {
                    console.warn('API times incomplete, falling back to calculations');
                }
            } catch (apiError) {
                console.warn('Failed to fetch API times, using calculated times:', apiError);
            }
            
            // Fallback to calculated times
            console.log('Calculating prayer times using astronomical formulas');
            
            // Get calculation parameters from Adhan library
            const params = await this.getCalculationParameters();
            
            // Create coordinates object for Adhan library
            const adhanCoordinates = new window.Adhan.Coordinates(latitude, longitude);
            
            // Create date components
            const dateComponents = new window.Adhan.DateComponents(
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate()
            );
        
        // Calculate prayer times
            const prayerTimes = new window.Adhan.PrayerTimes(
                adhanCoordinates,
                dateComponents,
            params
        );

            // Get timezone
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            // Format times
            const formattedTimes = {
                fajr: prayerTimes.fajr,
                sunrise: prayerTimes.sunrise,
                dhuhr: prayerTimes.dhuhr,
                asr: prayerTimes.asr,
                maghrib: prayerTimes.maghrib,
                isha: prayerTimes.isha
            };
            
            console.log('Calculated prayer times:', {
                method: this.calculationMethod,
                madhab: this.madhab,
                times: Object.fromEntries(
                    Object.entries(formattedTimes).map(([k, v]) => [k, this.formatTime(v)])
                )
            });
            
            // Update class properties
            this.prayerTimes = formattedTimes;
            this.lastCalculation = date;

        // Update UI
            await this.updatePrayerTimesUI(formattedTimes);
        
            return formattedTimes;
    } catch (error) {
        console.error('Error calculating prayer times:', error);
            this.showError('Failed to calculate prayer times');
            
            // Try to use Adhan library as a last resort
            try {
                if (window.Adhan) {
                    console.log('Attempting to use Adhan library directly as last resort');
                    
                    const { latitude, longitude } = coordinates;
                    const date = new Date();
                    
                    // Create coordinates object for Adhan library
                    const adhanCoordinates = new window.Adhan.Coordinates(latitude, longitude);
                    
                    // Create date components
                    const dateComponents = new window.Adhan.DateComponents(
                        date.getFullYear(),
                        date.getMonth() + 1,
                        date.getDate()
                    );
                    
                    // Use default ISNA method
                    const params = window.Adhan.CalculationMethod.ISNA();
                    
                    // Calculate prayer times
                    const prayerTimes = new window.Adhan.PrayerTimes(
                        adhanCoordinates,
                        dateComponents,
                        params
                    );
                    
                    // Format times
                    const formattedTimes = {
                        fajr: prayerTimes.fajr,
                        sunrise: prayerTimes.sunrise,
                        dhuhr: prayerTimes.dhuhr,
                        asr: prayerTimes.asr,
                        maghrib: prayerTimes.maghrib,
                        isha: prayerTimes.isha
                    };
                    
                    // Update UI
                    await this.updatePrayerTimesUI(formattedTimes);
                    
                    return formattedTimes;
                }
            } catch (fallbackError) {
                console.error('Even fallback calculation failed:', fallbackError);
        }
        
        throw error;
    }
}

    validateAndCombineTimes(calculatedTimes, apiTimes) {
        const validatedTimes = {};
        const prayers = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        for (const prayer of prayers) {
            const calcTime = calculatedTimes[prayer];
            const apiTime = apiTimes[prayer];
            
            if (!calcTime && !apiTime) {
                console.warn(`No valid time available for ${prayer}`);
                continue;
            }
            
            if (!calcTime) {
                validatedTimes[prayer] = apiTime;
                continue;
            }
            
            if (!apiTime) {
                validatedTimes[prayer] = calcTime;
                continue;
            }
            
            // Compare times and handle discrepancies
            const timeDiff = Math.abs(calcTime - apiTime) / (1000 * 60); // difference in minutes
            
            if (timeDiff > 15) { // If difference is more than 15 minutes
                console.warn(`Large time difference for ${prayer}:`, {
                    calculated: this.formatTime(calcTime),
                    api: this.formatTime(apiTime),
                    diffMinutes: timeDiff
                });
                
                // Use the more conservative time (earlier for start times, later for end times)
                if (prayer === 'fajr' || prayer === 'dhuhr' || prayer === 'asr' || prayer === 'maghrib') {
                    validatedTimes[prayer] = calcTime < apiTime ? calcTime : apiTime;
                } else {
                    validatedTimes[prayer] = calcTime > apiTime ? calcTime : apiTime;
                }
            } else {
                // If difference is small, use API time as it might include local adjustments
                validatedTimes[prayer] = apiTime;
            }
        }
        
        return validatedTimes;
    }

    async fetchPrayerTimesFromAPI(coordinates, timezoneOffset) {
        const date = new Date();
        const timestamp = Math.floor(date.getTime() / 1000);
        
        // Convert calculation method to API format
        const methodMapping = {
            'MuslimWorldLeague': 3,
            'ISNA': 2,
            'MWL': 3,
            'Karachi': 1,
            'UAQ': 4,
            'Dubai': 4,
            'Kuwait': 4,
            'Qatar': 4,
            'Singapore': 5,
            'Egypt': 5
        };
        
        const method = methodMapping[this.calculationMethod] || 2; // Default to ISNA if method not found
        
        // Convert madhab to API format
        const madhabId = this.madhab.toLowerCase() === 'hanafi' ? 2 : 1;
        
        try {
            // Use direct API call to aladhan.com instead of proxy
            const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&method=${method}&school=${madhabId}`;
            
            console.log('Fetching prayer times from API:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (!data.data || !data.data.timings) {
                throw new Error('Invalid API response format');
            }
            
            // Convert API response to Adhan.js format
            const timings = data.data.timings;
            
            // Apply timezone offset
            const prayerTimes = {};
            ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach(prayer => {
                const time = timings[prayer];
                if (!time) {
                    console.warn(`Missing ${prayer} time in API response`);
                    return;
                }
                
                try {
                    const [hours, minutes] = time.split(':').map(Number);
                    
                    // Create date object for the prayer time
                    const prayerDate = new Date(date);
                    prayerDate.setHours(hours, minutes, 0, 0);
                    
                    // Convert prayer name to lowercase for internal use
                    const prayerKey = prayer.toLowerCase();
                    prayerTimes[prayerKey] = prayerDate;
                } catch (error) {
                    console.error(`Error parsing ${prayer} time:`, time, error);
                }
            });
            
            console.log('Prayer times fetched from API:', {
                original: timings,
                converted: Object.fromEntries(
                    Object.entries(prayerTimes).map(([k, v]) => [k, this.formatTime(v)])
                )
            });
            
            return prayerTimes;
        } catch (error) {
            console.error('Error fetching prayer times from API:', error);
            return null;
        }
    }

    async getCalculationParameters() {
        if (typeof window.Adhan === 'undefined') {
            throw new Error('Adhan library not available for parameters');
        }
        
        // Get calculation method
        if (!window.Adhan.CalculationMethod[this.calculationMethod]) {
            console.warn(`Invalid calculation method: ${this.calculationMethod}, using default`);
            this.calculationMethod = 'MuslimWorldLeague';
        }

        console.log(`Using calculation method: ${this.calculationMethod}`);
        const params = window.Adhan.CalculationMethod[this.calculationMethod]();

        // Set madhab
        params.madhab = this.madhab.toLowerCase() === 'hanafi' ? 
            window.Adhan.Madhab.Hanafi : 
            window.Adhan.Madhab.Shafi;

        // Get DST adjustment from DST handler
        const { getDSTAdjustment } = await import('./dst-handler.js');
        const dstAdjustment = getDSTAdjustment();
        
        // Apply DST adjustment to prayer times
        if (dstAdjustment) {
            if (!params.adjustments) {
                params.adjustments = {};
            }
            ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(prayer => {
                params.adjustments[prayer] = (params.adjustments[prayer] || 0) + (dstAdjustment * 60);
            });
        }

        // Log parameters for debugging
        console.log('Calculation parameters:', {
            method: this.calculationMethod,
            madhab: this.madhab,
            fajrAngle: params.fajrAngle,
            ishaAngle: params.ishaAngle,
            ishaInterval: params.ishaInterval,
            adjustments: params.adjustments,
            dstAdjustment: dstAdjustment
        });

        return params;
    }

    async recalculatePrayerTimes() {
        if (this.coordinates) {
            await this.calculatePrayerTimes(this.coordinates);
        }
    }

    async updatePrayerTimesUI(prayerTimes) {
        if (!prayerTimes) {
            console.error('No prayer times to update UI');
            return;
        }

        // Standard prayer times mapping (excluding sunrise as it doesn't have a UI card)
        const prayers = {
            fajr: 'fajr',
            dhuhr: 'dhuhr',
            asr: 'asr',
            maghrib: 'maghrib',
            isha: 'isha'
        };

        // Calculate additional prayer times
        const additionalTimes = this.calculateAdditionalTimes(prayerTimes);

        // Log all prayer times for debugging
        console.log('All prayer times:', {
            standard: Object.fromEntries(
                Object.entries(prayerTimes).map(([k, v]) => [k, this.formatTime(v)])
            ),
            additional: Object.fromEntries(
                Object.entries(additionalTimes).map(([k, v]) => [k, this.formatTime(v)])
            )
        });

        // Update standard prayer times
        for (const [key, prayerId] of Object.entries(prayers)) {
            const time = prayerTimes[key];
            if (time) {
                const timeString = this.formatTime(time);
                const element = document.querySelector(`.prayer-card[data-prayer="${prayerId}"] .prayer-time`);
                if (element) {
                    element.textContent = timeString;
                    console.log(`Updated ${prayerId} time to ${timeString}`);
                } else {
                    console.warn(`Element for ${prayerId} not found`);
                }
            } else {
                console.warn(`No time available for ${key}`);
            }
        }

        // Update additional prayer times
        const additionalPrayers = {
            tahajjud: 'tahajjud',
            suhoor: 'suhoor',
            ishraq: 'ishraq'
        };

        for (const [key, prayerId] of Object.entries(additionalPrayers)) {
            const time = additionalTimes[key];
            if (time) {
                const timeString = this.formatTime(time);
                const element = document.querySelector(`.prayer-card[data-prayer="${prayerId}"] .prayer-time`);
                if (element) {
                    element.textContent = timeString;
                    console.log(`Updated ${prayerId} time to ${timeString}`);
                } else {
                    console.warn(`Element for ${prayerId} not found`);
                }
            } else {
                console.warn(`No additional time available for ${key}`);
            }
        }

        // Update next prayer and schedule notification
        this.updateNextPrayer(prayerTimes, additionalTimes);
        this.scheduleNextPrayerNotification(prayerTimes, additionalTimes);
    }

    calculateAdditionalTimes(prayerTimes) {
        if (!prayerTimes || !prayerTimes.fajr || !prayerTimes.maghrib) {
            console.warn('Missing required prayer times for additional calculations');
            return this.getDefaultAdditionalTimes();
        }

        const additionalTimes = {};
        
        try {
            // Get current date for calculations
            const now = new Date();
            
            // Get prayer times as Date objects
            const fajrTime = new Date(prayerTimes.fajr);
            const maghribTime = new Date(prayerTimes.maghrib);
            
            // Ensure we have valid times
            if (isNaN(fajrTime.getTime()) || isNaN(maghribTime.getTime())) {
                throw new Error('Invalid prayer time dates');
            }
            
            // Calculate night duration (from Maghrib to Fajr)
            let nightStart = new Date(maghribTime);
            let nightEnd = new Date(fajrTime);
            
            // If Fajr is earlier in the day than Maghrib, it means Fajr is for the next day
            if (fajrTime.getHours() < maghribTime.getHours()) {
                // Add one day to Fajr time
                nightEnd = new Date(fajrTime);
                nightEnd.setDate(nightEnd.getDate() + 1);
            }
            
            // Calculate night duration in milliseconds
            const nightDuration = nightEnd - nightStart;
            
            if (nightDuration <= 0) {
                throw new Error('Invalid night duration calculation');
            }
            
            // Tahajjud starts at the last third of the night
            // Calculate the time that is 2/3 of the way between Maghrib and Fajr
            const tahajjudTime = new Date(nightStart.getTime() + (nightDuration * 2/3));
            additionalTimes.tahajjud = tahajjudTime;
            
            // Suhoor ends at 10 minutes before Fajr
            const suhoorEndsTime = new Date(fajrTime);
            suhoorEndsTime.setMinutes(suhoorEndsTime.getMinutes() - 10);
            additionalTimes.suhoor = suhoorEndsTime;
            
            // Ishraq is 20 minutes after sunrise
            if (prayerTimes.sunrise) {
                const sunriseTime = new Date(prayerTimes.sunrise);
                if (!isNaN(sunriseTime.getTime())) {
                    const ishraqTime = new Date(sunriseTime);
                    ishraqTime.setMinutes(ishraqTime.getMinutes() + 20);
                    additionalTimes.ishraq = ishraqTime;
                }
            }
            
            console.log('Additional prayer times calculated:', {
                tahajjud: this.formatTime(additionalTimes.tahajjud),
                suhoor: this.formatTime(additionalTimes.suhoor),
                ishraq: additionalTimes.ishraq ? this.formatTime(additionalTimes.ishraq) : 'N/A'
            });
            
            return additionalTimes;
        } catch (error) {
            console.error('Error calculating additional prayer times:', error);
            return this.getDefaultAdditionalTimes();
        }
    }
    
    getDefaultAdditionalTimes() {
        console.log('Using default additional prayer times');
        const additionalTimes = {};
        const now = new Date();
        
        // Fallback Tahajjud (3:00 AM)
        const tahajjudFallback = new Date(now);
        tahajjudFallback.setHours(3, 0, 0, 0);
        additionalTimes.tahajjud = tahajjudFallback;
        
        // Fallback Suhoor (4:30 AM)
        const suhoorFallback = new Date(now);
        suhoorFallback.setHours(4, 30, 0, 0);
        additionalTimes.suhoor = suhoorFallback;
        
        // Fallback Ishraq (7:00 AM)
        const ishraqFallback = new Date(now);
        ishraqFallback.setHours(7, 0, 0, 0);
        additionalTimes.ishraq = ishraqFallback;
        
        return additionalTimes;
    }

    formatTime(date) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            console.error('Invalid date for formatting:', date);
            return '--:--';
        }
        
        try {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error formatting time:', error);
            
            // Fallback formatting
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const formattedHours = hours % 12 || 12;
            const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            
            return `${formattedHours}:${formattedMinutes} ${ampm}`;
        }
    }

    updateNextPrayer(prayerTimes, additionalTimes) {
        const now = new Date();
        
        // Combine standard and additional prayer times
        const allPrayerTimes = {
            ...prayerTimes,
            ...additionalTimes
        };
        
        // Define the order of prayers throughout the day
        const prayerOrder = ['tahajjud', 'suhoor', 'fajr', 'sunrise', 'ishraq', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        let nextPrayer = null;
        let nextPrayerTime = null;

        // Find next prayer
        for (const prayer of prayerOrder) {
            const time = allPrayerTimes[prayer];
            if (time && time > now) {
                nextPrayer = prayer;
                nextPrayerTime = time;
                break;
            }
        }

        // If no next prayer today, get tomorrow's first prayer (Tahajjud)
        if (!nextPrayer) {
            nextPrayer = 'tahajjud';
            // Calculate tomorrow's Tahajjud time
            const tomorrowTahajjud = new Date(additionalTimes.tahajjud);
            tomorrowTahajjud.setDate(tomorrowTahajjud.getDate() + 1);
            nextPrayerTime = tomorrowTahajjud;
        }

        // Remove active class from all prayer cards
        document.querySelectorAll('.prayer-card').forEach(card => {
            card.classList.remove('active', 'next-prayer');
        });

        // Add active class to next prayer card
        const nextPrayerCard = document.querySelector(`.prayer-card[data-prayer="${nextPrayer}"]`);
        if (nextPrayerCard) {
            nextPrayerCard.classList.add('active', 'next-prayer');
            
            // Update countdown
            const countdownElement = nextPrayerCard.querySelector('.countdown');
            if (countdownElement) {
                this.updateCountdown(countdownElement, nextPrayerTime);
                
                // Set up interval to update countdown
                if (this.countdownInterval) {
                    clearInterval(this.countdownInterval);
                }
                
                this.countdownInterval = setInterval(() => {
                    this.updateCountdown(countdownElement, nextPrayerTime);
                }, 60000); // Update every minute
            }
        }
    }

    scheduleNextPrayerNotification(prayerTimes, additionalTimes) {
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        const now = new Date();
        
        // Combine standard and additional prayer times
        const allPrayerTimes = {
            ...prayerTimes,
            ...additionalTimes
        };
        
        // Define the order of prayers throughout the day
        const prayerOrder = ['tahajjud', 'suhoor', 'fajr', 'sunrise', 'ishraq', 'dhuhr', 'asr', 'maghrib', 'isha'];
        
        let nextPrayer = null;
        let nextPrayerTime = null;

        // Find next prayer
        for (const prayer of prayerOrder) {
            const time = allPrayerTimes[prayer];
            if (time && time > now) {
                nextPrayer = prayer;
                nextPrayerTime = time;
                break;
            }
        }

        // If no next prayer today, get tomorrow's first prayer (Tahajjud)
        if (!nextPrayer) {
            nextPrayer = 'tahajjud';
            // Calculate tomorrow's Tahajjud time
            const tomorrowTahajjud = new Date(additionalTimes.tahajjud);
            tomorrowTahajjud.setDate(tomorrowTahajjud.getDate() + 1);
            nextPrayerTime = tomorrowTahajjud;
        }

        // Calculate time until next prayer
        const timeUntilPrayer = nextPrayerTime.getTime() - now.getTime();

        // Schedule notification
        this.notificationTimeout = setTimeout(() => {
            this.showPrayerNotification(nextPrayer);
            
            // Recalculate for the next prayer
            this.scheduleNextPrayerNotification(prayerTimes, additionalTimes);
        }, timeUntilPrayer);

        console.log(`Next prayer: ${nextPrayer} at ${this.formatTime(nextPrayerTime)} (in ${Math.round(timeUntilPrayer / 60000)} minutes)`);
    }

    async showPrayerNotification(prayerName) {
        // Skip notification for sunrise
        if (prayerName === 'sunrise') {
            return;
        }
        
        try {
            // Format prayer name for display
            const displayNames = {
                'tahajjud': 'Tahajjud',
                'suhoor': 'Suhoor Ends',
                'fajr': 'Fajr',
                'ishraq': 'Ishraq',
                'dhuhr': 'Dhuhr',
                'asr': 'Asr',
                'maghrib': 'Maghrib',
                'isha': 'Isha'
            };
            
            const displayName = displayNames[prayerName] || prayerName.charAt(0).toUpperCase() + prayerName.slice(1);
            
            // Show notification
            if (Notification.permission === 'granted') {
                const notification = new Notification(`Time for ${displayName}`, {
                    body: prayerName === 'suhoor' ? 
                        'Suhoor time is ending soon' : 
                        `It's time for ${displayName} prayer`,
                    icon: '/icons/mosque.png',
                    silent: true // We'll play Adhan instead
                });

                // Play Adhan if player is available
                if (this.adhanPlayer) {
                    await this.adhanPlayer.playAzan(prayerName);
                }
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    showError(message) {
        console.error(message);
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error';
        errorContainer.textContent = message;
        document.body.appendChild(errorContainer);
        setTimeout(() => errorContainer.remove(), 5000);
    }

    updateCountdown(element, targetTime) {
        if (!element || !targetTime) return;
        
        const now = new Date();
        const timeDiff = targetTime - now;
        
        if (timeDiff <= 0) {
            element.textContent = 'Now';
            return;
        }
        
        // Calculate hours, minutes, seconds
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        // Format the countdown text
        let countdownText = '';
        if (hours > 0) {
            countdownText += `${hours} hour${hours > 1 ? 's' : ''} `;
        }
        countdownText += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        
        element.textContent = `In ${countdownText}`;
    }
}

export default PrayerCalculation;
