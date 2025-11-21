// Memory leak detector - find and fix memory leaks
// Like how game engines track memory allocations

interface MemorySnapshot {
  timestamp: number;
  heapSize: number;
  usedHeap: number;
  heapLimit: number;
}

class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots = 100;
  private warningThreshold = 0.8; // 80% of heap limit

  takeSnapshot(): MemorySnapshot | null {
    if (typeof window === "undefined" || !(performance as any).memory) {
      return null;
    }

    const memory = (performance as any).memory;
    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      heapSize: memory.totalJSHeapSize,
      usedHeap: memory.usedJSHeapSize,
      heapLimit: memory.jsHeapSizeLimit,
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    // Check for memory warning
    const usage = snapshot.usedHeap / snapshot.heapLimit;
    if (usage > this.warningThreshold) {
      console.warn(`⚠️ High memory usage: ${(usage * 100).toFixed(1)}%`);
    }

    return snapshot;
  }

  // Detect memory leak (steadily increasing memory)
  detectLeak(): boolean {
    if (this.snapshots.length < 10) return false;

    const recent = this.snapshots.slice(-10);
    let increasing = 0;

    for (let i = 1; i < recent.length; i++) {
      if (recent[i].usedHeap > recent[i - 1].usedHeap) {
        increasing++;
      }
    }

    // If memory increased in 8+ out of 10 snapshots, likely a leak
    return increasing >= 8;
  }

  getMemoryTrend(): "increasing" | "stable" | "decreasing" {
    if (this.snapshots.length < 5) return "stable";

    const recent = this.snapshots.slice(-5);
    const first = recent[0].usedHeap;
    const last = recent[recent.length - 1].usedHeap;
    const diff = last - first;
    const threshold = first * 0.1; // 10% change

    if (diff > threshold) return "increasing";
    if (diff < -threshold) return "decreasing";
    return "stable";
  }

  getCurrentUsage(): number {
    const latest = this.snapshots[this.snapshots.length - 1];
    if (!latest) return 0;
    return (latest.usedHeap / latest.heapLimit) * 100;
  }

  clear(): void {
    this.snapshots = [];
  }
}

export const memoryProfiler = new MemoryProfiler();

// Auto-profile in development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  setInterval(() => {
    memoryProfiler.takeSnapshot();
    if (memoryProfiler.detectLeak()) {
      console.error("🚨 Memory leak detected!");
    }
  }, 10000); // Every 10s
}
