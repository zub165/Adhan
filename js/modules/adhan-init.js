export async function loadAdhan() {
    return new Promise((resolve, reject) => {
        if (typeof window.Adhan !== 'undefined') {
            console.log("✅ Adhan.js already loaded");
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/adhan@4.4.3/dist/adhan.min.js';
        script.async = true;

        script.onload = () => {
            if (typeof window.Adhan !== 'undefined') {
                console.log("✅ Adhan.js loaded successfully");
                resolve();
            } else {
                console.error("❌ Adhan.js failed to initialize");
                loadLocalAdhan().then(resolve).catch(reject);
            }
        };

        script.onerror = async () => {
            console.warn("⚠️ Failed to load Adhan.js from CDN. Trying local fallback...");
            try {
                await loadLocalAdhan();
                resolve();
            } catch (error) {
                reject(error);
            }
        };

        document.body.appendChild(script);
    });
}

// ✅ Load Local Adhan.js if CDN Fails
async function loadLocalAdhan() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/js/modules/adhan.js';
        script.type = 'text/javascript';  // Changed from module to regular script
        script.async = true;

        script.onload = () => {
            // Check if Adhan object is available globally
            if (typeof window.Adhan !== 'undefined') {
                console.log("✅ Local Adhan.js loaded successfully");
                resolve();
            } else {
                console.error("❌ Local Adhan.js did not initialize properly");
                reject(new Error("Local Adhan.js did not initialize properly"));
            }
        };

        script.onerror = () => {
            console.error("❌ Failed to load local Adhan.js");
            reject(new Error("Failed to load local Adhan.js"));
        };

        document.body.appendChild(script);
    });
}
