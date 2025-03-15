// Location utility functions

// Get current coordinates
export async function getCoordinates() {
    console.log('Getting coordinates...');
    
    // First try to get cached coordinates
    const cached = getCachedCoordinates();
    if (cached) {
        console.log('Using cached coordinates:', cached);
        return cached;
    }
    
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser');
            const makkah = {
                latitude: 21.4225,
                longitude: 39.8262
            };
            cacheCoordinates(makkah);
            resolve(makkah);
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
        };

        console.log('Requesting geolocation...');
        
        // Try to get position with a timeout
        const timeoutId = setTimeout(() => {
            console.warn('Geolocation request timed out');
            const makkah = {
                latitude: 21.4225,
                longitude: 39.8262
            };
            cacheCoordinates(makkah);
            resolve(makkah);
        }, 20000); // 20 second timeout
        
        navigator.geolocation.getCurrentPosition(
            position => {
                clearTimeout(timeoutId);
                console.log('Geolocation successful:', position.coords);
                
                const coordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                cacheCoordinates(coordinates);
                resolve(coordinates);
            },
            error => {
                clearTimeout(timeoutId);
                console.error('Geolocation error:', error.code, error.message);
                
                // Try to get cached coordinates first
                const cached = getCachedCoordinates();
                if (cached) {
                    console.log('Using cached coordinates after error');
                    resolve(cached);
                    return;
                }

                // Use Makkah coordinates as fallback
                console.log('Using Makkah coordinates as fallback');
                const makkah = {
                    latitude: 21.4225,
                    longitude: 39.8262
                };
                cacheCoordinates(makkah);
                resolve(makkah);
            },
            options
        );
    });
}

// Cache coordinates in localStorage
export function cacheCoordinates(coordinates) {
    try {
        localStorage.setItem('savedLocation', JSON.stringify(coordinates));
        localStorage.setItem('latitude', coordinates.latitude.toString());
        localStorage.setItem('longitude', coordinates.longitude.toString());
        console.log('Cached coordinates:', coordinates);
    } catch (error) {
        console.error('Error caching coordinates:', error);
    }
}

// Get cached coordinates from localStorage
export function getCachedCoordinates() {
    try {
        // Try both storage methods
        const saved = localStorage.getItem('savedLocation');
        if (saved) {
            return JSON.parse(saved);
        }
        
        const lat = localStorage.getItem('latitude');
        const lng = localStorage.getItem('longitude');
        
        if (lat && lng) {
            return {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng)
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting cached coordinates:', error);
        return null;
    }
}

// Format coordinates for display
export function formatCoordinates(coordinates) {
    if (!coordinates) return '';
    return `${coordinates.latitude.toFixed(4)}°, ${coordinates.longitude.toFixed(4)}°`;
} 