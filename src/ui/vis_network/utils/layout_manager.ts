import {BatchProcessor} from './batch_processor';
import {PositionUpdate} from './types';
import {NETWORK_COLORS, NETWORK_CONFIG, NETWORK_LAYOUT} from '../constants';
import {NetworkNode} from '../types';

/**
 * Vuliz - Network Layout
 * Network layout manager for creating radial layouts around the center node
 */
export class LayoutManager {
  private batchProcessor: BatchProcessor;

  constructor() {
    this.batchProcessor = new BatchProcessor(NETWORK_CONFIG.NODE_BATCH_SIZE);
  }

  /**
   * Create radial flower layout for the network around the center node
   * @param nodes - Vis.js nodes dataset
   * @param edges - Vis.js edges dataset
   */
  async createRadialLayout(nodes: any, edges: any): Promise<void> {
    const centerId = NETWORK_LAYOUT.CENTER_NODE_ID;
    const centerNode = nodes.get(centerId);

    if (!centerNode) {
      throw new Error('Center node not found!');
    }

    const nodesByLevel = this.groupNodesByLevel(nodes);
    const positionUpdates = this.calculateNodePositions(nodesByLevel);

    await this.applyNodePositionUpdates(nodes, positionUpdates);
  }

  /**
   * Group nodes by their level (distance from center)
   * @param nodes - Vis.js nodes dataset
   * @returns Object with level as key and array of node IDs as value
   */
  private groupNodesByLevel(nodes: any): Record<number, string[]> {
    const nodesByLevel: Record<number, string[]> = {};
    const allNodes = nodes.get();
    const centerId = NETWORK_LAYOUT.CENTER_NODE_ID;

    // Initialize center node
    nodesByLevel[0] = [centerId];

    // Group other nodes by their level
    allNodes.forEach((node: any) => {
      if (node.id !== centerId) {
        const level = node.level || 1; // Default to level 1 if no level specified
        if (!nodesByLevel[level]) {
          nodesByLevel[level] = [];
        }
        nodesByLevel[level].push(node.id);
      }
    });

    return nodesByLevel;
  }

  /**
   * Calculate positions for all nodes in the radial layout
   * @param nodesByLevel - Nodes grouped by level
   * @returns Array of position update objects
   */
  private calculateNodePositions(
    nodesByLevel: Record<number, string[]>,
  ): PositionUpdate[] {
    const positionUpdates: PositionUpdate[] = [];
    const sortedLevels = Object.keys(nodesByLevel).sort(
      (a, b) => parseInt(a) - parseInt(b),
    );

    sortedLevels.forEach(level => {
      const levelNum = parseInt(level);
      const levelNodes = nodesByLevel[levelNum];

      if (levelNodes.length === 0) return;

      const radius = levelNum === 0 ? 0 : levelNum * NETWORK_CONFIG.BASE_RADIUS;
      const angleStep =
        levelNodes.length > 1 ? (2 * Math.PI) / levelNodes.length : 0;

      levelNodes.forEach((nodeId: string, index: number) => {
        let x: number;
        let y: number;

        if (levelNum === 0) {
          // Center node
          x = 0;
          y = 0;
        } else {
          const angle = index * angleStep;
          x = radius * Math.cos(angle);
          y = radius * Math.sin(angle);
        }

        positionUpdates.push({
          id: nodeId,
          x: x,
          y: y,
          fixed: true,
        });
      });
    });

    return positionUpdates;
  }

  /**
   * Apply node position updates in batches to keep UI responsive
   * @param nodes - Vis.js nodes dataset
   * @param updates - Array of position update objects
   */
  private async applyNodePositionUpdates(
    nodes: any,
    updates: PositionUpdate[],
  ): Promise<void> {
    await this.batchProcessor.processBatches(updates, batch => {
      nodes.update(batch);
    });
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
  locateCenterNode(nodes: any, centerNode: NetworkNode): void {
    nodes.update([
      {
        ...centerNode,
        size: NETWORK_CONFIG.CENTER_NODE_SIZE,
        fixed: true,
        isCenter: true,
        color: NETWORK_COLORS.CENTER,
        x: 0,
        y: 0,
      },
    ]);
  }
}
