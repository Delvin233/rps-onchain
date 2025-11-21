// Frame budget enforcer - ensure 60fps by deferring heavy operations
// Like how games split work across multiple frames

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS; // ~16.67ms

interface Task {
  fn: () => void;
  priority: number;
  deadline?: number;
}

class FrameBudgetScheduler {
  private tasks: Task[] = [];
  private isRunning = false;
  private frameStartTime = 0;

  // Schedule a task with priority
  schedule(fn: () => void, priority = 0, deadline?: number): void {
    this.tasks.push({ fn, priority, deadline });
    this.tasks.sort((a, b) => b.priority - a.priority);

    if (!this.isRunning) {
      this.start();
    }
  }

  // Start processing tasks
  private start(): void {
    this.isRunning = true;
    requestAnimationFrame(this.processFrame.bind(this));
  }

  // Process tasks within frame budget
  private processFrame(timestamp: number): void {
    this.frameStartTime = timestamp;
    const frameDeadline = timestamp + FRAME_TIME;

    // Process tasks until frame budget exhausted
    while (this.tasks.length > 0 && performance.now() < frameDeadline) {
      const task = this.tasks.shift()!;

      // Check if task is past deadline
      if (task.deadline && performance.now() > task.deadline) {
        console.warn("Task missed deadline, skipping");
        continue;
      }

      try {
        task.fn();
      } catch (error) {
        console.error("Task error:", error);
      }
    }

    // Continue if more tasks
    if (this.tasks.length > 0) {
      requestAnimationFrame(this.processFrame.bind(this));
    } else {
      this.isRunning = false;
    }
  }

  // Clear all pending tasks
  clear(): void {
    this.tasks = [];
    this.isRunning = false;
  }

  // Get remaining frame time
  getRemainingFrameTime(): number {
    return FRAME_TIME - (performance.now() - this.frameStartTime);
  }
}

// Global scheduler instance
export const frameScheduler = new FrameBudgetScheduler();

// Helper: Defer heavy operation to next frame
export function deferToNextFrame<T>(fn: () => T): Promise<T> {
  return new Promise(resolve => {
    frameScheduler.schedule(() => resolve(fn()), 0);
  });
}

// Helper: Split array processing across frames
export async function processInChunks<T>(items: T[], processor: (item: T) => void, chunkSize = 10): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await deferToNextFrame(() => chunk.forEach(processor));
  }
}

// Helper: Measure function execution time
export function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (duration > FRAME_TIME) {
    console.warn(`⚠️ ${name} took ${duration.toFixed(2)}ms (exceeds frame budget)`);
  }

  return result;
}
