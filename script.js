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
        
        // Start checking bot statuses
        checkAllBotStatuses();
    } catch (error) {
        botList.innerHTML = '<li>Error loading bots</li>';
        console.error('Failed to load bots:', error);
    }
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
 * Check status for all bots
 */
async function checkAllBotStatuses() {
    const statusIndicators = document.querySelectorAll('[data-status-url]');
    
    for (const indicator of statusIndicators) {
        await checkBotStatus(indicator);
    }
}

/**
 * Check status for a single bot
 */
async function checkBotStatus(indicator) {
    const statusUrl = indicator.getAttribute('data-status-url');
    if (!statusUrl) return;
    
    // Reset to pending state
    indicator.className = 'status-indicator status-pending';
    
    try {
        // Add a small delay to make the UI feel more responsive
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch(statusUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Accept': 'application/json'
            },
            timeout: 5000
        });
        
        if (response.ok) {
            indicator.className = 'status-indicator status-online';
        } else {
            indicator.className = 'status-indicator status-offline';
        }
    } catch (error) {
        console.error('Failed to check bot status:', error);
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