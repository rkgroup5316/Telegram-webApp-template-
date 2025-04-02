document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // --- Configuration ---
    // *** REPLACE with your actual channel data ***
    const channels = [
        { name: "RKGROUP Main Channel", username: "YOUR_CHANNEL_USERNAME_1" },
        { name: "RKGROUP Updates", username: "YOUR_CHANNEL_USERNAME_2" },
        // Add more channels here
    ];

    // *** REPLACE with your actual bot data AND VALID PING URLS ***
    const bots = [
        { name: "Awesome Bot One", username: "YOUR_BOT_USERNAME_1", pingUrl: "https://your_bot_1_server.com/health", id: "bot1" },
        { name: "Cool Bot Two", username: "YOUR_BOT_USERNAME_2", pingUrl: "https://your_bot_2_server.com/ping", id: "bot2" },
        { name: "Utility Bot (No Ping)", username: "YOUR_BOT_USERNAME_3", pingUrl: null, id: "bot3" },
         // Add more bots here - pingUrl MUST be HTTPS and have CORS enabled!
    ];

    const PING_TIMEOUT = 5000; // 5 seconds

    // --- Element References ---
    const pageTitleElement = document.getElementById('page-title'); // Optional: For dynamic titles
    const channelListElement = document.getElementById('channel-list');
    const botListElement = document.getElementById('bot-list');
    const refreshButton = document.getElementById('refresh-button');
    const navItems = document.querySelectorAll('.nav-item');
    const pageContents = document.querySelectorAll('.page-content');

    // --- Telegram WebApp Initialization ---
    try {
        tg.ready();
        tg.expand();
        // Use themeParams for more dynamic colors if needed
        // tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#f5f5f5');
        tg.MainButton.hide(); // Hide main button initially, or repurpose it
        tg.BackButton.show(); // Show back button
        tg.BackButton.onClick(() => handleBackNavigation()); // Handle back nav potentially
        tg.enableClosingConfirmation();

        // Adjust background to match Telegram theme
        document.body.style.backgroundColor = tg.themeParams.bg_color || 'white';

    } catch (error) {
        console.error("Telegram WebApp initialization failed:", error);
        // Display error in the UI?
        const container = document.querySelector('.app-container');
        if (container) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: red;">Error initializing Telegram WebApp features.</p>';
        }
    }

    // --- Navigation / Routing ---
    function showPage(pageId) {
        // Hide all pages
        pageContents.forEach(page => page.classList.remove('active-page'));
        // Show the target page
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active-page');
        }

        // Update active state in nav
        navItems.forEach(item => {
            if (item.dataset.page === pageId) {
                item.classList.add('active');
                // Optional: Update header title
                // pageTitleElement.textContent = item.querySelector('span').textContent;
            } else {
                item.classList.remove('active');
            }
        });

        // Optional: Trigger actions when a page is shown
        if (pageId === 'page-bots') {
            // Maybe refresh bots if they haven't been checked recently
            // checkAllBotsIfNeeded();
        }
    }

    // Add event listeners to nav items
    navItems.forEach(item => {
        item.addEventListener('click', () => showPage(item.dataset.page));
    });

    function handleBackNavigation() {
        // Example: Navigate to 'About' page if not already there, otherwise close.
        const aboutPage = document.getElementById('page-about');
        if (!aboutPage || !aboutPage.classList.contains('active-page')) {
            showPage('page-about'); // Go to the default page
        } else {
            tg.close(); // Close the Mini App
        }
    }

    // --- Populate Lists ---
    function populateChannels() {
        if (!channels.length) {
             channelListElement.innerHTML = '<li>No channels configured.</li>';
             return;
        }
        channelListElement.innerHTML = channels.map(channel => `
            <li>
                <a href="https://t.me/${channel.username}" target="_blank">
                    <i class="fas fa-satellite-dish icon"></i> ${channel.name}
                </a>
                <i class="fas fa-external-link-alt" style="color: var(--tg-theme-hint-color); font-size: 0.8em;"></i>
            </li>
        `).join('');
    }

    function populateBots() {
         if (!bots.length) {
             botListElement.innerHTML = '<li>No bots configured.</li>';
             return;
         }
         botListElement.innerHTML = bots.map(bot => `
             <li id="li-${bot.id}">
                 <a href="https://t.me/${bot.username}" target="_blank">
                    <i class="fas fa-robot icon"></i> ${bot.name}
                 </a>
                 <span class="status-container">
                     ${bot.pingUrl ? `<span class="status-indicator status-pending" id="status-${bot.id}" title="Checking..."></span>` : '<span title="Status check N/A">-</span>'}
                 </span>
             </li>
         `).join('');
     }

    // --- Bot Status Pinging ---
    async function pingBot(bot) {
        const statusElement = document.getElementById(`status-${bot.id}`);
        if (!statusElement) return; // Skip if bot has no pingUrl or element not found

        statusElement.className = 'status-indicator status-pending'; // Sets pulsing animation
        statusElement.title = 'Checking...';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn(`Ping timeout for ${bot.name}`);
        }, PING_TIMEOUT);

        try {
            // Use 'no-cors' mode IF YOU CANNOT CONTROL SERVER-SIDE CORS.
            // This means you WON'T be able to read response status codes (like 404, 500).
            // The request succeeds if it *completes* (network level), regardless of HTTP status.
            // Use 'cors' mode if your server *is* configured correctly with Access-Control-Allow-Origin.
            const fetchOptions = {
                method: 'HEAD',      // HEAD is efficient, GET works too
                // mode: 'no-cors',  // Use if CORS is an issue and you only need basic online/offline
                mode: 'cors',      // Preferred if server allows it
                signal: controller.signal,
                cache: 'no-store'     // Don't cache status checks
            };

            const response = await fetch(bot.pingUrl, fetchOptions);
            clearTimeout(timeoutId);

            // Note: 'no-cors' responses always have status 0 and ok=false client-side.
            // So if using 'no-cors', reaching here means it's likely "online".
            if (fetchOptions.mode === 'no-cors') {
                 statusElement.className = 'status-indicator status-online';
                 statusElement.title = `Online (Network reachable, ${new Date().toLocaleTimeString()})`;
            }
            // For 'cors' mode, check the actual status
            else if (response.ok) { // Status 200-299
                 statusElement.className = 'status-indicator status-online';
                 statusElement.title = `Online (Status: ${response.status}, ${new Date().toLocaleTimeString()})`;
            } else {
                 statusElement.className = 'status-indicator status-offline';
                 statusElement.title = `Offline or Server Error (Status: ${response.status}, ${new Date().toLocaleTimeString()})`;
            }
        } catch (error) {
             clearTimeout(timeoutId);
             console.error(`Error pinging ${bot.name} (${bot.pingUrl}):`, error.name, error.message);
             statusElement.className = 'status-indicator status-offline'; // Treat most errors as offline/error

             if (error.name === 'AbortError') {
                 statusElement.title = `Error: Request Timed Out (${new Date().toLocaleTimeString()})`;
             } else if (error instanceof TypeError) {
                 // Often Network error or CORS preflight failure with 'cors' mode
                 statusElement.title = `Error: Network/CORS issue. Check console & server CORS setup. (${new Date().toLocaleTimeString()})`;
             } else {
                 statusElement.title = `Error: Ping failed. Check console. (${new Date().toLocaleTimeString()})`;
             }
        } finally {
             // Remove pulsing animation class if it was added
             statusElement.classList.remove('status-pending');
        }
    }

    // --- Check All Bot Statuses ---
    let isChecking = false; // Prevent multiple concurrent checks
    async function checkAllBots() {
        if (isChecking) return; // Don't start if already running
        isChecking = true;

        refreshButton.disabled = true;
        refreshButton.classList.add('loading'); // Add loading class for icon spin
        refreshButton.querySelector('span').textContent = ' Checking...'; // Update text
        // tg.MainButton.showProgress(); // Optional: if using MainButton

        // Set all pingable bots to pending state visually
        bots.forEach(bot => {
            if (bot.pingUrl) {
                 const statusElement = document.getElementById(`status-${bot.id}`);
                 if(statusElement) {
                    statusElement.className = 'status-indicator status-pending';
                    statusElement.title = 'Checking...';
                 }
            }
        });


        const pingPromises = bots.filter(bot => bot.pingUrl).map(bot => pingBot(bot));

        try {
            await Promise.allSettled(pingPromises); // Use allSettled to wait for all, even if some fail
            console.log("Finished checking all bots.");
        } catch (error) {
            // This catch is unlikely with Promise.allSettled, but good practice
            console.error("Unexpected error during batch bot check:", error);
        } finally {
            refreshButton.disabled = false;
            refreshButton.classList.remove('loading');
            refreshButton.querySelector('span').textContent = ' Refresh Status';
            // tg.MainButton.hideProgress();
            isChecking = false;
        }
    }

    // --- Event Listeners ---
    refreshButton.addEventListener('click', checkAllBots);

    // --- Initial Load ---
    populateChannels();
    populateBots();
    showPage('page-about'); // Show the default page explicitly
    checkAllBots(); // Initial check when the app loads

    console.log("Rkgroup Mini App Initialized with Multi-Page Navigation");
    // console.log("Theme Params:", tg.themeParams);
}); // End DOMContentLoaded