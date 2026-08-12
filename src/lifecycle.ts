// One place where every listener, observer and animation frame is registered
// with its teardown, so nothing outlives the thing that created it.
//
// Harness rule 5 says no `addEventListener` outside this file, and
// spec/assignment-1.test.ts enforces it. That is not bureaucracy: a listener
// added ad hoc during a fling or a resize is invisible until the page has been
// open long enough for it to matter, which is exactly when a marker is using
// it.

type Teardown = () => void;

/** A bag of teardowns that can be closed once. */
export class Lifecycle {
  #teardowns = new Set<Teardown>();
  #closed = false;

  /**
   * Register a teardown. Returns a function that runs it early and forgets it,
   * so a caller can undo one thing without closing the whole scope.
   */
  add(teardown: Teardown): Teardown {
    if (this.#closed) {
      // Registering against a closed scope would leak silently, which is the
      // one failure mode this class exists to prevent.
      teardown();
      return () => {};
    }
    this.#teardowns.add(teardown);
    return () => {
      if (this.#teardowns.delete(teardown)) teardown();
    };
  }

  /** Add a DOM listener and its removal in one step. Always passive-friendly. */
  on<T extends EventTarget, E extends Event = Event>(
    target: T,
    type: string,
    handler: (event: E) => void,
    options?: AddEventListenerOptions,
  ): Teardown {
    const listener = handler as EventListener;
    target.addEventListener(type, listener, options);
    return this.add(() => target.removeEventListener(type, listener, options));
  }

  /**
   * Run `frame` on the next animation frame, cancelling any pending one. The
   * whole app shares a single loop (see `useCamera`); this is the primitive it
   * is built from, and it guarantees a cancelled frame on teardown.
   */
  raf(frame: FrameRequestCallback): Teardown {
    let handle = requestAnimationFrame(frame);
    const cancel = this.add(() => cancelAnimationFrame(handle));
    return () => {
      cancelAnimationFrame(handle);
      handle = 0;
      cancel();
    };
  }

  /** Close the scope: run every teardown once, in reverse order of adding. */
  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    for (const teardown of [...this.#teardowns].reverse()) teardown();
    this.#teardowns.clear();
  }

  /** How many teardowns are outstanding — the stress pass watches this. */
  get size(): number {
    return this.#teardowns.size;
  }
}
