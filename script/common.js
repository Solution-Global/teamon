function getModalData(key) {
  return $(".modal").data(key);
}

function openModalDialog(url, options, data) {
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

  var rtMsg;
  if(runningChannel === constants.CHANNEL_WEB) {
    // For Browser
    data = "<div>test</div>";
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
