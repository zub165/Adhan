class AdhanPlayer {
    constructor() {
        this.availableQaris = [];
        this.currentQari = localStorage.getItem('defaultQari') || 'default';
        this.audio = null;
        this.isPlaying = false;
        this.isLoading = false;
        this.islamcanFiles = Array.from({length: 21}, (_, i) => `azan${i + 1}`);
        // Get base path for assets
        this.basePath = this.getBasePath();
        // Initialize after DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeQariSelectors());
        } else {
            this.initializeQariSelectors();
        }
    }

    // Helper function to determine if we're running on GitHub Pages
    isGitHubPages() {
        return window.location.hostname === 'zub165.github.io';
    }
    
    // Helper function to get the base path
    getBasePath() {
        if (this.isGitHubPages()) {
            return '/Adhan';
        }
        return '';
    }

    initializeQariSelectors() {
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
        this.scanAvailableQaris();
    }

    async updateFileList(prayer, qari) {
        const fileList = document.getElementById(`${prayer}Modal`).querySelector('.file-list');
        if (!fileList) return;

        try {
            // Clear existing options first
            fileList.innerHTML = '';

            // Special handling for IslamCan
            if (qari === 'islamcan') {
                this.islamcanFiles.forEach(file => {
                    const option = document.createElement('option');
                    option.value = `${file}.mp3`;
                    option.textContent = file;
                    fileList.appendChild(option);
                });
                const savedFile = localStorage.getItem(`${prayer}AudioFile_${qari}`);
                if (savedFile && this.islamcanFiles.includes(savedFile.replace('.mp3', ''))) {
                    fileList.value = savedFile;
                }
                return;
            }

            // Add a default option
            const defaultOption = document.createElement('option');
            defaultOption.value = 'adhan.mp3';
            defaultOption.textContent = 'Default Adhan';
            fileList.appendChild(defaultOption);

            // For other Qaris, try to fetch the file list from the correct server port
            const response = await fetch(`${this.basePath}/api/adhans/${qari}/list`);
            if (!response.ok) {
                console.log(`No additional audio files found for ${qari}`);
                return;
            }
            
            const files = await response.json();
            if (!files || files.length === 0) {
                console.log(`No audio files found for ${qari}`);
                return;
            }
            
            files.forEach(file => {
                if (file.toLowerCase().endsWith('.mp3')) {
                    const option = document.createElement('option');
                    option.value = file;
                    option.textContent = file.replace('.mp3', '').replace(/_/g, ' ');
                    fileList.appendChild(option);
                }
            });
            
            const savedFile = localStorage.getItem(`${prayer}AudioFile_${qari}`);
            if (savedFile && (savedFile === 'adhan.mp3' || files.includes(savedFile))) {
                fileList.value = savedFile;
            }
            
            // Save selection
            fileList.addEventListener('change', (e) => {
                localStorage.setItem(`${prayer}AudioFile_${qari}`, e.target.value);
            });
        } catch (error) {
            console.error('Error loading audio files:', error);
        }
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
            'default': 'Default'
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
            // List of all available Qaris from the adhans directory
            const qariList = [
                'abdul-basit',
                'al-ghamdi',
                'al-hussary',
                'al-minshawi',
                'assabile',
                'default',
                'islamcan',
                'Local',
                'madina',
                'madinah',
                'makkah',
                'mishary-rashid',
                'muaiqly'
            ];
            
            // Verify each Qari directory exists
            this.availableQaris = qariList;
            
            // Update all Qari selectors with the verified list
            this.updateQariSelectors();
            
            console.log('✅ Available Qaris:', this.availableQaris);
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
        const prayers = ['tahajjud', 'suhoor', 'fajr', 'ishraq', 'dhuhr', 'asr', 'maghrib', 'isha'];
        prayers.forEach(prayer => {
            const select = document.getElementById(`${prayer}QariSelect`);
            if (select) {
                // Store current selection
                const currentSelection = select.value;
                
                // Clear existing options
                select.innerHTML = '';
                
                // Add available qaris
                this.availableQaris.forEach(qari => {
                    const option = document.createElement('option');
                    option.value = qari;
                    option.textContent = this.formatQariName(qari);
                    select.appendChild(option);
                });
                
                // Restore previous selection or set default
                const savedQari = localStorage.getItem(`${prayer}Qari`) || currentSelection || 'default';
                if (this.availableQaris.includes(savedQari)) {
                    select.value = savedQari;
                } else {
                    select.value = 'default';
                }
                
                // Trigger change event to update audio files
                const event = new Event('change');
                select.dispatchEvent(event);
            }
        });
    }

    async playAzan(prayer) {
        try {
            if (this.isPlaying || this.isLoading) {
                console.log('Already playing or loading audio');
                return false;
            }
            
            this.isLoading = true;
            
            // Get the selected Qari for this prayer
            const qariSelect = document.getElementById(`${prayer}QariSelect`);
            const qari = qariSelect ? qariSelect.value : this.currentQari;
            
            // Determine the audio file to play
            let audioFile = localStorage.getItem(`${prayer}AudioFile_${qari}`);
            
            // If no file is stored in localStorage, use default files based on prayer
            if (!audioFile) {
                if (prayer === 'fajr') {
                    // Check for fajr-specific files first
                    audioFile = 'fajr.mp3';
                } else {
                    audioFile = 'adhan.mp3';
                }
            }
            
            // Construct the audio URL with the correct base path
            const audioUrl = `${this.basePath}/adhans/${qari}/${audioFile}`;
            
            console.log(`Playing adhan for ${prayer} using ${qari}/${audioFile}`);
            console.log(`Full audio URL: ${audioUrl}`);
            console.log(`Base path: ${this.basePath}`);
            
            // Create a new audio element
            this.audio = new Audio(audioUrl);
            
            // Set up event listeners with more detailed error logging
            this.audio.onerror = (e) => {
                console.error('Audio error details:', {
                    code: this.audio.error ? this.audio.error.code : 'unknown',
                    message: this.audio.error ? this.audio.error.message : 'unknown',
                    url: audioUrl,
                    event: e
                });
                
                // Try fallback to default adhan if the selected one fails
                if (qari !== 'default') {
                    console.log('Trying fallback to default adhan...');
                    this.tryFallbackAdhan(prayer);
                } else {
                    this.isPlaying = false;
                    this.isLoading = false;
                    this.audio = null;
                }
            };
            
            this.audio.onended = () => {
                console.log('Audio playback ended');
                this.isPlaying = false;
                this.audio = null;
            };
            
            this.audio.oncanplaythrough = () => {
                console.log('Audio can play through');
            };
            
            // Start playback
            console.log('Attempting to play audio...');
            await this.audio.play();
            
            console.log('Audio playback started successfully');
            this.isPlaying = true;
            this.isLoading = false;
            
            return true;
        } catch (error) {
            console.error('Error playing adhan:', error);
            console.error('Stack trace:', error.stack);
            this.isPlaying = false;
            this.isLoading = false;
            
            // Try fallback to default adhan
            return this.tryFallbackAdhan(prayer);
        }
    }
    
    // New method to try fallback to default adhan
    async tryFallbackAdhan(prayer) {
        try {
            console.log('Trying to play default adhan as fallback...');
            
            // Use default adhan
            const audioFile = prayer === 'fajr' ? 'fajr.mp3' : 'adhan.mp3';
            const audioUrl = `${this.basePath}/adhans/default/${audioFile}`;
            
            console.log(`Fallback audio URL: ${audioUrl}`);
            
            // Create a new audio element
            this.audio = new Audio(audioUrl);
            
            // Set up basic event listeners
            this.audio.onended = () => {
                console.log('Fallback audio playback ended');
                this.isPlaying = false;
                this.audio = null;
            };
            
            this.audio.onerror = (e) => {
                console.error('Fallback audio error:', e);
                this.isPlaying = false;
                this.isLoading = false;
                this.audio = null;
            };
            
            // Start playback
            await this.audio.play();
            
            console.log('Fallback audio playback started successfully');
            this.isPlaying = true;
            this.isLoading = false;
            
            return true;
        } catch (error) {
            console.error('Error playing fallback adhan:', error);
            this.isPlaying = false;
            this.isLoading = false;
            this.audio = null;
            return false;
        }
    }

    async playDefaultAzan() {
        try {
            await this.stopAzan();

            console.log('🔄 Playing default Adhan');
            const defaultPath = '/adhans/default/adhan.mp3';
            
            this.audio = new Audio(defaultPath);
            
            return new Promise((resolve, reject) => {
                const cleanup = () => {
                    this.audio.oncanplaythrough = null;
                    this.audio.onerror = null;
                    clearTimeout(loadTimeout);
                };

                const loadTimeout = setTimeout(() => {
                    cleanup();
                    this.cleanupAudio();
                    reject(new Error('Default audio loading timeout'));
                }, 5000);

                this.audio.oncanplaythrough = () => {
                    cleanup();
                    this.isLoading = false;
                    this.isPlaying = true;
                    this.audio.play().catch(reject);
                    resolve(true);
                };

                this.audio.onerror = (error) => {
                    cleanup();
                    this.cleanupAudio();
                    reject(error);
                };

                this.audio.onended = () => {
                    this.cleanupAudio();
                    document.querySelectorAll('.test-adhan').forEach(button => {
                        button.textContent = 'Test Adhan';
                        button.disabled = false;
                    });
                };

                this.audio.load();
            });
        } catch (error) {
            console.error('Error playing default Adhan:', error);
            this.cleanupAudio();
            throw error;
        }
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
            
            // Special handling for IslamCan
            if (qari === 'islamcan') {
                fileList.innerHTML = '';
                this.islamcanFiles.forEach(file => {
                    const fileButton = this.createFileButton(prayer, qari, file, true);
                    fileList.appendChild(fileButton);
                });
                return;
            }
            
            // For other Qaris, fetch the file list from the correct server port
            const response = await fetch(`${this.basePath}/api/adhans/${qari}/list`);
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
                const fileButton = this.createFileButton(
                    prayer, 
                    qari, 
                    file.name, 
                    file.local,
                    file.url,
                    file.needsDownload
                );
                fileList.appendChild(fileButton);
            });
        } catch (error) {
            console.error('Error loading files:', error);
            fileList.innerHTML = '<div class="error">Error loading files</div>';
        }
    }

    createFileButton(prayer, qari, fileName, isLocal, url, needsDownload) {
        const button = document.createElement('button');
        button.className = 'file-button';
        button.textContent = fileName.replace('.mp3', '').replace(/_/g, ' ');
        
        if (needsDownload) {
            button.classList.add('needs-download');
            button.innerHTML += ' <span class="download-icon">⬇️</span>';
        }

        button.onclick = async () => {
            if (needsDownload) {
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
            document.getElementById(`${prayer}Modal`).style.display = 'none';
            
            console.log(`Selected ${fileName} from ${qari} for ${prayer}`);
        };

        return button;
    }

    setupAudioEvents() {
        if (!this.audio) return;
        
        this.audio.onended = () => {
            console.log('Audio playback ended');
            this.isPlaying = false;
            this.audio = null;
        };
        
        this.audio.onerror = (error) => {
            console.error('Audio error:', error);
            this.isPlaying = false;
            this.isLoading = false;
            this.audio = null;
        };
        
        this.audio.oncanplaythrough = () => {
            console.log('Audio can play through');
        };
    }

    async fetchAvailableQaris() {
        try {
            // Use relative URL instead of hardcoded localhost
            const apiUrl = `${this.basePath}/api/qaris`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch qaris: ${response.status}`);
            }
            const data = await response.json();
            this.availableQaris = data.qaris || [];
            return this.availableQaris;
        } catch (error) {
            console.error('Error fetching qaris:', error);
            return [];
        }
    }

    async fetchQariFiles(qari) {
        try {
            // Use relative URL instead of hardcoded localhost
            const apiUrl = `${this.basePath}/api/adhans/${qari}/list`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch files for ${qari}: ${response.status}`);
            }
            const data = await response.json();
            return data.files || [];
        } catch (error) {
            console.error(`Error fetching files for ${qari}:`, error);
            return [];
        }
    }
}

export default AdhanPlayer; 
