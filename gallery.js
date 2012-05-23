/**
 *
 *
 * <code>
 *
 * </code>
 *
 */
(function($, root) {
var OPTIONS = {
    gallery: null,
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
};

var toString = Object.prototype.toString,
    IE6 = $.browser.msie && $.browser.version == '6.0';

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

var Util = {
    support: function() {
        var div = document.createElement('div'),
            vendors = ['Khtml', 'Ms', 'O', 'Moz', 'Webkit'],
            length = vendors.length;
        return function(prop) {
            if (prop in div.style) {
                return true;
            }
            prop = prop.replace('/^[a-z]/', function(val) {
                return val.toUpperCase();
            });
            while (length--) {
                if ((vendors[length] + prop) in div.style) {
                    return true;
                }
            }
            return false;
        };
    }(),
    mix: function(base, target) {
        if (! base || ! target || ! Util.isPlainObject(target)) {
            return base;
        }
        for (var key in target) {
            if (target.hasOwnProperty(key)) {
                base[key] = target[key];
            }
        }
        return base;
    },
    isString: function(val) {
        return toString.call(val) === '[object String]';
    },
    isPlainObject: function(val) {
        return val && toString.call(val) === '[object Object]' && 'isPrototypeOf' in val;
    },
    isFunction: function(val) {
        return toString.call(val) === '[object Function]';
    },
    isArray: Array.isArray || function(val) {
        return toString.call(val) === '[object Array]';
    },
    each: function() {
        var R_SPLIT = /[\s|,]+/;
        return function(val, func) {
            if (! val || ! Util.isFunction(func)) {
                return;
            }
            val = val.split(R_SPLIT);
            for (var index = 0, length = val.length, item = val[index];
                 index < length && func.call(item, item, index) !== false;
                 item = val[++index]) {}
        };
    }(),
    ucfirst: function(val) {
        if (! Util.isString(val)) {
            return val;
        }
        return val.charAt(0).toUpperCase() + val.slice(1);
    },
    template: function(template, values) {
        var key;
        values = Util.isPlainObject(values) ? values : {};
        for (key in values) {
            if (values.hasOwnProperty(key)) {
                template = template.replace(new RegExp('{' + key + '}', 'gm'), values[key] || '');
            }
        }
        return template;
    }
};

/**
 * 内置 Slider 组件
 */
var SliderOptions = {
    slider: null,
    photos: [],
    photoWidth: 100,
    photoHeight: 75,
    currentClass: 'current',
    current: 0
};
var GallerySlider = function(options) {
    if (! Util.isPlainObject(options) || ! options.slider || ! options.photos) {
        throw new TypeError('Slider 参数不正确');
    }
    this.init(options);
    return this;
};
GallerySlider.prototype = {
    guid: null,
    options: {},
    events: {},
    slider: null,

    _width: 0,
    _itemWidth: 0,
    _current: -1,

    _control: null,
    _bar: null,
    _items: null,
    _btn: null,

    init: function(options) {
        var self = this;

        this.guid = 'GALLERYSLIDER' + ((new Date()).getTime().toString(16));
        options = this.options = Util.mix(SliderOptions, options);

        Util.each('scrollStart scrollStop dragStart dragStop show', function(event) {
            var ucfirst = Util.ucfirst(event),
                before = 'before' + ucfirst,
                after = 'after' + ucfirst;
            options[before] && (self.bind(before, options[before]));
            options[after] && (self.bind(after, options[after]));
        });

        var slider = this.slider = options.slider.jquery ? options.slider : $(options.slider);
        this._width = slider.width();
        this._control = this.find('control');
        this._bar = this.find('bar');
        this._items = this.find('items');
        this._btn = this.find('btn');

        this.render();
        return this;
    },
    find: function(name, context) {
        return (context && context.jquery ? context : this.slider).find('[data-slider=' + name + ']');
    },
    bind: function(event, func) {
        (event in this.events) || (this.events[event] = []);
        this.events[event].push(func);
        return this;
    },
    trigger: function(event, args) {
        if (event in this.events) {
            for (var index = 0, func; (func = this.events[event][index++]) && (func.apply(this, args || []) !== false); ) {}
        }
        return this;
    },
    render: function() {
        var self = this,
            o = this.options,
            items = this._items.empty(),
            item, index = 0, total = o.photos.length;

        // 构建列表
        $.each(o.photos, function(index, photo) {
            item = $('<li><a hideFocus="true" href="javascript:void(0);"><img /></a></li>').attr('data-slider-index', index);
            item.find('a,img').css({
                width: o.photoWidth,
                height: o.photoHeight
            });
            item.find('img').attr('src', photo.thumb || photo).attr('alt', photo.note || '');
            item.bind('click', function() {
                self.show(item.attr('data-slider-index'));
            }).appendTo(items);
        });

        // 修正小图列表的宽度
        this._itemWidth = items.eq(0).outerWidth(true);
        items.css({
            width: this._itemWidth * total
        }).show();

        // 将当前页的小图滚动进入视图
        this.show(o.current || 0);

        // TODO 初始化拖拽


        return this;
    },
    show: function(index) {
        var o = this.options, old,
            item = this._items.children().eq(index);
        if (! item.length) {
            return false;
        }
        old = this._items.children().eq(this._current);
        old.removeClass(o.currentClass);
        item.addClass(o.currentClass);



        this._current = index;
        return this;
    }
};

var Gallery = function(options) {
    if (! Util.isPlainObject(options) || ! options.gallery || ! options.photos) {
        throw new TypeError('Gallery 参数不正确');
    }
    this.init(options);
    return this;
};
Gallery.prototype = {
    guid: null,
    options: {},
    events: {},
    gallery: null,
    slider: null,

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
        var self = this;

        this.guid = 'GALLERY' + ((new Date()).getTime().toString(16));
        options = this.options = Util.mix(OPTIONS, options);

        Util.each('prev next jumpTo show slide stop fullscreen exit', function(event) {
            var ucfirst = Util.ucfirst(event),
                before = 'before' + ucfirst,
                after = 'after' + ucfirst;
            options[before] && (self.bind(before, options[before]));
            options[after] && (self.bind(after, options[after]));
        });

        var gallery = this.gallery = options.gallery.jquery ? options.gallery : $(options.gallery);
        this._width = gallery.width();
        this._total = options.photos.length;
        this._loading = this.find('loading').hide();
        this._counterNow = this.find('counter-now');
        this._counterTotal = this.find('counter-total');
        this._photo = this.find('photo-items').empty();
        this._photoPrev = this.find('photo-prev');
        this._photoNext = this.find('photo-next');
        this._content = this.find('content');
        this._end = this.find('end').hide();
        this.slider = new GallerySlider({
            slider: this.find('slider'),
            photos: options.photos,
            photoWidth: options.thumbWidth,
            photoHeight: options.thumbHeight,
            currentClass: options.thumbCurrentClass
        });
        this.render();

        return this;
    },

    find: function(name, context) {
        return (context && context.jquery ? context : this.gallery).find('[data-gallery=' + name + ']');
    },

    /**
     * 将回调函数绑定到本实例的指定事件下
     *
     * @param event 要绑定的事件名称
     * @param func 回调函数
     * @return {Gallery}
     */
    bind: function(event, func) {
        (event in this.events) || (this.events[event] = []);
        this.events[event].push(func);
        return this;
    },

    /**
     * 触发绑定在本实例下的指定事件
     *
     * @param event 要触发的事件
     * @param args 附加参数
     * @return {Gallery}
     */
    trigger: function(event, args) {
        if (event in this.events) {
            for (var index = 0, func; (func = this.events[event][index++]) && (func.apply(this, args || []) !== false); ) {}
        }
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

        // TODO 初始化 slider，双向绑定事件
        slider && this.bind('afterShow', function() {
            slider.show(self._current);
        });

        // 滚动视图到图片区域
        o.scrollIntoView && $('html, body').animate({
            'scrollTop': this.gallery.offset().top
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

        // 处理结束后显示的推荐信息
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
            // 输入域的事件不触发
            if ($(ev.originalTarget).is(':input')) {
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
        return '<img src="' + photo.big + '" data-gallery="' + index + '" ' + style + ' />';
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
            if (photos && Util.isArray(photos)) {
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

            config = Util.isPlainObject(config) ? config : {};

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

        event = Util.ucfirst(event);
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
    },

    showThumbList: function() {},
    hideThumbList: function() {},

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
            this.gallery.addClass('fullscreen');
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
        this.gallery.removeClass('fullscreen');
    }
};

root.Gallery = Gallery;

$.fn.gallery = function(elem, options) {
    return this.each(function() {
        options = Util.isPlainObject(options) || {};
        options.gallery = elem;
        $(this).data('gallery', new Gallery(options));
    });
};

})(jQuery, window['GALLERY_NAMESPACE'] || window);
