// DST handling module

// Initialize DST settings
export function initializeDSTSettings() {
    const savedMode = localStorage.getItem('dstMode') || 'automatic';
    console.log('Initializing DST settings with mode:', savedMode);
    
    // Set up event listeners for DST mode changes
    document.addEventListener('DOMContentLoaded', () => {
        const dstInputs = document.querySelectorAll('input[name="dst"]');
        dstInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                localStorage.setItem('dstMode', e.target.value);
                updateDSTStatus();
                // Trigger prayer time recalculation
                window.dispatchEvent(new CustomEvent('dstSettingsChanged'));
            });
        });

        // Set initial radio button state
        const currentMode = localStorage.getItem('dstMode') || 'automatic';
        const radioButton = document.querySelector(`input[name="dst"][value="${currentMode}"]`);
        if (radioButton) {
            radioButton.checked = true;
        }
    });
    
    // Set the initial DST status
    updateDSTStatus();
    return savedMode;
}

// Update DST status display
export function updateDSTStatus() {
    try {
        const dstStatus = document.getElementById('dstStatus');
        if (dstStatus) {
            const adjustment = getDSTAdjustment();
            const isDST = adjustment > 0;
            dstStatus.textContent = isDST ? 'Active (+1 hour)' : 'Inactive';
            dstStatus.style.color = isDST ? 'var(--primary-color)' : 'inherit';
            console.log('DST Status Updated:', isDST ? 'Active' : 'Inactive');
        }
    } catch (error) {
        console.error('Error updating DST status:', error);
    }
}

// Get DST adjustment based on mode
export function getDSTAdjustment() {
    try {
        const mode = localStorage.getItem('dstMode') || 'automatic';
        console.log('Getting DST adjustment for mode:', mode);
        
        switch (mode) {
            case 'always-on':
                return 1;
            case 'always-off':
                return 0;
            case 'automatic':
            default:
                return calculateAutomaticDST();
        }
    } catch (error) {
        console.error('Error getting DST adjustment:', error);
        return 0; // Default to no adjustment on error
    }
}

// Calculate DST status automatically
function calculateAutomaticDST() {
    try {
        const date = new Date();
        
        // Get timezone offsets for January and July
        const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
        const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
        const currentOffset = date.getTimezoneOffset();
        
        // Check if timezone has DST
        const hasDST = jan !== jul;
        
        if (!hasDST) {
            console.log('Timezone does not observe DST');
            return 0;
        }
        
        // DST is active if current offset equals the minimum offset (summer time)
        const isDST = currentOffset === Math.min(jan, jul);
        
        console.log('Automatic DST calculation:', {
            januaryOffset: jan,
            julyOffset: jul,
            currentOffset: currentOffset,
            hasDST: hasDST,
            isDST: isDST
        });
        
        return isDST ? 1 : 0;
    } catch (error) {
        console.error('Error calculating automatic DST:', error);
        return 0; // Default to no adjustment on error
    }
}

// Get timezone with DST adjustment
export function getTimezoneWithDST() {
    try {
        const date = new Date();
        const offset = -date.getTimezoneOffset() / 60;
        const dstAdjustment = getDSTAdjustment();
        const totalOffset = offset;  // Don't add DST adjustment here as it's already included in the timezone offset
        
        console.log('Timezone calculation:', {
            baseOffset: offset,
            dstAdjustment: dstAdjustment,
            totalOffset: totalOffset
        });
        
        return totalOffset;
    } catch (error) {
        console.error('Error getting timezone with DST:', error);
        return 0; // Default to UTC on error
    }
} 