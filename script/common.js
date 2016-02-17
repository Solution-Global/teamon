var fs = require('fs');

/* String prototype */
String.prototype.string = function(len) {
  var s = '',
    i = 0;
  while (i++ < len) {
    s += this;
  }
  return s;
};
String.prototype.zf = function(len) {
  return "0".string(len - this.length) + this;
};

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

/* Number prototype */
Number.prototype.zf = function(len) {
  return this.toString().zf(len);
};

/* Date prototype */
Date.prototype.format = function(f) {
  if (!this.valueOf()) return " ";

  var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  var d = this;

  return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
    switch ($1) {
      case "yyyy":
        return d.getFullYear();
      case "yy":
        return (d.getFullYear() % 1000).zf(2);
      case "MM":
        return (d.getMonth() + 1).zf(2);
      case "dd":
        return d.getDate().zf(2);
      case "E":
        return weekName[d.getDay()];
      case "HH":
        return d.getHours().zf(2);
      case "hh":
        return ((h = d.getHours() % 12) ? h : 12).zf(2);
      case "mm":
        return d.getMinutes().zf(2);
      case "ss":
        return d.getSeconds().zf(2);
      case "a/p":
        return d.getHours() < 12 ? "오전" : "오후";
      default:
        return $1;
    }
  });
};

function loadHtml(fileName, target) {
  var div = target;
  if(typeof target === 'string') {
    div = $("#" + target);
  }

  var data = fs.readFileSync(fileName, 'utf-8');
  var rtMsg = jQuery.trim(data);
  div.html(rtMsg);
}

function getModalData(key) {
  return $(".modal").data(key);
}

function openModalDialog(fileName, data, options) {
  var dialogId = randomHashCode();
	var defaultOptions = {
    show : true
	};

  var div = $("<div>").attr("id", dialogId).addClass("modal inmodal").attr("role", "dialog");

  var keys = Object.keys(data);
  $.each(keys, function(idx, row) {
    div.attr("data-" + keys, data[row]);
  });

	$("body").append(div);
  var data = fs.readFileSync(fileName, 'utf-8');
  var rtMsg = jQuery.trim(data);
  div.html(rtMsg);
  div.modal(options ? $.extend({}, defaultOptions, options) : defaultOptions);
	div.on("hidden.bs.modal", function() {
		$(this).remove();
	});
	return div;
}

randomHashCode = function() {
	return hashCode((new Date().getTime() * Math.random()).toString());
};
hashCode = function(s) {
	return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);
};
