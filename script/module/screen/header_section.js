'use strict';

var headerSec = (function() {
  // cache DOM
  var $headerSec;
  var $titleArea;
  var $title;

  function _initialize() {
    $headerSec = $("#header-section");
    $titleArea = $headerSec.find(".title_area");
    $title = $headerSec.find(".tit");

    $headerSec.find(".call-menulink").click(function() {
      informationSection.adjustAsideArea(true);
    });

    $headerSec.find(".mention").click(function() {
      informationSection.showMentionList();
    });
  }

  function initHeaderSection() {
    _initialize()
  }

  function loadHeaderSection() {
    loadHtml("./html/header/header_section.html", $("#header-section"));
  }

  function setTitle(chatType, text) {
    $title.html(text);
  }

  return {
    initHeaderSection: initHeaderSection,
    loadHeaderSection: loadHeaderSection,
    setTitle: setTitle
  };
})();

module.exports = headerSec;
