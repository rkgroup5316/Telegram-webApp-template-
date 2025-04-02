document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // --- Configuration ---
    // *** REPLACE with your actual channel data ***
    const channels = [
        { name: "RKGROUP Channel 1", username: "YOUR_CHANNEL_USERNAME_1" },
        { name: "RKGROUP News", username: "YOUR_CHANNEL_USERNAME_2" },
        // Add more channels here
    ];

    // *** REPLACE with your actual bot data AND VALID PING URLS ***
    const bots = [
        { name: "My Awesome Bot", username: "YOUR_BOT_USERNAME_1", pingUrl: "https://your_bot_1_server.com/health", id: "bot1" },
        { name: "Another Cool Bot", username: "YOUR_BOT_USERNAME_2", pingUrl: "https://your_bot_2_server.com/ping", id: "bot2" },
        // Add more bots here - pingUrl MUST be HTTPS and have CORS enabled!
        // If a bot doesn't have a web server/ping endpoint, you can omit pingUrl or set it to null.
        { name: "Simple Bot (No Ping)", username: "YOUR_BOT_USERNAME_3", pingUrl: null, id: "bot3" },
    ];

    const PING_TIMEOUT = 5000; // Timeout for ping requests in milliseconds (e.g., 5 seconds)

    // --- Telegram WebApp Initialization ---
    try {
        tg.ready();
        tg.expand();
        // Optional: Adjust header color based on theme
        tg.setHeaderColor(tg.themeParams.secondary_bg_color || '#f5f5f5');
        // Optional: Enable closing confirmation
        tg.enableClosingConfirmation();
    } catch (error) {
        console.error("Telegram WebApp initialization failed:", error);
        // Optionally display an error message to the user in the HTML
    }

    // --- Element References ---
    const channelListElement = document.getElementById('channel-list');
    const botListElement = document.getElementById('bot-list');
    const refreshButton = document.getElementById('refresh-button');

    // --- Populate Lists ---
    function populateChannels() {
        if (!channels.length) {
             channelListElement.innerHTML = '<li>No channels specified.</li>';
             return;
        }
        channelListElement.innerHTML = channels.map(channel => `
            <li><a href="https://t.me/${channel.username}" target="_blank">${channel.name}</a></li>
        `).join('');
    }

    function populateBots() {
         if (!bots.length) {
             botListElement.innerHTML = '<li>No bots specified.</li>';
             return;
        }
        botListElement.innerHTML = bots.map(bot => `
            <li id="li-${bot.id}">
                <a href="https://t.me/${bot.username}" target="_blank">${bot.name}</a>
                ${bot.pingUrl ? `<span class="status-indicator status-pending" id="status-${bot.id}" title="Checking..."></span>` : '<span title="Status check N/A">-</span>'}
            </li>
        `).join('');
    }

    // --- Bot Status Pinging ---
    async function pingBot(bot) {
        const statusElement = document.getElementById(`status-${bot.id}`);
        if (!statusElement) return; // Skip if bot has no pingUrl or element not found

        statusElement.className = 'status-indicator status-pending';
        statusElement.title = 'Checking...';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.warn(`Ping timeout for ${bot.name}`);
        }, PING_TIMEOUT);

        try {
            const response = await fetch(bot.pingUrl, {
                method: 'HEAD', // Use HEAD for efficiency
                mode: 'cors',    // CRITICAL: Server must allow this origin
                signal: controller.signal,
                cache: 'no-store' // Try to prevent caching of the status check
            });

            clearTimeout(timeoutId);

            if (response.ok) { // Status 200-299 indicates online
                statusElement.className = 'status-indicator status-online';
                statusElement.title = `Online (Status: ${response.status}, ${new Date().toLocaleTimeString()})`;
            } else {
                statusElement.className = 'status-indicator status-offline';
                statusElement.title = `Offline or Error (Status: ${response.status}, ${new Date().toLocaleTimeString()})`;
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`Error pinging ${bot.name} at ${bot.pingUrl}:`, error);
            statusElement.className = 'status-indicator status-error'; // Use distinct error state maybe
             if (error.name === 'AbortError') {
                statusElement.title = `Error: Request Timed Out (${new Date().toLocaleTimeString()})`;
             } else if (error instanceof TypeError) {
                 // Likely a CORS issue or network problem
                 statusElement.title = `Error: Network or CORS issue. Check console. (${new Date().toLocaleTimeString()})`;
             }
             else {
                 statusElement.title = `Error: Ping failed. Check console. (${new Date().toLocaleTimeString()})`;
             }
        }
    }

    // --- Check All Bot Statuses ---
    async function checkAllBots() {
        refreshButton.disabled = true;
        refreshButton.textContent = 'Checking...';
        tg.MainButton.showProgress(); // Show progress on Telegram's main button

        const pingPromises = bots.filter(bot => bot.pingUrl).map(bot => pingBot(bot));

        try {
            await Promise.all(pingPromises);
            console.log("Finished checking all bots.");
        } catch (error) {
            console.error("Error during batch bot check:", error);
        } finally {
            refreshButton.disabled = false;
            refreshButton.textContent = 'Refresh Status';
            tg.MainButton.hideProgress(); // Hide progress
        }
    }

    // --- Event Listeners ---
    refreshButton.addEventListener('click', checkAllBots);

    // Optional: Handle Telegram's Main Button
    tg.MainButton.setText('Refresh Status');
    tg.MainButton.onClick(checkAllBots);
    tg.MainButton.show();

    // Optional: Handle Back Button
    tg.BackButton.onClick(() => tg.close());
    tg.BackButton.show();


    // --- Initial Load ---
    populateChannels();
    populateBots();
    checkAllBots(); // Initial check when the app loads

    console.log("Rkgroup Mini App Initialized");
    // Log theme params for debugging if needed
    // console.log("Theme Params:", tg.themeParams);

}); // End DOMContentLoaded