/**
 * Parallel execution utilities.
 * Supports concurrency-limited parallel processing.
 */

/** Options for parallel execution. */
export interface ParallelOptions {
  /** Maximum concurrent tasks. Default: 5. */
  concurrency?: number;

  /** Whether to stop on first error. Default: false. */
  failFast?: boolean;
}

/** Result of a parallel task execution. */
export interface ParallelResult<T> {
  /** Index of the task in the original array. */
  index: number;

  /** Result value (if successful). */
  value?: T;

  /** Error (if failed). */
  error?: Error;

  /** Whether the task succeeded. */
  success: boolean;

  /** Duration in milliseconds. */
  durationMs: number;
}

/**
 * Execute an array of async tasks with concurrency control.
 *
 * @param tasks - Array of async functions to execute
 * @param options - Parallel execution options
 * @returns Array of results in the same order as the input tasks
 */
export async function parallel<T>(
  tasks: Array<() => Promise<T>>,
  options: ParallelOptions = {},
): Promise<ParallelResult<T>[]> {
  const { concurrency = 5, failFast = false } = options;
  const results: ParallelResult<T>[] = new Array(tasks.length);
  let nextIndex = 0;
  let aborted = false;

  async function runWorker(): Promise<void> {
    while (nextIndex < tasks.length && !aborted) {
      const index = nextIndex++;
      const task = tasks[index];
      if (!task) continue;

      const start = Date.now();
      try {
        const value = await task();
        results[index] = {
          index,
          value,
          success: true,
          durationMs: Date.now() - start,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        results[index] = {
          index,
          error,
          success: false,
          durationMs: Date.now() - start,
        };

        if (failFast) {
          aborted = true;
          return;
        }
      }
    }
  }

  // Launch workers up to the concurrency limit
  const workerCount = Math.min(concurrency, tasks.length);
  const workers: Promise<void>[] = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(runWorker());
  }

  await Promise.all(workers);
  return results;
}

/**
 * Map over an array with concurrency-limited async operations.
 */
export async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: ParallelOptions = {},
): Promise<ParallelResult<R>[]> {
  const tasks = items.map((item, index) => () => fn(item, index));
  return parallel(tasks, options);
}

/**
 * Execute async tasks sequentially (concurrency = 1).
 */
export async function sequential<T>(
  tasks: Array<() => Promise<T>>,
): Promise<ParallelResult<T>[]> {
  return parallel(tasks, { concurrency: 1 });
}
