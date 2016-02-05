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
  }

  function initHeaderSection() {
    _initialize()
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
