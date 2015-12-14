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
require('malihu-custom-scrollbar-plugin')($);
var Mustache = require('mustache');
var chat = require('../script/module/chat.js');

function initialize() {
  console.log("initialize");
  bindEvents();
  $(window).resize();
  initCustomScrollbar();
  initLoginStatus();
  chat.configMyInfo(1, 1, 'jerry');
  var channelList = [1, 2, 3],
  userList = [3, 5, 7];
  chat.initClient(channelList, userList);
}

function initLoginStatus()
{
    session.cookies.get({url : sessionUrl, name: "loginId"}, function(error, cookies) {
    if (error) throw error;
    // login
    if(cookies.length > 0)
    {
      session.cookies.get({url : sessionUrl, name: "coId"}, function(error, cookies) {
        if (error) throw error;
        initEmpolyees(cookies.value);
      });
    } else {
      openLoginPopup();
    }
  });
}

function openLoginPopup() {
  console.log("call openLoginPopup");
  $.get("/ElectronExample/teamon/html/popup/login_pop.html", function(data) {
    var options = {
      buttons: [{
        text: "LOGIN",
        click: function() {
          loginSubmit();
        }
      }],
      show: { effect: "blind", duration: 800 },
      modal: true,
      width: 350,
      heght: 500
    }
    $("#dialog").text("").html(data).dialog(options).dialog("open");
  }).error(function() {
    alert("Connection Error");
  });
}

function initEmpolyees(coId){
  console.log("call initEmpolyees" + coId);
  var emplAPI = require('../script/rest/empl');
  var params = {
    "coId" : coId
  };
  emplAPI.getListByCoid(params, function(data){
      var userList = $('.users_area .list');
      $.each(data.rows, function(idx, row) {
        var userTemplet = userList.find('.userTemplet').clone();
        userTemplet.removeClass("blind"); // remove basic class for templet
        userTemplet.removeClass("userTemplet");  // remove basic class for templet
        userTemplet.find(".name").text(row.name);
        userTemplet.find(".img").find("img").attr("src", "/ElectronExample/teamon/img/" + (row.photoLoc ? row.photoLoc : "profile_no.jpg"));
        userList.append(userTemplet);
      });
  });

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

var chatWindow;
$(document).ready(function() {
  initialize();

  chatWindow = (function() {
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

      chat.sendDirectMsg(3, msgText);  // send to 3
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
});
