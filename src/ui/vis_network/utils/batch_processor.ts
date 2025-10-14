/**
 * Configuration for batch processing
 */
export interface BatchProcessorConfig {
  batchSize: number;
}

/**
 * Batch processor for handling UI responsiveness during large operations
 */
export class BatchProcessor {
  private batchSize: number;

  constructor(batchSize = 10) {
    this.batchSize = batchSize;
  }

  /**
   * Process items in batches with UI yielding
   * @param items - Items to process
   * @param processor - Function to process each item
   * @param batchProcessor - Optional function to process each batch
   */
  async processBatches<T>(
    items: T[],
    processor: (item: T) => void,
    batchProcessor?: (batch: T[]) => void,
  ): Promise<void> {
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);

      if (batchProcessor) {
        batchProcessor(batch);
      } else {
        batch.forEach(processor);
      }

      // Yield control back to the browser if there are more items
      if (i + this.batchSize < items.length) {
        await this.yieldToUI();
      }
    }
  }

  /**
   * Yield control back to the browser
   * @returns Promise that resolves after yielding
   */
  async yieldToUI(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}
