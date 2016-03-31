function getModalData(key) {
  return $(".modal").data(key);
}

function openModalDialog(url, options, data) {
  var dialogId = randomHashCode();
	var defaultOptions = {
    show : false
	};

  var div = $("<div>").attr("id", dialogId).addClass("modal inmodal").attr("role", "dialog");
  removeDataAttributes(div);
  if(data) {
    var keys = Object.keys(data);
    $.each(keys, function(idx, row) {
      div.attr("data-" + keys, data[row]);
    });
  }

	$("body").append(div);

  var rtMsg;
  if(runningChannel === constants.CHANNEL_WEB) {
    // For Browser
    $.ajax({
      type: 'GET',
      url: url,
      async: false,
      success: function(html) {
        rtMsg = html;
      }
    });
  } else {
    // For desktop
    if (url.startsWith("/"))
      url = appRootPath + url;
    rtMsg = fs.readFileSync(url, 'utf-8');
  }

  rtMsg = jQuery.trim(rtMsg);
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

randomHashCode = function() {
	return hashCode((new Date().getTime() * Math.random()).toString());
};
hashCode = function(s) {
	return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);
};

function removeDataAttributes(target) {
  var i,
      $target = $(target),
      attrName,
      dataAttrsToDelete = [],
      dataAttrs = $target.get(0).attributes,
      dataAttrsLen = dataAttrs.length;

  for (i=0; i<dataAttrsLen; i++) {
      if ( 'data-' === dataAttrs[i].name.substring(0,5) ) {
          dataAttrsToDelete.push(dataAttrs[i].name);
      }
  }
  $.each( dataAttrsToDelete, function( index, attrName ) {
      $target.removeAttr( attrName );
  });
}

function loadHtml(url, target, data) {
  var div = target;
  if(typeof target === 'string') {
    div = $("#" + target);
  }

  removeDataAttributes(div);
  var htmlStr;
  if(data) {
    var keys = Object.keys(data);
    $.each(keys, function(idx, row) {
      div.attr("data-" + keys.toString(), data[row]);
    });
  }

  if(runningChannel === constants.CHANNEL_WEB) {
    // For Browser
    $.ajax({
      type: 'GET',
      url: url,
      async: false,
      success: function(value) {
        htmlStr = value;
      }
    });
  } else {
    // For desktop
    if (url.startsWith("/"))
      url = appRootPath + url;
    htmlStr = fs.readFileSync(url, 'utf-8');
  }

  var rtMsg = jQuery.trim(htmlStr);
  div.html(rtMsg);
}

function generateTopic(emplId1, emplId2) {
  var emplIds = [emplId1, emplId2];
  return Math.min.apply(null, emplIds) + "_" + Math.max.apply(null, emplIds);
}

function getChatType(topic) {
  if(topic.startsWith(constants.CHANNEL_TOPIC_DELIMITER)) {
    return constants.CHANNEL_CHAT;
  } else {
    return constants.DIRECT_CHAT;
  }
}

function getChannelTopicName(name) {
  if(name.startsWith(constants.CHANNEL_TOPIC_DELIMITER)) {
    name = name.substr(1, name.length);
  }
  return loginInfo.teamId + constants.TOPIC_MSG + "/" + constants.CHANNEL_CHAT + "/" + name;
}

/* Date prototype */
Date.prototype.add = function(offset, unit) {
	if (!unit)
		throw "unit is undefined";
	return moment(this).tz(timezone).add(offset, unit).toDate();
};

Date.prototype.format = function(formatStr) {
	if (!formatStr)
		throw "the format is not defined";
	return moment(this).tz(timezone).format(formatStr);
};

Date.prototype.parse = function(dateStr, formatStr) {
	if (!formatStr)
		throw "the format is not defined";
	return moment(dateStr, formatStr).tz(timezone);
};

// simple plugin definition
(function($) {
	$.fn.serializeObject = function() {
		var o = {};
		var a = this.serializeArray();
		$.each(a, function() {
			if (this.value === null || this.value === "")
				return;
			if (o[this.name]) {
				if (!o[this.name].push) {
					o[this.name] = [o[this.name]];
				}
				o[this.name].push(this.value || "");
			} else {
				o[this.name] = this.value || "";
			}
		});
		return o;
	};

	// selects elements that have same "name" attribute
	$.fn.nameFind = function(selector) {
		if ("*^$~!|".indexOf(selector.charAt(0)) > -1)
			return $(this).find("[name"+selector.charAt(0)+"="+selector.substr(1)+"]");
		else
			return $(this).find("[name="+selector+"]");
	};
})(jQuery);

jQuery.validator.addMethod("specialcharacter", function(value, element) {
  var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"\s]/;
  return this.optional(element) || !regExp.test(value);
}, "Please avoid the special characters.");
