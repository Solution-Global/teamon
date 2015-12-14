
var remote = require('remote');
var Menu = remote.require('menu');
var app = remote.require('app');

module.exports = {
  customMenus: function() {
    var myMenu = Menu.buildFromTemplate(
      [{
        label: 'File',
        submenu: [
          {
            label: 'Preference',
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            accelerator: 'CmdOrCtrl+Q',
            click: function () {
              app.quit();
            }
          },
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'Command+Z',
            selector: 'undo:'
          },
          {
            label: 'Redo',
            accelerator: 'Shift+Command+Z',
            selector: 'redo:'
          },
          {
            type: 'separator'
          },
          {
            label: 'Cut',
            accelerator: 'Command+X',
            selector: 'cut:'
          },
          {
            label: 'Copy',
            accelerator: 'Command+C',
            selector: 'copy:'
          },
          {
            label: 'Paste',
            accelerator: 'Command+V',
            selector: 'paste:'
          },
          {
            label: 'Select All',
            accelerator: 'Command+A',
            selector: 'selectAll:'
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Reload',
            accelerator: 'Command+R',
            click: function() {
              remote.getCurrentWindow().reload();
              // 임시
              session.cookies.remove({url : sessionUrl, name : "loginId"}, function(error, cookies) {if (error) throw error;});
              session.cookies.remove({url : sessionUrl, name : "emplId"}, function(error, cookies) {if (error) throw error;});
              session.cookies.remove({url : sessionUrl, name : "coId"}, function(error, cookies) {if (error) throw error;});
            }
          },
          {
            label: 'Toggle DevTools',
            accelerator: 'Alt+Command+I',
            click: function() { remote.getCurrentWindow().toggleDevTools(); }
          },
          {
            label: 'Sign In',
            click: function() {
              openLoginPopup();
          }
        },
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Abount Teamon',
          selector: 'arrangeInFront:',
          click: function() { alert("솔루션 개발 1팀 개발 중.."); }
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(myMenu);
  }
};
