/**
 * Vuliz - Main Application Controller
 *
 * This class serves as the central coordinator for the Vuliz application,
 * managing the interaction between file upload, network visualization,
 * and user notifications. It provides a clean API for initializing and
 * controlling the application lifecycle.
 *
 * Key responsibilities:
 * - File upload handling and validation
 * - Package network creation and visualization
 * - User notification management
 * - Application state management
 *
 * @example
 * ```typescript
 * const app = new VulizApp();
 * await app.initialize();
 * // Application is now ready to handle file uploads
 * ```
 */
import {APP_CONFIG, APP_IDS, APP_CLASSES} from './constants';
import {VisNetworkEngine} from './vis_network/vis_network_engine';
import {NotificationSystem} from './notifications/notification_system';
import {PackageNetworkCreator} from 'src/package_network/package_network_creator';

/**
 * Main application controller class
 *
 * Provides the primary interface for managing the Vuliz application.
 * Handles file uploads, coordinates network visualization, and manages
 * user feedback through notifications.
 */
export class VulizApp {
  /** Manages user notifications and feedback messages */
  private notificationSystem: NotificationSystem;
  /** Handles network visualization and rendering */
  private networkEngine: VisNetworkEngine;

  /**
   * Creates a new VulizApp instance
   *
   * Initializes the core components required for the application:
   * - Notification system for user feedback
   * - Network engine for visualization
   */
  constructor() {
    this.notificationSystem = new NotificationSystem();
    this.networkEngine = new VisNetworkEngine();
  }

  /**
   * Initialize the application
   *
   * Sets up the application for use by initializing file input handling.
   * This method must be called before the application can process file uploads.
   *
   * @returns Promise that resolves when initialization is complete
   * @throws {Error} If required DOM elements are not found
   */
  async initialize(): Promise<void> {
    await this.initializeFileInput();
  }

  /**
   * Handle file upload and processing
   *
   * Processes an uploaded package file by creating a dependency network
   * visualization. This is the main entry point for file processing.
   *
   * The process includes:
   * 1. Resetting the application state
   * 2. Showing processing notifications
   * 3. Creating the package network
   * 4. Rendering the visualization
   * 5. Providing user feedback
   *
   * @param file - The uploaded package file (package.json, requirements.txt, etc.)
   * @returns Promise that resolves when processing is complete
   * @throws {Error} If file processing fails or network creation encounters errors
   */
  async handleFileUpload(file: File): Promise<void> {
    try {
      this.prepareForFileProcessing();
      await this.processPackageData(file);
      this.showSuccessNotification();
    } catch (error) {
      this.handleFileProcessingError(error);
    } finally {
      this.resetFileInput();
    }
  }

  /**
   * Prepare the application for file processing
   * @private
   */
  private prepareForFileProcessing(): void {
    this.resetApplication();
    this.notificationSystem.info(
      'Processing file...',
      APP_CONFIG.PERMANENT_NOTIFICATION,
    );
    this.moveInputContainerToTop();
  }

  /**
   * Show success notification after file processing
   * @private
   */
  private showSuccessNotification(): void {
    this.notificationSystem.hide();
    setTimeout(() => {
      this.notificationSystem.success('File processed successfully!');
    }, APP_CONFIG.NOTIFICATION_DELAY_MS);
  }

  /**
   * Handle errors that occur during file processing
   * @param error - The error that occurred
   * @private
   */
  private handleFileProcessingError(error: unknown): void {
    console.error('Error processing file:', error);
    this.notificationSystem.hide();
    setTimeout(() => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during file processing';
      this.notificationSystem.error(`Failed to process file: ${errorMessage}`);
    }, APP_CONFIG.NOTIFICATION_DELAY_MS);
  }

  /**
   * Process package data and create visualization
   *
   * Analyzes the uploaded package file and creates a hierarchical network
   * visualization showing dependencies and their relationships. The network
   * is built level by level, with each level representing direct dependencies
   * of packages from the previous level.
   *
   * @param file - The package file to analyze
   * @returns Promise that resolves when the network is created and rendered
   * @throws {Error} If package extraction fails or network creation encounters errors
   */
  async processPackageData(file: File): Promise<void> {
    this.networkEngine.initialize();
    const creator: PackageNetworkCreator = new PackageNetworkCreator(
      file,
      APP_CONFIG.MAX_NETWORK_LEVELS,
    );

    this.notificationSystem.info(
      'Creating network structure...',
      APP_CONFIG.PERMANENT_NOTIFICATION,
    );

    const networkLevels = await creator.create();
    let levelNum = 1;
    const totalLevels = networkLevels.levels.length;

    // Collect all nodes and edges in batch mode (don't show until layout is ready)
    for (const level of networkLevels.levels) {
      this.notificationSystem.info(
        `Processing level ${levelNum} of ${totalLevels}...`,
        APP_CONFIG.PERMANENT_NOTIFICATION,
      );
      this.networkEngine.updateNetwork(
        levelNum,
        level.packages,
        level.dependencies,
      );
      levelNum++;
    }

    this.notificationSystem.info(
      'Creating network layout...',
      APP_CONFIG.PERMANENT_NOTIFICATION,
    );

    // Load all collected data at once and apply layout
    await this.networkEngine.loadCollectedData();
  }

  /**
   * Reset the application to initial state
   *
   * Clears all network data and hides notifications, returning the application
   * to its initial state. This is called before processing a new file to ensure
   * a clean slate.
   */
  resetApplication(): void {
    this.networkEngine.clearNetwork();
    this.notificationSystem.hide();
  }

  /**
   * Move input container to top of the page
   */
  private moveInputContainerToTop(): void {
    const inputContainer = document.getElementById(APP_IDS.INPUT_CONTAINER);
    if (inputContainer) {
      inputContainer.classList.add(APP_CLASSES.TOP);
    }
  }

  /**
   * Reset file input to allow selecting files again
   *
   * Clears the file input value and resets the UI state to allow users
   * to select the same file again or choose a different file. This ensures
   * the file input change event will fire even for the same file.
   */
  resetFileInput(): void {
    const elements = this.getFileInputElements();
    if (!elements) return;

    const {fileInput, fileWrapper, uploadText} = elements;

    // Reset file input value to allow selecting the same file again
    fileInput.value = '';

    // Reset UI state
    fileWrapper.classList.remove(APP_CLASSES.FILE_SELECTED);
    uploadText.textContent = 'Please select your package file';
  }

  /**
   * Get and validate required file input DOM elements
   * @returns Object containing validated elements or null if validation fails
   * @private
   */
  private getFileInputElements(): {
    fileInput: HTMLInputElement;
    fileWrapper: HTMLElement;
    uploadText: HTMLElement;
  } | null {
    const fileInput = document.getElementById(
      APP_IDS.FILE_INPUT,
    ) as HTMLInputElement;
    const fileWrapper = fileInput?.closest(
      '.file-input-wrapper',
    ) as HTMLElement;
    const uploadText = document.getElementById(
      APP_IDS.UPLOAD_TEXT,
    ) as HTMLElement;

    if (!fileInput || !fileWrapper || !uploadText) {
      console.error(
        'Required DOM elements not found for file input operations',
      );
      return null;
    }

    return {fileInput, fileWrapper, uploadText};
  }

  /**
   * Initialize file input handling
   *
   * Sets up event listeners for the file input element to handle file selection
   * and automatic processing. When a file is selected, it automatically triggers
   * the file upload and processing workflow.
   */
  async initializeFileInput(): Promise<void> {
    const fileInput = document.getElementById(
      APP_IDS.FILE_INPUT,
    ) as HTMLInputElement;

    if (!fileInput) {
      console.error('File input element not found');
      return;
    }

    fileInput.addEventListener('change', async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const elements = this.getFileInputElements();

      if (!elements) {
        console.error(
          'Required DOM elements not found for file input handling',
        );
        return;
      }

      const {fileWrapper, uploadText} = elements;

      if (target.files && target.files.length > 0) {
        fileWrapper.classList.add(APP_CLASSES.FILE_SELECTED);
        uploadText.textContent = target.files[0].name;
        // Auto-process the file when selected
        await this.handleFileUpload(target.files[0]);
      } else {
        fileWrapper.classList.remove(APP_CLASSES.FILE_SELECTED);
        uploadText.textContent = 'Please select your package file';
      }
    });
  }
}
