/* String prototype */
String.prototype.string = function(len) {
  var s = '',
    i = 0;
  while (i++ < len) {
    s += this;
  }
  return s;
};
String.prototype.zf = function(len) {
  return "0".string(len - this.length) + this;
};

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/* Number prototype */
Number.prototype.zf = function(len) {
  return this.toString().zf(len);
};

/* Date prototype */
Date.prototype.format = function(f) {
  if (!this.valueOf()) return " ";

  var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  var d = this;

  return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
    switch ($1) {
      case "yyyy":
        return d.getFullYear();
      case "yy":
        return (d.getFullYear() % 1000).zf(2);
      case "MM":
        return (d.getMonth() + 1).zf(2);
      case "dd":
        return d.getDate().zf(2);
      case "E":
        return weekName[d.getDay()];
      case "HH":
        return d.getHours().zf(2);
      case "hh":
        return ((h = d.getHours() % 12) ? h : 12).zf(2);
      case "mm":
        return d.getMinutes().zf(2);
      case "ss":
        return d.getSeconds().zf(2);
      case "a/p":
        return d.getHours() < 12 ? "오전" : "오후";
      default:
        return $1;
    }
  });
};

window.$ = window.jQuery = require('jquery');
require('jquery-ui');
var Mustache = require('mustache');
var chat = require('../script/module/chat.js');
var preference = require('../script/module/preference.js');
var remote = require('remote');

function initialize() {
  console.log("initialize");
  require('../script/teamon_menu').customMenus();
  require('malihu-custom-scrollbar-plugin')($);

  bindEvents();
  $(window).resize();
  initCustomScrollbar();
  initLoginStatus();
}

function initLoginStatus()
{
    var keepSigned = preference.get("login", "keepSigned");
    var loginId = preference.get("login", "loginId");

    if(keepSigned) {
      // TODO get User Infomation
      var coId = 1;
      var emplId = 8;

      initEmpolyees(coId);
      initChatt(coId, emplId, loginId);

    } else {
      openLoginPopup();
    }
}

function openLoginPopup() {
  console.log("call openLoginPopup");
  $.get("/ElectronExample/teamon/html/popup/login_pop.html", function(data) {
    var options = {
      buttons: [{
        text: "Signed In",
        click: function() {
          loginSubmit();
        }
      }],
      show: { effect: "blind", duration: 800 },
      modal: true,
      width: 350,
      heght: 500
    };
    $("#dialog").text("").html(data).dialog(options).dialog("open");
  }).error(function() {
    alert("Connection Error");
  });
}

function getCurrentChattingTarget() {
  var userList = $('.users_area .list');
  return userList.find('.active').find("input[name=emplId]").val();
}

function initChatt(coId, emplId, loginId) {
  console.log('call initChatt] coid:%i, emplid:%i, loginid:%s, myInfo:%o, recvCallback:%o', coId, emplId, loginId);
  chat.configMyInfo(coId, emplId, loginId);

  var chatWindow = (function() {
    // cache DOM
    $inputMsg = $('.chat_section .input_message');
    $inputText = $inputMsg.find('.input_text');
    $btnSend = $inputMsg.find('.btn_send');
    $contentArea = $('.chat_section .content_area');
    $mcsbContainer = $('.chat_section .content_area .mCSB_container');
    msgTemplate = $contentArea.find('#msg-template').html();

    // bind events
    $btnSend.on('click', sendMsg);
    $inputText.on('keyup', _keyup);

    function sendMsg(msg) {
      if (typeof msg !== "string")
        msg = $inputText.val();

      _render(msg);
      $inputText.val('').focus();
    }

    function _keyup(event) {
      if (event.keyCode == 13) {
        $btnSend.click();
      }
    }

    function _render(msgText, callback) {
      if (!msgText || !msgText.trim().length)
        return;

      var msgData = {
        "msg": [{
          "mode": "send", // send or receive
          "img": "../img/profile_img1.jpg",
          "imgAlt": "mafintosh",
          "sender": "mafintosh",
          "msgText": msgText,
          "time": new Date().format("a/p hh mm")
        }]
      };

      chat.sendDirectMsg(getCurrentChattingTarget(), msgText);
    }

    function recvMsg(myIdPostfix, topic, message) {
      var sendMode = topic.endsWith(myIdPostfix);
      var userList = ['mafintosh', 'maxcgden', 'ngoldman', 'Flot', 'foross', 'groundwater', 'shama', 'DamonOchlman'];
      var random = 0;
      if (!sendMode)
        random = Math.floor(Math.random() * userList.length) + 1;
      var recvData = {
        "msg": [{
          "mode": sendMode ? "send" : "receive", // send or receive
          "img": "../img/profile_img" + (random + 1) + ".jpg",
          "imgAlt": userList[random],
          "sender": userList[random],
          "msgText": message + ' from ' + topic,
          "time": new Date().format("a/p hh mm")
        }]
      };
      $mcsbContainer.append(Mustache.render(msgTemplate, recvData));
      $contentArea.mCustomScrollbar("scrollTo", "bottom");
    }

    return {
      sendMsg: sendMsg,
      recvMsg: recvMsg
    };
  })();

  chat.registerRecvCallback(chatWindow.recvMsg);
}

function initEmpolyees(coId) {
  console.log("call initEmpolyees" + coId);
  var params = {
    "coId" : coId
  };
  restResours.empl.getListByCoid(params, function(data){
      var userListContext = $('.users_area .list');
      var chatSection = $('.chat_section');
      var titleAreaChatSection = chatSection.find(".title_area");
      var contentAreaChatSection = chatSection.find(".content_area");
      var userListArray = [];
      if(data.rows) {
        $.each(data.rows, function(idx, row) {
          var userTemplet = userListContext.find('.userTemplet').clone();
          userTemplet.removeClass("blind"); // remove basic class for templet
          userTemplet.removeClass("userTemplet");  // remove basic class for templet
          userTemplet.find(".name").text(row.name);
          userTemplet.find("[name=emplId]").val(row.emplId);
          userTemplet.find(".img").find("img").attr("src", "/ElectronExample/teamon/img/" + (row.photoLoc || "profile_no.jpg"));
          userListContext.append(userTemplet);

          // click the Users
          userTemplet.bind("click", function(event){
            $.each(userListContext.find(".active"), function(idx, row) {
                $(row).removeClass("active");
            });
            $(this).addClass("active");

            titleAreaChatSection.find('.tit').html(row.name); // set the title of chat area
            $.each(contentAreaChatSection.find(".msg_set"), function(idx, row) {
                $(row).remove(); // remove chatting texts
            });
          });

          // to init client of chat
          userListArray.push(row.emplId);
        });

        chat.initClient([], userListArray);
      }
  });
}

function bindEvents() {
  $(window).bind("orientationchange resize", function() {
    var wrapHeight = $(window).height();
    $('.connection_section .inner_box').css('height', wrapHeight - $('.connection_section .header').outerHeight());
    $('.chat_section .content_area').css('height', wrapHeight - $('.chat_section .title_area').outerHeight() - $('.chat_section .input_message').outerHeight() - 30);
    $('.aside_section .content_area').css('height', wrapHeight - $('.aside_section .title_area').outerHeight() - 30);
  });
}

function initCustomScrollbar() {
  $('.connection_section .inner_box').mCustomScrollbar({
    axis: "y",
    scrollInertia: 100,
    theme: "light-thick"
  });
  $('.chat_section .content_area').mCustomScrollbar({
    axis: "y",
    scrollInertia: 100,
    theme: "dark-thick"
  }).mCustomScrollbar("scrollTo", "bottom");
}

$(document).ready(function() {
  initialize();
});


var emplResource = require("../script/module/rest/empl");
var loginResource = require("../script/module/rest/login");

var restResours = {
  empl : new emplResource(),
  login : new loginResource()
};


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
