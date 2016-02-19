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
Date.prototype.add = function(offset, unit) {
	if (!unit)
		throw "unit is undefined";
	return moment(this).tz(timezone).add(offset, unit).toDate();
}

Date.prototype.format = function(formatStr) {
	if (!formatStr)
		throw "the format is not defined";
	return moment(this).tz(timezone).format(formatStr);
}

Date.prototype.parse = function(dateStr, formatStr) {
	if (!formatStr)
		throw "the format is not defined";
	return moment(dateStr, formatStr).tz(timezone);
}

/* String prototype */
String.prototype.startsWith = function(str) {
	if (this.indexOf(str) > -1 && this[0] === str[0])
		return true;
	return false;
}

String.prototype.endsWith = function(str) {
	if (this.indexOf(str) > -1 && this[this.length-1] === str[str.length-1])
		return true;
	return false;
}

String.prototype.byteLength = function() {
	var l= 0;
	for (var idx = 0; idx < this.length; idx++) {
		var c = escape(this.charAt(idx));
		if (c.length == 1)
			l ++;
		else if (c.indexOf("%u") != -1)
			l += 2;
		else if (c.indexOf("%") != -1)
			l += c.length / 3;
	}
	return l;
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

function openModalDialog(fileName, options, data) {
  var dialogId = randomHashCode();
	var defaultOptions = {
    show : false
	};

  var div = $("<div>").attr("id", dialogId).addClass("modal inmodal").attr("role", "dialog");

  if(data) {
    var keys = Object.keys(data);
    $.each(keys, function(idx, row) {
      div.attr("data-" + keys, data[row]);
    });
  }

	$("body").append(div);
  var data = fs.readFileSync(fileName, 'utf-8');
  var rtMsg = jQuery.trim(data);
  div.html(rtMsg);
  div.modal(options ? $.extend({}, defaultOptions, options) : defaultOptions);
  div.on('shown.bs.modal', function (e) {
    if(options && options.backgroundOpacity) {
      $(".modal-backdrop.in").css({ "opacity": options.backgroundOpacity });
    }
    if(options && options.backgroundColor) {
      $(".modal-backdrop").css({ "background-color": options.backgroundColor });
    }
  });
  div.modal('show');
  div.on("hidden.bs.modal", function() {
  	$(this).remove();
  });
	return div;
}

function adjustSectionSize($target, size) {
  var colXs = "col-xs-" + size,
    colSm = "col-sm-" + size,
    colMd = "col-md-" + size,
    colLg = "col-lg-" + size;

  $target.removeClass("col-*").addClass(colXs).addClass(colSm).addClass(colMd).addClass(colLg);
}

randomHashCode = function() {
	return hashCode((new Date().getTime() * Math.random()).toString());
};
hashCode = function(s) {
	return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);
};
