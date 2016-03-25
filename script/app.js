var app = require('app');
var BrowserWindow = require('browser-window');
var path = require('path');
var constants = require('./constants');
var trayMenu = require('./tray_menu');

var INDEX = 'file://' + path.join(__dirname, '../index_app.html');
var mainWindow = null;

// make single instance
var iShouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
    return true;
});

if(iShouldQuit) {
  app.quit();return;
}

// Ignores certificate related errors.
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 650,
    title: constants.APP_NAME,
    icon: path.join(__dirname, '../img/icon.ico')
  });

  mainWindow.loadURL(INDEX);
  trayMenu.renderTrayIconMenu();

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('close', function(event) { //   <---- Catch close event
    event.preventDefault();
    mainWindow.hide(); // minimize();
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
