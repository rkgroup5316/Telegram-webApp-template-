# Basic Telegram Mini App Template

A simple, minimal template for creating a Telegram Mini App (Web App), suitable for static hosting like GitHub Pages.

## Features

* **HTML Structure:** Basic `index.html`.
* **CSS Styling:** Uses Telegram's theme variables (`--tg-theme-...`) for adaptive styling (`style.css`).
* **JavaScript Integration:**
    * Initializes the Telegram Web App (`script.js`).
    * Displays basic (unsafe) user information.
    * Shows and handles the Main Button (sends data back to the bot).
    * Shows and handles the Back Button (closes the app).
    * Displays and updates based on Telegram theme parameters.
    * Listens for theme and viewport changes.
    * Enables closing confirmation.
* **Static Hosting Ready:** No backend code included in the app itself.

## Files

* `index.html`: The main HTML file.
* `style.css`: CSS styles using Telegram theme variables.
* `script.js`: Core JavaScript logic interacting with `telegram-web-app.js`.
* `README.md`: This file.

## How to Use

1.  **Get the Code:** Clone this repository or download the files.
2.  **Host the Files:** Upload `index.html`, `style.css`, and `script.js` to a web server that supports **HTTPS**. GitHub Pages is a great free option.
    * **GitHub Pages Setup:**
        * Create a new GitHub repository.
        * Push these files to the `main` branch.
        * Go to your repository's `Settings` -> `Pages`.
        * Under `Build and deployment`, select `Deploy from a branch`.
        * Choose the `main` branch and the `/ (root)` folder. Click `Save`.
        * Wait a few minutes. GitHub will provide you with a URL like `https://<your-username>.github.io/<repository-name>/`. **This URL must be HTTPS.**
3.  **Configure Your Telegram Bot:**
    * Talk to `@BotFather` on Telegram.
    * If you don't have a bot, create one using `/newbot`.
    * Use the `/setmenubutton` command with BotFather.
    * Select your bot.
    * Enter the **HTTPS URL** of your hosted `index.html` (from step 2).
    * Give the menu button a name (e.g., "Open App").
    * Alternatively, you can launch the Mini App from an inline keyboard button in your bot's messages.
4.  **Launch the App:** Open a chat with your bot in Telegram and click the menu button you just configured (or the inline button if you set one up).

## Important Notes

* **HTTPS is Required:** Telegram Mini Apps **must** be served over HTTPS. GitHub Pages provides this automatically.
* **`initDataUnsafe` vs `initData`:** This template uses `tg.initDataUnsafe` to easily display user info directly in the Mini App. **This data is not secure**. For any action that requires verification (like purchases, logins, saving user-specific data), you **must** send the `tg.initData` string (not `initDataUnsafe`) to your **backend server**. Your backend must then validate this data using your bot token according to Telegram's documentation to ensure it hasn't been tampered with. This template does **not** include backend validation.
* **`sendData(data)`:** The `tg.sendData()` function sends a string back to your bot as an `Update` containing a `web_app_data` field. Your bot's backend code needs to be listening for these updates to process the data.
* **Bot Backend:** This template is only the *frontend* Mini App. You still need a separate backend service for your Telegram bot (written in Python, Node.js, Go, etc.) to handle commands, receive data from the Mini App via `sendData`, and perform actions.

## Further Reading

* [Official Telegram Mini Apps Documentation](https://core.telegram.org/bots/webapps)
* [Telegram Web App JS Script Reference](https://core.telegram.org/bots/webapps#initializing-mini-apps)