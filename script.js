// Make sure the Telegram Web App script is loaded and ready
document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;

    // Check if the WebApp object is available
    if (!tg) {
        console.error("Telegram WebApp script not loaded or failed to initialize.");
        document.body.innerHTML = "Error: Could not initialize Telegram WebApp.";
        return;
    }

    // --- Initialization ---
    // Call ready() to inform Telegram the app is ready to be displayed.
    tg.ready();

    // Expand the Mini App to full height
    tg.expand();

    // --- Basic Info ---
    const userDataElement = document.getElementById('userData');
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        userDataElement.textContent = `
            ID: ${user.id}
            Name: ${user.first_name} ${user.last_name || ''}
            Username: @${user.username || 'N/A'}
            Language: ${user.language_code}
            Premium: ${user.is_premium ? 'Yes' : 'No'}
        `;
    } else {
        userDataElement.textContent = 'User data not available.';
        console.warn("initDataUnsafe.user is not available.");
    }

    // --- Theme Parameters ---
    const themeButton = document.getElementById('themeButton');
    const themeInfoDiv = document.getElementById('themeInfo');
    const themeParamsElement = document.getElementById('themeParams');

    function displayThemeParams() {
        // Display current theme parameters
        themeParamsElement.textContent = JSON.stringify(tg.themeParams, null, 2);
        // Also apply theme variables immediately (although CSS does this, it ensures consistency)
        document.body.style.backgroundColor = tg.themeParams.bg_color || '#ffffff';
        document.body.style.color = tg.themeParams.text_color || '#000000';
    }

    // Initial display
    displayThemeParams();

    // Toggle display on button click
    themeButton.addEventListener('click', () => {
        const isVisible = themeInfoDiv.style.display === 'block';
        themeInfoDiv.style.display = isVisible ? 'none' : 'block';
        themeButton.textContent = isVisible ? 'Show Theme Info' : 'Hide Theme Info';
    });

    // Listen for theme changes
    tg.onEvent('themeChanged', displayThemeParams);


    // --- Main Button ---
    // Configure the main button
    tg.MainButton.setText('Send Data & Close');
    tg.MainButton.setTextColor(tg.themeParams.button_text_color || '#ffffff');
    tg.MainButton.color = tg.themeParams.button_color || '#2481cc';
    tg.MainButton.show(); // Make the button visible

    // Handle Main Button clicks
    tg.MainButton.onClick(() => {
        // Data to send back to the bot
        const dataToSend = {
            message: 'Hello from Mini App!',
            userId: tg.initDataUnsafe?.user?.id || 'unknown',
            timestamp: new Date().toISOString()
        };

        // Send data to the bot. The bot needs to be set up to receive this.
        // IMPORTANT: For production, you MUST validate tg.initData on your backend.
        // The initData string itself should be sent for validation.
        // Here, we just send a simple JSON payload for demonstration.
        tg.sendData(JSON.stringify(dataToSend));

        // Optionally, provide feedback to the user
        tg.showAlert('Data sent! Closing Mini App.');

        // Close the Mini App
        // tg.close(); // Uncomment this line if you want the app to close after sending data
    });

    // --- Back Button ---
    // Enable the back button in the header
    tg.BackButton.show();

    // Handle Back Button clicks
    tg.BackButton.onClick(() => {
        // You can add custom logic here, like navigating back within your app
        // For this basic template, we'll just close the Mini App
        tg.showAlert('Back button clicked! Closing.');
        tg.close();
    });

    // --- Other Events (Example) ---
    tg.onEvent('viewportChanged', (event) => {
        console.log('Viewport changed:', event);
        // You could adjust layout based on event.isStateStable
        if (!event.isStateStable) {
             console.log('Viewport is potentially changing size.');
        } else {
             console.log('Viewport size is stable.');
        }
    });

    // --- Closing Behavior ---
    // Optional: Ask for confirmation before closing
    tg.enableClosingConfirmation();

    console.log('Telegram Mini App script initialized.');
    console.log('WebApp Info:', tg); // Log the WebApp object for debugging
    console.log('InitData (Unsafe):', tg.initDataUnsafe);
    console.log('Theme Params:', tg.themeParams);

}); // End DOMContentLoaded