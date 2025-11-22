// Optimistic updates with rollback - like fighting game netcode
// Update UI immediately, rollback if server disagrees

interface OptimisticAction<T> {
  id: string;
  optimisticState: T;
  serverRequest: () => Promise<T>;
  onSuccess?: (result: T) => void;
  onRollback?: (error: any) => void;
}

class OptimisticUpdateManager<T> {
  private pendingActions = new Map<string, OptimisticAction<T>>();
  private currentState: T;

  constructor(initialState: T) {
    this.currentState = initialState;
  }

  // Apply optimistic update immediately
  async apply(action: OptimisticAction<T>): Promise<void> {
    // Store pending action
    this.pendingActions.set(action.id, action);

    // Apply optimistic state immediately (user sees instant feedback)
    this.currentState = action.optimisticState;

    try {
      // Send to server in background
      const serverResult = await action.serverRequest();

      // Server confirmed - commit the change
      this.commit(action.id, serverResult);
      action.onSuccess?.(serverResult);
    } catch (error) {
      // Server rejected - rollback
      this.rollback(action.id);
      action.onRollback?.(error);
    }
  }

  private commit(id: string, serverState: T): void {
    this.pendingActions.delete(id);
    this.currentState = serverState;
  }

  private rollback(id: string): void {
    this.pendingActions.delete(id);
    // Revert to last confirmed state
    // In real implementation, would replay all non-rolled-back actions
  }

  getState(): T {
    return this.currentState;
  }

  hasPending(): boolean {
    return this.pendingActions.size > 0;
  }
}

// Example usage for move submission
export function createMoveOptimisticUpdate(
  roomId: string,
  move: string,
  currentState: any,
  onSuccess: (result: any) => void,
  onRollback: (error: any) => void,
) {
  return {
    id: `move-${roomId}-${Date.now()}`,
    optimisticState: {
      ...currentState,
      playerMove: move,
      status: "revealing",
    },
    serverRequest: async () => {
      const response = await fetch("/api/room/submit-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, move }),
      });
      return response.json();
    },
    onSuccess,
    onRollback,
  };
}

export { OptimisticUpdateManager };
