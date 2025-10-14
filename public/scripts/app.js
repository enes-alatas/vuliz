/**
 * Vuliz - Package Vulnerability Visualization Tool
 * Main application entry point
 */

// Global variables
let vulizApp = null;

/**
 * Initialize application when DOM loads
 */
document.addEventListener('DOMContentLoaded', initializeApp);

/**
 * Initialize the entire application
 */
function initializeApp() {
    vulizApp = new AppBundle.VulizApp();
    vulizApp.initialize();
}
