# Adhan - Islamic Prayer Times Application

A modern, feature-rich web application for accurate Islamic prayer times calculation and Adhan notifications.

## Features

### Prayer Time Calculations
- Multiple calculation methods supported:
  - Muslim World League
  - Egyptian General Authority
  - University of Islamic Sciences, Karachi
  - Umm Al-Qura University, Makkah
  - Islamic Society of North America (ISNA)
  - Kuwait
  - Qatar
  - Majlis Ugama Islam Singapura
  - Union Organization Islamic de France
  - Diyanet İşleri Başkanlığı
  - Institute of Geophysics, University of Tehran
- Madhab-specific calculations:
  - Hanafi (Asr time when shadow length = 2x object height)
  - Shafi'i (Asr time when shadow length = 1x object height)
- High latitude prayer time adjustments
- Automatic location detection with manual override
- API fallback system for reliable calculations
- Additional prayer times:
  - Tahajjud (Last third of the night)
  - Suhoor (Ends 10 minutes before Fajr)
  - Ishraq (20 minutes after Sunrise)

### Adhan Player
- Multiple Qari (muezzin) options:
  - Abdul Basit Abdul Samad
  - Al-Hussary
  - Al-Minshawi
  - Al-Ghamdi
  - Mishary Rashid Alafasy
  - Various Madinah and Makkah muezzins
- Special Fajr Adhan support
- Audio features:
  - Volume control
  - Auto-play options
  - Prayer-specific Adhan selection
  - Quality audio from trusted sources
  - Offline playback support
- File browser for selecting specific Adhan audio files
- Download manager for online Adhan files
- Audio fallback system

### Daylight Saving Time (DST) Management
- Automatic DST detection
- Manual DST override options:
  - Always on
  - Always off
  - Auto (system default)
- Custom time adjustments per prayer
- Timezone awareness
- Real-time updates
- DST transition handling

### User Interface
- Modern, clean design
- Theme options:
  - Light mode
  - Dark mode
  - Auto (system preference)
- Responsive layout for all devices
- Prayer time features:
  - Countdown to next prayer
  - Next prayer highlighting
  - Time remaining indicator
  - Prayer status (Current/Next)
- Accessibility features:
  - Screen reader support
  - Keyboard navigation
  - High contrast mode
  - Customizable font sizes

### Additional Features
- Browser notifications:
  - Prayer time alerts
  - Adhan notifications
  - Custom reminder settings
- Offline support:
  - Service worker implementation
  - Cached prayer times
  - Offline audio playback
- Local storage for:
  - User preferences
  - Selected Qaris
  - Custom settings
  - Downloaded audio files
- Multiple language support
- Qibla direction with compass
- Islamic calendar with:
  - Hijri date conversion
  - Important Islamic dates
  - Moon phase indicator

## Technical Architecture

### Frontend Components
```
js/
├── modules/
│   ├── adhan-init.js       # Adhan library initialization
│   ├── adhan-player.js     # Audio playback management
│   ├── adhan.js           # Core prayer time calculations
│   ├── app-init.js        # Application bootstrap
│   ├── dst-handler.js     # DST management
│   ├── islamic-calendar.js # Hijri calendar functions
│   ├── location.js        # Geolocation handling
│   ├── prayer-calculation.js # Prayer time algorithms
│   ├── qibla-compass.js   # Qibla direction
│   └── theme-manager.js   # UI theme handling
```

### Backend Services
```
server/
├── server.js              # Main server file
├── routes/               # API routes
├── controllers/         # Business logic
├── models/             # Data models
└── services/           # External services
```

## Application Workflow

### 1. Initialization Process
```mermaid
graph TD
    A[App Start] --> B[Load Configuration]
    B --> C[Initialize Components]
    C --> D[Get User Location]
    D --> E[Calculate Prayer Times]
    E --> F[Setup UI]
    F --> G[Start Services]
```

### 2. Prayer Time Calculation
1. Get user coordinates (auto/manual)
2. Apply calculation method
3. Adjust for madhab preference
4. Handle high latitude rules
5. Apply DST adjustments
6. Calculate additional times

### 3. Adhan Playback Process
1. Prayer time reached
2. Check notification settings
3. Load appropriate audio file
4. Handle playback states
5. Manage audio fallback

### 4. User Interaction Flow
- Settings modification
- Audio selection
- Theme switching
- Location updates
- Notification management

## API Documentation

### Prayer Time Endpoints
- GET `/prayer-times`: Get prayer times for current location
- GET `/prayer-times/:date`: Get prayer times for specific date
- GET `/qibla`: Get Qibla direction

### Audio Endpoints
- GET `/adhans/:qari/list`: List available audio files
- GET `/adhans/:qari/:file`: Stream audio file
- POST `/adhans/:qari/download`: Download audio file

### Settings Endpoints
- GET `/settings`: Get user settings
- POST `/settings`: Update settings
- GET `/location`: Get user location

## Development

### Prerequisites
- Node.js >= 14.x
- npm >= 6.x
- Modern web browser

### Setup Development Environment
1. Clone repository:
```bash
git clone https://github.com/zub165/Adhan.git
cd Adhan
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

### Building for Production
1. Create production build:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

### Testing
- Run unit tests: `npm test`
- Run integration tests: `npm run test:integration`
- Run e2e tests: `npm run test:e2e`

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -am 'Add YourFeature'`
4. Push to branch: `git push origin feature/YourFeature`
5. Submit pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Adhan.js](https://github.com/batoulapps/adhan-js) for prayer time calculations
- Various Qaris for audio contributions
- Community feedback and support

## Support

For support, please:
1. Check the [Issues](https://github.com/zub165/Adhan/issues) page
2. Create a new issue if needed
3. Join our [Discord community](#)
