'use strict';

var headerSec = (function() {
  // cache DOM
  var $headerSec;
  var $titleArea;
  var $title;

  function _initialize() {
    $headerSec = $(".header_section");
    $titleArea = $headerSec.find(".title_area");
    $title = $headerSec.find(".tit");

    $headerSec.find(".call-menulink").click(function() {
      asideSection.adjustAsideArea(true);
    });

    $headerSec.find(".mention").click(function() {
      _getMetionList();
    });
  }

  function initHeaderSection() {
    _initialize()
  }

  function _getMetionList() {
    var params = {
      "emplId": myPref.emplId
    };

    restResourse.chat.getMentionList(params, function(data) {
      if (data) {
        var messages = [];
        $.each(data, function(idx, row) {
          var sender = connSection.getUserObj(row.spkrId);
          var channel = connSection.getChannelObj(row.peer2);
          console.log(sender);
          var message = {
            "msgId": row.chatId,
            "img": "../img/profile_img" + row.spkrId + ".jpg",
            "imgAlt": sender.loginId,
            "channel": channel ? channel.name : "unknown",
            "sender": sender.loginId,
            "msgText": row.msg,
            "date": new Date(row.creTime).format("yyyy/MM/dd"),
            "time": new Date(row.creTime).format("a/p hh mm")
          };

          messages.push(message);
          asideSection.displayMetionList(messages);
        });
      }
    });
  }

  function setTitle(chatType, text) {
    $title.html(text);
  }

  return {
    initHeaderSection: initHeaderSection,
    setTitle: setTitle
  };
})();

module.exports = headerSec;
