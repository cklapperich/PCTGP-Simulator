import { GameEvent } from './event_models.js';

export class EventHandler {
    subscribe(callback) {
        throw new Error('Must implement subscribe');
    }

    push(event) {
        throw new Error('Must implement push');
    }
}

export class QueueEventHandler extends EventHandler {
    constructor() {
        super();
        this.events = [];
        this.subscribers = new Set();
    }

    push(event) {
        if (!(event instanceof GameEvent)) {
            throw new Error('Must push GameEvent instances');
        }
        this.events.push(event);
        this.subscribers.forEach(callback => callback(event));
    }
    /* returns a method to unsubscribe yourself */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback); // enclosure, unsubscribes the callback when called
    }

    clear() {
        const events = [...this.events];
        this.events = [];
        return events;
    }
}
