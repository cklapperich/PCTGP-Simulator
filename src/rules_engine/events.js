// Transport interface that can be implemented for different messaging systems
class MessageTransport {
    send(message) {
        throw new Error('send() must be implemented');
    }

    subscribe(callback) {
        throw new Error('subscribe() must be implemented');
    }

    unsubscribe(callback) {
        throw new Error('unsubscribe() must be implemented');
    }
}

// In-memory implementation using standard JavaScript events
class InMemoryTransport extends MessageTransport {
    constructor() {
        super();
        this.subscribers = new Set();
        this.messageQueue = [];
    }

    send(message) {
        this.messageQueue.push(message);
        this.subscribers.forEach(callback => callback(message));
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.unsubscribe(callback);
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }

    // For backwards compatibility with queue interface
    put(message) {
        this.send(message);
    }

    get() {
        return this.messageQueue.shift();
    }

    empty() {
        return this.messageQueue.length === 0;
    }

    clear() {
        this.messageQueue = [];
        this.subscribers.clear();
    }
}

// Message bus that uses a transport strategy
class MessageBus {
    constructor(transport) {
        this.transport = transport;
    }

    publish(message) {
        this.transport.send(message);
    }

    subscribe(callback) {
        return this.transport.subscribe(callback);
    }

    // For backwards compatibility
    put(message) {
        this.publish(message);
    }

    get() {
        return this.transport.get();
    }

    empty() {
        return this.transport.empty();
    }

    clear() {
        this.transport.clear();
    }
}

// Example WebSocket transport that could be used in the future
/*
class WebSocketTransport extends MessageTransport {
    constructor(url) {
        super();
        this.url = url;
        this.subscribers = new Set();
        this.ws = new WebSocket(url);
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.subscribers.forEach(callback => callback(message));
        };
    }

    send(message) {
        this.ws.send(JSON.stringify(message));
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.unsubscribe(callback);
    }

    unsubscribe(callback) {
        this.subscribers.delete(callback);
    }
}
*/

// Create transport instances
const uiOutputTransport = new InMemoryTransport();
const requestInputTransport = new InMemoryTransport();
const inputTransport = new InMemoryTransport();

// Create message buses with transports
export const UIoutputBus = new MessageBus(uiOutputTransport);
export const RequestInputBus = new MessageBus(requestInputTransport);
export const inputBus = new MessageBus(inputTransport);

// For backwards compatibility
export const UIoutputQueue = UIoutputBus;
export const RequestInputQueue = RequestInputBus;
export const inputQueue = inputBus;

// Example of how to switch to WebSocket transport in the future:
/*
const wsTransport = new WebSocketTransport('ws://localhost:8080');
export const UIoutputBus = new MessageBus(wsTransport);
*/
