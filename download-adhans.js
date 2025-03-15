const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Create directories if they don't exist
const createDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// Download a file from a URL
const downloadFile = (url, destination) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${destination}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {});
      reject(err);
    });
  });
};

// Main function
async function main() {
  // Define base directories
  const baseDir = 'adhans';
  
  // Define Qaris and their sample files
  const qaris = {
    'default': [
      { name: 'adhan.mp3', url: 'https://islamcan.com/audio/adhan/azan1.mp3' },
      { name: 'adhan_fajr.mp3', url: 'https://islamcan.com/audio/adhan/azan2.mp3' }
    ],
    'islamcan': Array.from({ length: 21 }, (_, i) => ({
      name: `azan${i + 1}.mp3`,
      url: `https://islamcan.com/audio/adhan/azan${i + 1}.mp3`
    })),
    'madinah': [
      { name: 'adhan_madinah1.mp3', url: 'https://islamcan.com/audio/adhan/azan3.mp3' },
      { name: 'fajr_adhan.mp3', url: 'https://islamcan.com/audio/adhan/azan4.mp3' }
    ],
    'makkah': [
      { name: 'adhan_makkah1.mp3', url: 'https://islamcan.com/audio/adhan/azan5.mp3' },
      { name: 'adhan_makkah2.mp3', url: 'https://islamcan.com/audio/adhan/azan6.mp3' }
    ],
    'assabile': [
      { name: 'adhan1.mp3', url: 'https://islamcan.com/audio/adhan/azan7.mp3' },
      { name: 'adhan2.mp3', url: 'https://islamcan.com/audio/adhan/azan8.mp3' },
      { name: 'adhan3.mp3', url: 'https://islamcan.com/audio/adhan/azan9.mp3' }
    ],
    'Local': [
      { name: 'adhan.mp3', url: 'https://islamcan.com/audio/adhan/azan10.mp3' },
      { name: 'default-azan.mp3', url: 'https://islamcan.com/audio/adhan/azan11.mp3' },
      { name: 'beep.mp3', url: 'https://www.soundjay.com/button/beep-07.mp3' }
    ]
  };
  
  // Create base directory
  createDir(baseDir);
  
  // Create directories for each Qari and download files
  for (const [qari, files] of Object.entries(qaris)) {
    const qariDir = path.join(baseDir, qari);
    createDir(qariDir);
    
    console.log(`Downloading files for ${qari}...`);
    
    for (const file of files) {
      const filePath = path.join(qariDir, file.name);
      
      // Skip if file already exists
      if (fs.existsSync(filePath)) {
        console.log(`File already exists: ${filePath}`);
        continue;
      }
      
      try {
        await downloadFile(file.url, filePath);
      } catch (error) {
        console.error(`Error downloading ${file.url}: ${error.message}`);
      }
    }
  }
  
  console.log('All downloads completed!');
  
  // Add files to git
  try {
    execSync('git add adhans/*');
    console.log('Added files to git');
  } catch (error) {
    console.error('Error adding files to git:', error.message);
  }
}

main().catch(console.error); 