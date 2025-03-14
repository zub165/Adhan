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
        const φ1 = this.toRadians(latitude);
        const φ2 = this.toRadians(this.kaaba.latitude);
        const Δλ = this.toRadians(this.kaaba.longitude - longitude);

        const y = Math.sin(Δλ);
        const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
        let qibla = this.toDegrees(Math.atan2(y, x));

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