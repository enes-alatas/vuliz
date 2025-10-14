import {
  NetworkNode,
  NetworkEdge,
  VisDataSet,
  VisNetwork,
  VisLibrary,
  FocusOptions,
} from './types';
import {NETWORK_IDS, NETWORK_LAYOUT} from './constants';
import {Dependency} from 'src/dependencies/types';
import {Package} from 'src/packages/types';
import {LayoutManager} from './utils/layout_manager';
import {DataTransformer} from './utils/data_transformer';
import {NetworkOptionsBuilder} from './utils/network_options_builder';

/**
 * Vis.js network engine for managing network visualization
 *
 * Handles the creation, management, and rendering of interactive network
 * visualizations using the vis.js library. Applies vulnerability-based
 * coloring, and radial layout positioning.
 */
export class VisNetworkEngine {
  private network: VisNetwork | null = null;
  private networkNodes: VisDataSet<NetworkNode> | null = null;
  private networkEdges: VisDataSet<NetworkEdge> | null = null;
  private readonly layoutManager: LayoutManager;
  private readonly dataTransformer: DataTransformer;
  private pendingNodes: NetworkNode[] = [];
  private pendingEdges: NetworkEdge[] = [];
  private isInitialized = false;

  constructor() {
    this.layoutManager = new LayoutManager();
    this.dataTransformer = new DataTransformer();
  }

  /**
   * Initialize the vis.js network engine
   *
   * Creates the network visualization container and sets up the vis.js
   * network instance with default configuration.
   *
   * @throws {Error} When vis.js library is not loaded or container element is missing
   */
  initialize(): void {
    this.validateVisLibrary();
    this.validateContainer();

    const vis = this.getVisLibrary();
    this.networkNodes = new vis.DataSet<NetworkNode>();
    this.networkEdges = new vis.DataSet<NetworkEdge>();

    const container = document.getElementById(NETWORK_IDS.CONTAINER)!;
    const data = {nodes: this.networkNodes, edges: this.networkEdges};
    const options = NetworkOptionsBuilder.build();

    this.network = new vis.Network(container, data, options);
    this.isInitialized = true;
  }

  /**
   * Validates that the vis.js library is loaded
   * @private
   * @throws {Error} When vis.js library is not available
   */
  private validateVisLibrary(): void {
    if (!(window as any).vis) {
      throw new Error(
        'vis.js library is not loaded. Please ensure vis.js is included before initializing the network engine.',
      );
    }
  }

  /**
   * Gets the vis.js library with proper typing
   * @private
   * @returns The vis.js library instance
   * @throws {Error} When vis.js library is not available
   */
  private getVisLibrary(): VisLibrary {
    const vis = (window as any).vis as VisLibrary;
    if (!vis || !vis.DataSet || !vis.Network) {
      throw new Error(
        'vis.js library is not properly loaded. Required components (DataSet, Network) are missing.',
      );
    }
    return vis;
  }

  /**
   * Validates that the network container element exists
   * @private
   * @throws {Error} When container element is not found
   */
  private validateContainer(): void {
    const container = document.getElementById(NETWORK_IDS.CONTAINER);
    if (!container) {
      throw new Error(
        `Network container element with ID '${NETWORK_IDS.CONTAINER}' not found in DOM.`,
      );
    }
  }

  /**
   * Update network with new data
   *
   * Prepares and queues new nodes and edges
   * Data is collected in pending arrays until loadCollectedData() is called.
   *
   * @param level - Network level (distance from center node)
   * @param packages - Array of package objects to add as nodes
   * @param dependencies - Array of dependency objects to add as edges
   * @throws {Error} When network is not initialized
   */
  updateNetwork(
    level: number,
    packages: Package[],
    dependencies: Dependency[],
  ): void {
    this.ensureInitialized();

    const nodes = this.dataTransformer.transformPackagesToNodes(
      packages,
      level,
    );
    const edges = this.dataTransformer.transformDependenciesToEdges(
      dependencies,
      level,
    );

    this.pendingNodes.push(...nodes);
    this.pendingEdges.push(...edges);
  }

  /**
   * Ensures the network engine is properly initialized
   * @private
   * @throws {Error} When network is not initialized
   */
  private ensureInitialized(): void {
    if (
      !this.isInitialized ||
      !this.network ||
      !this.networkNodes ||
      !this.networkEdges
    ) {
      throw new Error(
        'Network engine must be initialized before updating data. Call initialize() first.',
      );
    }
  }

  /**
   * Load all collected data at once and apply layout
   *
   * Processes all pending nodes and edges, adds them to the network,
   * sets up the center node, and applies the radial layout.
   *
   * @throws {Error} When network is not initialized or data loading fails
   */
  async loadCollectedData(): Promise<void> {
    this.ensureInitialized();

    if (this.pendingNodes.length === 0 && this.pendingEdges.length === 0) {
      return;
    }

    try {
      this.networkNodes!.add(this.pendingNodes);
      this.networkEdges!.add(this.pendingEdges);
      this.clearPendingData();
      await this.setLayout();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load collected data: ${errorMessage}`);
    }
  }

  /**
   * Sets up the network layout by positioning the center node and applying radial layout
   * @private
   */
  private async setLayout(): Promise<void> {
    this.setCenterNode(NETWORK_LAYOUT.CENTER_NODE_ID);
    await this.layoutManager.createRadialLayout(
      this.networkNodes!,
      this.networkEdges!,
    );
  }

  /**
   * Clears pending data arrays to prevent memory leaks
   * @private
   */
  private clearPendingData(): void {
    this.pendingNodes = [];
    this.pendingEdges = [];
  }

  /**
   * Clear all network data and reset to initial state
   *
   * Removes all nodes and edges from the network and resets the view.
   * Also clears any pending data to ensure a clean state.
   */
  clearNetwork(): void {
    if (this.networkNodes) {
      this.networkNodes.clear();
    }
    if (this.networkEdges) {
      this.networkEdges.clear();
    }
    this.clearPendingData();
    if (this.network) {
      this.network.fit();
    }
  }

  /**
   * Set center node with special styling and focus
   *
   * Applies special styling to the center node and focuses the network view on it.
   * The center node is made larger, fixed in position, and colored distinctly.
   *
   * @param nodeId - ID of the node to set as center
   * @throws {Error} When network is not initialized or node is not found
   */
  private setCenterNode(nodeId: string): void {
    this.ensureInitialized();
    try {
      const centerNode = this.getCenterNode(nodeId);
      this.layoutManager.locateCenterNode(this.networkNodes!, centerNode);
      this.focusOnNode(nodeId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to set center node: ${errorMessage}`);
    }
  }

  /**
   * Retrieves the center node from the network by ID
   * @private
   * @param nodeId - ID of the center node to retrieve
   * @returns The center node object
   * @throws {Error} When the center node is not found
   */
  private getCenterNode(nodeId: string): NetworkNode {
    const centerNode = this.networkNodes!.get(nodeId) as NetworkNode;
    if (!centerNode) {
      throw new Error(`Center node with ID '${nodeId}' not found in network`);
    }
    return centerNode;
  }

  /**
   * Focuses the network view on a specific node with animation
   * @private
   * @param nodeId - ID of the node to focus on
   */
  private focusOnNode(nodeId: string): void {
    const focusOptions: FocusOptions = {
      scale: NETWORK_LAYOUT.FOCUS_SCALE,
      animation: {
        duration: NETWORK_LAYOUT.ANIMATION_DURATION,
        easingFunction: NETWORK_LAYOUT.ANIMATION_EASING,
      },
    };
    this.network!.focus(nodeId, focusOptions);
  }
}
