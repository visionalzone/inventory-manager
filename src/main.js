const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('Main process starting...');

// Import handlers before anything else
require('./main/handlers/modelHandlers');

let mainWindow;

function createWindow() {
  const preloadPath = path.resolve(__dirname, 'preload.js');
  console.log('Full preload path:', preloadPath);

  if (!fs.existsSync(preloadPath)) {
    console.error('Preload script not found at:', preloadPath);
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      sandbox: false,
      webSecurity: false,
      devTools: true
    }
  });

  mainWindow.loadURL('http://localhost:3000');
  mainWindow.webContents.openDevTools();
  
  // 监听页面加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded, checking API...');
    mainWindow.webContents.executeJavaScript(`
      console.log('API check:', {
        api: window.api,
        hasInvoke: window.api && typeof window.api.invoke === 'function'
      });
    `);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

// 添加这行来帮助调试
console.log('Preload path:', path.join(__dirname, 'preload.js'));