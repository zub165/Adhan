export async function loadAdhan() {
    return new Promise((resolve, reject) => {
        // Check if Adhan is already loaded
        if (typeof window.Adhan !== 'undefined') {
            console.log("✅ Adhan.js already loaded");
            resolve(window.Adhan);
            return;
        }

        // Try to load from CDN first
        console.log("🔄 Loading Adhan.js from CDN...");
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/adhan@4.4.3/dist/adhan.min.js';
        script.async = true;

        // Set a timeout for CDN loading
        const cdnTimeout = setTimeout(() => {
            console.warn("⚠️ CDN loading timeout. Trying local fallback...");
            // Only proceed with local loading if the script hasn't loaded yet
            if (typeof window.Adhan === 'undefined') {
                loadLocalAdhan().then(resolve).catch(reject);
            }
        }, 5000); // 5 second timeout

        script.onload = () => {
            clearTimeout(cdnTimeout);
            if (typeof window.Adhan !== 'undefined') {
                console.log("✅ Adhan.js loaded successfully from CDN");
                resolve(window.Adhan);
            } else {
                console.error("❌ Adhan.js failed to initialize from CDN");
                loadLocalAdhan().then(resolve).catch(reject);
            }
        };

        script.onerror = async () => {
            clearTimeout(cdnTimeout);
            console.warn("⚠️ Failed to load Adhan.js from CDN. Trying local fallback...");
            try {
                const adhan = await loadLocalAdhan();
                resolve(adhan);
            } catch (error) {
                console.error("❌ All loading attempts failed:", error);
                // Create a minimal Adhan object as a last resort
                console.warn("⚠️ Creating minimal Adhan object as last resort");
                window.Adhan = createMinimalAdhan();
                resolve(window.Adhan);
            }
        };

        document.body.appendChild(script);
    });
}

// Helper function to determine if we're running on GitHub Pages
function isGitHubPages() {
    return window.location.hostname === 'zub165.github.io';
}

// Helper function to get the base path
function getBasePath() {
    if (isGitHubPages()) {
        return '/Adhan';
    }
    return '';
}

// Load Local Adhan.js if CDN Fails
async function loadLocalAdhan() {
    return new Promise((resolve, reject) => {
        console.log("🔄 Loading local Adhan.js...");
        
        // Create a new script element
        const script = document.createElement('script');
        const basePath = getBasePath();
        
        // Log the path for debugging
        const scriptPath = `${basePath}/js/modules/adhan.js`;
        console.log(`📂 Loading local Adhan.js from: ${scriptPath}`);
        
        script.src = scriptPath;
        script.type = 'text/javascript';
        script.async = true;

        // Set a timeout for local loading
        const localTimeout = setTimeout(() => {
            console.error("❌ Local Adhan.js loading timeout");
            reject(new Error("Local Adhan.js loading timeout"));
        }, 5000); // 5 second timeout

        // Set up event handlers
        script.onload = () => {
            clearTimeout(localTimeout);
            // Check if Adhan object is available globally
            if (typeof window.Adhan !== 'undefined') {
                console.log("✅ Local Adhan.js loaded successfully");
                resolve(window.Adhan);
            } else {
                console.error("❌ Local Adhan.js did not initialize properly");
                reject(new Error("Local Adhan.js did not initialize properly"));
            }
        };

        script.onerror = (error) => {
            clearTimeout(localTimeout);
            console.error("❌ Failed to load local Adhan.js:", error);
            reject(new Error("Failed to load local Adhan.js"));
        };

        // Add the script to the document
        document.body.appendChild(script);
    });
}

// Create a minimal Adhan object as a last resort
function createMinimalAdhan() {
    console.warn("⚠️ Creating minimal Adhan implementation");
    
    // Simple calculation methods
    const calculationMethods = {
        MuslimWorldLeague: { fajr: 18, isha: 17 },
        Egyptian: { fajr: 19.5, isha: 17.5 },
        Karachi: { fajr: 18, isha: 18 },
        UmmAlQura: { fajr: 18.5, isha: 90 }, // 90 min after maghrib
        Dubai: { fajr: 18.2, isha: 18.2 },
        MoonsightingCommittee: { fajr: 18, isha: 18 },
        NorthAmerica: { fajr: 15, isha: 15 },
        Kuwait: { fajr: 18, isha: 17.5 },
        Qatar: { fajr: 18, isha: 90 }, // 90 min after maghrib
        Singapore: { fajr: 20, isha: 18 },
        Tehran: { fajr: 17.7, isha: 14 },
        Turkey: { fajr: 18, isha: 17 }
    };
    
    // Simple madhab enum
    const madhab = {
        Shafi: 'shafi',
        Hanafi: 'hanafi'
    };
    
    // Simple coordinates class
    class Coordinates {
        constructor(latitude, longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }
    }
    
    // Simple prayer times calculation
    class PrayerTimes {
        constructor(date, coordinates, params) {
            this.date = date;
            this.coordinates = coordinates;
            this.params = params;
            this.times = this.calculateTimes();
        }
        
        calculateTimes() {
            // Return fixed times for now as a fallback
            const now = new Date();
            const times = {
                fajr: new Date(now.setHours(5, 0, 0, 0)),
                sunrise: new Date(now.setHours(6, 30, 0, 0)),
                dhuhr: new Date(now.setHours(12, 0, 0, 0)),
                asr: new Date(now.setHours(15, 30, 0, 0)),
                maghrib: new Date(now.setHours(18, 0, 0, 0)),
                isha: new Date(now.setHours(19, 30, 0, 0))
            };
            return times;
        }
    }
    
    // Return minimal Adhan object
    return {
        CalculationMethod: calculationMethods,
        Madhab: madhab,
        Coordinates: Coordinates,
        PrayerTimes: PrayerTimes
    };
}
