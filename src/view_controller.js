// main.js
class ViewManager {
    constructor() {
        this.activeView = null;
        this.views = {
            'menu': MenuView,
            'packOpening': PackOpeningView,
            'collection': CollectionView,
            'battle': BattleView,
            'shop': ShopView
        };
        this.container = document.getElementById('game-container');
    }

    async show(viewName, data = {}) {
        if (!this.views[viewName]) {
            console.error(`View ${viewName} doesn't exist`);
            return;
        }

        // Hide current view
        if (this.activeView) {
            this.activeView.hide();
        }

        // Show new view
        const View = this.views[viewName];
        this.activeView = new View(this.container, data);
        await this.activeView.show();
    }
}

const gameState = {
    collection: [],
    currency: 0,
    currentPack: null,
    listeners: new Set(),

    update(changes) {
        Object.assign(this, changes);
        this.notifyListeners();
    },

    subscribe(callback) {
        this.listeners.add(callback);
        // Immediately call with current state
        callback(this);
    },

    unsubscribe(callback) {
        this.listeners.delete(callback);
    },

    notifyListeners() {
        this.listeners.forEach(callback => callback(this));
    }
};

class BaseView {
    constructor(container, data = {}) {
        this.container = container;
        this.data = data;
        this.elements = {};
    }

    async loadResources() {
        const viewName = this.constructor.name.toLowerCase().replace('view', '');
        const [htmlResponse, cssResponse] = await Promise.all([
            fetch(`/views/${viewName}/${viewName}.html`),
            fetch(`/views/${viewName}/${viewName}.css`)
        ]);

        const html = await htmlResponse.text();
        const css = await cssResponse.text();

        return { html, css };
    }

    async show() {
        const { html, css } = await this.loadResources();
        
        // Add CSS
        const styleId = `style-${this.constructor.name}`;
        if (!document.getElementById(styleId)) {
            const styleElement = document.createElement('style');
            styleElement.id = styleId;
            styleElement.textContent = css;
            document.head.appendChild(styleElement);
        }

        // Add HTML
        this.container.innerHTML = html;
        
        // Bind events
        this.bindEvents();
    }

    hide() {
        this.unbindEvents();
        this.container.innerHTML = '';
    }

    bindEvents() {
        // Override in subclasses
    }

    unbindEvents() {
        // Override in subclasses
    }
}

// Initialize the view manager
const viewManager = new ViewManager();

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    viewManager.show('menu');
});