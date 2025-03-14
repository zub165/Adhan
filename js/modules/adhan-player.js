class AdhanPlayer {
    constructor() {
        this.availableQaris = [
            'Local',
            'abdul-basit',
            'al-hussary',
            'al-minshawi',
            'al-ghamdi',
            'mishary-rashid',
            'madinah',
            'makkah',
            'islamcan'
        ];
        this.currentQari = localStorage.getItem('defaultQari') || 'Local';
        this.audio = null;
        this.isPlaying = false;
        this.isLoading = false;
        
        // Initialize after DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeQariSelectors());
        } else {
            this.initializeQariSelectors();
        }
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
        if (this.isPlaying || this.isLoading) return;
        
        try {
            this.isLoading = true;
            const qari = document.getElementById(`${prayer}QariSelect`).value;
            const savedFile = localStorage.getItem(`${prayer}AudioFile_${qari}`) || 'adhan.mp3';
            
            // Clean up any existing audio
            this.cleanupAudio();
            
            // Create new audio instance
            this.audio = new Audio();
            
            // Set up event listeners
            this.setupAudioEventListeners(prayer);
            
            // Set the source and load the audio
            this.audio.src = `adhans/${qari}/${savedFile}`;
            await this.audio.load();
            
            // Play the audio
            await this.audio.play();
            this.isPlaying = true;
            this.isLoading = false;
            
            console.log('▶️ Playing Adhan:', qari, savedFile);
        } catch (error) {
            console.error('Error playing Adhan:', error);
            this.isPlaying = false;
            this.isLoading = false;
            this.cleanupAudio();
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
}

export default AdhanPlayer; 
