
// Simple queue implementation for events
export class EventQueue {
    constructor() {
        this.items = [];
    }

    put(item) {
        this.items.push(item);
    }

    get() {
        return this.items.shift();
    }

    empty() {
        return this.items.length === 0;
    }
}

// Global event queues
export const outputQueue = new EventQueue();
export const inputQueue = new EventQueue();
