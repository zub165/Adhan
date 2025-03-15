// Qibla Compass Module
class QiblaCompass {
    constructor() {
        this.kaaba = {
            latitude: 21.4225,
            longitude: 39.8262
        };
        this.compass = null;
        this.arrow = null;
        this.info = null;
        this.hasOrientation = false;
        this.userCoordinates = null;
    }

    initialize() {
        console.log('Initializing Qibla compass...');
        this.compass = document.querySelector('.qibla-compass');
        this.arrow = document.querySelector('.compass-arrow');
        this.info = document.querySelector('.compass-info');
        
        if (!this.compass || !this.arrow || !this.info) {
            console.error('Qibla compass elements not found in the DOM');
            return;
        }
        
        // Try to get cached coordinates
        const lat = localStorage.getItem('latitude');
        const lng = localStorage.getItem('longitude');
        
        if (lat && lng) {
            this.userCoordinates = {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng)
            };
            this.showStaticDirection(this.userCoordinates.latitude, this.userCoordinates.longitude);
        }
        
        // Check if device orientation is supported
        if (window.DeviceOrientationEvent) {
            this.requestDeviceOrientation();
        } else {
            console.warn('Device orientation not supported by this device');
            this.showError('Compass not available on this device');
            // Still show static direction if we have coordinates
            if (this.userCoordinates) {
                this.showStaticDirection(this.userCoordinates.latitude, this.userCoordinates.longitude);
            }
        }
    }

    async requestDeviceOrientation() {
        try {
            console.log('Requesting device orientation permission...');
            
            // For iOS 13+ devices
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    console.log('Device orientation permission granted');
                    this.startCompass();
                } else {
                    console.warn('Device orientation permission denied');
                    this.showError('Compass permission denied');
                    // Fall back to static direction
                    if (this.userCoordinates) {
                        this.showStaticDirection(this.userCoordinates.latitude, this.userCoordinates.longitude);
                    }
                }
            } else {
                // For non-iOS devices or older iOS versions
                this.startCompass();
            }
        } catch (error) {
            console.error('Error requesting device orientation:', error);
            this.showError('Could not access compass');
            
            // Fall back to static direction
            if (this.userCoordinates) {
                this.showStaticDirection(this.userCoordinates.latitude, this.userCoordinates.longitude);
            }
        }
    }

    startCompass() {
        console.log('Starting compass...');
        
        // Try deviceorientationabsolute first (more accurate)
        window.addEventListener('deviceorientationabsolute', (event) => {
            this.hasOrientation = true;
            this.updateCompass(event.alpha);
        }, { once: false });
        
        // Fallback to regular deviceorientation
        window.addEventListener('deviceorientation', (event) => {
            // Only use this if we haven't received absolute orientation
            if (!this.hasOrientation && event.alpha !== null) {
                this.hasOrientation = true;
                this.updateCompass(event.alpha);
            }
        }, { once: false });
        
        // Set a timeout to check if we've received any orientation events
        setTimeout(() => {
            if (!this.hasOrientation) {
                console.warn('No orientation events received');
                this.showError('Compass not available');
                
                // Fall back to static direction
                if (this.userCoordinates) {
                    this.showStaticDirection(this.userCoordinates.latitude, this.userCoordinates.longitude);
                }
            }
        }, 3000);
    }

    updateCompass(heading) {
        if (!this.arrow) return;
        
        // If we have cached coordinates, use them
        if (this.userCoordinates) {
            const qiblaDirection = this.calculateQiblaDirection(
                this.userCoordinates.latitude,
                this.userCoordinates.longitude
            );

            // Adjust arrow to point to Qibla
            const rotation = qiblaDirection - heading;
            this.arrow.style.transform = `rotate(${rotation}deg)`;

            // Update info text
            if (this.info) {
                this.info.textContent = `Qibla Direction: ${Math.round(qiblaDirection)}° (Heading: ${Math.round(heading)}°)`;
            }
            return;
        }

        // Otherwise try to get current position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Cache the coordinates
                this.userCoordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                // Save to localStorage
                localStorage.setItem('latitude', position.coords.latitude.toString());
                localStorage.setItem('longitude', position.coords.longitude.toString());
                
                const qiblaDirection = this.calculateQiblaDirection(
                    position.coords.latitude,
                    position.coords.longitude
                );

                // Adjust arrow to point to Qibla
                const rotation = qiblaDirection - heading;
                this.arrow.style.transform = `rotate(${rotation}deg)`;

                // Update info text
                if (this.info) {
                    this.info.textContent = `Qibla Direction: ${Math.round(qiblaDirection)}° (Heading: ${Math.round(heading)}°)`;
                }
            },
            (error) => {
                console.error('Error getting position for compass:', error);
                this.showError('Could not get location for Qibla direction');
            }
        );
    }

    calculateQiblaDirection(latitude, longitude) {
        // Convert to radians
        const lat1 = this.toRadians(latitude);
        const lon1 = this.toRadians(longitude);
        const lat2 = this.toRadians(this.kaaba.latitude);
        const lon2 = this.toRadians(this.kaaba.longitude);

        // Calculate qibla direction
        const y = Math.sin(lon2 - lon1);
        const x = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(lon2 - lon1);
        let qibla = Math.atan2(y, x);

        // Convert to degrees
        qibla = this.toDegrees(qibla);

        // Normalize to 0-360
        return (qibla + 360) % 360;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    showError(message) {
        if (this.info) {
            this.info.textContent = message;
            this.info.classList.add('error');
        }
        console.error('Qibla compass error:', message);
    }

    // Calculate initial Qibla direction without compass
    showStaticDirection(latitude, longitude) {
        console.log('Showing static Qibla direction for coordinates:', latitude, longitude);
        const direction = this.calculateQiblaDirection(latitude, longitude);
        if (this.arrow) {
            this.arrow.style.transform = `rotate(${direction}deg)`;
        }
        if (this.info) {
            this.info.textContent = `Qibla Direction: ${Math.round(direction)}° from North`;
            this.info.classList.remove('error');
        }
    }
}

export default QiblaCompass; 