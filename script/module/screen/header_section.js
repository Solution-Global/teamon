'use strict';

var headerSec = (function() {
  var myPref;
  var asideSection;

  // cache DOM
  var $headerSec;
  var $titleArea;
  var $title;

  function _initialize(pref, asideSec) {
    myPref = pref;
    asideSection = asideSec;

    $headerSec = $(".header_section");
    $titleArea = $headerSec.find(".title_area");
    $title = $headerSec.find(".tit");

    $headerSec.find(".call-menulink").click(function() {
      asideSection.adjustAsideArea(true);
    });
  }

  function initHeaderSection(pref, asideSec) {
    _initialize(pref, asideSec)
  }

  function setTitle(text) {
    $title.html(text);
  }

  return {
    initHeaderSection: initHeaderSection,
    setTitle: setTitle
  };
})();

module.exports = headerSec;
