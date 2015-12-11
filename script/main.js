window.$ = window.jQuery = require('jquery');
require('malihu-custom-scrollbar-plugin')($);
var Mustache = require('mustache');
var chat = require('../script/module/chat.js');

function initialize() {
  bindEvents();
  $(window).resize();
  initCustomScrollbar();

  // chat initialize
  chat.configMyInfo(1, 1, 'jerry');
  var channelList = [1, 2, 3],
    userList = [3, 5, 7];
  chat.initClient(channelList, userList);
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
