import { loadAdhan } from './adhan-init.js';
import { getDSTAdjustment } from './dst-handler.js';

class PrayerCalculation {
    constructor() {
        this.coordinates = null;
        this.prayerTimes = null;
        this.calculationMethod = 'MuslimWorldLeague'; // Default method
        this.madhab = 'Shafi'; // Default madhab
        this.highLatitudeRule = 'MiddleOfTheNight'; // Default high latitude rule
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

    async initialize() {
        try {
            // Wait for the Adhan library to be loaded
            if (typeof Adhan === 'undefined') {
                await new Promise(resolve => {
                    const checkAdhan = setInterval(() => {
                        if (typeof Adhan !== 'undefined') {
                            clearInterval(checkAdhan);
                            resolve();
                        }
                    }, 100);
                });
            }

            // Load saved settings
            this.loadSettings();

            // Initialize coordinates (default to Makkah if not set)
            this.coordinates = this.coordinates || new Adhan.Coordinates(21.4225, 39.8262);

            // Set up calculation parameters
            const params = this.getCalculationParameters();
        
        // Calculate prayer times
            await this.calculatePrayerTimes(params);

            console.log('Prayer calculation initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing prayer calculation:', error);
            return false;
        }
    }

    loadSettings() {
        // Load saved calculation method
        const savedMethod = localStorage.getItem('calculationMethod');
        if (savedMethod && Adhan.CalculationMethod[savedMethod]) {
            this.calculationMethod = savedMethod;
        }

        // Load saved madhab
        const savedMadhab = localStorage.getItem('madhab');
        if (savedMadhab && Adhan.Madhab[savedMadhab]) {
            this.madhab = savedMadhab;
        }

        // Load saved coordinates
        const savedLat = parseFloat(localStorage.getItem('latitude'));
        const savedLng = parseFloat(localStorage.getItem('longitude'));
        if (!isNaN(savedLat) && !isNaN(savedLng)) {
            this.coordinates = new Adhan.Coordinates(savedLat, savedLng);
        }
    }

    getCalculationParameters() {
        // Get the calculation method parameters
        let params = Adhan.CalculationMethod[this.calculationMethod]();

        // Set madhab
        params.madhab = Adhan.Madhab[this.madhab];

        // Set high latitude rule
        params.highLatitudeRule = Adhan.HighLatitudeRule[this.highLatitudeRule];

        return params;
    }

    async calculatePrayerTimes(params) {
        try {
            const date = new Date();
            const prayerTimes = new Adhan.PrayerTimes(this.coordinates, date, params);
            
            // Format and store prayer times
            this.prayerTimes = {
                fajr: prayerTimes.fajr,
                sunrise: prayerTimes.sunrise,
                dhuhr: prayerTimes.dhuhr,
                asr: prayerTimes.asr,
                maghrib: prayerTimes.maghrib,
                isha: prayerTimes.isha
            };

            // Add custom prayer times
            const fajrTime = new Date(this.prayerTimes.fajr);
            
            // Calculate Tahajjud time (last third of the night)
            const sunsetYesterday = new Adhan.PrayerTimes(
                this.coordinates, 
                new Date(date.getTime() - 24 * 60 * 60 * 1000), 
                params
            ).maghrib;
            const nightDuration = this.prayerTimes.fajr - sunsetYesterday;
            const tahajjudStart = new Date(sunsetYesterday.getTime() + (nightDuration * 2/3));
            
            // Calculate Suhoor end time (10 minutes before Fajr)
            const suhoorEnds = new Date(fajrTime.getTime() - 10 * 60 * 1000);
            
            // Calculate Ishraq time (15-20 minutes after sunrise)
            const ishraqTime = new Date(this.prayerTimes.sunrise.getTime() + 20 * 60 * 1000);

            // Add custom times to prayer times object
            this.prayerTimes.tahajjud = tahajjudStart;
            this.prayerTimes.suhoor = suhoorEnds;
            this.prayerTimes.ishraq = ishraqTime;

            return true;
    } catch (error) {
        console.error('Error calculating prayer times:', error);
            return false;
        }
    }

    // Getter for prayer times
    getPrayerTimes() {
        return this.prayerTimes;
    }

    // Update coordinates and recalculate
    async updateCoordinates(latitude, longitude) {
        this.coordinates = new Adhan.Coordinates(latitude, longitude);
        localStorage.setItem('latitude', latitude.toString());
        localStorage.setItem('longitude', longitude.toString());
        return await this.calculatePrayerTimes(this.getCalculationParameters());
    }

    // Update calculation method and recalculate
    async updateCalculationMethod(method) {
        if (Adhan.CalculationMethod[method]) {
            this.calculationMethod = method;
            localStorage.setItem('calculationMethod', method);
            return await this.calculatePrayerTimes(this.getCalculationParameters());
        }
        return false;
    }

    // Update madhab and recalculate
    async updateMadhab(madhab) {
        if (Adhan.Madhab[madhab]) {
            this.madhab = madhab;
            localStorage.setItem('madhab', madhab);
            return await this.calculatePrayerTimes(this.getCalculationParameters());
        }
        return false;
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

    async recalculatePrayerTimes() {
        if (this.coordinates) {
            await this.calculatePrayerTimes(this.getCalculationParameters());
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
