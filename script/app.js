var app = require('app');
var BrowserWindow = require('browser-window');
var path = require('path');
var constants = require('./constants');
var globalShortcut = require('global-shortcut');
var ipc = require('electron').ipcMain;
var cp = require('child_process');
var autoUpdater = require('auto-updater');
var appVersion = require('../package.json').version;
var os = require('os').platform();
var appRootPath = require('app-root-path').path.replace(/\\/gi, "/");

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

// squirrel setting
var handleSquirrelEvent = function() {
  if (process.platform != 'win32') {
    return false;
  }

  function executeSquirrelCommand(args, done) {
    var updateDotExe = path.resolve(path.dirname(process.execPath),
      '..', 'update.exe');
    var child = cp.spawn(updateDotExe, args, {
      detached: true
    });
    child.on('close', function(code) {
      done();
    });
  }

  function install(done) {
    var target = path.basename(process.execPath);
    executeSquirrelCommand(["--createShortcut", target], done);
  }

  function uninstall(done) {
    var target = path.basename(process.execPath);
    executeSquirrelCommand(["--removeShortcut", target], done);
  }

  app.setAppUserModelId('com.squirrel.teamon.teamon');
  var squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      install(app.quit);
      return true;
    case '--squirrel-uninstall':
      uninstall(app.quit);
      return true;
    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated
      app.quit();
      return true;
  }

  return false;
};

if (handleSquirrelEvent()) {
  return;
}

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  // update check
  var updateFeed = null;
  if (process.env.NODE_ENV === 'production') {
    updateFeed = constants.SOFTWARE_UPDATE_URL_BASE_PROD;
  } else {
    updateFeed = constants.SOFTWARE_UPDATE_URL_BASE_DEV;
  }

  updateFeed += (os === 'darwin' ?
    constants.SOFTWARE_UPDATE_URL_PATH_LATEST : constants.SOFTWARE_UPDATE_URL_PATH_RELEASE + "/win32");

  autoUpdater.setFeedURL(updateFeed + '?v=' + appVersion);
  console.log('feedURL: %s', updateFeed + '?v=' + appVersion);

  autoUpdater.on('error', function(error) {
    console.error('error occurred! ' + error);
    createWindow();
  })
  .on('checking-for-update', function() {
    console.log('Checking for update');
  })
  .on('update-available', function() {
    console.log('Update available');
  })
  .on('update-not-available', function() {
    console.log('Update not available');
    createWindow();
  })
  .on('update-downloaded', function() {
    console.log('Update downloaded');
    autoUpdater.quitAndInstall();
  });

  autoUpdater.checkForUpdates();
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 650,
    title: constants.APP_NAME,
    icon: path.join(appRootPath, '/favicon.png')
  });

  mainWindow.loadURL(INDEX);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  var protocol = require('protocol');
  var fs = require('fs');
  protocol.interceptFileProtocol('file', function(request, callback) {
    var url = request.url.substr(7);
    // console.log(request.url);
    if (url.lastIndexOf("?") > 0)
      url = url.substr(0, url.lastIndexOf("?"));
    if (process.platform != 'darwin')
      url = url.indexOf(appRootPath) == -1 ? appRootPath + url.substr(3) : url.substr(1);
    else
      url = url.indexOf(appRootPath) == -1 ? appRootPath + url : url;
    if (url.charAt(url.length - 1) === '#')
      url = url.substr(0, url.length - 1);
    // console.log(path.normalize(url));
    callback(path.normalize(url));
  }, function (error) {
    if (error)
      console.log(error);
  });

  // mainWindow.on('close', function(event) { //   <---- Catch close event
  //   event.preventDefault();
  //   mainWindow.hide();
  // });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  // Global shortcut register
  setGlobalShortcuts();

  handleTrayEvent();
}

function setGlobalShortcuts() {
    globalShortcut.unregisterAll();

    var ret = globalShortcut.register('ctrl+Q', function() {
       console.log('ctrl+Q is pressed');
       if (mainWindow.isFocused())
        app.quit();
    });
    if (!ret) {
      console.log('ctrl+Q registration failed');
    }

    ret = globalShortcut.register('cmdOrctrl+shift+I', function() {
      console.log('cmdOrctrl+shift+I is pressed');
      if (mainWindow.isFocused())
        mainWindow.toggleDevTools();
    });
    if (!ret) {
      console.log('ctrl+Q registration failed');
    }

    ret = globalShortcut.register('F5', function() {
      if (mainWindow.isFocused())
       console.log('F5 is pressed. Just ignored.');
    });
    if (!ret) {
      console.log('F5 registration failed');
    }
}

function handleTrayEvent() {
  ipc.on('show-window', function() {
    mainWindow.show();
    mainWindow.focus();
  });

  ipc.on('toggle-dev-tools', function() {
    mainWindow.toggleDevTools();
  });

  ipc.on('close-main-window', function() {
    app.quit();
  });
}
