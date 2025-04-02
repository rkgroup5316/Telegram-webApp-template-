
// Define CONFIG first before it's used
const CONFIG = {
    // Your configuration settings
    channels: [
        { name: "Rkgroup News", url: "https://t.me/rkgroupnews", icon: "fas fa-newspaper" },
        { name: "Rkgroup Updates", url: "https://t.me/rkgroupupdates", icon: "fas fa-bell" }
    ],
    bots: [
        { name: "RkgroupBot", url: "https://t.me/RkgroupBot", statusUrl: "https://animeosint-telgram.onrender.com", icon: "fas fa-robot" },
        { name: "RkgroupInfoBot", url: "https://t.me/RkgroupInfoBot", statusUrl: "https://your-bot-status-endpoint.com/rkgroupinfobot", icon: "fas fa-info-circle" }
    ],
    analyticsUrl: "https://your-analytics-endpoint.com/log"
};

// Initialize the app when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeTelegramWebApp();
        setupNavigation();
        loadChannelsList();
        loadBotsList();
        setupRefreshButton();
        
        // Start automatic status checking immediately after initialization
        checkAllBotStatuses();
        // Set up automatic periodic checking
        startPeriodicStatusChecking();
    } catch (error) {
        handleFatalError("Failed to initialize application", error);
    }
});

/**
 * Initialize the Telegram WebApp
 */
function initializeTelegramWebApp() {
    try {
        // Check if running in Telegram WebApp environment
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            
            // Initialize the WebApp
            webApp.ready();
            
            // Set theme variables
            document.documentElement.style.setProperty('--tg-var-bg-color', webApp.backgroundColor);
            document.documentElement.style.setProperty('--tg-var-text-color', webApp.textColor);
            document.documentElement.style.setProperty('--tg-var-hint-color', webApp.backgroundColor);
            document.documentElement.style.setProperty('--tg-var-link-color', webApp.linkColor);
            document.documentElement.style.setProperty('--tg-var-button-color', webApp.buttonColor);
            document.documentElement.style.setProperty('--tg-var-button-text-color', webApp.buttonTextColor);
            document.documentElement.style.setProperty('--tg-var-secondary-bg-color', webApp.secondaryBackgroundColor);
            
            // Adjust header if needed
            const headerTitle = document.getElementById('page-title');
            if (headerTitle) {
                headerTitle.textContent = "Rkgroup Hub";
            }
            
            // Log successful initialization
            logAnalyticsEvent('webapp_initialized', { platform: 'telegram' });
        } else {
            console.log('Not running in Telegram WebApp environment');
            // Continue anyway for testing in browser
        }
    } catch (error) {
        handleFatalError("Telegram WebApp initialization failed", error);
    }
}

/**
 * Setup navigation between pages
 */
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-item');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetPageId = this.getAttribute('data-page');
            switchToPage(targetPageId);
            
            // Update active state on nav buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Log navigation event
            logAnalyticsEvent('page_view', { page: targetPageId });
        });
    });
}

/**
 * Switch to the specified page
 */
function switchToPage(pageId) {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active-page');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active-page');
    }
}

/**
 * Load and display channels list
 */
function loadChannelsList() {
    const channelList = document.getElementById('channel-list');
    if (!channelList) return;
    
    try {
        // Clear loading indicator
        channelList.innerHTML = '';
        
        // Add channels from config
        CONFIG.channels.forEach(channel => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <a href="${channel.url}" target="_blank">
                    <i class="${channel.icon} icon"></i>
                    ${channel.name}
                </a>
                <i class="fas fa-external-link-alt external-icon"></i>
            `;
            channelList.appendChild(listItem);
        });
        
        // If no channels, show message
        if (CONFIG.channels.length === 0) {
            channelList.innerHTML = '<li>No channels available</li>';
        }
    } catch (error) {
        channelList.innerHTML = '<li>Error loading channels</li>';
        console.error('Failed to load channels:', error);
    }
}

/**
 * Load and display bots list
 */
function loadBotsList() {
    const botList = document.getElementById('bot-list');
    if (!botList) return;
    
    try {
        // Clear loading indicator
        botList.innerHTML = '';
        
        // Add bots from config
        CONFIG.bots.forEach(bot => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <a href="${bot.url}" target="_blank">
                    <i class="${bot.icon} icon"></i>
                    ${bot.name}
                </a>
                <span class="status-indicator status-pending" data-status-url="${bot.statusUrl}"></span>
            `;
            botList.appendChild(listItem);
        });
        
        // If no bots, show message
        if (CONFIG.bots.length === 0) {
            botList.innerHTML = '<li>No bots available</li>';
        }
    } catch (error) {
        botList.innerHTML = '<li>Error loading bots</li>';
        console.error('Failed to load bots:', error);
    }
}

/**
 * Set up periodic status checking every minute
 */
function startPeriodicStatusChecking() {
    // Check status every minute (60000 ms)
    const checkInterval = setInterval(checkAllBotStatuses, 60000);
    
    // Store interval ID for potential cleanup
    window.botStatusCheckInterval = checkInterval;
    
    // Log setup of periodic checking
    logAnalyticsEvent('periodic_check_setup', { interval: '60000ms' });
}

/**
 * Setup refresh button for bot statuses
 */
function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-button');
    if (!refreshButton) return;
    
    refreshButton.addEventListener('click', function() {
        this.classList.add('loading');
        checkAllBotStatuses().finally(() => {
            this.classList.remove('loading');
        });
        
        // Log refresh event
        logAnalyticsEvent('refresh_status', { timestamp: new Date().toISOString() });
    });
}

/**
 * Check status for all bots with improved error handling
 */
async function checkAllBotStatuses() {
    const statusIndicators = document.querySelectorAll('[data-status-url]');
    
    // Create an array of promises but don't await them yet
    const statusPromises = Array.from(statusIndicators).map(indicator => {
        return checkBotStatus(indicator).catch(error => {
            console.warn('Status check failed but continuing with others:', error);
            // Ensure we don't break the Promise.all below
            return null;
        });
    });
    
    // Execute all status checks in parallel with a global timeout
    try {
        await Promise.race([
            Promise.all(statusPromises),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Global status check timeout')), 45000)
            )
        ]);
    } catch (error) {
        console.error('Status checking had a global failure:', error);
        logAnalyticsEvent('status_check_global_failure', { error: error.toString() });
    }
}

/**
 * Check status for a single bot with improved reliability
 */
async function checkBotStatus(indicator) {
    const statusUrl = indicator.getAttribute('data-status-url');
    if (!statusUrl) {
        indicator.className = 'status-indicator status-error';
        return;
    }
    
    // Reset to pending state
    indicator.className = 'status-indicator status-pending';
    
    try {
        // First create the controller for the abort signal
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        // Use Ping.js library if available, otherwise fallback to fetch
        let isOnline = false;
        
        if (window.ping) {
            // Using ping.js if available (add this library)
            try {
                const result = await new Promise((resolve, reject) => {
                    ping.ping({
                        url: statusUrl,
                        timeout: 5000,
                        logFailed: false,
                        onSuccess: function() {
                            resolve(true);
                        },
                        onFail: function() {
                            resolve(false);
                        },
                        onError: function(error) {
                            reject(error);
                        }
                    });
                });
                isOnline = result;
            } catch (pingError) {
                console.warn('Ping.js failed, falling back to fetch:', pingError);
                // Fall back to fetch below
            }
        }
        
        // If ping.js wasn't available or failed, use fetch as fallback
        if (!window.ping || isOnline === false) {
            try {
                // Try with no-cors mode first to avoid CORS issues
                const response = await fetch(statusUrl, {
                    method: 'HEAD', // HEAD is lighter than GET
                    mode: 'no-cors', // Try with no-cors to avoid CORS issues
                    cache: 'no-cache',
                    redirect: 'follow',
                    signal: controller.signal
                });
                
                // If we get here with no-cors, the request didn't throw an error,
                // so we consider the endpoint reachable
                isOnline = true;
            } catch (fetchError) {
                // Try one more time with a simple image request as ultimate fallback
                try {
                    const img = document.createElement('img');
                    img.style.display = 'none';
                    document.body.appendChild(img);
                    
                    await new Promise((resolve, reject) => {
                        img.onload = () => {
                            resolve(true);
                            document.body.removeChild(img);
                        };
                        img.onerror = () => {
                            resolve(false);
                            document.body.removeChild(img);
                        };
                        img.src = `${statusUrl}/favicon.ico?t=${Date.now()}`;
                        
                        // Set another timeout for image loading
                        setTimeout(() => {
                            resolve(false);
                            if (document.body.contains(img)) {
                                document.body.removeChild(img);
                            }
                        }, 5000);
                    });
                    
                    isOnline = true;
                } catch (imgError) {
                    console.error('All connectivity checks failed:', imgError);
                    isOnline = false;
                }
            }
        }
        
        // Clear timeout
        clearTimeout(timeoutId);
        
        // Update status indicator based on result
        if (isOnline) {
            indicator.className = 'status-indicator status-online';
            logAnalyticsEvent('bot_status_check', { url: new URL(statusUrl).hostname, status: 'online' });
        } else {
            indicator.className = 'status-indicator status-offline';
            logAnalyticsEvent('bot_status_check', { url: new URL(statusUrl).hostname, status: 'offline' });
        }
    } catch (error) {
        console.error('Failed to check bot status:', error);
        
        // Check if it was a timeout
        if (error.name === 'AbortError') {
            console.log('Status check timed out after 30 seconds');
            logAnalyticsEvent('bot_status_timeout', { url: new URL(statusUrl).hostname });
        } else {
            logAnalyticsEvent('bot_status_error', { 
                url: new URL(statusUrl).hostname,
                error: error.toString() 
            });
        }
        
        indicator.className = 'status-indicator status-error';
    }
}
/**
 * Log analytics events
 */
function logAnalyticsEvent(eventName, eventData = {}) {
    try {
        // Skip if no analytics URL configured
        if (!CONFIG.analyticsUrl) return;
        
        // Get Telegram user data if available
        const userData = {};
        if (window.Telegram && window.Telegram.WebApp) {
            const webApp = window.Telegram.WebApp;
            if (webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
                userData.userId = webApp.initDataUnsafe.user.id;
                userData.username = webApp.initDataUnsafe.user.username;
            }
        }
        
        // Prepare log data
        const logData = {
            event: eventName,
            timestamp: new Date().toISOString(),
            data: eventData,
            user: userData,
            appVersion: '1.0.0'
        };
        
        // Send log data
        fetch(CONFIG.analyticsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        }).catch(error => {
            console.error('Failed to log analytics:', error);
        });
    } catch (error) {
        console.error('Error logging analytics:', error);
    }
}

/**
 * Handle fatal errors
 */
function handleFatalError(message, error) {
    console.error(message, error);
    
    // Log the error
    logAnalyticsEvent('fatal_error', { 
        message: message,
        error: error ? error.toString() : 'Unknown error'
    });
    
    // Show error UI
    const appContent = document.querySelector('.app-content');
    if (appContent) {
        appContent.innerHTML = `
            <div class="fatal-error">
                <h3><i class="fas fa-exclamation-triangle"></i> ${message}</h3>
                <p>Sorry, something went wrong. Please try again later.</p>
                <p class="error-details">${error}</p>
                <button onclick="location.reload()">Reload App</button>
            </div>
        `;
    }
}