// Object pooling - reuse objects instead of creating new ones
// Like how fighting games reuse particle effects

export class ObjectPool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10, maxSize = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      // Pool exhausted, create new (but don't exceed max)
      if (this.inUse.size >= this.maxSize) {
        throw new Error(`Object pool exhausted (max: ${this.maxSize})`);
      }
      obj = this.factory();
    }

    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (!this.inUse.has(obj)) return;

    this.inUse.delete(obj);
    this.reset(obj);
    this.available.push(obj);
  }

  releaseAll(): void {
    this.inUse.forEach(obj => {
      this.reset(obj);
      this.available.push(obj);
    });
    this.inUse.clear();
  }

  get size() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    };
  }
}

// Pre-configured pools for common game objects
export const matchDataPool = new ObjectPool(
  () => ({
    roomId: "",
    playerMove: null as string | null,
    opponentMove: null as string | null,
    result: null as string | null,
    timestamp: 0,
  }),
  obj => {
    obj.roomId = "";
    obj.playerMove = null;
    obj.opponentMove = null;
    obj.result = null;
    obj.timestamp = 0;
  },
  20,
  100,
);
