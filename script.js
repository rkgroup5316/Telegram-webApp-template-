// --- Configuration ---
const CONFIG = {
    channels: [
        { name: "Rkgroup News", url: "https://t.me/rkgroupnews", icon: "fas fa-newspaper" },
        { name: "Rkgroup Updates", url: "https://t.me/rkgroupupdates", icon: "fas fa-bell" }
        // Add more channels as needed
    ],
    bots: [
        {
            name: "RkgroupBot",
            url: "https://t.me/RkgroupBot",
            // IMPORTANT: Replace with your ACTUAL status check URL for this bot
            statusUrl: "https://animeosint-telgram.onrender.com", // Example: Needs to be a reachable endpoint
            icon: "fas fa-robot"
        },
        {
            name: "RkgroupInfoBot",
            url: "https://t.me/RkgroupInfoBot",
            // IMPORTANT: Replace with your ACTUAL status check URL for this bot
            statusUrl: "https://your-real-bot-status-endpoint.com/rkgroupinfobot", // <<< MUST BE REPLACED
            icon: "fas fa-info-circle"
        }
        // Add more bots as needed
    ],
    // IMPORTANT: Replace with your actual analytics endpoint if you use analytics
    analyticsUrl: null, // Set to null or remove if not using analytics
    statusCheckInterval: 60000, // Check status every 60 seconds
    statusCheckTimeout: 20000, // Max time (ms) for a single bot status check
    globalStatusCheckTimeout: 45000 // Max time (ms) for all bots check cycle
};

// --- Global Variables ---
let botStatusCheckIntervalId = null; // To store the interval timer

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Initializing Rkgroup Hub...");
        initializeTelegramWebApp();
        setupNavigation();
        loadChannelsList();
        loadBotsList(); // Load list structure first
        setupRefreshButton();

        // Perform initial check and start periodic checks
        checkAllBotStatuses();
        startPeriodicStatusChecking();

        console.log("Initialization complete.");
        logAnalyticsEvent('app_initialized');

    } catch (error) {
        handleFatalError("Failed to initialize the application", error);
    }
});

// --- Telegram WebApp Integration ---
function initializeTelegramWebApp() {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            console.log("Telegram WebApp detected. Initializing...");
            webApp.ready(); // Inform Telegram the app is ready

            // Apply theme parameters to CSS variables
            document.documentElement.style.setProperty('--tg-var-bg-color', webApp.backgroundColor);
            document.documentElement.style.setProperty('--tg-var-text-color', webApp.textColor);
            document.documentElement.style.setProperty('--tg-var-hint-color', webApp.hintColor); // Corrected hint color mapping
            document.documentElement.style.setProperty('--tg-var-link-color', webApp.linkColor);
            document.documentElement.style.setProperty('--tg-var-button-color', webApp.buttonColor);
            document.documentElement.style.setProperty('--tg-var-button-text-color', webApp.buttonTextColor);
            document.documentElement.style.setProperty('--tg-var-secondary-bg-color', webApp.secondaryBackgroundColor);

            // Optionally expand the app to fill the viewport height
            webApp.expand();

            console.log("Telegram WebApp theme applied.");
            logAnalyticsEvent('webapp_theme_applied', { platform: 'telegram' });
        } else {
            console.warn('Not running in Telegram WebApp environment. Some features like theme integration might not work.');
        }
    } catch (error) {
        // Don't make this fatal, allow testing in browser
        console.error("Telegram WebApp initialization failed, continuing...", error);
        logAnalyticsEvent('webapp_init_error', { error: error.toString() });
    }
}

// --- Navigation ---
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page-content');
    const pageTitle = document.getElementById('page-title'); // Get title element

    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPageId = this.dataset.page; // Use dataset for cleaner access
            const targetPage = document.getElementById(targetPageId);
            const pageName = this.querySelector('span')?.textContent || 'Hub'; // Get name from button span

            if (targetPage) {
                // Hide all pages
                pages.forEach(page => page.classList.remove('active-page'));
                // Show target page
                targetPage.classList.add('active-page');

                // Update active state on nav buttons
                navButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                 // Update header title
                if (pageTitle) {
                    pageTitle.textContent = `Rkgroup ${pageName}`;
                }

                console.log(`Mapsd to: ${targetPageId}`);
                logAnalyticsEvent('page_view', { page: targetPageId });
            } else {
                console.error(`Navigation error: Page with ID "${targetPageId}" not found.`);
            }
        });
    });
}

// --- Content Loading ---
function loadChannelsList() {
    const channelList = document.getElementById('channel-list');
    if (!channelList) {
        console.error("Element with ID 'channel-list' not found.");
        return;
    }

    try {
        channelList.innerHTML = ''; // Clear loader/previous content

        if (CONFIG.channels.length === 0) {
            channelList.innerHTML = '<li>No channels configured.</li>';
            return;
        }

        CONFIG.channels.forEach(channel => {
            const listItem = document.createElement('li');
            // Using template literals for cleaner HTML generation
            listItem.innerHTML = `
                <a href="${channel.url}" target="_blank" rel="noopener noreferrer">
                    <i class="${channel.icon || 'fas fa-link'} icon"></i>
                    ${channel.name}
                </a>
                <i class="fas fa-external-link-alt external-icon"></i>
            `;
            channelList.appendChild(listItem);
        });
        console.log("Channels list loaded.");
    } catch (error) {
        channelList.innerHTML = '<li>Error loading channels.</li>';
        console.error('Failed to load channels list:', error);
        logAnalyticsEvent('load_channels_error', { error: error.toString() });
    }
}

function loadBotsList() {
    const botList = document.getElementById('bot-list');
    if (!botList) {
        console.error("Element with ID 'bot-list' not found.");
        return;
    }

    try {
        botList.innerHTML = ''; // Clear loader/previous content

        if (CONFIG.bots.length === 0) {
            botList.innerHTML = '<li>No bots configured.</li>';
            return;
        }

        CONFIG.bots.forEach((bot, index) => {
            const listItem = document.createElement('li');
            // Add a unique ID to the status indicator for easier targeting if needed
            const indicatorId = `bot-status-${index}`;
            listItem.innerHTML = `
                <a href="${bot.url}" target="_blank" rel="noopener noreferrer">
                    <i class="${bot.icon || 'fas fa-robot'} icon"></i>
                    ${bot.name}
                </a>
                <span id="${indicatorId}" class="status-indicator status-pending" data-status-url="${bot.statusUrl || ''}"></span>
            `;
            botList.appendChild(listItem);
        });
        console.log("Bots list structure loaded.");
    } catch (error) {
        botList.innerHTML = '<li>Error loading bots list structure.</li>';
        console.error('Failed to load bots list:', error);
        logAnalyticsEvent('load_bots_error', { error: error.toString() });
    }
}

// --- Status Checking ---
function startPeriodicStatusChecking() {
    // Clear any existing interval first
    if (botStatusCheckIntervalId) {
        clearInterval(botStatusCheckIntervalId);
    }

    console.log(`Starting periodic status checks every ${CONFIG.statusCheckInterval / 1000} seconds.`);
    botStatusCheckIntervalId = setInterval(checkAllBotStatuses, CONFIG.statusCheckInterval);

    logAnalyticsEvent('periodic_check_start', { interval: CONFIG.statusCheckInterval });
}

function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-button');
    if (!refreshButton) return;

    refreshButton.addEventListener('click', function() {
        console.log("Manual refresh requested.");
        const icon = this.querySelector('i');
        const span = this.querySelector('span');
        const originalText = span.textContent;

        this.disabled = true; // Disable button during refresh
        this.classList.add('loading');
        if(icon) icon.classList.add('fa-spin'); // Add spin animation
        if(span) span.textContent = 'Refreshing...';


        logAnalyticsEvent('refresh_status_manual_start');

        checkAllBotStatuses().finally(() => {
            this.disabled = false;
            this.classList.remove('loading');
             if(icon) icon.classList.remove('fa-spin');
             if(span) span.textContent = originalText;
            console.log("Manual refresh complete.");
            logAnalyticsEvent('refresh_status_manual_end');
        });
    });
}

async function checkAllBotStatuses() {
    console.log("Starting batch bot status check...");
    const statusIndicators = document.querySelectorAll('.status-indicator[data-status-url]');
    if (statusIndicators.length === 0) {
        console.log("No bot status indicators found to check.");
        return;
    }

    const statusPromises = Array.from(statusIndicators).map(indicator => {
        // Wrap individual check in a promise that resolves even on error,
        // so Promise.all doesn't fail immediately.
        return checkBotStatus(indicator)
            .catch(error => {
                // Log the specific error but allow the batch process to continue
                const url = indicator.getAttribute('data-status-url') || 'unknown';
                console.error(`Error checking status for ${url}:`, error);
                logAnalyticsEvent('bot_status_check_individual_error', { url: getHostname(url), error: error.toString() });
                // Ensure the indicator shows an error state
                 indicator.className = 'status-indicator status-error';
                 indicator.title = `Error: ${error.message}`; // Add tooltip
                return null; // Resolve promise so Promise.all continues
            });
    });

    // Execute all checks concurrently with a global timeout
    try {
        await Promise.race([
            Promise.all(statusPromises),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Global status check timed out')), CONFIG.globalStatusCheckTimeout)
            )
        ]);
        console.log("Batch bot status check finished.");
        logAnalyticsEvent('bot_status_batch_complete');
    } catch (error) {
        console.error('Global status check failure (likely timeout):', error);
        logAnalyticsEvent('bot_status_batch_failure', { error: error.toString(), timeout: CONFIG.globalStatusCheckTimeout });
        // Optionally update all remaining pending indicators to error state
        statusIndicators.forEach(ind => {
            if (ind.classList.contains('status-pending')) {
                 ind.className = 'status-indicator status-error';
                 ind.title = 'Status check timed out';
            }
        });
    }
}

async function checkBotStatus(indicator) {
    const statusUrl = indicator.getAttribute('data-status-url');
    const hostname = getHostname(statusUrl); // Helper to get hostname for logging

    if (!statusUrl) {
        console.warn("Indicator found without a data-status-url attribute.");
        indicator.className = 'status-indicator status-error';
        indicator.title = 'Missing status URL';
        return; // No need to proceed
    }

    // Reset to pending state and clear previous title
    indicator.className = 'status-indicator status-pending';
    indicator.title = `Checking ${hostname}...`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.warn(`Aborting check for ${hostname} due to timeout (${CONFIG.statusCheckTimeout}ms)`);
        controller.abort();
    }, CONFIG.statusCheckTimeout);

    let isOnline = false;
    let checkMethod = 'unknown'; // Track which method succeeded/failed

    try {
        // --- Strategy 1: Use ping.js if available ---
        if (typeof ping !== 'undefined' && ping.ping) {
            checkMethod = 'ping.js';
            console.log(`Checking ${hostname} using ping.js...`);
            try {
                isOnline = await new Promise((resolve, reject) => {
                    // Note: ping.js uses callbacks, we wrap in a promise
                    ping.ping({
                        url: statusUrl,
                        timeout: CONFIG.statusCheckTimeout - 500, // Slightly less than main timeout
                        logFailed: false, // We handle logging
                        onSuccess: () => { console.log(`ping.js success for ${hostname}`); resolve(true); },
                        onFail: () => { console.log(`ping.js fail for ${hostname}`); resolve(false); },
                        onError: (err) => { console.warn(`ping.js error for ${hostname}:`, err); reject(err); } // Reject on actual errors
                    });
                });
            } catch (pingJsError) {
                console.warn(`ping.js threw an error for ${hostname}, will fallback. Error:`, pingJsError);
                isOnline = false; // Ensure it's false if ping.js errored
                checkMethod = 'ping.js (error)';
                 // Fall through to next strategy
            }
        } else {
             console.log("ping.js not found, skipping.");
             checkMethod = 'ping.js (skipped)';
        }


        // --- Strategy 2: Fallback to Fetch HEAD with no-cors (if ping.js failed or skipped) ---
        if (!isOnline && typeof fetch !== 'undefined') {
            checkMethod = 'fetch (no-cors)';
            console.log(`Checking ${hostname} using fetch (HEAD, no-cors)...`);
            try {
                await fetch(statusUrl, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    signal: controller.signal, // Use abort controller
                    redirect: 'follow'
                });
                // If fetch with no-cors doesn't throw a network error, consider it reachable
                console.log(`Workspace (no-cors) request sent without immediate error for ${hostname}. Assuming reachable.`);
                isOnline = true;
            } catch (fetchError) {
                 if (fetchError.name === 'AbortError') {
                    // Already handled by the main timeout logic below
                    throw fetchError; // Re-throw abort error
                }
                console.warn(`Workspace (no-cors) failed for ${hostname}:`, fetchError);
                isOnline = false; // Fetch failed
                 checkMethod = 'fetch (no-cors, failed)';
                // Fall through to next strategy (Image ping) - Currently no explicit image ping fallback here,
                // ping.js already includes it. If you remove ping.js, you might add an Image ping here.
            }
        } else if (isOnline && checkMethod === 'ping.js') {
             console.log(`Status for ${hostname} already determined as ONLINE by ping.js.`);
        } else {
             console.log(`Skipping fetch check for ${hostname} (already online or fetch unavailable).`);
        }

        // --- Final Result ---
        clearTimeout(timeoutId); // Clear the timeout since the check completed or failed naturally

        if (isOnline) {
            indicator.className = 'status-indicator status-online';
            indicator.title = `${hostname} is Online (Checked via ${checkMethod})`;
            console.log(`${hostname} reported as ONLINE.`);
             logAnalyticsEvent('bot_status_check', { url: hostname, status: 'online', method: checkMethod });
        } else {
             indicator.className = 'status-indicator status-offline';
             indicator.title = `${hostname} is Offline or Unreachable (Checked via ${checkMethod})`;
             console.log(`${hostname} reported as OFFLINE.`);
             logAnalyticsEvent('bot_status_check', { url: hostname, status: 'offline', method: checkMethod });
        }

    } catch (error) {
        // Catch errors from await/fetch/ping.js promise rejection
        clearTimeout(timeoutId); // Ensure timeout is cleared on error too

        console.error(`Failed to check status for ${hostname}:`, error);
        indicator.className = 'status-indicator status-error';

        if (error.name === 'AbortError') {
            indicator.title = `${hostname} - Check Timed Out`;
            logAnalyticsEvent('bot_status_timeout', { url: hostname, timeout: CONFIG.statusCheckTimeout });
        } else {
             indicator.title = `${hostname} - Error: ${error.message}`;
             logAnalyticsEvent('bot_status_error', { url: hostname, error: error.toString(), method: checkMethod });
        }
    }
}


// --- Analytics ---
function logAnalyticsEvent(eventName, eventData = {}) {
    if (!CONFIG.analyticsUrl) {
        // console.log(`Analytics disabled. Event: ${eventName}`, eventData); // Optional: log to console if disabled
        return;
    }

    try {
        const payload = {
            event: eventName,
            timestamp: new Date().toISOString(),
            data: eventData,
            appVersion: '1.1.0', // Example version
            url: window.location.href,
            userAgent: navigator.userAgent,
            user: {}
        };

        // Try to get Telegram user data safely
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe) {
             const user = window.Telegram.WebApp.initDataUnsafe.user;
             if (user) {
                payload.user = {
                    id: user.id,
                    is_bot: user.is_bot,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    username: user.username,
                    language_code: user.language_code
                 };
            }
        }

        // Use navigator.sendBeacon if available for more reliable background sending
        if (navigator.sendBeacon) {
             const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
             navigator.sendBeacon(CONFIG.analyticsUrl, blob);
             // console.log('Analytics sent via sendBeacon:', payload);
        } else {
            // Fallback to fetch (might be less reliable on page unload)
            fetch(CONFIG.analyticsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true // Attempt to keep request alive on unload
            }).catch(error => {
                console.warn('Failed to send analytics via fetch:', error);
            });
             // console.log('Analytics sent via fetch:', payload);
        }
    } catch (error) {
        console.error('Error preparing or sending analytics:', error);
    }
}

// --- Error Handling ---
function handleFatalError(message, error) {
    console.error("FATAL ERROR:", message, error);

    logAnalyticsEvent('fatal_error', {
        message: message,
        error: error ? error.toString() : 'Unknown error',
        stack: error?.stack // Include stack trace if available
    });

    const appContent = document.querySelector('.app-content');
    const appNav = document.querySelector('.app-nav');

    // Hide navigation on fatal error
    if (appNav) {
        appNav.style.display = 'none';
    }

    // Display error message
    if (appContent) {
        appContent.innerHTML = `
            <div class="fatal-error-container" style="padding: 20px; text-align: center; color: var(--tg-var-text-color, #dc3545);">
                <i class="fas fa-exclamation-triangle fa-3x" style="margin-bottom: 15px;"></i>
                <h3 style="margin-bottom: 10px; color: var(--tg-var-text-color, inherit);">${message}</h3>
                <p style="margin-bottom: 15px;">An unexpected problem occurred. Please try reloading the app.</p>
                ${error ? `<p class="error-details" style="font-size: 0.8em; color: var(--tg-var-hint-color, #6c757d); word-break: break-all;">Details: ${error}</p>` : ''}
                <button onclick="location.reload()" style="padding: 10px 20px; background-color: var(--tg-var-button-color, #007bff); color: var(--tg-var-button-text-color, white); border: none; border-radius: 5px; cursor: pointer; margin-top: 15px;">
                    <i class="fas fa-redo"></i> Reload App
                </button>
            </div>
        `;
    }
}

// --- Utility Functions ---
function getHostname(url) {
    try {
        if (!url) return 'unknown host';
        return new URL(url).hostname;
    } catch (e) {
        // Handle cases where URL might be invalid or relative
        return url.split('/')[2] || url; // Basic fallback
    }
}