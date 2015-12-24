'use strict';

var connSection = (function() {
  var myPref;
  var chatModule;
  var chatSection;

  // cache DOM
  var $connSec;
  var $userListContext;
  var userTemplate;

  function _initialize(pref, chatMo, chatSec) {
    myPref = pref;
    chatModule = chatMo;
    chatSection = chatSec;

    $connSec = $(".connection_section");
    $userListContext = $connSec.find('.users_area .list');
    userTemplate = $userListContext.find('#user-template').html();

    $userListContext.delegate("li", "click", function() {
      $userListContext.find("li.active").removeClass("active");
      var $targetList = $(this);
      $targetList.addClass("active");

      chatSection.changeChatView($targetList.data("emp").emplId, $targetList.data("emp").loginId);
    });
  }

  function initConnSection(pref, chatMo, chatSec) {
    _initialize(pref, chatMo, chatSec);
    _initEmployees();
  }

  function _initEmployees() {
    var coId = myPref.login.coId;
    console.log("call _initEmployees[coId:%s]", coId);

    var params = {
      "coId": coId
    };
    restResourse.empl.getListByCoid(params, function(data) {
      var userListArray = [];

      if (data.rows) {
        $.each(data.rows, function(idx, row) {
          if (row.emplId === myPref.login.emplId)
            return;

          // img file (TODO 이후 사용자 이미지를 서버에 저장할 경우 photoLoc 정보를 이용하여 서버에서 가져와 로컬에 저장)
          var imgIdx = row.emplId % 10;
          var imgFile = "file://" + path.join(__dirname, '../../../img/profile_img' + imgIdx + '.jpg');
          var userData = {
            "user": [{
              "emplId": row.emplId,
              "loginId": row.loginId,
              "img": imgFile,
              "imgAlt": row.name
            }]
          };
          $userListContext.append(Mustache.render(userTemplate, userData));

          // to init client of chat
          userListArray.push(row.emplId);
        });

        chatModule.initClient([], userListArray);
      }
    });
  }

  function getCurrentChattingTarget() {
    return $userListContext.find('.active').data("emp").emplId;
  }

  return {
    initConnSection: initConnSection,
    getCurrentChattingTarget: getCurrentChattingTarget
  };
})();

module.exports = connSection;
