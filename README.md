# Adhan Player Application

An Islamic prayer times application that allows users to play Adhan (call to prayer) from both local and online sources. The application supports multiple Qaris (reciters) and provides a beautiful interface for managing prayer times and Adhan preferences.

## Features

- Display and manage Islamic prayer times
- Play Adhan from local and online sources
- Support for multiple Qaris
- Beautiful and modern user interface
- Customizable Adhan settings

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd adhan-player
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add any necessary environment variables.

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `/public` - Static assets and Adhan audio files
- `/src` - Source code
  - `/components` - React components
  - `/styles` - CSS styles
  - `/utils` - Utility functions
- `server.js` - Express server configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to all the Qaris who provided their beautiful recitations
- [Adhan.js](https://github.com/batoulapps/adhan-js) for prayer times calculations
- All contributors who helped improve this application
