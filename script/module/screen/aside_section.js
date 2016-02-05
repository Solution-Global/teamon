'use strict';

var asideSection = (function() {
  // cache DOM
  var $asideSec;
  var $titleArea;
  var $title;
  var $contentArea;

  var aboutChannelTemplate;
  var aboutUserTemplate;

  function _initialize() {
    $asideSec = $(".aside_section");
    $titleArea = $asideSec.find(".ibox-title");
    $title = $titleArea.find(".title");
    $contentArea = $asideSec.find('.ibox-content');
    aboutChannelTemplate = $asideSec.find('#aboutChannel-template').html();
    aboutUserTemplate = $asideSec.find('#aboutUser-template').html();

    // Close ibox function
    $asideSec.find(".aside-close-link").click(function() {
      adjustAsideArea();
    });
  }

  function adjustAsideArea(isOpen) {
    var chatSection = $('.chat_section');
    var asideIbox = $(".aside_section .ibox");
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

  function showAboutUser(emplId) {
    var userValue = connSection.getUserObj(emplId);

    var aboutUserData = {
      "loginId" : userValue.loginId,
      "imgAlt" : userValue.loginId,
      "img": "../img/profile_img" + userValue.emplId + ".jpg",
    };

    $title.html("About this conversation");
    $contentArea.find(".content_area").remove();
    $contentArea.prepend(Mustache.render(aboutUserTemplate, aboutUserData));

    $contentArea.find(".call").click(function() {
      callSection.showSection();
      chatSection.hideSection(); // chat Area

      callSection.showCallInfo(emplId, userValue.loginI);
    });
  }

  function showAboutChannel(channelId) {
    var channelValue = connSection.getChannelObj(channelId);
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
      var userValue = connSection.getUserObj(membersArray[key]);
      aboutChannelData.members.push({
        "loginId" : userValue.loginId,
        "emplId" : userValue.emplId,
        "imgAlt" : userValue.loginId,
        "img": "../img/profile_img" + userValue.emplId + ".jpg",
      });
    }

    $contentArea.find(".content_area").remove();
    $contentArea.prepend(Mustache.render(aboutChannelTemplate, aboutChannelData));

    $contentArea.find(".addMember").bind("click", function() {
      var $inviteChannelModal = $("#inviteChannelModal");
      var chosenSelect = $inviteChannelModal.find(".chosen-select");
      chosenSelect.find("option").remove();

      var userArray = connSection.getUsers();
      for(var key in userArray) {
        var userValue = userArray[key];
        var isMember = membersArray.indexOf(String(userValue.emplId));
        if(isMember < 0)
          chosenSelect.append("<option value='" + userValue.emplId + "'>" + userValue.loginId + "</option>");
      }
      chosenSelect.chosen({width:"100%"});
      $inviteChannelModal.modal();

      // set event for new create channel
      $inviteChannelModal.find(".invite").one("click", function() {
        var $inviteChannelForm = $("#inviteChannelForm");

        var newMembers = $inviteChannelForm.find("[name=members]").val();
        var params = {
          "channelId": channelId,
          "members": newMembers,
        };

        restResourse.channel.addMember(params,
          function(response) {
            // Success
            if(response.statusCode === 200) {
              // 새로운 추가운 사용자 대상으로 그룹 가입 권고
              var paramsForNewMember = {
                "type": constants.GROUP_CREATE,
                "channelId": channelId,
                "name" : channelValue.name
              }

              var loginIds = "";
              for(var key in newMembers) {
                chatModule.sendCommand(newMembers[key], paramsForNewMember);
                var memberInfo = connSection.getUserObj(newMembers[key]);
                loginIds += " #" + memberInfo.loginId;
              }

              // 기존 사용자에게 멤버 추가
              var paramsForExistMember = {
                "type": constants.GROUP_ADD_MEMBER,
                "channelId": channelId,
                "newMembers": newMembers
              }

              for(var member in existMembers) {
                chatModule.sendCommand(member, paramsForExistMember);
              }

              chatSection.sendMsg("Invite members - " + loginIds, constants.GROUP_CHAT, channelId); // 멤버 추가 메시지 전송

              // form reset
              $inviteChannelForm.each(function() {
                if(this.className  == "frmClass") this.reset();
              });

              $inviteChannelModal.modal("hide");
            } else {
              console.log("[fail add memeber]" + response.statusMessage);
            }
          }
        );
      });
    });

    $contentArea.find(".leaveChannel").click(function() {
      var params = {
        "channelId": channelId,
        "members": myPref.emplId,
      };

      restResourse.channel.removeMember(params,
        function(response) {
          if(response.statusCode === 200) {

            var channelValue = connSection.getChannelObj(channelId);
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
  }

  function displayMember(members) {
    for(var key in members) {
      var userValue = connSection.getUserObj(members[key]);
      var imgUrl = "../img/profile_img" + userValue.emplId + ".jpg";
      $contentArea.find(".members").append("<li data-emplid='" + userValue.emplId + "'><a href='#'><img class='chat-avatar' src='" + imgUrl + "' alt='" + userValue.loginId + "'>" + userValue.loginId + "</a></li>");
    }
  }

  function hideMember(member) {
    $contentArea.find(".members [data-emplid='" + member + "']").remove();
  }

  function hideSection() {
    $asideSec.hide();
  }

  function showSection() {
    $asideSec.show();
  }

  return {
    initAsideSection: initAsideSection,
    showAboutChannel: showAboutChannel,
    showAboutUser: showAboutUser,
    adjustAsideArea: adjustAsideArea,
    displayMember: displayMember,
    hideMember: hideMember,
    hideSection: hideSection,
    showSection: showSection
  };
})();

module.exports = asideSection;
