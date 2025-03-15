// Location utility functions

// Get current coordinates
export async function getCoordinates() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        navigator.geolocation.getCurrentPosition(
            position => {
                const coordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                cacheCoordinates(coordinates);
                resolve(coordinates);
            },
            error => {
                // Try to get cached coordinates first
                const cached = getCachedCoordinates();
                if (cached) {
                    resolve(cached);
                    return;
                }

                // Use Makkah coordinates as fallback
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
    } catch (error) {
        console.error('Error caching coordinates:', error);
    }
}

// Get cached coordinates from localStorage
export function getCachedCoordinates() {
    try {
        const saved = localStorage.getItem('savedLocation');
        return saved ? JSON.parse(saved) : null;
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