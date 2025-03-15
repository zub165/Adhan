// Test script to check path handling in different environments
console.log('Starting deployment test...');

// Mock location for testing
function mockLocation(hostname) {
    // Save original location
    const originalLocation = window.location;
    
    // Define a custom location object
    const customLocation = {
        hostname: hostname,
        href: hostname === 'zub165.github.io' ? 
            'https://zub165.github.io/Adhan/' : 
            'http://localhost:3000/',
        protocol: hostname === 'zub165.github.io' ? 'https:' : 'http:',
        host: hostname === 'zub165.github.io' ? 'zub165.github.io' : 'localhost:3000',
        pathname: hostname === 'zub165.github.io' ? '/Adhan/' : '/'
    };
    
    // Mock the window.location
    delete window.location;
    window.location = customLocation;
    
    return () => {
        window.location = originalLocation;
    };
}

// Test local environment
console.log('Testing local environment...');
mockLocation('localhost');

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

// Test paths
const localAudioPath = `${getBasePath()}/adhans/default/adhan.mp3`;
console.log('Local audio path:', localAudioPath);

// Test GitHub Pages environment
console.log('\nTesting GitHub Pages environment...');
mockLocation('zub165.github.io');

// Test paths again
const ghPagesAudioPath = `${getBasePath()}/adhans/default/adhan.mp3`;
console.log('GitHub Pages audio path:', ghPagesAudioPath);

// Verify paths
console.log('\nVerifying paths:');
console.log('Local Audio path correct:', localAudioPath === '/adhans/default/adhan.mp3');
console.log('GitHub Pages Audio path correct:', ghPagesAudioPath === '/Adhan/adhans/default/adhan.mp3');

// Test script loading paths
console.log('\nTesting script loading paths:');
const localScriptPath = `${getBasePath()}/js/modules/adhan.js`;
console.log('Local script path:', localScriptPath);

const ghPagesScriptPath = `${getBasePath()}/js/modules/adhan.js`;
console.log('GitHub Pages script path:', ghPagesScriptPath);

// Check for common issues
console.log('\nChecking for common issues:');
console.log('1. Base path handling:', getBasePath() === '/Adhan' ? 'Correct' : 'Incorrect');
console.log('2. Hostname detection:', isGitHubPages() ? 'Correct' : 'Incorrect');
console.log('3. Path construction:', ghPagesAudioPath.startsWith('/Adhan/') ? 'Correct' : 'Incorrect');

console.log('\nDeployment test complete.'); 