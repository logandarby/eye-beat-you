/**
 * MedianFilter class for smoothing noisy data by calculating the median
 * of the most recent N values in a sliding window
 */
export class MedianFilter {
  private values: number[] = [];
  private maxSize: number;

  constructor(windowSize: number) {
    if (windowSize <= 0) {
      throw new Error("Window size must be positive");
    }
    this.maxSize = windowSize;
  }

  /**
   * Add a new value to the filter
   * @param value - The new value to add
   */
  addValue(value: number): void {
    this.values.push(value);

    // Keep only the most recent maxSize values
    if (this.values.length > this.maxSize) {
      this.values.shift();
    }
  }

  /**
   * Get the median of the current window
   * @returns The median value, or 0 if no values have been added
   */
  getMedian(): number {
    if (this.values.length === 0) {
      return 0;
    }

    // Create a sorted copy of values
    const sortedValues = [...this.values].sort((a, b) => a - b);
    const length = sortedValues.length;

    if (length % 2 === 0) {
      // Even number of values - return average of middle two
      const midIndex1 = Math.floor(length / 2) - 1;
      const midIndex2 = Math.floor(length / 2);
      return (sortedValues[midIndex1] + sortedValues[midIndex2]) / 2;
    } else {
      // Odd number of values - return middle value
      const midIndex = Math.floor(length / 2);
      return sortedValues[midIndex];
    }
  }

  /**
   * Get the number of values currently in the filter
   * @returns The count of values
   */
  getCount(): number {
    return this.values.length;
  }

  /**
   * Check if the filter has enough values to be considered "warmed up"
   * @returns True if the filter is at capacity
   */
  isFull(): boolean {
    return this.values.length >= this.maxSize;
  }

  /**
   * Reset the filter, clearing all stored values
   */
  reset(): void {
    this.values = [];
  }

  /**
   * Get the current raw values (for debugging)
   * @returns Array of current values
   */
  getValues(): number[] {
    return [...this.values];
  }
}
