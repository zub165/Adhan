const http = require('http');
const https = require('https');
const serveHandler = require('serve-handler');
const fs = require('fs').promises;
const path = require('path');

let server = null;

// Online source mappings for different Qaris
const onlineSources = {
    'assabile': {
        baseUrl: 'https://media.sd.ma/assabile/adhan_3435370/',
        files: [
            { name: 'madina_adhan.mp3', id: '0bf83c80b583' },
            { name: 'mishary_adhan.mp3', id: '8c052a5edec1' },
            { name: 'adhan1.mp3', id: 'cbcd8d249dcc' },
            { name: 'adhan2.mp3', id: '495dea4f4ea5' },
            { name: 'adhan3.mp3', id: 'cd17c7200df5' }
        ]
    },
    'abdulbasit': {
        baseUrl: 'https://server12.mp3quran.net/basit/',
        files: [
            { name: 'adhan_masr.mp3', id: 'adhan1' },
            { name: 'adhan_makkah.mp3', id: 'adhan2' },
            { name: 'adhan_fajr_masr.mp3', id: 'adhan3' },
            { name: 'adhan_cairo.mp3', id: 'adhan4' }
        ]
    },
    'mishary-rashid': {
        baseUrl: 'https://server12.mp3quran.net/mishari/',
        files: [
            { name: 'adhan_kuwait.mp3', id: 'adhan1' },
            { name: 'adhan_fajr_kuwait.mp3', id: 'adhan2' },
            { name: 'adhan_makkah.mp3', id: 'adhan3' }
        ]
    },
    'al-hussary': {
        baseUrl: 'https://server8.mp3quran.net/hussary/',
        files: [
            { name: 'adhan_cairo.mp3', id: 'adhan1' },
            { name: 'adhan_fajr.mp3', id: 'adhan2' }
        ]
    },
    'ahmad-al-amade': {
        baseUrl: 'https://media.sd.ma/assabile/qatar/',
        files: [
            { name: 'adhan_qatar1.mp3', id: 'adhan1' },
            { name: 'adhan_qatar2.mp3', id: 'adhan2' },
            { name: 'takberat_eid.mp3', id: 'takberat1' }
        ]
    },
    'al-minshawi': {
        baseUrl: 'https://server8.mp3quran.net/minsh_mjwd/',
        files: [
            { name: 'adhan1.mp3', id: '1' },
            { name: 'adhan2.mp3', id: '2' },
            { name: 'adhan3.mp3', id: '3' },
            { name: 'adhan4.mp3', id: '4' },
            { name: 'adhan5.mp3', id: '5' }
        ]
    },
    'madinah': {
        baseUrl: 'https://media.sd.ma/assabile/madinah/',
        files: [
            { name: 'adhan_madinah1.mp3', id: 'adhan1' },
            { name: 'adhan_madinah2.mp3', id: 'adhan2' },
            { name: 'adhan_fajr_madinah.mp3', id: 'fajr1' }
        ]
    },
    'makkah': {
        baseUrl: 'https://media.sd.ma/assabile/makkah/',
        files: [
            { name: 'adhan_makkah1.mp3', id: 'adhan1' },
            { name: 'adhan_makkah2.mp3', id: 'adhan2' },
            { name: 'adhan_fajr_makkah.mp3', id: 'fajr1' }
        ]
    }
};

// Function to proxy API requests
async function proxyAladhanAPI(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';
            
            resp.on('data', (chunk) => {
                data += chunk;
            });
            
            resp.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Function to check if a file exists locally
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Function to ensure directory exists
async function ensureDirectoryExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
}

// Function to download file
async function downloadFile(url, filePath) {
    const dirPath = path.dirname(filePath);
    await ensureDirectoryExists(dirPath);

    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve(true);
            });

            fileStream.on('error', (err) => {
                fs.unlink(filePath);
                reject(err);
            });
        }).on('error', reject);
    });
}

// Function to recursively get files from a directory
async function getFilesRecursively(dir) {
    try {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        const files = await Promise.all(dirents.map(async (dirent) => {
            const res = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                return getFilesRecursively(res);
            }
            return res;
        }));
        return files.flat();
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
        return [];
    }
}

async function startServer(port) {
    if (server) {
        try {
            await new Promise((resolve) => server.close(resolve));
        } catch (err) {
            console.error('Error closing existing server:', err);
        }
    }

    server = http.createServer(async (req, res) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Handle Aladhan API proxy requests
        if (req.url.startsWith('/api/aladhan/')) {
            try {
                const apiPath = req.url.replace('/api/aladhan/', '');
                const aladhanUrl = `https://api.aladhan.com/v1/${apiPath}`;
                const data = await proxyAladhanAPI(aladhanUrl);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
                return;
            } catch (error) {
                console.error('Error proxying Aladhan API:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Failed to fetch prayer times' }));
                return;
            }
        }

        // Handle audio file listing requests
        if (req.url.startsWith('/adhans/') && req.url.endsWith('/list')) {
            try {
                const qariPath = req.url.slice(1, -5); // Remove leading / and /list
                const dirPath = path.join(__dirname, qariPath);
                const qariName = path.basename(qariPath);
                
                let mp3Files = [];

                // First, try to get local files
                try {
                    const allFiles = await getFilesRecursively(dirPath);
                    mp3Files = allFiles
                        .filter(file => file.toLowerCase().endsWith('.mp3'))
                        .map(file => {
                            const relativePath = path.relative(dirPath, file);
                            return {
                                name: relativePath,
                                local: true,
                                url: `/adhans/${qariName}/${relativePath}`
                            };
                        });
                    console.log(`Found ${mp3Files.length} local files in ${qariPath}:`, mp3Files);
                } catch (err) {
                    console.log(`No local files found for ${qariName}:`, err.message);
                }

                // If this Qari has online sources, add them
                if (onlineSources[qariName]) {
                    const source = onlineSources[qariName];
                    const onlineFiles = await Promise.all(source.files.map(async file => {
                        const localPath = path.join(dirPath, file.name);
                        const exists = await fileExists(localPath);
                        return {
                            name: file.name,
                            local: exists,
                            url: exists ? 
                                `/adhans/${qariName}/${file.name}` : 
                                `${source.baseUrl}${file.id}.mp3`,
                            needsDownload: !exists
                        };
                    }));
                    
                    // Add online files that aren't already local
                    onlineFiles.forEach(file => {
                        if (!mp3Files.some(f => f.name === file.name)) {
                            mp3Files.push(file);
                        }
                    });
                    console.log(`Added ${onlineFiles.length} online files for ${qariName}`);
                }

                // Sort files by name
                mp3Files.sort((a, b) => a.name.localeCompare(b.name));

                console.log(`Total ${mp3Files.length} files for ${qariName}:`, mp3Files);
                
                res.writeHead(200, { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                });
                res.end(JSON.stringify(mp3Files));
            } catch (error) {
                console.error('Error listing files:', error);
                res.writeHead(500);
                res.end(JSON.stringify([]));
            }
            return;
        }

        // Handle file download requests
        if (req.url.startsWith('/adhans/') && req.url.includes('/download/')) {
            try {
                const parts = req.url.split('/download/');
                const qariName = parts[0].split('/')[2];
                const fileName = parts[1];

                if (onlineSources[qariName]) {
                    const source = onlineSources[qariName];
                    const file = source.files.find(f => f.name === fileName);
                    
                    if (file) {
                        const localPath = path.join(__dirname, 'adhans', qariName, fileName);
                        const sourceUrl = `${source.baseUrl}${file.id}.mp3`;

                        await downloadFile(sourceUrl, localPath);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true, path: `/adhans/${qariName}/${fileName}` }));
                        return;
                    }
                }

                res.writeHead(404);
                res.end(JSON.stringify({ error: 'File not found' }));
            } catch (error) {
                console.error('Error downloading file:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Download failed' }));
            }
            return;
        }

        // Handle all other requests with serve-handler
        return serveHandler(req, res, {
            public: __dirname,
            directoryListing: true,
            renderSingle: true,
            cleanUrls: false,
            symlinks: true,
            headers: [
                {
                    source: '**/*.mp3',
                    headers: [{
                        key: 'Content-Type',
                        value: 'audio/mpeg'
                    }]
                }
            ],
            rewrites: [
                { source: '/adhans/**', destination: '/adhans/:splat' }
            ],
            cors: true
        });
    });

    return new Promise((resolve, reject) => {
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is in use, trying ${port + 1}...`);
                resolve(startServer(port + 1));
            } else {
                reject(err);
            }
        });

        server.once('listening', () => {
            console.log(`Server running at http://localhost:${port}`);
            resolve(server);
        });

        server.listen(port);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    if (server) {
        server.close(() => {
            console.log('Server shut down gracefully');
            process.exit(0);
        });
    }
});

const PORT = process.env.PORT || 3000;
startServer(PORT).catch(console.error); 