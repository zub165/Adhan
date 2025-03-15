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
    }

    initialize() {
        this.compass = document.querySelector('.qibla-compass');
        this.arrow = document.querySelector('.compass-arrow');
        this.info = document.querySelector('.compass-info');
        
        if ('permissions' in navigator) {
            this.requestDeviceOrientation();
        } else {
            this.showError('Device orientation not supported');
        }
    }

    async requestDeviceOrientation() {
        try {
            const permission = await navigator.permissions.query({ name: 'accelerometer' });
            if (permission.state === 'granted') {
                this.startCompass();
            } else {
                await DeviceOrientationEvent.requestPermission();
                this.startCompass();
            }
        } catch (error) {
            console.error('Error requesting device orientation:', error);
            this.showError('Could not access compass');
        }
    }

    startCompass() {
        window.addEventListener('deviceorientationabsolute', (event) => {
            this.updateCompass(event.alpha);
        });
    }

    updateCompass(heading) {
        if (!this.arrow) return;

        navigator.geolocation.getCurrentPosition((position) => {
            const qiblaDirection = this.calculateQiblaDirection(
                position.coords.latitude,
                position.coords.longitude
            );

            // Adjust arrow to point to Qibla
            const rotation = qiblaDirection - heading;
            this.arrow.style.transform = `rotate(${rotation}deg)`;

            // Update info text
            if (this.info) {
                this.info.textContent = `Qibla Direction: ${Math.round(qiblaDirection)}°`;
            }
        });
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
        const direction = this.calculateQiblaDirection(latitude, longitude);
        if (this.arrow) {
            this.arrow.style.transform = `rotate(${direction}deg)`;
        }
        if (this.info) {
            this.info.textContent = `Qibla Direction: ${Math.round(direction)}° from North`;
        }
    }
}

export default QiblaCompass; 