export async function loadAdhan() {
    return new Promise((resolve, reject) => {
        // Check if Adhan is already loaded
        if (typeof window.Adhan !== 'undefined') {
            console.log("✅ Adhan.js already loaded");
            resolve(window.Adhan);
            return;
        }

        // Try to load from CDN first
        console.log("🔄 Loading Adhan.js from CDN...");
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/adhan@4.4.3/dist/adhan.min.js';
        script.async = true;

        script.onload = () => {
            if (typeof window.Adhan !== 'undefined') {
                console.log("✅ Adhan.js loaded successfully from CDN");
                resolve(window.Adhan);
            } else {
                console.error("❌ Adhan.js failed to initialize from CDN");
                loadLocalAdhan().then(resolve).catch(reject);
            }
        };

        script.onerror = async () => {
            console.warn("⚠️ Failed to load Adhan.js from CDN. Trying local fallback...");
            try {
                const adhan = await loadLocalAdhan();
                resolve(adhan);
            } catch (error) {
                console.error("❌ All loading attempts failed:", error);
                reject(error);
            }
        };

        document.body.appendChild(script);
    });
}

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

// Load Local Adhan.js if CDN Fails
async function loadLocalAdhan() {
    return new Promise((resolve, reject) => {
        console.log("🔄 Loading local Adhan.js...");
        
        // Create a new script element
        const script = document.createElement('script');
        const basePath = getBasePath();
        script.src = `${basePath}/js/modules/adhan.js`;
        script.type = 'text/javascript';
        script.async = true;

        // Set up event handlers
        script.onload = () => {
            // Check if Adhan object is available globally
            if (typeof window.Adhan !== 'undefined') {
                console.log("✅ Local Adhan.js loaded successfully");
                resolve(window.Adhan);
            } else {
                console.error("❌ Local Adhan.js did not initialize properly");
                reject(new Error("Local Adhan.js did not initialize properly"));
            }
        };

        script.onerror = () => {
            console.error("❌ Failed to load local Adhan.js");
            reject(new Error("Failed to load local Adhan.js"));
        };

        // Add the script to the document
        document.body.appendChild(script);
    });
}
