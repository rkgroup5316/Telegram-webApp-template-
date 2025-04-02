document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram WebApp with error handling
    const tg = initializeTelegramWebApp();
    if (!tg) return; // Exit if initialization failed

    // Configuration - load from external config if possible in production
    const CONFIG = {
        channels: [
            { name: "RKGROUP Main Channel", username: "YOUR_CHANNEL_USERNAME_1" },
            { name: "RKGROUP Updates", username: "YOUR_CHANNEL_USERNAME_2" },
        ],
        bots: [
            { name: "Awesome Bot One", username: "Test", pingUrl: "https://animeosint-telgram.onrender.com", id: "bot1" },
            { name: "Cool Bot Two", username: "YOUR_BOT_USERNAME_2", pingUrl: "https://your_bot_2_server.com/ping", id: "bot2" },
            { name: "Utility Bot (No Ping)", username: "YOUR_BOT_USERNAME_3", pingUrl: null, id: "bot3" },
        ],
        settings: {
            pingTimeout: 5000,
            pingInterval: 60000 * 5, // Check every 5 minutes
            debugMode: false
        }
    };

    // State management
    const state = {
        activePage: 'page-about',
        isChecking: false,
        lastCheckTime: null,
        botStatuses: {}
    };

    // DOM element references
    const elements = {
        pageTitleElement: document.getElementById('page-title'),
        channelListElement: document.getElementById('channel-list'),
        botListElement: document.getElementById('bot-list'),
        refreshButton: document.getElementById('refresh-button'),
        navItems: document.querySelectorAll('.nav-item'),
        pageContents: document.querySelectorAll('.page-content')
    };

    // Initialize app components
    setupNavigation();
    setupEventListeners();
    populateChannels();
    populateBots();
    setupTheme();
    showPage('page-about');
    checkAllBots();

    // Setup periodic bot status checks
    if (CONFIG.settings.pingInterval > 0) {
        setInterval(() => {
            // Only auto-refresh if we're on the bots page or it's been a long time
            const timeSinceLastCheck = Date.now() - (state.lastCheckTime || 0);
            if (state.activePage === 'page-bots' || timeSinceLastCheck > CONFIG.settings.pingInterval * 2) {
                checkAllBots(true); // true = silent refresh
            }
        }, CONFIG.settings.pingInterval);
    }

    // --- Core Functions ---

    function initializeTelegramWebApp() {
        try {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            tg.MainButton.hide();
            tg.BackButton.show();
            tg.BackButton.onClick(handleBackNavigation);
            tg.enableClosingConfirmation();

            // Log WebApp info in debug mode
            if (CONFIG.settings.debugMode) {
                console.log("Telegram WebApp initialized:", {
                    version: tg.version,
                    platform: tg.platform,
                    colorScheme: tg.colorScheme,
                    themeParams: tg.themeParams
                });
            }
            return tg;
        } catch (error) {
            handleFatalError("Telegram WebApp initialization failed", error);
            return null;
        }
    }

    function setupTheme() {
        try {
            // Set body background to match Telegram theme
            document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
            
            // Apply theme colors to various elements
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2678b6');
            document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#50a8eb');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
        } catch (error) {
            console.error("Error applying theme:", error);
            // Non-fatal, continue with default styling
        }
    }

    function setupNavigation() {
        // Add event listeners to nav items
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => showPage(item.dataset.page));
        });
    }

    function setupEventListeners() {
        // Set up refresh button
        elements.refreshButton.addEventListener('click', () => checkAllBots());
        
        // Optional: Add analytics events
        document.addEventListener('click', (e) => {
            // Check if clicked element is a channel or bot link
            const linkParent = e.target.closest('a');
            if (linkParent) {
                const href = linkParent.getAttribute('href');
                if (href && href.includes('t.me/')) {
                    logAnalyticsEvent('link_click', {
                        url: href,
                        type: href.includes('/bot') ? 'bot' : 'channel'
                    });
                }
            }
        });
    }

    function showPage(pageId) {
        // Update state
        state.activePage = pageId;
        
        // Hide all pages
        elements.pageContents.forEach(page => page.classList.remove('active-page'));
        
        // Show target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active-page');
            
            // Page-specific actions
            if (pageId === 'page-bots' && shouldRefreshBots()) {
                checkAllBots(true); // Silently refresh if needed
            }
        }

        // Update active state in nav
        elements.navItems.forEach(item => {
            if (item.dataset.page === pageId) {
                item.classList.add('active');
                if (elements.pageTitleElement) {
                    elements.pageTitleElement.textContent = item.querySelector('span').textContent;
                }
            } else {
                item.classList.remove('active');
            }
        });
        
        // Log page view for analytics
        logAnalyticsEvent('page_view', { page: pageId });
    }

    function handleBackNavigation() {
        if (state.activePage !== 'page-about') {
            showPage('page-about');
        } else {
            tg.close();
        }
    }

    function populateChannels() {
        if (!CONFIG.channels || !CONFIG.channels.length) {
            renderEmptyState(elements.channelListElement, 'No channels available');
            return;
        }
        
        elements.channelListElement.innerHTML = CONFIG.channels.map(channel => `
            <li>
                <a href="https://t.me/${escapeHtml(channel.username)}" target="_blank" class="channel-link" data-id="${escapeHtml(channel.username)}">
                    <i class="fas fa-satellite-dish icon"></i> ${escapeHtml(channel.name)}
                </a>
                <i class="fas fa-external-link-alt external-icon"></i>
            </li>
        `).join('');
    }

    function populateBots() {
        if (!CONFIG.bots || !CONFIG.bots.length) {
            renderEmptyState(elements.botListElement, 'No bots available');
            return;
        }
        
        elements.botListElement.innerHTML = CONFIG.bots.map(bot => `
            <li id="li-${escapeHtml(bot.id)}">
                <a href="https://t.me/${escapeHtml(bot.username)}" target="_blank" class="bot-link" data-id="${escapeHtml(bot.id)}">
                    <i class="fas fa-robot icon"></i> ${escapeHtml(bot.name)}
                </a>
                <span class="status-container">
                    ${bot.pingUrl ? `<span class="status-indicator ${getBotStatusClass(bot.id)}" id="status-${escapeHtml(bot.id)}" title="${getBotStatusTitle(bot.id)}"></span>` : '<span class="status-na" title="Status check N/A">-</span>'}
                </span>
            </li>
        `).join('');
    }

    async function checkAllBots(silent = false) {
        if (state.isChecking) return;
        state.isChecking = true;

        // Update UI for loading state
        if (!silent) {
            elements.refreshButton.disabled = true;
            elements.refreshButton.classList.add('loading');
            elements.refreshButton.querySelector('span').textContent = ' Checking...';
        }

        // Set pending states
        CONFIG.bots.forEach(bot => {
            if (bot.pingUrl) {
                updateBotStatus(bot.id, 'pending', 'Checking...');
            }
        });

        try {
            // Group ping operations by batch to avoid overwhelming the network
            const pingableBots = CONFIG.bots.filter(bot => bot.pingUrl);
            const results = await pingBotsInBatches(pingableBots, 3); // Check 3 at a time
            
            // Process results if needed
            if (CONFIG.settings.debugMode) {
                console.log("Bot check results:", results);
            }
        } catch (error) {
            console.error("Error during bot status check:", error);
        } finally {
            // Update UI after checking
            if (!silent) {
                elements.refreshButton.disabled = false;
                elements.refreshButton.classList.remove('loading');
                elements.refreshButton.querySelector('span').textContent = ' Refresh Status';
            }
            
            state.isChecking = false;
            state.lastCheckTime = Date.now();
        }
    }

    async function pingBotsInBatches(bots, batchSize) {
        const results = [];
        
        // Process bots in batches
        for (let i = 0; i < bots.length; i += batchSize) {
            const batch = bots.slice(i, i + batchSize);
            const batchPromises = batch.map(bot => pingBot(bot));
            
            // Wait for current batch to finish before starting next batch
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults);
        }
        
        return results;
    }

    async function pingBot(bot) {
        if (!bot.pingUrl) return null;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.settings.pingTimeout);

        try {
            const fetchOptions = {
                method: 'HEAD',  // More efficient than GET
                mode: 'cors',    // Preferred if CORS is properly configured
                signal: controller.signal,
                cache: 'no-store'
            };

            const startTime = performance.now();
            const response = await fetch(bot.pingUrl, fetchOptions);
            const responseTime = Math.round(performance.now() - startTime);
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                updateBotStatus(bot.id, 'online', `Online (${responseTime}ms, ${formatTime(new Date())})`);
                return { bot, status: 'online', responseTime, httpStatus: response.status };
            } else {
                updateBotStatus(bot.id, 'offline', `Error: HTTP ${response.status} (${formatTime(new Date())})`);
                return { bot, status: 'offline', responseTime, httpStatus: response.status };
            }
        } catch (error) {
            clearTimeout(timeoutId);
            
            let errorMessage;
            let errorType;
            
            if (error.name === 'AbortError') {
                errorType = 'timeout';
                errorMessage = `Timeout after ${CONFIG.settings.pingTimeout}ms (${formatTime(new Date())})`;
            } else if (error instanceof TypeError) {
                errorType = 'network';
                errorMessage = `Network error (${formatTime(new Date())})`;
            } else {
                errorType = 'unknown';
                errorMessage = `Error: ${error.message} (${formatTime(new Date())})`;
            }
            
            updateBotStatus(bot.id, 'offline', errorMessage);
            return { bot, status: 'offline', error: errorType, message: errorMessage };
        }
    }

    // --- Helper Functions ---

    function updateBotStatus(botId, status, message) {
        const statusElement = document.getElementById(`status-${botId}`);
        if (!statusElement) return;
        
        // Update element
        statusElement.className = `status-indicator status-${status}`;
        statusElement.title = message;
        
        // Store in state
        state.botStatuses[botId] = { status, message, timestamp: Date.now() };
    }

    function getBotStatusClass(botId) {
        return state.botStatuses[botId]?.status ? `status-${state.botStatuses[botId].status}` : 'status-unknown';
    }
    
    function getBotStatusTitle(botId) {
        return state.botStatuses[botId]?.message || 'Status unknown';
    }

    function shouldRefreshBots() {
        if (!state.lastCheckTime) return true;
        return Date.now() - state.lastCheckTime > 60000; // Refresh if older than 1 minute
    }

    function renderEmptyState(element, message) {
        if (element) {
            element.innerHTML = `<li class="empty-state">${escapeHtml(message)}</li>`;
        }
    }

    function handleFatalError(message, error) {
        console.error(message, error);
        
        // Display user-friendly error in UI
        const container = document.querySelector('.app-container') || document.body;
        const errorElement = document.createElement('div');
        errorElement.className = 'fatal-error';
        errorElement.innerHTML = `
            <h3>Something went wrong</h3>
            <p>${escapeHtml(message)}</p>
            <button onclick="window.location.reload()">Reload App</button>
        `;
        
        container.innerHTML = '';
        container.appendChild(errorElement);
        
        // Optionally report to error tracking service
        logAnalyticsEvent('error', { type: 'fatal', message, details: error?.toString() });
    }

    function logAnalyticsEvent(eventName, data = {}) {
        if (!CONFIG.settings.debugMode) return;
        
        // In production, replace with actual analytics
        console.log(`[Analytics] ${eventName}:`, data);
        
        // Example implementation for real analytics:
        // if (window.tg?.initDataUnsafe?.user) {
        //     data.userId = window.tg.initDataUnsafe.user.id;
        // }
        // fetch('https://your-analytics-endpoint.com/event', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ event: eventName, ...data, timestamp: Date.now() })
        // }).catch(err => console.error('Analytics error:', err));
    }

    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Log initialization complete
    console.log(`RKGroup Mini App initialized (${CONFIG.channels.length} channels, ${CONFIG.bots.length} bots)`);
});