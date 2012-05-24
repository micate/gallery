/**
 * 类腾讯高清组图展示组件
 *
 * @copyright (c) CmsTop {@link http://www.cmstop.com}
 * @author    micate {@link http://micate.me}
 * @homepage  @github {@link http://github.com/micate/gallery}
 * @version   $Id$
 */
(function($, root) {

    Array.prototype.indexOf || (Array.prototype.indexOf = function(searchElement, fromIndex) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var self = Object(this),
            len = self.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) {
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in self && self[k] === searchElement) {
                return k;
            }
        }
        return -1;
    });

    var IE6 = $.browser.msie && $.browser.version == '6.0',
        toString = Object.prototype.toString,
        isString = function(val) {
            return toString.call(val) === '[object String]';
        },
        isPlainObject = function(val) {
            return val && toString.call(val) === '[object Object]' && 'isPrototypeOf' in val;
        },
        isFunction = function(val) {
            return toString.call(val) === '[object Function]';
        },
        isArray = Array.isArray || function(val) {
            return toString.call(val) === '[object Array]';
        },
        each = function() {
            var R_SPLIT = /[\s|,]+/;
            return function(val, func) {
                if (! val || ! isFunction(func)) {
                    return;
                }
                val = val.split(R_SPLIT);
                for (var index = 0, length = val.length, item = val[index];
                     index < length && func.call(item, item, index) !== false;
                     item = val[++index]) {
                }
            };
        }(),
        clone = function(object) {
            if (object == null || typeof object != 'object') {
                return object;
            }
            var temp = new object.constructor(), key;
            for (key in object) {
                if (object[key] === object) {
                    continue;
                }
                temp[key] = clone(object[key]);
            }
            return temp;
        },
        ucfirst = function(val) {
            if (! isString(val)) {
                return val;
            }
            return val.charAt(0).toUpperCase() + val.slice(1);
        },
        template = function(template, values) {
            var key;
            values = isPlainObject(values) ? values : {};
            for (key in values) {
                if (values.hasOwnProperty(key)) {
                    template = template.replace(new RegExp('{' + key + '}', 'gm'), values[key] || '');
                }
            }
            return template;
        };

    /**
     * 轻量级的 Class.extend() 实现，来自 John Resig
     *
     * 修改了默认的 _super() 方法为 parent()
     *
     * @link http://ejohn.org/blog/simple-javascript-inheritance/
     */
    var Class = function() {
        var initializing = false,
            fnTest = /xyz/.test(function() {xyz;}) ? /\bparent\b/ : /.*/,
            Class = function() {};
        Class.extend = function(proporties) {
            var parent = this.prototype;

            initializing = true;
            var prototype = new this();
            initializing = false;

            for (var name in proporties) {
                if (typeof proporties[name] == 'function'
                    && typeof parent[name] == 'function'
                    && fnTest.test(proporties[name])) {
                    prototype[name] = (function(name, func) {
                        return function() {
                            var temp = this.parent;
                            this.parent = parent[name];
                            var ret = func.apply(this, arguments);
                            this.parent = temp;
                            return ret;
                        };
                    })(name, proporties[name]);
                } else if (isArray(proporties[name])) {
                    prototype[name] = proporties[name].slice();
                } else if (isPlainObject(proporties[name])) {
                    prototype[name] = clone(proporties[name]);
                } else {
                    prototype[name] = proporties[name];
                }
            }

            function Class() {
                if (! initializing && this.init) {
                    this.init.apply(this, arguments);
                }
            }

            Class.prototype = prototype;
            Class.prototype.constructor = Class;
            Class.extend = arguments.callee;

            return Class;
        };
        return Class;
    }();

    var Base = Class.extend({
        name: '',
        element: null,
        guid: null,
        _eventNames: '',
        init: function(options) {
            var self = this;
            if (! isPlainObject(options) || ! options.element) {
                throw new TypeError('参数不正确');
            }
            options = this.options = $.extend({}, this.OPTIONS, options);
            this.guid = this.name.toUpperCase() + ((new Date()).getTime().toString(16));
            this.element = this.options.element.jquery ? this.options.element : $(this.options.element);
            each(this._eventNames, function(event) {
                event = ucfirst(event);
                var before = 'before' + event,
                    after = 'after' + event;
                options[before] && (self.bind(before, options[before]));
                options[after] && (self.bind(after, options[after]));
            });
            return this;
        },
        find: function(name, context) {
            return (context && context.jquery ? context : this.element).find('[data-' + this.name + '=' + name + ']');
        },
        bind: function(event, func) {
            (event in this.events) || (this.events[event] = []);
            this.events[event].push(func);
            return this;
        },
        trigger: function(event, args) {
            if (event in this.events) {
                for (var index = 0, func;
                     (func = this.events[event][index++]) && (func.apply(this, args || []) !== false); ) {
                }
            }
            return this;
        }
    });

    var Slider = Base.extend({
        OPTIONS: {
            element: null,
            photos: [],
            photoWidth: 100,
            photoHeight: 75,
            currentClass: 'current',
            current: 0
        },
        name: 'slider',
        options: {},
        events: {},

        _eventNames: 'render show drag',

        _width: 0,
        _itemWidth: 0,
        _totalWidth: 0,
        _visibleWidth: 0,
        _visibleSize: 0,

        _total: 0,
        _current: -1,
        _draging: false,

        _control: null,
        _bar: null,
        _items: null,
        _btn: null,

        init: function(options) {
            this.parent(options);

            if (! isArray(this.options.photos)) {
                this.options.photos = [];
            }

            this._width = this.element.width();
            this._control = this.find('control');
            this._bar = this.find('bar');
            this._items = this.find('items');
            this._total = this.options.photos.length;
            this._btn = this.find('btn');

            this.render();
            return this;
        },
        render: function() {
            var self = this,
                o = this.options,
                items = this._items.empty().show(),
                index = 0, total = o.photos.length;

            this.trigger('beforeRender');

            // 构建列表
            $.each(o.photos, function(index, photo) {
                var item = $('<li><a hideFocus="true" href="javascript:void(0);"><img /></a></li>')
                    .attr('data-slider-index', index);
                item.find('a,img').css({
                    width: o.photoWidth,
                    height: o.photoHeight
                });
                item.find('img').attr('src', photo.thumb || photo).attr('alt', photo.note || '');
                item.click(function() {
                    self.show(index);
                }).appendTo(items);
                if (! self._itemWidth) {
                    self._itemWidth = item.outerWidth(true);
                }
            });

            // 修正缩略图列表的宽度
            this._totalWidth = this._itemWidth * total;
            items.css('width', this._totalWidth).show();

            // 计算一些数值
            this._visibleWidth = items.parent().innerWidth();
            this._visibleSize = Math.floor(this._visibleWidth / this._itemWidth);

            // 显示预设缩略图
            this.show(o.current || 0);

            // 初始化滚动条
            if (this._bar && this._bar.length) {
                this.renderScrollbar();
            }

            this.trigger('afterRender');
            return this;
        },
        show: function(index) {
            var o = this.options,
                items = this._items,
                item = items.children().eq(index);

            if (! item.length || index === this._current) {
                return false;
            }

            this.trigger('beforeShow', [index]);

            items.children().eq(this._current).removeClass(o.currentClass);
            item.addClass(o.currentClass);

            var total = this._total,
                visibleSize = this._visibleSize,              // 可见个数
                centerSize = Math.ceil(visibleSize / 2),      // 水平居中的个数
                pos = 0;                                      // 最终用来计算的位置值

            // 总数大于可见数时才滚动
            if (total > visibleSize) {
                if (index < centerSize) { // 靠近开始
                    pos = 0;
                } else if ((total - (index + 1)) < centerSize) { // 靠近结束
                    pos = total - visibleSize;
                } else { // 中间部分
                    pos = (index + 1) - centerSize;
                }
                items.stop(false, true).animate({
                    left: this._itemWidth * pos * -1
                });
            }

            this._current = index;

            this.trigger('afterShow', [index]);
            return this;
        },
        // TODO 未完成
        renderScrollbar: function() {
            var self = this,
                startLeft, startX,
                btn = this._btn,
                items = this._items,
                btnParentWidth = btn.parent().innerWidth(),
                btnWidth = Math.floor(btnParentWidth * (
                    this._total > this._visibleSize
                        ? (this._visibleSize || 1) / (this._total || 1)
                        : 1
                )),
                btnMaxLeftValue = (btnParentWidth - btnWidth) || 1,
                itemsScrollWidth = (this._total - 1 - (this._visibleSize - this._total % this._visibleSize)) * this._itemWidth;

            // 修正滚动条宽度
            btn.width(btnWidth);

            // 总数小于等于可见数时不初始化滚动条
            if (this._total <= this._visibleSize) {
                return this;
            }

            this.bind('afterShow', function() {

            });

            // 拖动查看
            this.bind('afterDrag', function() {
                // TODO
            });
            // TODO 点击向左向右查看

            btn.bind('mousedown.slider', function(ev) {
                var position = btn.position(),
                    doc = $(document);
                self._draging && doc.trigger('mouseup.slider');
                self._draging = true;

                startLeft = position.left;
                startX = ev.pageX;

                doc.bind('mousemove.slider', function(ed) {
                    if (! self._draging) {
                        return;
                    }
                    var left = startLeft + ed.clientX - startX;
                    left = Math.max(0, Math.min(left, btnMaxLeftValue));
                    btn.css('left', left);
                    items.css('left', Math.floor(left / btnMaxLeftValue * itemsScrollWidth) * -1);
                });
                doc.bind('selectstart.slider', function() {
                    return false;
                });
                doc.bind('mouseup.slider', function() {
                    doc.unbind('.slider');
                    self._draging = false;
                });
                ev.preventDefault();
            });
        },
        updateScrollbar: function() {

        }
    });

    /**
     * 以分页列表方式展示小图
     *
     * @type {PhotoList}
     */
    var PhotoList = Base.extend({
        OPTIONS: {
            element: null,
            photos: [],
            photoWidth: 100,
            photoHeight: 75,
            currentClass: 'current',
            current: 0
        },
        name: 'photolist',
        options: {},
        events: {},

        _eventNames: 'render show',

        init: function(options) {
            this.parent(options);

            if (! isArray(this.options.photos)) {
                this.options.photos = [];
            }
        },
        render: function() {

        },
        show: function() {

        },
        hide: function() {

        }
    });

    var Gallery = Base.extend({
        OPTIONS: {
            element: null,
            photos: [],
            preload: 1,
            autoslide: false,
            interval: 5000,
            keyboard: true,
            scrollIntoView: true,
            minHeight: 500,
            maxWidth: 0,
            hashPageParam: 'p',

            thumbWidth: 100,
            thumbHeight: 75,
            thumbCurrentClass: 'current'
        },
        name: 'gallery',
        options: {},
        events: {},

        slider: null,
        photoList: null,

        _eventNames: 'render prev next jumpTo show slide stop fullscreen exit',
        _width: 0,
        _height: 0,

        _current: -1,
        _total: 0,

        _isFullscreen: false,
        _hasPrev: false,
        _hasNext: false,

        _photo: null,
        _photoPrev: null,
        _photoNext: null,
        _loading: null,
        _counterNow: null,
        _counterTotal: null,
        _content: null,
        _end: null,

        _hashParamRegexp: null,

        init: function(options) {
            this.parent(options);

            if (! isArray(this.options.photos)) {
                this.options.photos = [];
            }

            options = this.options;
            this._width = this.element.width();
            this._total = options.photos.length;
            this._loading = this.find('loading').hide();
            this._counterNow = this.find('counter-now');
            this._counterTotal = this.find('counter-total');
            this._photo = this.find('photo-items').empty();
            this._photoPrev = this.find('photo-prev');
            this._photoNext = this.find('photo-next');
            this._content = this.find('content');
            this._end = this.find('end').hide();
            this.slider = new Slider({
                element: this.find('slider'),
                photos: options.photos,
                photoWidth: options.thumbWidth,
                photoHeight: options.thumbHeight,
                currentClass: options.thumbCurrentClass
            });

            this.render();
            return this;
        },
        render: function() {
            var self = this,
                o = this.options,
                width = this._width,
                half = Math.floor(width / 2),
                photo = this._photo,
                prev = this._photoPrev.width(half),
                prevTrigger = prev.find('a').hide(),
                next = this._photoNext.width(half),
                nextTrigger = next.find('a').hide(),
                loading = this._loading,
                slider = this.slider;

            // 显示总数
            this._counterTotal.html(this._total);

            // 最小高度
            o.minHeight && (photo.css({
                'min-height': o.minHeight
            }), IE6 && photo.css({
                height: o.minHeight
            }));

            // 初始化 slider，双向绑定事件
            if (slider) {
                this.bind('afterShow', function(index) {
                    slider.show(index);
                });
                slider.bind('afterShow', function(index) {
                    self.jumpTo(index);
                });
            }

            // 滚动视图到图片区域
            o.scrollIntoView && $('html, body').animate({
                'scrollTop': this.element.offset().top
            }, 500);

            // 加载图片时显示 loading 样式
            this.bind('beforeLoadImage', function() {
                loading.show();
            });
            this.bind('afterLoadImage', function() {
                loading.hide();
            });

            // 处理向前向后样式和逻辑
            this.bind('afterShow', function(index) {
                self._hasPrev = self._hasNext = true;
                if (index === 0) {
                    self._hasPrev = false;
                    prevTrigger.stop(false, true).fadeOut();
                }
                if (index === (this._total - 1)) {
                    self._hasNext = false;
                    nextTrigger.stop(false, true).fadeOut();
                }
            });
            prev.click(function() {
                self.prev();
                return false;
            });
            next.click(function() {
                self.next();
                return false;
            });
            prev.hover(function() {
                prevTrigger.stop(false, true);
                self._hasPrev && prevTrigger.is(':hidden') && prevTrigger.fadeIn();
            }, function() {
                prevTrigger.stop(false, true);
                prevTrigger.is(':visible') && prevTrigger.fadeOut();
            });
            next.hover(function() {
                nextTrigger.stop(false, true);
                self._hasNext && nextTrigger.is(':hidden') && nextTrigger.fadeIn();
            }, function() {
                nextTrigger.stop(false, true);
                nextTrigger.is(':visible') && nextTrigger.fadeOut();
            });

            // TODO 同步更新附加信息
            this.bind('afterShow', function(index) {
                // 计数器
                self._counterNow.html(index + 1);
            });

            // TODO (测试只有一张图片或没有图片的情况) 处理结束后显示的推荐信息
            if (this._end.length) {
                this.bind('beforeShow', function(index) {
                    if (index === self._total) {
                        self._end.show();
                    } else {
                        self._end.hide();
                    }
                });
            }

            // 预加载图片
            o.preload && this.bind('afterShow', function(index) {
                // 向后预加载
                self.preload(o.photos.slice(index + 1, index + 1 + o.preload));
                // 向前预加载
                self.preload(o.photos.slice(Math.max(0, index - o.preload), index));
            });

            // 加载 location.hash 指定的图片，或第一张图片
            if (o.hashPageParam) {
                this._hashParamRegexp = new RegExp('\\b' + o.hashPageParam + '=(\\d+)\\b', 'i');
                // 更新 hash
                this.bind('afterShow', function(index) {
                    var hash = location.hash;
                    if (hash.match(self._hashParamRegexp)) {
                        location.hash = hash.replace(self._hashParamRegexp, function() {
                            return self.options.hashPageParam + '=' + (index + 1);
                        });
                    } else {
                        location.hash = (hash ? (hash + '&') : '') + self.options.hashPageParam + '=' + (index + 1);
                    }
                });
                this.jumpTo(Math.max(0, parseInt(((location.hash.match(this._hashParamRegexp) || [])[1] || 1)) - 1));
            } else {
                this.jumpTo(0);
            }

            // 全屏
            this.find('fullscreen').click(function() {
                self.fullscreen();
                return false;
            });

            // 绑定键盘事件
            o.keyboard && $(document).bind('keydown', function(ev) {
                // 组合键、输入域的事件不触发
                if (ev.ctrlKey || ev.shiftKey || ev.altKey || $(ev.originalTarget).is(':input')) {
                    return;
                }
                // 阻止上下键盘事件易导致可访问性问题，暂不启用
                switch (ev.keyCode) {
                    //case 38: // top
                    case 37: // left
                    //case 75: // k
                    case 72: // h
                        self.prev();
                        ev.preventDefault();
                        break;
                    case 39: // right
                    //case 40: // down
                    case 74: // j
                        //case 76: // l
                        self.next();
                        ev.preventDefault();
                        break;
                    default:
                        break;
                }
            });

            return this;
        },
        renderPhoto: function(photo, index, width, height) {
            var o = this.options, style = [];
            // 防止图片过宽破坏页面布局，拼接 style 来应对 IE6 不支持 max-width 的问题
            if ((o.maxWidth && width > o.maxWidth) || width > this._width) {
                style.push('width: ' + (o.maxWidth ? Math.min(this._width, o.maxWidth) : this._width) + 'px');
            }
            style = style.length ? (' style="' + style.join('; ') + '"') : '';
            return '<img src="' + (photo.big || photo) + '" data-gallery="' + index + '" ' + style + ' />';
        },
        resizeTrigger: function(width, height) {
            var o = this.options,
                newWidth = width,
                newHeight = height;
            if ((o.maxWidth && width > o.maxWidth) || width > this._width) {
                newWidth = o.maxWidth ? Math.min(this._width, o.maxWidth) : this._width;
                newHeight = Math.ceil(height * (newWidth / width));
            }
            if (o.minHeight && newHeight < o.minHeight) {
                newHeight = o.minHeight;
            }
            this._photoPrev.height(newHeight);
            this._photoNext.height(newHeight);
        },
        preload: function() {
            var queue = [],
                loaded = [];
            return function(photos) {
                var self = this, photo;
                if (photos && isArray(photos)) {
                    while (photo = photos.shift()) {
                        loaded.indexOf(photo) === -1 && queue.push(photo);
                    }
                }
                queue.length && self.loadImage(queue.shift(), {
                    slient: true,
                    success: function(image) {
                        loaded.indexOf(image) === -1 && loaded.push(image);
                        self.preload();
                    },
                    error: function(image) {
                        loaded.indexOf(image) === -1 && loaded.push(image);
                        self.preload();
                    }
                });
            };
        }(),
        loadImage: function() {
            var queue = {};
            return function(photo, config) {
                if (! photo) {
                    return false;
                }

                var self = this,
                    src = photo.big || photo, img, complete;

                config = isPlainObject(config) ? config : {};

                if (queue[src]) {
                    if (queue[src].state === 'loading') {
                        config.success && queue[src].success.push(config.success);
                        config.error && queue[src].error.push(config.error);
                    } else if (queue[src].state === 'loaded') {
                        config.success && config.success.call(photo, photo, queue[src].width, queue[src].height);
                    } else {
                        config.error && config.error.call(photo, photo);
                    }
                    return;
                }

                queue[src] = {
                    state: 'loading',
                    success: [],
                    error: []
                };

                config.success && queue[src].success.push(config.success);
                config.error && queue[src].error.push(config.error);

                ! config.slient && this.trigger('beforeLoadImage', [photo]);

                complete = function() {
                    var func;
                    queue[src].state = 'loaded';
                    queue[src].error = [];
                    queue[src].width = this.width;
                    queue[src].height = this.height;
                    ! config.slient && self.trigger('afterLoadImage', [photo, this.width, this.height]);
                    while (func = queue[src].success.shift()) {
                        if (func.call(this, photo, queue[src].width, queue[src].height) === false) {
                            break;
                        }
                    }
                    img = img.onload = img.onerror = null;
                };

                img = new Image();
                img.src = src;
                if (img.complete) {
                    complete.call(img);
                    return;
                }
                img.onerror = function() {
                    var func;
                    queue[src].state = 'error';
                    queue[src].success = [];
                    ! config.slient && self.trigger('afterLoadImage', [photo]);
                    while (func = queue[src].error.shift()) {
                        if (func.call(this, photo) === false) {
                            break;
                        }
                    }
                    img = img.onload = img.onerror = null;
                }
                img.onload = complete;
            };
        }(),
        prev: function() {
            this.show(this._current - 1, 'prev');
            return this;
        },
        next: function() {
            this.show(this._current + 1, 'next');
            return this;
        },
        jumpTo: function(index) {
            this.show(index, 'jumpTo');
        },
        show: function(index, event) {
            var self = this,
                current = this._current,
                photo = this._photo,
                photoToShow;

            if (index === current) {
                return false;
            }

            event = ucfirst(event);
            this.trigger('beforeShow', [index, 'before' + event]);

            // 序号合法判断，放在这里是为了能够监听到 beforeShow 事件的不规范序号，
            // 如监听第一张之前或最后一张之后的事件
            if (index < 0 || index > (this._total - 1)) {
                return false;
            }

            this.trigger('before' + event, [index]);

            photoToShow = this.find(index, photo);
            function callback(width, height) {
                self.resizeTrigger(width, height);
                self._current = index;
                self.trigger('after' + event, [index]);
                self.trigger('afterShow', [index, 'after' + event]);
            }
            // 已加载过
            if (photoToShow.length) {
                this.find(current, photo).hide();
                photoToShow.show();
                callback(photoToShow.width(), photoToShow.height());
            } else {
                this.loadImage(this.options.photos[index], {
                    success: function(image, width, height) {
                        self.find(current, photo).hide();
                        // 如果队列中的图片被绑定了多个回调，有可能该图片已经被插入到 DOM 中
                        if (self.find(index, photo).length) {
                            self.find(index, photo).show();
                        } else {
                            photo.append(self.renderPhoto(image, index, width, height));
                        }
                        callback(width, height);
                    }
                });
            }
            return this;
        },

        showList: function() {},
        hideList: function() {},

        slide: function() {},
        stop: function() {},

        fullscreen: function() {
            var elem = this._content[0];
            if ((elem.fullScreenElement && elem.fullScreenElement !== null) ||    // alternative standard method
                (!elem.mozFullScreen && !elem.webkitIsFullScreen)) {               // current working methods
                if (elem.requestFullScreen) {
                    elem.requestFullScreen();
                } else if (elem.mozRequestFullScreen) {
                    elem.mozRequestFullScreen();
                } else if (elem.webkitRequestFullScreen) {
                    elem.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
                }
                // TODO 无法去除该样式
                this.element.addClass('fullscreen');
            }
        },
        exit: function() {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
            this.element.removeClass('fullscreen');
        }
    });

    root.Gallery = Gallery;

    $.fn.gallery = function(elem, options) {
        return this.each(function() {
            options = isPlainObject(options) || {};
            options.element = elem;
            $(this).data('gallery', new Gallery(options));
        });
    };

})(jQuery, window['GALLERY_NAMESPACE'] || window);
