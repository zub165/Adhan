class AdhanPlayer {
    constructor() {
        console.log('🎵 AdhanPlayer constructor called');
        this.availableQaris = [
            'Local',
            'assabile',
            'default',
            'islamcan',
            'madinah',
            'makkah'
        ];
        this.currentQari = localStorage.getItem('defaultQari') || 'Local';
        this.baseUrl = window.location.hostname.includes('github.io') ? '/Adhan' : '';
        this.audio = null;
        this.isPlaying = false;
        this.isLoading = false;
        
        // Initialize after DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.initializeQariSelectors(), 100);
            });
        } else {
            setTimeout(() => this.initializeQariSelectors(), 100);
        }
    }

    async initializeQariSelectors() {
        console.log('🚀 Initializing Qari selectors...');
        const prayers = ['tahajjud', 'suhoor', 'fajr', 'ishraq', 'dhuhr', 'asr', 'maghrib', 'isha'];
        prayers.forEach(prayer => {
            const prayerCard = document.querySelector(`.prayer-card[data-prayer="${prayer}"]`);
            if (prayerCard) {
                // Find existing qari-select-container or create a new one
                let container = prayerCard.querySelector('.qari-select-container');
                if (!container) {
                    container = document.createElement('div');
                    container.className = 'qari-select-container';
                    
                    // Create label
                    const label = document.createElement('label');
                    label.textContent = 'Select Qari: ';
                    label.htmlFor = `${prayer}QariSelect`;
                    container.appendChild(label);
                    
                    // Create select element for Qari
                    const select = document.createElement('select');
                    select.id = `${prayer}QariSelect`;
                    select.className = 'qari-select';
                    container.appendChild(select);
                    
                    // Insert the container before the adhan controls
                    const adhanControls = prayerCard.querySelector('.adhan-controls');
                    if (adhanControls) {
                        adhanControls.parentNode.insertBefore(container, adhanControls);
                    } else {
                        prayerCard.appendChild(container);
                    }
                }
                
                // Add browse button if it doesn't exist
                let browseButton = prayerCard.querySelector('.browse-button');
                if (!browseButton) {
                    browseButton = document.createElement('button');
                    browseButton.textContent = 'Browse Files';
                    browseButton.className = 'browse-button';
                    browseButton.onclick = () => this.showFileSelector(prayer);
                    container.appendChild(browseButton);
                }

                // Create file selector modal if it doesn't exist
                let modal = document.getElementById(`${prayer}Modal`);
                if (!modal) {
                    modal = document.createElement('div');
                    modal.id = `${prayer}Modal`;
                    modal.className = 'file-selector-modal';
                    modal.style.display = 'none';
                    modal.innerHTML = `
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Select Adhan File</h3>
                                <button class="close-modal">&times;</button>
                            </div>
                            <div class="modal-body">
                                <div class="file-browser">
                                    <div class="qari-list"></div>
                                    <div class="file-list"></div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(modal);

                    // Close modal when clicking the close button
                    modal.querySelector('.close-modal').onclick = () => {
                        modal.style.display = 'none';
                    };

                    // Close modal when clicking outside
                    window.onclick = (event) => {
                        if (event.target === modal) {
                            modal.style.display = 'none';
                        }
                    };
                }
                
                // Add change event listener for Qari select if not already added
                const select = document.getElementById(`${prayer}QariSelect`);
                if (select) {
                    // Remove existing event listeners to avoid duplicates
                    const newSelect = select.cloneNode(true);
                    select.parentNode.replaceChild(newSelect, select);
                    
                    // Add new event listener
                    newSelect.addEventListener('change', async (e) => {
                        const selectedQari = e.target.value;
                        localStorage.setItem(`${prayer}Qari`, selectedQari);
                        console.log(`Selected Qari for ${prayer}: ${selectedQari}`);
                    });
                }
                
                // Set up play/stop buttons
                const playButton = prayerCard.querySelector('.play-adhan');
                const stopButton = prayerCard.querySelector('.stop-adhan');
                
                if (playButton) {
                    // Remove existing event listeners to avoid duplicates
                    const newPlayButton = playButton.cloneNode(true);
                    playButton.parentNode.replaceChild(newPlayButton, playButton);
                    
                    // Add new event listener
                    newPlayButton.addEventListener('click', async () => {
                        if (this.isPlaying) return;
                        
                        newPlayButton.disabled = true;
                        if (stopButton) stopButton.disabled = false;
                        
                        await this.playAzan(prayer);
                    });
                }
                
                if (stopButton) {
                    // Remove existing event listeners to avoid duplicates
                    const newStopButton = stopButton.cloneNode(true);
                    stopButton.parentNode.replaceChild(newStopButton, stopButton);
                    
                    // Add new event listener
                    newStopButton.addEventListener('click', async () => {
                        if (!this.isPlaying) return;
                        
                        await this.stopAzan();
                        
                        if (playButton) playButton.disabled = false;
                        newStopButton.disabled = true;
                    });
                }
            }
        });
        // Scan and populate Qari options
        await this.scanAvailableQaris();
    }

    async updateFileList(prayer, qari) {
        const fileList = document.getElementById(`${prayer}Modal`).querySelector('.file-list');
        if (!fileList) return;

        try {
            fileList.innerHTML = '';

            // Add a default option
            const defaultOption = document.createElement('option');
            defaultOption.value = 'adhan.mp3';
            defaultOption.textContent = 'Default Adhan';
            fileList.appendChild(defaultOption);

            // Get the static file list based on qari
            const files = await this.getStaticFileList(qari);
            
            files.forEach(file => {
                const option = document.createElement('option');
                option.value = file;
                option.textContent = file.replace('.mp3', '').replace(/_/g, ' ');
                fileList.appendChild(option);
            });
            
            const savedFile = localStorage.getItem(`${prayer}AudioFile_${qari}`);
            if (savedFile && files.includes(savedFile)) {
                fileList.value = savedFile;
            }
            
            fileList.addEventListener('change', (e) => {
                localStorage.setItem(`${prayer}AudioFile_${qari}`, e.target.value);
            });
        } catch (error) {
            console.error('Error loading audio files:', error);
        }
    }

    getStaticFileList(qari) {
        // Return predefined lists based on qari
        const staticFiles = {
            'Local': ['adhan.mp3', 'azan.mp3', 'azan2.mp3', 'default-azan.mp3', 'default-azanfajr.mp3'],
            'abdul-basit': ['adhan_masr.mp3', 'adhan_makkah.mp3', 'adhan_fajr_masr.mp3'],
            'al-hussary': ['adhan_cairo.mp3', 'adhan_fajr.mp3'],
            'al-minshawi': ['adhan1.mp3', 'adhan2.mp3', 'adhan3.mp3', 'adhan4.mp3', 'adhan5.mp3'],
            'madinah': ['adhan_madinah1.mp3', 'adhan_madinah2.mp3', 'adhan_fajr_madinah.mp3'],
            'makkah': ['adhan_makkah1.mp3', 'adhan_makkah2.mp3', 'adhan_fajr_makkah.mp3'],
            'islamcan': Array.from({length: 21}, (_, i) => `azan${i + 1}.mp3`)
        };
        
        return Promise.resolve(staticFiles[qari] || []);
    }

    async stopAzan() {
        console.log('Stopping Adhan...');
        if (this.audio) {
            try {
                // Immediately update state
                this.isPlaying = false;
                this.isLoading = false;

                // Stop the audio
                this.audio.pause();
                this.audio.currentTime = 0;
                
                // Clean up the audio instance
                this.cleanupAudio();
                
                // Reset all button states
                this.resetButtonStates();
                
                console.log('⏹️ Audio playback stopped');
                return true;
            } catch (error) {
                console.error('Error stopping audio:', error);
                // Reset state even if there's an error
                this.isPlaying = false;
                this.isLoading = false;
                return false;
            }
        }
        return true;
    }

    cleanupAudio() {
        if (this.audio) {
            try {
                // Remove event listeners first
                this.audio.oncanplaythrough = null;
                this.audio.onerror = null;
                this.audio.onended = null;

                // Stop and reset audio
                this.audio.pause();
                this.audio.currentTime = 0;
                this.audio.src = '';
                
                // Remove the audio element
                this.audio = null;
            } catch (error) {
                console.error('Error cleaning up audio:', error);
            } finally {
                // Always reset state
        this.isPlaying = false;
                this.isLoading = false;
            }
        }
    }

    formatQariName(qari) {
        // Special cases
        const specialNames = {
            'islamcan-18': 'IslamCan (18 Qaris)',
            'islamcan': 'IslamCan',
            'Local': 'Local Adhan',
            'madina': 'Madinah',
            'madinah': 'Madinah',
            'makkah': 'Makkah',
            'default': 'Default',
            'assabile': 'Assabile'
        };

        if (specialNames[qari]) {
            return specialNames[qari];
        }

        // Format regular names (e.g., "al-ghamdi" -> "Al-Ghamdi")
        return qari.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    async scanAvailableQaris() {
        try {
            // List of all available Qaris from the adhans directory (matching actual directories)
            const qariList = [
                'assabile',
                'default',
                'islamcan',
                'Local',
                'madinah',
                'makkah'
            ];
            
            // Verify each Qari directory exists
            this.availableQaris = qariList;
            
            // Update all Qari selectors with the verified list

            this.updateQariSelectors();
            

            return this.availableQaris;
        } catch (error) {
            console.error('Error scanning Qaris:', error);
            // Fallback to default if there's an error
            this.availableQaris = ['default'];
            this.updateQariSelectors();
            return this.availableQaris;
        }
    }

    updateQariSelectors() {
        console.log('🔄 Updating Qari selectors with:', this.availableQaris);
        const prayers = ['tahajjud', 'suhoor', 'fajr', 'ishraq', 'dhuhr', 'asr', 'maghrib', 'isha'];
        prayers.forEach(prayer => {
            const select = document.getElementById(`${prayer}QariSelect`);
            if (select) {
                console.log(`✅ Found select for ${prayer}, populating with ${this.availableQaris.length} qaris`);
                // Store current selection
                const currentSelection = select.value;
                
                // Clear existing options
                select.innerHTML = '';
                
                // Add a default "Select Qari" option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select Qari...';
                defaultOption.disabled = true;
                select.appendChild(defaultOption);
                
                // Add available qaris
                this.availableQaris.forEach(qari => {
                    const option = document.createElement('option');
                    option.value = qari;
                    option.textContent = this.formatQariName(qari);
                    select.appendChild(option);

                });
                
                // Restore previous selection or set default
                const savedQari = localStorage.getItem(`${prayer}Qari`) || currentSelection || 'Local';
                if (this.availableQaris.includes(savedQari)) {
                    select.value = savedQari;
                } else {
                    select.value = 'Local'; // Default to Local if saved qari is not available
                }
                
                // Trigger change event to update audio files
                const event = new Event('change');
                select.dispatchEvent(event);
            } else {
                console.error(`❌ Select element NOT found for ${prayer}`);
            }
        });
    }

    async playAzan(prayer) {
        if (this.isPlaying || this.isLoading) return;
        
        try {
            this.isLoading = true;
            const qariSelect = document.getElementById(`${prayer}QariSelect`);
            if (!qariSelect) {
                throw new Error(`Qari select element not found for ${prayer}`);
            }
            
            const qari = qariSelect.value || 'default';
            const savedFile = localStorage.getItem(`${prayer}AudioFile_${qari}`) || 'adhan.mp3';
            
            console.log(`Playing Adhan for ${prayer} using qari ${qari}, file: ${savedFile}`);
            
            // Update button states
            this.updateButtonStates(prayer);
            
            // Use the loadAudio method to handle the audio loading and playing
            const success = await this.loadAudio(prayer, savedFile, qari);
            
            if (!success) {
                console.warn(`Failed to load audio for ${prayer}, trying default`);
                await this.loadDefaultAdhan(prayer);
            }
        } catch (error) {
            console.error('Error playing Adhan:', error);
            this.isPlaying = false;
            this.isLoading = false;
            this.cleanupAudio();
            this.resetButtonStates();
        }
    }

    setupAudioEventListeners(prayer) {
        if (!this.audio) return;
        
        // Remove any existing event listeners
        this.audio.oncanplaythrough = null;
        this.audio.onerror = null;
        this.audio.onended = null;
        
        // Add new event listeners
        this.audio.oncanplaythrough = () => {
            console.log('✅ Audio loaded successfully');
            this.isLoading = false;
            this.isPlaying = true;
            this.audio.play().catch(error => {
                console.error('Error playing audio:', error);
                this.isPlaying = false;
                this.isLoading = false;
                this.resetButtonStates();
            });
        };
        
        this.audio.onerror = (error) => {
            console.error('❌ Error loading audio:', error);
            this.isLoading = false;
            this.isPlaying = false;
            // Try loading default Adhan if custom one fails
            this.loadDefaultAdhan(prayer);
        };
        
        this.audio.onended = () => {
            console.log('✅ Audio playback completed');
            this.isPlaying = false;
            this.resetButtonStates();
        };
    }

    playBeep() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.1;

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
            audioContext.close();
        }, 500);
    }

    setDefaultQari(qari) {
        this.currentQari = qari;
        localStorage.setItem('defaultQari', qari);
    }

    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('❌ Error requesting notification permission:', error);
            return false;
        }
    }

    updateButtonStates(prayerName) {
        // Enable stop button and disable play button for the current prayer
        const prayerCard = document.querySelector(`.prayer-card[data-prayer="${prayerName}"]`);
        if (prayerCard) {
            const playButton = prayerCard.querySelector('.play-adhan');
            const stopButton = prayerCard.querySelector('.stop-adhan');
            if (playButton) playButton.disabled = true;
            if (stopButton) stopButton.disabled = false;
        }
        
        // Disable play buttons for other prayers
        document.querySelectorAll('.prayer-card').forEach(card => {
            if (card.dataset.prayer !== prayerName) {
                const playButton = card.querySelector('.play-adhan');
                if (playButton) playButton.disabled = true;
            }
        });
    }

    resetButtonStates() {
        // Enable all play buttons and disable all stop buttons
        document.querySelectorAll('.play-adhan').forEach(button => {
            button.disabled = false;
        });
        document.querySelectorAll('.stop-adhan').forEach(button => {
            button.disabled = true;
        });
    }

    async showFileSelector(prayer) {
        const modal = document.getElementById(`${prayer}Modal`);
        if (!modal) {
            console.error(`Modal for ${prayer} not found`);
            return;
        }
        
        const qariList = modal.querySelector('.qari-list');
        const fileList = modal.querySelector('.file-list');

        // Clear previous content
        qariList.innerHTML = '<div class="loading">Loading Qaris...</div>';
        fileList.innerHTML = '';

        try {
            // Populate Qari list
            qariList.innerHTML = '';
            this.availableQaris.forEach(qari => {
                const qariButton = document.createElement('button');
                qariButton.className = 'qari-button';
                qariButton.textContent = this.formatQariName(qari);
                qariButton.dataset.qari = qari;
                qariButton.onclick = async () => {
                    // Remove active class from all buttons
                    qariList.querySelectorAll('.qari-button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    // Add active class to clicked button
                    qariButton.classList.add('active');
                    // Load files for this Qari
                    await this.loadQariFiles(prayer, qari, fileList);
                };
                qariList.appendChild(qariButton);
            });

            // Show the modal
            modal.style.display = 'block';
            
            // Select the current Qari if available
            const currentQari = localStorage.getItem(`${prayer}Qari`) || 'default';
            const currentQariButton = qariList.querySelector(`[data-qari="${currentQari}"]`);
            if (currentQariButton) {
                currentQariButton.click();
            } else if (qariList.firstChild) {
                qariList.firstChild.click();
            }
        } catch (error) {
            console.error('Error showing file selector:', error);
            qariList.innerHTML = '<div class="error">Error loading Qaris</div>';
        }
    }

    async loadQariFiles(prayer, qari, fileList) {
        try {
            fileList.innerHTML = '<div class="loading">Loading files...</div>';
            
            // Define islamcanFiles if it doesn't exist
            if (!this.islamcanFiles) {
                this.islamcanFiles = Array.from({length: 21}, (_, i) => `azan${i + 1}.mp3`);
            }
            
            // Special handling for IslamCan
            if (qari === 'islamcan') {
                fileList.innerHTML = '';
                this.islamcanFiles.forEach(file => {
                    const fileButton = this.createFileButton(prayer, qari, file, true);
                    fileList.appendChild(fileButton);
                });
                return;
            }
            
            // For GitHub Pages deployment, use static file lists instead of server requests
            if (window.location.hostname === 'zub165.github.io') {
                const staticFiles = await this.getStaticFileList(qari);
                fileList.innerHTML = '';
                
                if (staticFiles.length === 0) {
                    const noFiles = document.createElement('div');
                    noFiles.className = 'no-files';
                    noFiles.textContent = 'No audio files found';
                    fileList.appendChild(noFiles);
                    return;
                }
                
                staticFiles.forEach(file => {
                    const fileButton = this.createFileButton(prayer, qari, file, true);
                    fileList.appendChild(fileButton);
                });
                return;
            }
            
            // For local development, try to fetch from server
            try {
                const response = await fetch(`http://localhost:3001/adhans/${qari}/list`);
                if (!response.ok) {
                    throw new Error(`Failed to load files for ${qari}`);
                }
                
                const files = await response.json();
                fileList.innerHTML = '';
                
                // Add default option
                const defaultButton = this.createFileButton(prayer, qari, 'adhan', true);
                fileList.appendChild(defaultButton);
                
                if (files.length === 0) {
                    const noFiles = document.createElement('div');
                    noFiles.className = 'no-files';
                    noFiles.textContent = 'No additional audio files found';
                    fileList.appendChild(noFiles);
                    return;
                }

                files.forEach(file => {
                    if (file && typeof file === 'object') {
                        const fileButton = this.createFileButton(
                            prayer, 
                            qari, 
                            file.name || 'unknown', 
                            file.local || false,
                            file.url || '',
                            file.needsDownload || false
                        );
                        fileList.appendChild(fileButton);
                    }
                });
            } catch (error) {
                console.error('Error fetching from server, falling back to static list:', error);
                // Fallback to static list
                const staticFiles = await this.getStaticFileList(qari);
                fileList.innerHTML = '';
                
                staticFiles.forEach(file => {
                    const fileButton = this.createFileButton(prayer, qari, file, true);
                    fileList.appendChild(fileButton);
                });
            }
        } catch (error) {
            console.error('Error loading files:', error);
            fileList.innerHTML = '<div class="error">Error loading files</div>';
        }
    }

    createFileButton(prayer, qari, fileName, isLocal = true, url = '', needsDownload = false) {
        if (!fileName) {
            console.error('Missing fileName in createFileButton');
            fileName = 'unknown';
        }
        
        const button = document.createElement('button');
        button.className = 'file-button';
        button.textContent = fileName.replace('.mp3', '').replace(/_/g, ' ');
        
        if (needsDownload) {
            button.classList.add('needs-download');
            button.innerHTML += ' <span class="download-icon">⬇️</span>';
        }

        button.onclick = async () => {
            if (needsDownload && window.location.hostname !== 'zub165.github.io') {
                button.disabled = true;
                button.innerHTML = 'Downloading... <span class="loading-spinner"></span>';
                
                try {
                    const response = await fetch(`/adhans/${qari}/download/${fileName}`);
                    if (!response.ok) throw new Error('Download failed');
                    
                    const result = await response.json();
                    if (result.success) {
                        // Update button state
                        button.classList.remove('needs-download');
                        button.innerHTML = fileName.replace('.mp3', '').replace(/_/g, ' ');
                        url = result.path;
                        needsDownload = false;
                    } else {
                        throw new Error('Download failed');
                    }
                } catch (error) {
                    console.error('Error downloading file:', error);
                    button.innerHTML = 'Download Failed ⚠️';
                    button.disabled = false;
                    return;
                }
            }

            // Update the Qari selection
            const qariSelect = document.getElementById(`${prayer}QariSelect`);
            if (qariSelect) qariSelect.value = qari;
            localStorage.setItem(`${prayer}Qari`, qari);
            
            // Save the selected file and URL
            localStorage.setItem(`${prayer}AudioFile_${qari}`, fileName);
            if (url) localStorage.setItem(`${prayer}AudioURL_${qari}`, url);
            
            // Close the modal
            const modal = document.getElementById(`${prayer}Modal`);
            if (modal) modal.style.display = 'none';
            
            console.log(`Selected ${fileName} from ${qari} for ${prayer}`);
        };

        return button;
    }

    async loadAudio(prayer, selectedFile, qari) {
        try {
            console.log('Loading audio:', selectedFile, 'for prayer:', prayer, 'from qari:', qari);
            
            if (this.isLoading || this.isPlaying) {
                console.log('Already playing or loading audio');
                return false;
            }

            this.isLoading = true;
            
            // Clean up any existing audio
            await this.stopAzan();
            
            // Create new audio instance
            this.audio = new Audio();
            
            // Set up event listeners before setting the source
            this.setupAudioEventListeners(prayer);
            
            // Construct the correct audio file path
            let audioPath;
            if (qari === 'Local') {
                audioPath = `${this.baseUrl}/adhans/local/${selectedFile}`;
            } else {
                // Convert qari name to lowercase and replace hyphens with underscores
                const qariDir = qari.toLowerCase().replace(/-/g, '_');
                audioPath = `${this.baseUrl}/adhans/${qariDir}/${selectedFile}`;
            }
            
            console.log('Attempting to load audio from path:', audioPath);
            
            // Set the source and load the audio
            this.audio.src = audioPath;
            
            // Add specific error handler for loading failure
            this.audio.onerror = (e) => {
                console.error('Failed to load audio file:', audioPath);
                console.error('Audio error:', e.target.error);
                
                // Try alternative path with original qari name
                const altPath = `${this.baseUrl}/adhans/${qari}/${selectedFile}`;
                console.log('Trying alternative path:', altPath);
                
                this.audio.src = altPath;
                this.audio.onerror = (e2) => {
                    console.error('Failed to load alternative path:', altPath);
                    console.error('Audio error:', e2.target.error);
                    this.isLoading = false;
                    this.isPlaying = false;
                };
            };
            
            await this.audio.load();
            
            return true;
        } catch (error) {
            console.error('Error in loadAudio:', error);
            this.isLoading = false;
            this.isPlaying = false;
            return false;
        }
    }

    async loadDefaultAdhan(prayer) {
        console.log('Falling back to default Adhan...');
        try {
            const defaultPath = `${this.baseUrl}/adhans/default/adhan.mp3`;
            if (!this.audio) {
                this.audio = new Audio();
            }
            this.audio.src = defaultPath;
            await this.audio.play();
            this.isPlaying = true;
        } catch (error) {
            console.error('Error loading default Adhan:', error);
            this.isPlaying = false;
        }
    }
}

export default AdhanPlayer; 
