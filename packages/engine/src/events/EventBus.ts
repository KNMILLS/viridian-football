/**
 * Typed event bus for Viridian Football.
 * Ported from KNMILLS/football-strategy and adapted for GM simulation events.
 *
 * ARCHITECTURE: Every engine module communicates through this bus.
 * No module directly calls another module's business logic.
 * Modules publish events and subscribe to events from other modules.
 * This is the backbone of the emergent systems architecture.
 */

import type { GameEventMap } from './GameEvents.js';

type Handler<T> = (payload: T) => void;

export class EventBus<TEventMap extends Record<string, unknown> = GameEventMap> {
  private listeners: {
    [K in keyof TEventMap]?: Handler<TEventMap[K]>[];
  } = {};

  private eventLog: { event: string; payload: unknown; timestamp: number }[] = [];
  private logging = false;

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof TEventMap>(event: K, handler: Handler<TEventMap[K]>): () => void {
    const arr = (this.listeners[event] ??= []);
    arr.push(handler);
    return () => {
      const i = arr.indexOf(handler);
      if (i >= 0) arr.splice(i, 1);
    };
  }

  /** Subscribe to an event, but only fire once then auto-unsubscribe. */
  once<K extends keyof TEventMap>(event: K, handler: Handler<TEventMap[K]>): () => void {
    const unsub = this.on(event, (payload) => {
      unsub();
      handler(payload);
    });
    return unsub;
  }

  /** Emit an event to all subscribers. */
  emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void {
    if (this.logging) {
      this.eventLog.push({
        event: event as string,
        payload,
        timestamp: Date.now(),
      });
    }

    const arr = this.listeners[event];
    if (!arr) return;
    for (const h of [...arr]) {
      h(payload);
    }
  }

  /** Enable/disable event logging for debugging and replay. */
  setLogging(enabled: boolean): void {
    this.logging = enabled;
    if (!enabled) this.eventLog = [];
  }

  /** Get the event log (only populated when logging is enabled). */
  getLog(): readonly { event: string; payload: unknown; timestamp: number }[] {
    return this.eventLog;
  }

  /** Remove all listeners. */
  clear(): void {
    this.listeners = {};
    this.eventLog = [];
  }

  /** Remove all listeners for a specific event. */
  clearEvent<K extends keyof TEventMap>(event: K): void {
    delete this.listeners[event];
  }

  /** Get the count of listeners for a specific event. */
  listenerCount<K extends keyof TEventMap>(event: K): number {
    return this.listeners[event]?.length ?? 0;
  }
}
