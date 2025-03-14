// Adhan.js - Prayer Times Library
// This is a simplified version for fallback purposes

// Define the Adhan namespace
window.Adhan = {};

// Coordinates class
Adhan.Coordinates = function(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
};

// Calculation Method
Adhan.CalculationMethod = {
    // Muslim World League
    MuslimWorldLeague: function() {
        var params = new Adhan.CalculationParameters(18, 17);
        params.calculationMethod = 'MuslimWorldLeague';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: -1,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0
        };
        return params;
    },
    
    // Egyptian General Authority of Survey
    Egyptian: function() {
        var params = new Adhan.CalculationParameters(19.5, 17.5);
        params.calculationMethod = 'Egyptian';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: -1,
            dhuhr: 1,
            asr: 0,
            maghrib: 1,
            isha: 0
        };
        return params;
    },
    
    // University of Islamic Sciences, Karachi
    Karachi: function() {
        var params = new Adhan.CalculationParameters(18, 18);
        params.calculationMethod = 'Karachi';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: -1,
            dhuhr: 1,
            asr: 0,
            maghrib: 0,
            isha: 0
        };
        return params;
    },
    
    // Umm al-Qura University, Makkah
    UmmAlQura: function() {
        var params = new Adhan.CalculationParameters(18.5, 0);
        params.calculationMethod = 'UmmAlQura';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: -1,
            dhuhr: 5,
            asr: 0,
            maghrib: 3,
            isha: 0
        };
        params.ishaInterval = 90; // 90 minutes after Maghrib
        return params;
    },
    
    // Dubai
    Dubai: function() {
        var params = new Adhan.CalculationParameters(18.2, 18.2);
        params.calculationMethod = 'Dubai';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: 0,
            dhuhr: 3,
            asr: 0,
            maghrib: 3,
            isha: 0
        };
        return params;
    },
    
    // Moonsighting Committee
    MoonsightingCommittee: function() {
        var params = new Adhan.CalculationParameters(18, 18);
        params.calculationMethod = 'MoonsightingCommittee';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: 0,
            dhuhr: 5,
            asr: 0,
            maghrib: 3,
            isha: 0
        };
        return params;
    },
    
    // North America (ISNA)
    NorthAmerica: function() {
        var params = new Adhan.CalculationParameters(15, 15);
        params.calculationMethod = 'NorthAmerica';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: -2,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0
        };
        return params;
    },
    
    // Institute of Geophysics, Tehran
    Tehran: function() {
        var params = new Adhan.CalculationParameters(17.7, 14);
        params.calculationMethod = 'Tehran';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0
        };
        return params;
    },
    
    // Muslim World League (Alternative for Europe)
    MWLEurope: function() {
        var params = new Adhan.CalculationParameters(18, 17);
        params.calculationMethod = 'MWLEurope';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: -1,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0
        };
        return params;
    },
    
    // Custom Method
    Custom: function() {
        var params = new Adhan.CalculationParameters(18, 17);
        params.calculationMethod = 'Custom';
        params.methodAdjustments = {
            fajr: 0,
            sunrise: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0
        };
        return params;
    }
};

// Calculation Parameters
Adhan.CalculationParameters = function(fajrAngle, ishaAngle) {
    this.fajrAngle = fajrAngle;
    this.ishaAngle = ishaAngle;
    this.ishaInterval = 0;
    this.madhab = Adhan.Madhab.Shafi;
    this.highLatitudeRule = Adhan.HighLatitudeRule.MiddleOfTheNight;
    this.adjustments = {fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0};
    this.methodAdjustments = {fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0};
};

// Madhab for Asr calculation
Adhan.Madhab = {
    Shafi: 'shafi',
    Hanafi: 'hanafi'
};

// High Latitude Rule
Adhan.HighLatitudeRule = {
    MiddleOfTheNight: 'middleofthenight',
    SeventhOfTheNight: 'seventhofthenight',
    TwilightAngle: 'twilightangle'
};

// Prayer Times
Adhan.PrayerTimes = function(coordinates, date, params) {
    // Get base time for the date
    var baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);
    
    // Store calculation parameters
    this.params = params;
    this.coordinates = coordinates;
    
    // Calculate prayer times based on calculation method angles
    const fajrAngle = params.fajrAngle;
    const ishaAngle = params.ishaAngle;
    
    // Calculate times in minutes from midnight
    const fajrMinutes = this.calculateFajrTime(fajrAngle, coordinates);
    const sunriseMinutes = this.calculateSunrise(coordinates);
    const dhuhrMinutes = this.calculateDhuhr(coordinates);
    const asrMinutes = this.calculateAsr(coordinates, params.madhab);
    const maghribMinutes = this.calculateMaghrib(coordinates);
    const ishaMinutes = params.ishaInterval ? 
        maghribMinutes + params.ishaInterval :
        this.calculateIsha(ishaAngle, coordinates);
    
    // Convert minutes to Date objects
    this.fajr = new Date(baseDate.getTime() + fajrMinutes * 60000);
    this.sunrise = new Date(baseDate.getTime() + sunriseMinutes * 60000);
    this.dhuhr = new Date(baseDate.getTime() + dhuhrMinutes * 60000);
    this.asr = new Date(baseDate.getTime() + asrMinutes * 60000);
    this.maghrib = new Date(baseDate.getTime() + maghribMinutes * 60000);
    this.isha = new Date(baseDate.getTime() + ishaMinutes * 60000);
    
    // Apply method adjustments
    if (params.methodAdjustments) {
        this.fajr = new Date(this.fajr.getTime() + params.methodAdjustments.fajr * 60000);
        this.sunrise = new Date(this.sunrise.getTime() + params.methodAdjustments.sunrise * 60000);
        this.dhuhr = new Date(this.dhuhr.getTime() + params.methodAdjustments.dhuhr * 60000);
        this.asr = new Date(this.asr.getTime() + params.methodAdjustments.asr * 60000);
        this.maghrib = new Date(this.maghrib.getTime() + params.methodAdjustments.maghrib * 60000);
        this.isha = new Date(this.isha.getTime() + params.methodAdjustments.isha * 60000);
    }
    
    // Apply manual adjustments
    if (params.adjustments) {
        this.fajr = new Date(this.fajr.getTime() + params.adjustments.fajr * 60000);
        this.sunrise = new Date(this.sunrise.getTime() + params.adjustments.sunrise * 60000);
        this.dhuhr = new Date(this.dhuhr.getTime() + params.adjustments.dhuhr * 60000);
        this.asr = new Date(this.asr.getTime() + params.adjustments.asr * 60000);
        this.maghrib = new Date(this.maghrib.getTime() + params.adjustments.maghrib * 60000);
        this.isha = new Date(this.isha.getTime() + params.adjustments.isha * 60000);
    }
    
    // Log calculated times for debugging
    console.log('Prayer times calculated:', {
        method: params.calculationMethod,
        fajrAngle: params.fajrAngle,
        ishaAngle: params.ishaAngle,
        madhab: params.madhab,
        times: {
            fajr: this.fajr,
            sunrise: this.sunrise,
            dhuhr: this.dhuhr,
            asr: this.asr,
            maghrib: this.maghrib,
            isha: this.isha
        }
    });
};

// Prayer time calculation methods
Adhan.PrayerTimes.prototype = {
    // Helper functions for astronomical calculations
    toRadians: function(degrees) {
        return degrees * Math.PI / 180;
    },
    
    toDegrees: function(radians) {
        return radians * 180 / Math.PI;
    },

    // Calculate Julian Date
    julianDate: function(date) {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const day = date.getDate();
        
        if (month <= 2) {
            year -= 1;
            month += 12;
        }
        
        const a = Math.floor(year / 100);
        const b = 2 - a + Math.floor(a / 4);
        
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
    },

    // Calculate solar position
    calculateSolarPosition: function(jd, latitude, longitude) {
        const D = jd - 2451545.0;  // Days since J2000
        
        // Mean solar noon
        const M = 357.529 + 0.98560028 * D;
        const L = 280.459 + 0.98564736 * D;
        
        // Equation of center
        const C = 1.9148 * Math.sin(this.toRadians(M)) + 
                  0.0200 * Math.sin(this.toRadians(2 * M)) + 
                  0.0003 * Math.sin(this.toRadians(3 * M));
        
        // Sun's true longitude
        const λ = L + C;
        
        // Sun's declination
        const δ = this.toDegrees(Math.asin(Math.sin(this.toRadians(λ)) * Math.sin(this.toRadians(23.44))));
        
        // Equation of time (in minutes)
        const EoT = 4 * this.toDegrees(
            2.0002 * Math.sin(this.toRadians(2 * L)) -
            0.0089 * Math.sin(this.toRadians(M)) -
            0.0465 * Math.sin(this.toRadians(2 * λ))
        );
        
        return { declination: δ, equationOfTime: EoT };
    },

    // Calculate prayer times using astronomical formulas
    calculateFajrTime: function(angle, coordinates) {
        const date = new Date();
        const jd = this.julianDate(date);
        const sp = this.calculateSolarPosition(jd, coordinates.latitude, coordinates.longitude);
        
        // Hour angle for Fajr
        const cosH = (Math.sin(this.toRadians(-angle)) - 
                     Math.sin(this.toRadians(coordinates.latitude)) * Math.sin(this.toRadians(sp.declination))) /
                    (Math.cos(this.toRadians(coordinates.latitude)) * Math.cos(this.toRadians(sp.declination)));
        
        // Convert to hours
        const H = this.toDegrees(Math.acos(cosH)) / 15;
        
        // Time in minutes from midnight
        return 720 - (H * 60) - sp.equationOfTime - (coordinates.longitude / 15 * 60);
    },
    
    calculateSunrise: function(coordinates) {
        const date = new Date();
        const jd = this.julianDate(date);
        const sp = this.calculateSolarPosition(jd, coordinates.latitude, coordinates.longitude);
        
        // Hour angle for sunrise (-0.833° is the angle for sunrise/sunset)
        const cosH = (Math.sin(this.toRadians(-0.833)) - 
                     Math.sin(this.toRadians(coordinates.latitude)) * Math.sin(this.toRadians(sp.declination))) /
                    (Math.cos(this.toRadians(coordinates.latitude)) * Math.cos(this.toRadians(sp.declination)));
        
        const H = this.toDegrees(Math.acos(cosH)) / 15;
        
        return 720 - (H * 60) - sp.equationOfTime - (coordinates.longitude / 15 * 60);
    },
    
    calculateDhuhr: function(coordinates) {
        const date = new Date();
        const jd = this.julianDate(date);
        const sp = this.calculateSolarPosition(jd, coordinates.latitude, coordinates.longitude);
        
        // Dhuhr is at solar noon
        return 720 - sp.equationOfTime - (coordinates.longitude / 15 * 60);
    },
    
    calculateAsr: function(coordinates, madhab) {
        const date = new Date();
        const jd = this.julianDate(date);
        const sp = this.calculateSolarPosition(jd, coordinates.latitude, coordinates.longitude);
        
        // Shadow length factor based on madhab
        const shadowFactor = madhab === Adhan.Madhab.Hanafi ? 2 : 1;
        
        // Calculate shadow angle
        const zenithDistance = this.toDegrees(Math.atan(shadowFactor + Math.tan(this.toRadians(Math.abs(coordinates.latitude - sp.declination)))));
        
        // Hour angle for Asr
        const cosH = (Math.sin(this.toRadians(90 - zenithDistance)) - 
                     Math.sin(this.toRadians(coordinates.latitude)) * Math.sin(this.toRadians(sp.declination))) /
                    (Math.cos(this.toRadians(coordinates.latitude)) * Math.cos(this.toRadians(sp.declination)));
        
        const H = this.toDegrees(Math.acos(cosH)) / 15;
        
        return 720 + (H * 60) - sp.equationOfTime - (coordinates.longitude / 15 * 60);
    },
    
    calculateMaghrib: function(coordinates) {
        const date = new Date();
        const jd = this.julianDate(date);
        const sp = this.calculateSolarPosition(jd, coordinates.latitude, coordinates.longitude);
        
        // Same as sunrise but positive hour angle
        const cosH = (Math.sin(this.toRadians(-0.833)) - 
                     Math.sin(this.toRadians(coordinates.latitude)) * Math.sin(this.toRadians(sp.declination))) /
                    (Math.cos(this.toRadians(coordinates.latitude)) * Math.cos(this.toRadians(sp.declination)));
        
        const H = this.toDegrees(Math.acos(cosH)) / 15;
        
        return 720 + (H * 60) - sp.equationOfTime - (coordinates.longitude / 15 * 60);
    },
    
    calculateIsha: function(angle, coordinates) {
        const date = new Date();
        const jd = this.julianDate(date);
        const sp = this.calculateSolarPosition(jd, coordinates.latitude, coordinates.longitude);
        
        // Hour angle for Isha
        const cosH = (Math.sin(this.toRadians(-angle)) - 
                     Math.sin(this.toRadians(coordinates.latitude)) * Math.sin(this.toRadians(sp.declination))) /
                    (Math.cos(this.toRadians(coordinates.latitude)) * Math.cos(this.toRadians(sp.declination)));
        
        const H = this.toDegrees(Math.acos(cosH)) / 15;
        
        return 720 + (H * 60) - sp.equationOfTime - (coordinates.longitude / 15 * 60);
    }
};

// Islamic Date Implementation
Adhan.Date = function(date) {
    const gregorianDate = new Date(date);
    
    // Islamic calendar calculation
    let year = gregorianDate.getFullYear();
    let month = gregorianDate.getMonth() + 1;
    let day = gregorianDate.getDate();
    
    if (month < 3) {
        year -= 1;
        month += 12;
    }
    
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
    
    let c = Math.floor((jd - 1867216.25) / 29.53058796);
    const islamicDate = jd - 1948084 + c;
    
    this.year = Math.floor((30 * islamicDate + 10646) / 10631);
    const monthDays = Math.ceil(29.5 * (islamicDate - Math.floor((11 * this.year + 3) / 30) + 1));
    this.month = Math.min(Math.ceil(monthDays / 29.5), 12);
    this.day = Math.ceil(monthDays % 29.5);
    
    return this;
};

// Make Adhan globally available
console.log("Adhan.js loaded successfully (fallback version)");