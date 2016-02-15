'use strict';

var informationSection = (function() {
  // cache DOM
  var $informationSec;
  var $contentArea;

  function _initialize() {
    $informationSec = $("#information-section");

    // Close ibox function
    $informationSec.find(".aside-close-link").click(function() {
      adjustAsideArea();
    });
  }

  function adjustAsideArea(isOpen) {
    var chatSection = $('#chat-section');
    var asideIbox = $("#information-section .ibox");
    if(isOpen || chatSection.hasClass("col-xs-12 col-lg-12")) {
      chatSection.removeClass("col-xs-12 col-lg-12").addClass( "col-xs-9 col-lg-9" );
      asideIbox.show(500);
    } else {
      chatSection.removeClass("col-xs-9 col-lg-9").addClass( "col-xs-12 col-lg-12" );
      asideIbox.hide();
    }
  }

  function initAsideSection() {
    _initialize()
  }

  function resizeInformationSection() {
    var windowHeight = $(window).height();
    var headerHeight = $("#header-section").outerHeight(true);
    var informationHeaderHeight =  $informationSec.find(".ibox-title").outerHeight(true);
    var informationHeight =  windowHeight - headerHeight - informationHeaderHeight;
    $informationSec.find(".ibox-content").css("height", informationHeight);
  }

  function showAboutUser() {
    loadHtml("./html/information/about_user.html", $informationSec);
    var aboutUserTemplate = $informationSec.find('#aboutUser-template').html();
    var $title = $informationSec.find(".title");
    var $contentArea = $informationSec.find('.content_area');

    var emplId = activeChatInfo.chatRoomId;
    var userValue = catalogSection.getUserObj(emplId);
    var aboutUserData = {
      "loginId" : userValue.loginId,
      "imgAlt" : userValue.loginId,
      "img": "../img/profile_img" + userValue.emplId + ".jpg",
    };

    $title.html("About this conversation");
    $contentArea.prepend(Mustache.render(aboutUserTemplate, aboutUserData));

    $contentArea.find(".call").click(function() {
      callSection.showSection();
      chatSection.hideSection(); // chat Area

      callSection.showCallInfo(emplId, userValue.loginId);
    });

    resizeInformationSection();
    _informationSectionScroll();
  }

  function showAboutChannel() {
    loadHtml("./html/information/about_channel.html", $informationSec);
    var aboutChannelTemplate = $informationSec.find('#aboutChannel-template').html();
    var $title = $informationSec.find(".title");
    var $contentArea = $informationSec.find('.content_area');

    var channelId = activeChatInfo.chatRoomId;
    var channelValue = catalogSection.getChannelObj(channelId);
    var existMembers;
    for(var key in channelValue.memberList) {
      var emplId = channelValue.memberList[key].emplId;
      if(!existMembers)
        existMembers = emplId;
      else
        existMembers += "," + channelValue.memberList[key].emplId;
    }
    var membersArray = String(existMembers).split(",");
    var memberCount = membersArray.length;

    $title.html("About #" + channelValue.name);
    var aboutChannelData = {
      "pinupMessage": channelValue.pinupMessage || "There are no purpose.",
      "memberCount": memberCount,
      "members":[]
    };

    for(var key in membersArray) {
      var userValue = catalogSection.getUserObj(membersArray[key]);
      aboutChannelData.members.push({
        "loginId" : userValue.loginId,
        "emplId" : userValue.emplId,
        "imgAlt" : userValue.loginId,
        "img": "../img/profile_img" + userValue.emplId + ".jpg",
      });
    }

    $contentArea.empty();
    $contentArea.prepend(Mustache.render(aboutChannelTemplate, aboutChannelData));

    $("#onInviteChannelModal").bind("click", function() {
      openModalDialog("./html/information/modal/invite_channel_modal.html");
    });

    $contentArea.find(".leaveChannel").click(function() {
      var params = {
        "channelId": channelId,
        "members": myPref.emplId,
      };

      restResourse.channel.removeMember(params,
        function(response) {
          if(response.statusCode === 200) {

            var channelValue = catalogSection.getChannelObj(channelId);
            if(channelValue) {
              var members;
              for(var key in channelValue.memberList) {
                var emplId = channelValue.memberList[key].emplId;

                var params = {
                  "type": constants.GROUP_REMOVE_MEMBER,
                  "channelId": channelId,
                  "member": myPref.emplId
                }

                chatModule.sendCommand(emplId, params);
              }
            }

            chatSection.sendMsg("퇴장 members - " + myPref.loginId, constants.GROUP_CHAT, channelId); // 멤버 삭제 메시지 전송
          } else {
            console.log("[fail add memeber]" + response.statusMessage);
          }
        }
      );
    });

    resizeInformationSection();
    _informationSectionScroll();
  }

  function displayMember(members) {
    for(var key in members) {
      var userValue = catalogSection.getUserObj(members[key]);
      var imgUrl = "../img/profile_img" + userValue.emplId + ".jpg";
      $contentArea.find(".members").append("<li data-emplid='" + userValue.emplId + "'><a href='#'><img class='chat-avatar' src='" + imgUrl + "' alt='" + userValue.loginId + "'>" + userValue.loginId + "</a></li>");
    }
  }

  function showMentionList(messages) {
    loadHtml("./html/information/mention_list.html", $informationSec);

    var mentionTemplate = $informationSec.find('#mention-template').html();
    var mentionDateLineTemplate = $informationSec.find('#mention-dateline-template').html();
    var $title = $informationSec.find(".title");
    var $contentArea = $informationSec.find('.content_area');

    var params = {
      "emplId": myPref.emplId
    };

    restResourse.chat.getMentionList(params, function(data) {
      if (data) {
        var messages = [];
        $.each(data, function(idx, row) {
          var sender = catalogSection.getUserObj(row.spkrId);
          var channel = catalogSection.getChannelObj(row.peer2);
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
        });

        $contentArea.empty();
        $title.html("Mention #" + myPref.loginId);
        for (var key = 0; key < messages.length; key++) {
          if(messages[key - 1] && messages[key - 1].date != messages[key].date) {
            $contentArea.append(Mustache.render(mentionDateLineTemplate, {"date" : messages[key].date}));
          }
          $contentArea.append(Mustache.render(mentionTemplate, messages[key]));
        }
        resizeInformationSection();
        _informationSectionScroll();
      }
    });
  }

  function hideMember(member) {
    $contentArea.find(".members [data-emplid='" + member + "']").remove();
  }

  function hideSection() {
    $informationSec.hide();
  }

  function showSection() {
    $informationSec.show();
  }

  function _informationSectionScroll() {
    $informationSec.find(".ibox-content").mCustomScrollbar({
      axis:"y",
  		setWidth: "auto",
      theme:"3d"
    });
  }

  return {
    initAsideSection: initAsideSection,
    resizeInformationSection: resizeInformationSection,
    showAboutChannel: showAboutChannel,
    showAboutUser: showAboutUser,
    adjustAsideArea: adjustAsideArea,
    displayMember: displayMember,
    showMentionList: showMentionList,
    hideMember: hideMember,
    hideSection: hideSection,
    showSection: showSection
  };
})();

module.exports = informationSection;
