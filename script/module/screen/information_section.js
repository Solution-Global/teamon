'use strict';

var informationSection = (function() {
  // cache DOM
  var $informationSec;
  var $contentArea;

  function _initialize() {
    $informationSec = $("#information-section");

    $informationSec.delegate(".aside-close-link", "click", function() {
      hideSection();
      adjustSectionSize(chatSection.getSection(), 12);
      chatSection.showSection();
    });
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

  function showAboutUser(callHistoryData) {
    loadHtml("/html/information/about_user.html", $informationSec);
    var aboutUserTemplate = $informationSec.find('#aboutUser-template').html();
    var callHistoryTemplate = $informationSec.find('#callHistory-template').html();
    var $title = $informationSec.find(".title");
    var $contentArea = $informationSec.find('.content_area');

    var emplId = activeChatInfo.chatRoomId;
    var userValue = catalogSection.getUserObj(emplId);
    var aboutUserData = {
      "loginId" : userValue.loginId,
      "imgAlt" : userValue.loginId,
      "img": "../img/profile_img" + userValue.emplId % 10 + ".jpg",
    };

    $title.html("About this conversation");
    $contentArea.find("#about-user").append(Mustache.render(aboutUserTemplate, aboutUserData));

    $contentArea.find(".call").click(function() {
      hideSection(); // information Section
      adjustSectionSize(callSection.getSection(), 8);
      adjustSectionSize(chatSection.getSection(), 4);
      callSection.showSection();
      callSection.showCallInfo(emplId, userValue.loginId);
    });

    $contentArea.find(".screenShare").click(function() {
      screenshareSection.showDialog(emplId);
    });

    // TODO 현재는 사용자 선택시마다 API 호출 -> 캐시 기능 필요 ?
    var restPrams = {
      "coId": myPref.coId,
      "caller": myPref.emplId,
      "callee": activeChatInfo.chatRoomId
    };

    restResourse.callHistory.getListByCondition(restPrams, function(commonGridValue) {
      console.log("commonGridValue[totalPage:%d, totalRecords:%d]", commonGridValue.totalPage, commonGridValue.totalRecords);

      var callHistoryList = commonGridValue.rows;
      $.each(callHistoryList, function(idx, callHistoryRow) {
        callHistoryRow.callStart = new Date(callHistoryRow.callStart).format("M/D H:mm");
      });

      var callHistoryData = {
        "callHistoryList" : callHistoryList
      };

      $contentArea.append(Mustache.render(callHistoryTemplate, callHistoryData));
      $contentArea.find(".onDetailHistoryModal").bind("click", function() {
        var callHistoryId = $(this).closest("li").data("callhistoryid") ;
        var sendingData = {"callhistoryid" : callHistoryId };
        openModalDialog("/html/information/popup/detail_callhistory_popup.html", null, sendingData);
      });
    });

    resizeInformationSection();
    _informationSectionScroll();
    $informationSec.show();
  }

  function showAboutChannel() {
    loadHtml("/html/information/about_channel.html", $informationSec);
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
        "img": "../img/profile_img" + userValue.emplId % 10 + ".jpg",
      });
    }

    $contentArea.empty();
    $contentArea.prepend(Mustache.render(aboutChannelTemplate, aboutChannelData));

    $("#onInviteChannelModal").bind("click", function() {
      openModalDialog("/html/information/popup/invite_channel_popup.html");
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

            chatSection.sendMsg("left - " + myPref.loginId, constants.GROUP_CHAT, channelId); // 멤버 삭제 메시지 전송
          } else {
            console.log("[fail add memeber]" + response.statusMessage);
          }
        }
      );
    });

    resizeInformationSection();
    _informationSectionScroll();
    $informationSec.show();
  }

  function showMentionList(messages) {
    loadHtml("/html/information/mention_list.html", $informationSec);

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
            "img": "../img/profile_img" + row.spkrId % 10 + ".jpg",
            "imgAlt": sender.loginId,
            "channel": channel ? channel.name : "unknown",
            "sender": sender.loginId,
            "msgText": row.msg,
            "date": new Date(row.creTime).format("YYYY/MM/DD"),
            "time": new Date(row.creTime).format("a hh:mm")
          };

          messages.push(message);
        });

        $contentArea.empty();
        $title.html("Mention #" + myPref.loginId);
        for (var key = 0; key < messages.length; key++) {
          if(key === 0) {
            $contentArea.append(Mustache.render(mentionDateLineTemplate, {"date" : messages[key].date}));
          }
          if(messages[key - 1] && messages[key - 1].date != messages[key].date) {
            $contentArea.append(Mustache.render(mentionDateLineTemplate, {"date" : messages[key].date}));
          }
          $contentArea.append(Mustache.render(mentionTemplate, messages[key]));
        }
      }
    });
    resizeInformationSection();
    _informationSectionScroll();
    $informationSec.show();
  }

  function displayMember(members) {
    var $contentArea = $informationSec.find('.content_area');
    for(var key in members) {
      var userValue = catalogSection.getUserObj(members[key]);
      var imgUrl = "../img/profile_img" + userValue.emplId % 10 + ".jpg";
      $contentArea.find(".members").append("<li data-emplid='" + userValue.emplId + "'><a href='#'><img class='chat-avatar' src='" + imgUrl + "' alt='" + userValue.loginId + "'>" + userValue.loginId + "</a></li>");
    }
  }

  function hideMember(member) {
    var $contentArea = $informationSec.find('.content_area');
    $contentArea.find(".members [data-emplid='" + member + "']").remove();
  }

  function hideSection() {
    $informationSec.hide();
  }

  function showSection() {
    $informationSec.show();
  }

  function getSection() {
    return $informationSec;
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
    displayMember: displayMember,
    showMentionList: showMentionList,
    hideMember: hideMember,
    hideSection: hideSection,
    showSection: showSection,
    getSection: getSection
  };
})();

module.exports = informationSection;
