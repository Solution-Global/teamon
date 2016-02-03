'use strict';

var asideSection = (function() {
  var myPref;
  var callSection;

  // cache DOM
  var $asideSec;
  var $titleArea;
  var $title;
  var $contentArea;

  var aboutChannelTemplate;
  var aboutUserTemplate;

  function _initialize(pref, callSec) {
    myPref = pref;
    callSection = callSec;

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

  function initAsideSection(pref, callSec) {
    _initialize(pref, callSec)
  }

  function showAboutUser(emplId, userCache) {
    var userValue = userCache.get(emplId);

    var aboutUserData = {
      "loginId" : userValue.loginId,
      "imgAlt" : userValue.loginId,
      "img": "../img/profile_img" + userValue.emplId + ".jpg",
    };

    $title.html("About this conversation");
    $contentArea.find(".content_area").remove();
    $contentArea.prepend(Mustache.render(aboutUserTemplate, aboutUserData));

    $contentArea.find(".call").click(function() {
      $('.chatAndAside_section').hide();
      $('.call_section').show();
      callSection.showCallInfo(emplId, userValue.loginI);
    });
  }

  function showAboutChannel(channelId, members, userCache, channelCache) {
    var channelValue = channelCache.get(channelId);
    var membersArray = String(members).split(",");
    var memberCount = membersArray.length;

    $title.html("About #" + channelValue.name);
    var aboutChannelData = {
      "pinupMessage": channelValue.pinupMessage || "There are no purpose.",
      "memberCount": memberCount,
      "members":[]
    };

    for(var key in membersArray) {
      var userValue = userCache.get(membersArray[key]);
      aboutChannelData.members.push({
        "loginId" : userValue.loginId,
        "imgAlt" : userValue.loginId,
        "img": "../img/profile_img" + userValue.emplId + ".jpg",
      });
    }

    $contentArea.find(".content_area").remove();
    $contentArea.prepend(Mustache.render(aboutChannelTemplate, aboutChannelData));

    $contentArea.find(".addMember").click(function() {
      var inviteChannelModal = $("#inviteChannelModal");
      var chosenSelect = inviteChannelModal.find(".chosen-select");
      chosenSelect.find("option").remove();

      var userArray = userCache.getValueArray();
      for(var key in userArray) {
        var userValue = userArray[key];
        var isMember = membersArray.indexOf(String(userValue.emplId));
        if(isMember < 0)
          chosenSelect.append("<option value='" + userValue.emplId + "'>" + userValue.loginId + "</option>");
      }
      chosenSelect.chosen({width:"100%"});
      inviteChannelModal.modal();
    });
  }

  return {
    initAsideSection: initAsideSection,
    showAboutChannel: showAboutChannel,
    showAboutUser: showAboutUser,
    adjustAsideArea: adjustAsideArea
  };
})();

module.exports = asideSection;
