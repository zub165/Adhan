// Islamic Calendar and Moon Phase Module
class IslamicCalendar {
    constructor() {
        this.islamicDateDay = document.getElementById('islamic-date-day');
        this.islamicDateMonth = document.getElementById('islamic-date-month');
        this.islamicDateYear = document.getElementById('islamic-date-year');
        this.gregorianDateText = document.querySelector('.gregorian-date-text');
        this.moonPhaseIcon = document.querySelector('.moon-phase-icon');
        this.moonPhaseName = document.querySelector('.moon-phase-name');
        
        // Islamic month names in Arabic and English
        this.islamicMonths = [
            { ar: 'محرم', en: 'Muharram' },
            { ar: 'صفر', en: 'Safar' },
            { ar: 'ربيع الأول', en: 'Rabi al-Awwal' },
            { ar: 'ربيع الثاني', en: 'Rabi al-Thani' },
            { ar: 'جمادى الأولى', en: 'Jumada al-Ula' },
            { ar: 'جمادى الآخرة', en: 'Jumada al-Thani' },
            { ar: 'رجب', en: 'Rajab' },
            { ar: 'شعبان', en: 'Shaban' },
            { ar: 'رمضان', en: 'Ramadan' },
            { ar: 'شوال', en: 'Shawwal' },
            { ar: 'ذو القعدة', en: 'Dhu al-Qadah' },
            { ar: 'ذو الحجة', en: 'Dhu al-Hijjah' }
        ];
    }

    updateCalendarDisplay() {
        try {
            const now = new Date();
            
            // Get Islamic date
            const islamicDate = this.getIslamicDate(now);
            
            // Update Islamic date display
            this.islamicDateDay.textContent = islamicDate.day;
            this.islamicDateMonth.textContent = `${this.islamicMonths[islamicDate.month - 1].en} (${this.islamicMonths[islamicDate.month - 1].ar})`;
            this.islamicDateYear.textContent = islamicDate.year;
            
            // Update Gregorian date display
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZoneName: 'short'
            };
            this.gregorianDateText.textContent = now.toLocaleDateString(undefined, options);
            
            // Update moon phase
            this.updateMoonPhase(now);
            
            console.log('Calendar display updated successfully');
        } catch (error) {
            console.error('Error updating calendar display:', error);
            this.showError();
        }
    }

    getIslamicDate(date) {
        try {
            // Using the Adhan.js library's Date converter
            const islamicDate = new Intl.DateTimeFormat('en-u-ca-islamic', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric'
            }).format(date);
            
            // Parse the Islamic date string (format: M/D/Y)
            const [month, day, year] = islamicDate.split('/').map(num => parseInt(num, 10));
            
            return { day, month, year };
        } catch (error) {
            console.error('Error converting to Islamic date:', error);
            throw error;
        }
    }

    updateMoonPhase(date) {
        try {
            // Calculate moon phase (0-29.5)
            const moonAge = this.getMoonAge(date);
            const phase = Math.floor((moonAge / 29.5) * 8) % 8;
            
            // Moon phase icons and names
            const phases = [
                { icon: '🌑', name: 'New Moon' },
                { icon: '🌒', name: 'Waxing Crescent' },
                { icon: '🌓', name: 'First Quarter' },
                { icon: '🌔', name: 'Waxing Gibbous' },
                { icon: '🌕', name: 'Full Moon' },
                { icon: '🌖', name: 'Waning Gibbous' },
                { icon: '🌗', name: 'Last Quarter' },
                { icon: '🌘', name: 'Waning Crescent' }
            ];
            
            this.moonPhaseIcon.textContent = phases[phase].icon;
            this.moonPhaseName.textContent = phases[phase].name;
        } catch (error) {
            console.error('Error updating moon phase:', error);
            this.moonPhaseIcon.textContent = '🌒';
            this.moonPhaseName.textContent = 'Unknown';
        }
    }

    getMoonAge(date) {
        // Simple moon age calculation (approximate)
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();

        if (month < 3) {
            year--;
            month += 12;
        }

        const a = Math.floor(year / 100);
        const b = 2 - a + Math.floor(a / 4);
        const jd = Math.floor(365.25 * (year + 4716)) +
                  Math.floor(30.6001 * (month + 1)) +
                  day + b - 1524.5;
        
        const newMoon = 2451550.1;
        const synMonth = 29.530588853;
        
        const age = (jd - newMoon) % synMonth;
        return age < 0 ? age + synMonth : age;
    }

    showError() {
        this.islamicDateDay.textContent = '--';
        this.islamicDateMonth.textContent = '--';
        this.islamicDateYear.textContent = '--';
        this.gregorianDateText.textContent = 'Error loading date';
        this.moonPhaseIcon.textContent = '🌒';
        this.moonPhaseName.textContent = 'Unknown';
    }
}

export default IslamicCalendar; 