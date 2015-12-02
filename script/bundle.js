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

function initialize() {
  bindEvents();
  $(window).resize();
  initCustomScrollbar();
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

var messenger;
$(document).ready(function() {
  initialize();

  messenger = (function() {
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
      _render(msg, _simReceiver);
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
      $mcsbContainer.append(Mustache.render(msgTemplate, msgData));
      $contentArea.mCustomScrollbar("scrollTo", "bottom");

      if (callback)
        setTimeout(callback, 1000);
    }

    function _simReceiver() {
      var msgList = ['ㅇㅋ', 'ㅋㅋ', '^^', 'okay', 'good!', 'hi~', 'bye~'];
      var userList = ['mafintosh', 'maxcgden', 'ngoldman', 'Flot', 'foross', 'groundwater', 'shama', 'DamonOchlman'];
      var random = Math.floor(Math.random() * msgList.length);
      var recvData = {
        "msg": [{
          "mode": "receive", // send or receive
          "img": "../img/profile_img" + (random + 2) + ".jpg",
          "imgAlt": userList[random + 2],
          "sender": userList[random + 2],
          "msgText": msgList[random],
          "time": new Date().format("a/p hh mm")
        }]
      };
      $mcsbContainer.append(Mustache.render(msgTemplate, recvData));
      $contentArea.mCustomScrollbar("scrollTo", "bottom");
    }

    return {
      sendMsg: sendMsg
    };
  })();
})
