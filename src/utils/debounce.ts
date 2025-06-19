export type DebouncedFunction<
  F extends (...args: unknown[]) => unknown,
> = (...args: Parameters<F>) => void & { cancel: () => void };

/**
 * Creates a debounced version of the provided function that delays its execution
 * until after `wait` milliseconds have elapsed since the last time the debounced
 * function was invoked.
 *
 * If `immediate` is set to `true`, the function will be triggered on the leading
 * edge instead of the trailing edge of the `wait` interval. In this mode, the
 * debounced function will still pause subsequent calls until the interval has
 * passed.
 *
 * Example usage:
 * ```ts
 * const resizeHandler = () => console.log("resize");
 * const debouncedResize = debounce(resizeHandler, 250);
 * window.addEventListener("resize", debouncedResize);
 *
 * // Later, if you need to cancel any pending execution:
 * debouncedResize.cancel();
 * ```
 *
 * @param func - The function to debounce.
 * @param wait - The number of milliseconds to delay.
 * @param immediate - If `true`, trigger the function on the leading edge.
 * @returns A debounced function with a `cancel` method to clear pending timeouts.
 */
export function debounce<F extends (...args: unknown[]) => unknown>(
  func: F,
  wait: number,
  immediate: boolean = false,
): DebouncedFunction<F> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Core debounced function that will be returned.
  const core = (...args: Parameters<F>): void => {
    const callNow = immediate && timeoutId === null;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func(...args);
      }
    }, wait);

    if (callNow) {
      func(...args);
    }
  };

  // Combine the core function with a cancel method.
  const debounced = Object.assign(core, {
    cancel(): void {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
  }) as unknown as DebouncedFunction<F>;

  return debounced;
}
