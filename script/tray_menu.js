// var Menu = require('menu'),
//   app = require('app'),
//   BrowserWindow = require('browser-window'),
//   Tray = require('tray'),
//   path = require('path'),
//   MenuItem = require('menu-item'),
//   contants = require('./constants');
//
var Tray = remote.require('tray');
var Menu = remote.require('menu');
var path = require('path');
var trayIcon = null;

function renderTrayIconMenu(){
//if (process.platform === 'darwin') {
//  trayIcon = new Tray(path.join(__dirname, 'img/tray-iconTemplate.png'));
//}
//else {
    trayIcon = new Tray(path.join(__dirname, '../img/icon.ico'));
//}

  var trayMenuTemplate = [
    {
      label: 'Toggle Developer Tool',
      accelerator: 'CmdOrCrtl+Shift+I',
      click: function () {
        ipc.send('toggle-dev-tools');
      }
    },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click: function () {
        ipc.send('close-main-window');
      }
    }
  ];
  var trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
  trayIcon.setContextMenu(trayMenu);

  trayIcon.on('click', function() {
    ipc.send('show-window');
  });
}

function changeImageToNew() {
  trayIcon.setImage(path.join(__dirname, "../img/profile_no.jpg"));
}

function changeImageToNormal() {
  trayIcon.setImage(path.join(__dirname, "../img/icon.ico"));
}

module.exports = {
  renderTrayIconMenu: renderTrayIconMenu,
  changeImageToNormal: changeImageToNormal,
  changeImageToNew: changeImageToNew
};
