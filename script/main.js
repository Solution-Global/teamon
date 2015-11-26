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

$(document).ready(function() {
  initialize();

  var messagener = {
    init: function() {
      this.cacheDom();
      this.bindEvents();
    },
    cacheDom: function() {
      this.$inputMsg = $('.chat_section .input_message');
      this.$inputText = this.$inputMsg.find('.input_text');
      this.$btnSend = this.$inputMsg.find('.btn_send');
      this.$contentArea = $('.chat_section .content_area');
      this.$mcsbContainer = $('.chat_section .content_area .mCSB_container');
      this.msgTemplate = this.$contentArea.find('#msg-template').html();
    },
    bindEvents: function() {
      this.$btnSend.on('click', this.sendMsg.bind(this));
      this.$inputText.on('keyup', this.keyup.bind(this));
    },
    keyup: function(event) {
      if (event.keyCode == 13) {
        this.$btnSend.click();
      }
    },
    sendMsg: function() {
      this.render(this.$inputText.val(), this.simReceiver.bind(this));
      this.$inputText.val('').focus();
    },
    render: function(msgText, callback) {
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
      this.$mcsbContainer.append(Mustache.render(this.msgTemplate, msgData));
      this.$contentArea.mCustomScrollbar("scrollTo", "bottom");

      if (callback)
        setTimeout(callback, 1000);
    },
    msgList: ['ㅇㅋ', 'ㅋㅋ', '^^', 'okay', 'good!', 'hi~', 'bye~'],
    userList: ['mafintosh', 'maxcgden', 'ngoldman', 'Flot', 'foross', 'groundwater', 'shama', 'DamonOchlman'],
    simReceiver: function() {
      var random = Math.floor(Math.random() * this.msgList.length);
      var recvData = {
        "msg": [{
          "mode": "receive", // send or receive
          "img": "../img/profile_img" + (random + 2) + ".jpg",
          "imgAlt": this.userList[random + 2],
          "sender": this.userList[random + 2],
          "msgText": this.msgList[random],
          "time": new Date().format("a/p hh mm")
        }]
      };
      this.$mcsbContainer.append(Mustache.render(this.msgTemplate, recvData));
      this.$contentArea.mCustomScrollbar("scrollTo", "bottom");
    }
  }

  messagener.init();
});
