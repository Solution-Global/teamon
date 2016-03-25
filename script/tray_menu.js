var Menu = require('menu'),
  app = require('app'),
  BrowserWindow = require('browser-window'),
  Tray = require('tray'),
  path = require('path'),
  MenuItem = require('menu-item'),
  contants = require('./constants');

module.exports = {
  // Method to create tray icon object
  renderTrayIconMenu: function(){
    var trayIconPath = path.join(__dirname, '../img/icon.ico'),
        trayIconObject = new Tray(trayIconPath),
        trayContextMenu = new Menu();

        trayContextMenu.append(new MenuItem({
          label: 'Full Screen',
          click: function() {
            var targetWindow = BrowserWindow.getAllWindows()[0];
            targetWindow.setFullScreen(true);
          }
        }));

        trayContextMenu.append(new MenuItem({type: 'separator'}));

        trayContextMenu.append(new MenuItem({
          label: 'Toggle Developer Tool',
          click: function() {
            var targetWindow = BrowserWindow.getAllWindows()[0];
            targetWindow.toggleDevTools();
          }
        }));

        trayContextMenu.append(new MenuItem({
          label: 'Reload',
          click: function() {
            var targetWindow = BrowserWindow.getAllWindows()[0];
            targetWindow.reload();
          }
        }));

        trayContextMenu.append(new MenuItem({
          label: 'Quit',
          //accelerator: 'CmdorCtrl+Q',
          click: function() {
            BrowserWindow.getAllWindows()[0] = null;
            app.exit(0);
          }
        }));

        trayIconObject.setToolTip(contants.APP_NAME);

        trayIconObject.on('click', function() {
          var targetWindow = BrowserWindow.getAllWindows()[0];
          targetWindow.show();
          targetWindow.focus();
        });

        trayIconObject.setContextMenu(trayContextMenu);
        trayIconObject.setImage(path.join(__dirname, "../img/profile_no.jpg"));
    }
};
