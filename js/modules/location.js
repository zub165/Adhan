// Location handling module
export async function getCurrentPosition(retries = 3, timeout = 10000) {
    return new Promise(async (resolve, reject) => {
        let attemptCount = 0;

        const attemptGeolocation = () => {
            if (!navigator.geolocation) {
                console.warn("Geolocation not supported, using default location");
                resolve({
                    coords: {
                        latitude: 21.4225,
                        longitude: 39.8262
                    }
                });
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("Location obtained successfully");
                    resolve(position);
                },
                (error) => {
                    console.warn(`Geolocation error (attempt ${attemptCount + 1}/${retries}):`, error);
                    attemptCount++;
                    
                    if (attemptCount < retries) {
                        console.log(`Retrying geolocation... (attempt ${attemptCount + 1})`);
                        setTimeout(attemptGeolocation, 1000);
                    } else {
                        console.warn("All geolocation attempts failed, using default location");
                        resolve({
                            coords: {
                                latitude: 21.4225,
                                longitude: 39.8262
                            }
                        });
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: timeout,
                    maximumAge: 0
                }
            );
        };

        // Try to get cached coordinates first
        const cachedLat = localStorage.getItem('latitude');
        const cachedLng = localStorage.getItem('longitude');
        
        if (cachedLat && cachedLng) {
            console.log("Using cached coordinates");
            resolve({
                coords: {
                    latitude: parseFloat(cachedLat),
                    longitude: parseFloat(cachedLng)
                }
            });
            return;
        }

        // Start geolocation attempts
        attemptGeolocation();
    });
}

// Cache coordinates for future use
export function cacheCoordinates(latitude, longitude) {
    localStorage.setItem('latitude', latitude.toString());
    localStorage.setItem('longitude', longitude.toString());
    console.log(`Cached coordinates: ${latitude}, ${longitude}`);
}

// Get coordinates with fallback
export async function getCoordinates() {
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Cache the coordinates
        cacheCoordinates(latitude, longitude);
        
        return { latitude, longitude };
    } catch (error) {
        console.error('Error getting coordinates:', error);
        // Return default coordinates (Makkah)
        return { latitude: 21.4225, longitude: 39.8262 };
    }
} 