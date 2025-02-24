const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script starting...');

// 直接定义并暴露 API
contextBridge.exposeInMainWorld('api', {
  invoke: (...args) => {
    console.log('Invoke called with args:', args);
    return ipcRenderer.invoke(...args);
  }
});

console.log('Preload script finished, API exposed');
