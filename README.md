# Rkgroup Info - Telegram Mini App

A Telegram Mini App designed to display information about Rkgroup, list associated channels and bots, and show the online/offline status of the bots. Built for static hosting (e.g., GitHub Pages) with a minimalistic and professional design.

## Features

* **About Section:** Displays a description of Rkgroup.
* **Channel Listing:** Lists predefined Telegram channels with direct links.
* **Bot Listing:** Lists predefined Telegram bots with direct links.
* **Bot Status Check:**
    * Attempts to ping specified HTTPS URLs for each bot to determine status (Online/Offline/Error).
    * Uses client-side `Workspace` with `HEAD` requests.
    * Displays status visually with colored indicators.
    * Includes a "Refresh Status" button.
* **Minimalist Design:** Clean card-based layout using Telegram theme variables for adaptive appearance.
* **Telegram Integration:** Initializes correctly, expands, uses theme colors, supports Main and Back buttons, enables closing confirmation.

## Files

* `index.html`: The main HTML structure with sections for about, channels, and bots.
* `style.css`: CSS styles defining the layout, cards, status indicators, and using Telegram theme variables.
* `script.js`:
    * Contains configuration for channels and bots (including their ping URLs).
    * Populates the channel and bot lists dynamically.
    * Handles the logic for pinging bot URLs and updating status indicators.
    * Integrates with Telegram Web App features (Main Button, Back Button, etc.).
* `README.md`: This file.

## Setup

1.  **Configure Data:**
    * **Open `script.js`**.
    * Modify the `channels` array: Replace placeholder data with your actual channel names and usernames.
    * Modify the `bots` array:
        * Replace placeholder data with your actual bot names and usernames.
        * **Crucially:** For each bot you want to check status for, provide a valid **HTTPS `pingUrl`**. This URL must point to an endpoint on your bot's server designed for health checks (e.g., `https://your-bot.com/health`).
        * **CORS Requirement:** The server at the `pingUrl` **MUST** respond with appropriate CORS headers (e.g., `Access-Control-Allow-Origin: *` or specifically allowing your Mini App's hosting domain like `https://your-username.github.io`) for the browser `Workspace` request to succeed. If CORS is not configured, the status check will fail.
        * If a bot doesn't have a pingable endpoint, set its `pingUrl` to `null`.
    * Modify the "About Rkgroup" paragraph in `index.html`.
2.  **Host the Files:** Upload `index.html`, `style.css`, and `script.js` to a web server that supports **HTTPS**. GitHub Pages is recommended.
    * Follow the GitHub Pages setup instructions (create repo, push files, enable Pages in settings) to get your `https://<...>.github.io/` URL.
3.  **Configure Your Telegram Bot:**
    * Talk to `@BotFather` on Telegram.
    * Use `/setmenubutton` with BotFather, select your bot, and provide the **HTTPS URL** of your hosted `index.html`. Give the button a name (e.g., "Rkgroup Info").
4.  **Launch:** Open your bot in Telegram and use the menu button.

## Important Notes

* **HTTPS is Required:** Telegram Mini Apps must be served over HTTPS.
* **CORS for Bot Ping:** The most common reason for bot status checks failing will be missing or incorrect CORS headers on the server hosting the `pingUrl`. Ensure your bot's web server framework is configured to send `Access-Control-Allow-Origin` headers for the specified health check endpoint.
* **Ping URL Endpoint:** The `pingUrl` should be a lightweight endpoint. Returning just a `200 OK` status code is sufficient. The `HEAD` method is used to minimize data transfer.
* **Static Nature:** This is a frontend-only application. All status checks happen in the user's browser.

## Further Reading

* [Official Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
* [Cross-Origin Resource Sharing (CORS) - MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)