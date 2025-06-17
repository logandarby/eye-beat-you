/**
 * A class to compute rolling averages over a configurable window size
 */
export class RollingAverage {
  private values: number[] = [];
  private windowSize: number;
  private sum: number = 0;

  constructor(windowSize: number) {
    if (windowSize <= 0) {
      throw new Error("Window size must be positive");
    }
    this.windowSize = windowSize;
  }

  /**
   * Add a new value to the rolling window
   * @param value The value to add
   */
  public addValue(value: number): void {
    this.values.push(value);
    this.sum += value;
    if (this.values.length > this.windowSize) {
      const removedValue = this.values.shift()!;
      this.sum -= removedValue;
    }
  }

  /**
   * Get the current rolling average
   * @returns The average of values in the current window
   */
  public getAverage(): number {
    if (this.values.length === 0) {
      return 0;
    }
    return this.sum / this.values.length;
  }

  /**
   * Get the number of values currently in the window
   * @returns The count of values
   */
  public getCount(): number {
    return this.values.length;
  }

  /**
   * Check if the window is full
   * @returns True if window contains the maximum number of values
   */
  public isFull(): boolean {
    return this.values.length >= this.windowSize;
  }

  /**
   * Reset the rolling average
   */
  public reset(): void {
    this.values = [];
    this.sum = 0;
  }

  /**
   * Get the current window size
   * @returns The maximum number of values in the window
   */
  public getWindowSize(): number {
    return this.windowSize;
  }
}
