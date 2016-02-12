!function($){

  "use strict"; // jshint ;_;

  var Metion = function (element, options) {
    //console.log(element);
    this.$element = $(element)
    this.options = $.extend({}, $.fn.mention.defaults, options)
    this.matcher = this.options.matcher || this.matcher
    this.sorter = this.options.sorter || this.sorter
    this.highlighter = this.options.highlighter || this.highlighter
    this.updater = this.options.updater || this.updater
    this.users = this.options.users
    this.$menu = $(this.options.menu)
    this.shown = false
    this.listen()
  }

  Metion.prototype = {

    constructor: Metion

  , select: function () {
      var val = this.$menu.find('.active').attr('data-value')
      this.$element
        .val(this.updater(val))
        .change()
      return this.hide()
    }

  , updater: function(item) {
      var data = this.query,
          caratPos = this.$element[0].selectionStart,
          i;

      for (i = caratPos; i >= 0; i--) {
          if (data[i] == this.options.delimiter) {
              break;
          }
      }
      var replace = data.substring(i, caratPos),
        textBefore = data.substring(0, i),
        textAfter = data.substring(caratPos),
        data = textBefore + this.options.delimiter + item + textAfter;

      this.tempQuery = data;

      return data;
  }

  , show: function () {

      // 처음 한번만
      if (this.eventSupported('keydown')) {
        this.$element.on('keydown', $.proxy(this.keydown, this))
      }

      var pos = $.extend({}, this.$element.position(), {
        height: this.$element[0].offsetHeight
      })

      this.$menu
        .insertAfter(this.$element)
        .css({
          // top: pos.top + pos.height : 아래 방향 fix - anna
          top: - (pos.top + this.$menu.height())
        , left: pos.left
        })
        .show()

      this.shown = true
      return this
    }

  , hide: function () {
      this.$menu.hide()
      this.shown = false

      // hide action
      if(this.options.ending) {
        this.options.ending();
      }
      return this
    }

  , lookup: function (event) {
      var items

      this.query = this.$element.val()

      if (!this.query || this.query.length < this.options.minLength) {
        return this.shown ? this.hide() : this
      }

      items = $.isFunction(this.users) ? this.users(this.query, $.proxy(this.process, this)) : this.users

      return items ? this.process(items) : this
    }

  , process: function (items) {
      var that = this

      items = $.grep(items, function (item) {
        return that.matcher(item)
      })

      items = this.sorter(items)

      if (!items.length) {
        return this.shown ? this.hide() : this
      }


      return this.render(items.slice(0, this.options.items)).show()
    }

  , extractCurrentQuery : function(query, caratPos) {
      var i;
      for (i = caratPos; i >= 0; i--) {
          if (query[i] == this.options.delimiter) {
              break;
          }
      }
      return query.substring(i, caratPos);
  }

  , matcher: function(itemProps) {
      var i;

      if(this.options.emptyQuery){
        var q = (this.query.toLowerCase()),
          caratPos = this.$element[0].selectionStart,
          lastChar = q.slice(caratPos-1,caratPos);
        if(lastChar==this.options.delimiter){
          return true;
        }
      }

      for (i in this.options.queryBy) {
          if (itemProps[this.options.queryBy[i]]) {
              var item = itemProps[this.options.queryBy[i]].toLowerCase(),
                  usernames = (this.query.toLowerCase()).match(new RegExp(this.options.delimiter + '\\w+', "g")),
                  j;

              if ( !! usernames) {
                  for (j = 0; j < usernames.length; j++) {

                      var username = (usernames[j].substring(1)).toLowerCase(),
                          re = new RegExp(this.options.delimiter + item, "g"),
                          used = ((this.query.toLowerCase()).match(re));

                      if (item.indexOf(username) != -1 && used === null) {
                          return true;
                      }
                  }
              }
          }
      }
  }

  , sorter: function(items) {
      if (items.length && this.options.sensitive) {
          var currentUser = this.extractCurrentQuery(this.query, this.$element[0].selectionStart).substring(1),
              i, len = items.length,
              priorities = {
                  highest: [],
                  high: [],
                  med: [],
                  low: []
              }, finals = [];
          if (currentUser.length == 1) {
              for (i = 0; i < len; i++) {
                  var currentRes = items[i];

                  if ((currentRes.username[0] == currentUser)) {
                      priorities.highest.push(currentRes);
                  }
                  else if ((currentRes.username[0].toLowerCase() == currentUser.toLowerCase())) {
                      priorities.high.push(currentRes);
                  }
                  else if (currentRes.username.indexOf(currentUser) != -1) {
                      priorities.med.push(currentRes);
                  }
                  else {
                      priorities.low.push(currentRes);
                  }
              }
              for (i in priorities) {
                  var j;
                  for (j in priorities[i]) {
                      finals.push(priorities[i][j]);
                  }
              }
              return finals;
          }
      }
      return items;
  }

  , highlighter: function (item) {
      var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
      return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
        return '<strong>' + match + '</strong>'
      })
    }

  , render: function(items) {
      var that = this;
      items = $(items).map(function(i, item) {

          i = $(that.options.item).attr('data-value', item.username);

          var _linkHtml = $('<div />');

          if (item.image) {
              _linkHtml.append('<img class="mention_image" src="' + item.image + '">');
          }
          if (item.name) {
              _linkHtml.append('<b class="mention_name">' + item.name + '</b>');
          }
          if (item.username) {
              _linkHtml.append('<span class="mention_username"> ' + that.options.delimiter + item.username + '</span>');
          }

          i.find('a').html(that.highlighter(_linkHtml.html()));
          return i[0];
      });

      items.first().addClass('active');
      this.$menu.html(items);
      return this;
  }

  , next: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , next = active.next()

      if (!next.length) {
        next = $(this.$menu.find('li')[0])
      }

      next.addClass('active')
    }

  , prev: function (event) {
      var active = this.$menu.find('.active').removeClass('active')
        , prev = active.prev()

      if (!prev.length) {
        prev = this.$menu.find('li').last()
      }

      prev.addClass('active')
    }

  , listen: function () {
      this.$element
        .on('focus',    $.proxy(this.focus, this))
        .on('blur',     $.proxy(this.blur, this))
        .on('keypress', $.proxy(this.keypress, this))
        .on('keyup',    $.proxy(this.keyup, this))

      // if (this.eventSupported('keydown')) {
      //   this.$element.on('keydown', $.proxy(this.keydown, this))
      // }

      this.$menu
        .on('click', $.proxy(this.click, this))
        .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        .on('mouseleave', 'li', $.proxy(this.mouseleave, this))
    }

  , eventSupported: function(eventName) {
      var isSupported = eventName in this.$element
      if (!isSupported) {
        this.$element.setAttribute(eventName, 'return;')
        isSupported = typeof this.$element[eventName] === 'function'
      }
      return isSupported
    }

  , move: function (e) {
      if (!this.shown) return

      switch(e.keyCode) {
        case 9: // tab
        case 13: // enter
        case 27: // escape
          e.preventDefault()
          break

        case 38: // up arrow
          e.preventDefault()
          this.prev()
          break

        case 40: // down arrow
          e.preventDefault()
          this.next()
          break
      }

      e.stopPropagation()
    }

  , keydown: function (e) {
      this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27])
      this.move(e)
    }

  , keypress: function (e) {
      if (this.suppressKeyPressRepeat) return
      this.move(e)
    }

  , keyup: function (e) {
      switch(e.keyCode) {
        case 40: // down arrow
        case 38: // up arrow
        case 16: // shift
        case 17: // ctrl
        case 18: // alt
          break

        case 9: // tab
        case 13: // enter
          if (!this.shown) return
          this.select()
          break

        case 27: // escape
          if (!this.shown) return
          this.hide()
          break

        default:
          this.lookup()
      }

      e.stopPropagation()
      e.preventDefault()
  }

  , focus: function (e) {
      this.focused = true
    }

  , blur: function (e) {
      this.focused = false
      if (!this.mousedover && this.shown) this.hide()
    }

  , click: function (e) {
      e.stopPropagation()
      e.preventDefault()
      this.select()
      this.$element.focus()
    }

  , mouseenter: function (e) {
      this.mousedover = true
      this.$menu.find('.active').removeClass('active')
      $(e.currentTarget).addClass('active')
    }

  , mouseleave: function (e) {
      this.mousedover = false
      if (!this.focused && this.shown) this.hide()
    }

  , updateUsers: function(value) {
      this.users = undefined;
      this.users = value;
    }

  }

  /* METION PLUGIN DEFINITION
   * =========================== */

  var old = $.fn.mention

  $.fn.mention = function (option, value) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('mention')
        , options = typeof option == 'object' && option
      if (!data)
        $this.data('mention', (data = new Metion(this, options)))
      if (typeof option == 'string')
        data[option](value);
    })
  }

  $.fn.mention.defaults = {
    users: []
  , delimiter: '@'
  , sensitive: true
  , emptyQuery: false
  , queryBy: ['name', 'username']
  , items: 8
  , menu: '<ul class="mention dropdown-menu"></ul>'
  , item: '<li><a href="#"></a></li>'
  , minLength: 1
  }

  $.fn.mention.Constructor = Metion


 /* METION NO CONFLICT
  * =================== */

  $.fn.mention.noConflict = function () {
    $.fn.mention = old
    return this
  }


 /* METION DATA-API
  * ================== */

  $(document).on('focus.mention.data-api', '[data-provide="mention"]', function (e) {
    var $this = $(this)
    if ($this.data('mention')) return
    $this.mention($this.data())
  })

}(window.jQuery);
