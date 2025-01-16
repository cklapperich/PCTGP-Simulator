// preload.js
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    // Add API methods here later
})