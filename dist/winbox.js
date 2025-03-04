(() => {
  // src/template.js
  var template = document.createElement("div");
  template.innerHTML = //'<div class=winbox>' +
  '<div class=wb-header><div class=wb-control><span title="Minimize" class=wb-min></span><span title="Maximize" class=wb-max></span><span title="Fullscreen" class=wb-full></span><span title="Close" class=wb-close></span></div><div class=wb-drag><div class=wb-icon></div><div class=wb-title></div></div></div><div class=wb-body></div><div class=wb-n></div><div class=wb-s></div><div class=wb-w></div><div class=wb-e></div><div class=wb-nw></div><div class=wb-ne></div><div class=wb-se></div><div class=wb-sw></div>';
  function template_default(tpl) {
    return (tpl || template).cloneNode(true);
  }

  // src/helper.js
  function addListener(node, event, fn, opt) {
    node && node.addEventListener(event, fn, opt || false);
  }
  function removeListener(node, event, fn, opt) {
    node && node.removeEventListener(event, fn, opt || false);
  }
  function preventEvent(event, prevent) {
    event.stopPropagation();
    event.cancelable && event.preventDefault();
  }
  function getByClass(root, name) {
    return root.getElementsByClassName(name)[0];
  }
  function addClass(node, classname) {
    node.classList.add(classname);
  }
  function hasClass(node, classname) {
    return node.classList.contains(classname);
  }
  function removeClass(node, classname) {
    node.classList.remove(classname);
  }
  function setStyle(node, style, value) {
    value = "" + value;
    if (node["_s_" + style] !== value) {
      node.style.setProperty(style, value);
      node["_s_" + style] = value;
    }
  }
  function setText(node, value) {
    const textnode = node.firstChild;
    textnode ? textnode.nodeValue = value : node.textContent = value;
  }

  // src/winbox.js
  var use_raf = false;
  var stack_min = [];
  var eventOptions = { "capture": true, "passive": true };
  var body;
  var id_counter = 0;
  var index_counter = 10;
  var is_fullscreen;
  var last_focus;
  var prefix_request;
  var prefix_exit;
  var root_w;
  var root_h;
  function WinBox(params, _title) {
    if (!(this instanceof WinBox)) {
      return new WinBox(params);
    }
    body || setup();
    let id, index, root, tpl, title, icon, mount, html, url, shadowel, framename, cssurl, width, height, minwidth, minheight, maxwidth, maxheight, autosize, x, y, top, left, bottom, right, min, max, hidden, modal, background, border, header, classname, oncreate, onclose, onfocus, onblur, onmove, onresize, onfullscreen, onmaximize, onminimize, onrestore, onhide, onshow, onload;
    if (params) {
      if (_title) {
        title = params;
        params = _title;
      }
      if (typeof params === "string") {
        title = params;
      } else {
        id = params["id"];
        index = params["index"];
        root = params["root"];
        tpl = params["template"];
        title = title || params["title"];
        icon = params["icon"];
        mount = params["mount"];
        html = params["html"];
        url = params["url"];
        shadowel = params["shadowel"];
        framename = params["framename"];
        cssurl = params["cssurl"];
        width = params["width"];
        height = params["height"];
        minwidth = params["minwidth"];
        minheight = params["minheight"];
        maxwidth = params["maxwidth"];
        maxheight = params["maxheight"];
        autosize = params["autosize"];
        min = params["min"];
        max = params["max"];
        hidden = params["hidden"];
        modal = params["modal"];
        x = params["x"] || (modal ? "center" : 0);
        y = params["y"] || (modal ? "center" : 0);
        top = params["top"];
        left = params["left"];
        bottom = params["bottom"];
        right = params["right"];
        background = params["background"];
        border = params["border"];
        header = params["header"];
        classname = params["class"];
        onclose = params["onclose"];
        onfocus = params["onfocus"];
        onblur = params["onblur"];
        onmove = params["onmove"];
        onresize = params["onresize"];
        onfullscreen = params["onfullscreen"];
        onmaximize = params["onmaximize"];
        onminimize = params["onminimize"];
        onrestore = params["onrestore"];
        onhide = params["onhide"];
        onshow = params["onshow"];
        onload = params["onload"];
      }
    }
    this.dom = template_default(tpl);
    this.dom.id = this.id = id || "winbox-" + ++id_counter;
    this.dom.className = "winbox" + (classname ? " " + (typeof classname === "string" ? classname : classname.join(" ")) : "") + (modal ? " modal" : "");
    this.dom["winbox"] = this;
    this.window = this.dom;
    this.body = getByClass(this.dom, "wb-body");
    this.header = header || 35;
    if (background) {
      this.setBackground(background);
    }
    if (border) {
      setStyle(this.body, "margin", border + (isNaN(border) ? "" : "px"));
    } else {
      border = 0;
    }
    if (header) {
      const node = getByClass(this.dom, "wb-header");
      setStyle(node, "height", header + "px");
      setStyle(node, "line-height", header + "px");
      setStyle(this.body, "top", header + "px");
    }
    if (title) {
      this.setTitle(title);
    }
    if (icon) {
      this.setIcon(icon);
    }
    if (mount) {
      this.mount(mount);
    } else if (html) {
      this.body.innerHTML = html;
    } else if (url) {
      this.setUrl(url, onload);
    }
    top = top ? parse(top, root_h) : 0;
    bottom = bottom ? parse(bottom, root_h) : 0;
    left = left ? parse(left, root_w) : 0;
    right = right ? parse(right, root_w) : 0;
    const viewport_w = root_w - left - right;
    const viewport_h = root_h - top - bottom;
    maxwidth = maxwidth ? parse(maxwidth, viewport_w) : viewport_w;
    maxheight = maxheight ? parse(maxheight, viewport_h) : viewport_h;
    minwidth = minwidth ? parse(minwidth, maxwidth) : 150;
    minheight = minheight ? parse(minheight, maxheight) : this.header;
    if (autosize) {
      (root || body).appendChild(this.body);
      width = Math.max(Math.min(this.body.clientWidth + border * 2 + 1, maxwidth), minwidth);
      height = Math.max(Math.min(this.body.clientHeight + this.header + border + 1, maxheight), minheight);
      this.dom.appendChild(this.body);
    } else {
      width = width ? parse(width, maxwidth) : Math.max(maxwidth / 2, minwidth) | 0;
      height = height ? parse(height, maxheight) : Math.max(maxheight / 2, minheight) | 0;
    }
    x = x ? parse(x, viewport_w, width) : left;
    y = y ? parse(y, viewport_h, height) : top;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.minwidth = minwidth;
    this.minheight = minheight;
    this.maxwidth = maxwidth;
    this.maxheight = maxheight;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
    this.left = left;
    this.index = index;
    this.min = false;
    this.max = false;
    this.full = false;
    this.hidden = false;
    this.focused = false;
    this.onclose = onclose;
    this.onfocus = onfocus;
    this.onblur = onblur;
    this.onmove = onmove;
    this.onresize = onresize;
    this.onfullscreen = onfullscreen;
    this.onmaximize = onmaximize;
    this.onminimize = onminimize;
    this.onrestore = onrestore;
    this.onhide = onhide;
    this.onshow = onshow;
    if (max) {
      this.maximize();
    } else if (min) {
      this.minimize();
    } else {
      this.resize().move();
    }
    if (hidden) {
      this.hide();
    } else {
      this.focus();
      if (index || index === 0) {
        this.index = index;
        setStyle(this.dom, "z-index", index);
        if (index > index_counter)
          index_counter = index;
      }
    }
    register(this);
    if (shadowel) {
      const se = document.createElement(shadowel);
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = cssurl;
      link.itemprop = "url";
      se.appendChild(link);
      se.appendChild(this.dom);
      se.attachShadow({ mode: "open" }).innerHTML = "<slot></slot>";
      (root || body).appendChild(se);
    } else {
      (root || body).appendChild(this.dom);
    }
    (oncreate = params["oncreate"]) && oncreate.call(this, params);
  }
  WinBox["new"] = function(params) {
    return new WinBox(params);
  };
  var winbox_default = WinBox;
  function parse(num, base, center) {
    if (typeof num === "string") {
      if (num === "center") {
        num = (base - center) / 2 | 0;
      } else if (num === "right" || num === "bottom") {
        num = base - center;
      } else {
        const value = parseFloat(num);
        const unit = "" + value !== num && num.substring(("" + value).length);
        if (unit === "%") {
          num = base / 100 * value | 0;
        } else {
          num = value;
        }
      }
    }
    return num;
  }
  function setup() {
    body = document.body;
    body[prefix_request = "requestFullscreen"] || body[prefix_request = "msRequestFullscreen"] || body[prefix_request = "webkitRequestFullscreen"] || body[prefix_request = "mozRequestFullscreen"] || (prefix_request = "");
    prefix_exit = prefix_request && prefix_request.replace("request", "exit").replace("mozRequest", "mozCancel").replace("Request", "Exit");
    addListener(window, "resize", function() {
      init();
      update_min_stack();
    });
    init();
  }
  function register(self) {
    addWindowListener(self, "drag");
    addWindowListener(self, "n");
    addWindowListener(self, "s");
    addWindowListener(self, "w");
    addWindowListener(self, "e");
    addWindowListener(self, "nw");
    addWindowListener(self, "ne");
    addWindowListener(self, "se");
    addWindowListener(self, "sw");
    addListener(getByClass(self.dom, "wb-min"), "click", function(event) {
      preventEvent(event);
      self.min ? self.focus().restore() : self.blur().minimize();
    });
    addListener(getByClass(self.dom, "wb-max"), "click", function(event) {
      self.max ? self.restore() : self.maximize();
    });
    if (prefix_request) {
      addListener(getByClass(self.dom, "wb-full"), "click", function(event) {
        self.fullscreen();
      });
    } else {
      self.addClass("no-full");
    }
    addListener(getByClass(self.dom, "wb-close"), "click", function(event) {
      preventEvent(event);
      self.close() || (self = null);
    });
    addListener(self.dom, "click", function(event) {
      self.focus();
    });
  }
  function remove_min_stack(self) {
    stack_min.splice(stack_min.indexOf(self), 1);
    update_min_stack();
    self.removeClass("min");
    self.min = false;
    self.dom.title = "";
  }
  function update_min_stack() {
    const length = stack_min.length;
    const splitscreen_index = {};
    const splitscreen_length = {};
    for (let i = 0, self, key; i < length; i++) {
      self = stack_min[i];
      key = (self.left || self.right) + ":" + (self.top || self.bottom);
      if (splitscreen_length[key]) {
        splitscreen_length[key]++;
      } else {
        splitscreen_index[key] = 0;
        splitscreen_length[key] = 1;
      }
    }
    for (let i = 0, self, key, width; i < length; i++) {
      self = stack_min[i];
      key = (self.left || self.right) + ":" + (self.top || self.bottom);
      width = Math.min((root_w - self.left - self.right) / splitscreen_length[key], 250);
      self.resize(width + 1 | 0, self.header, true).move(self.left + splitscreen_index[key] * width | 0, root_h - self.bottom - self.header, true);
      splitscreen_index[key]++;
    }
  }
  function addWindowListener(self, dir) {
    const node = getByClass(self.dom, "wb-" + dir);
    if (!node)
      return;
    let touch, x, y;
    let raf_timer, raf_move, raf_resize;
    let dblclick_timer = 0;
    addListener(node, "mousedown", mousedown);
    addListener(node, "touchstart", mousedown, eventOptions);
    function loop() {
      raf_timer = requestAnimationFrame(loop);
      if (raf_resize) {
        self.resize();
        raf_resize = false;
      }
      if (raf_move) {
        self.move();
        raf_move = false;
      }
    }
    function mousedown(event) {
      preventEvent(event);
      self.focus();
      if (dir === "drag") {
        if (self.min) {
          self.restore();
          return;
        }
        const now = Date.now();
        const diff = now - dblclick_timer;
        dblclick_timer = now;
        if (diff < 300) {
          self.max ? self.restore() : self.maximize();
          return;
        }
      }
      if (!self.max && !self.min) {
        addClass(body, "wb-lock");
        use_raf && loop();
        if ((touch = event.touches) && (touch = touch[0])) {
          event = touch;
          addListener(window, "touchmove", handler_mousemove, eventOptions);
          addListener(window, "touchend", handler_mouseup, eventOptions);
        } else {
          addListener(window, "mousemove", handler_mousemove);
          addListener(window, "mouseup", handler_mouseup);
        }
        x = event.pageX;
        y = event.pageY;
      }
    }
    function handler_mousemove(event) {
      preventEvent(event);
      if (touch) {
        event = event.touches[0];
      }
      const pageX = event.pageX;
      const pageY = event.pageY;
      const offsetX = pageX - x;
      const offsetY = pageY - y;
      const old_w = self.width;
      const old_h = self.height;
      const old_x = self.x;
      const old_y = self.y;
      let resize_w, resize_h, move_x, move_y;
      if (dir === "drag") {
        self.x += offsetX;
        self.y += offsetY;
        move_x = move_y = 1;
      } else {
        if (dir === "e" || dir === "se" || dir === "ne") {
          self.width += offsetX;
          resize_w = 1;
        } else if (dir === "w" || dir === "sw" || dir === "nw") {
          self.x += offsetX;
          self.width -= offsetX;
          resize_w = 1;
          move_x = 1;
        }
        if (dir === "s" || dir === "se" || dir === "sw") {
          self.height += offsetY;
          resize_h = 1;
        } else if (dir === "n" || dir === "ne" || dir === "nw") {
          self.y += offsetY;
          self.height -= offsetY;
          resize_h = 1;
          move_y = 1;
        }
      }
      if (resize_w) {
        self.width = Math.max(Math.min(self.width, self.maxwidth, root_w - self.x - self.right), self.minwidth);
        resize_w = self.width !== old_w;
      }
      if (resize_h) {
        self.height = Math.max(Math.min(self.height, self.maxheight, root_h - self.y - self.bottom), self.minheight);
        resize_h = self.height !== old_h;
      }
      if (resize_w || resize_h) {
        use_raf ? raf_resize = true : self.resize();
      }
      if (move_x) {
        self.x = Math.max(Math.min(self.x, root_w - self.width - self.right), self.left);
        move_x = self.x !== old_x;
      }
      if (move_y) {
        self.y = Math.max(Math.min(self.y, root_h - self.height - self.bottom), self.top);
        move_y = self.y !== old_y;
      }
      if (move_x || move_y) {
        use_raf ? raf_move = true : self.move();
      }
      if (resize_w || move_x) {
        x = pageX;
      }
      if (resize_h || move_y) {
        y = pageY;
      }
    }
    function handler_mouseup(event) {
      preventEvent(event);
      removeClass(body, "wb-lock");
      use_raf && cancelAnimationFrame(raf_timer);
      if (touch) {
        removeListener(window, "touchmove", handler_mousemove, eventOptions);
        removeListener(window, "touchend", handler_mouseup, eventOptions);
      } else {
        removeListener(window, "mousemove", handler_mousemove);
        removeListener(window, "mouseup", handler_mouseup);
      }
    }
  }
  function init() {
    const doc = document.documentElement;
    root_w = doc.clientWidth;
    root_h = doc.clientHeight;
  }
  WinBox.prototype.mount = function(src) {
    this.unmount();
    src._backstore || (src._backstore = src.parentNode);
    this.body.textContent = "";
    this.body.appendChild(src);
    return this;
  };
  WinBox.prototype.unmount = function(dest) {
    const node = this.body.firstChild;
    if (node) {
      const root = dest || node._backstore;
      root && root.appendChild(node);
      node._backstore = dest;
    }
    return this;
  };
  WinBox.prototype.setTitle = function(title) {
    const node = getByClass(this.dom, "wb-title");
    setText(node, this.title = title);
    return this;
  };
  WinBox.prototype.setIcon = function(src) {
    const img = getByClass(this.dom, "wb-icon");
    setStyle(img, "background-image", "url(" + src + ")");
    setStyle(img, "display", "inline-block");
    return this;
  };
  WinBox.prototype.setBackground = function(background) {
    setStyle(this.dom, "background", background);
    return this;
  };
  WinBox.prototype.setUrl = function(url, onload) {
    const node = this.body.firstChild;
    if (node && node.tagName.toLowerCase() === "iframe") {
      node.src = url;
    } else {
      const name = this.framename ?? "";
      this.body.innerHTML = `<iframe name="${name}" src="${url}"></iframe>`;
      onload && (this.body.firstChild.onload = onload);
    }
    return this;
  };
  WinBox.prototype.focus = function(state) {
    if (state === false) {
      return this.blur();
    }
    if (last_focus !== this && this.dom) {
      last_focus && last_focus.blur();
      setStyle(this.dom, "z-index", ++index_counter);
      this.index = index_counter;
      this.addClass("focus");
      last_focus = this;
      this.focused = true;
      this.onfocus && this.onfocus();
    }
    return this;
  };
  WinBox.prototype.blur = function(state) {
    if (state === false) {
      return this.focus();
    }
    if (last_focus === this) {
      this.removeClass("focus");
      this.focused = false;
      this.onblur && this.onblur();
      last_focus = null;
    }
    return this;
  };
  WinBox.prototype.hide = function(state) {
    if (state === false) {
      return this.show();
    }
    if (!this.hidden) {
      this.onhide && this.onhide();
      this.hidden = true;
      return this.addClass("hide");
    }
  };
  WinBox.prototype.show = function(state) {
    if (state === false) {
      return this.hide();
    }
    if (this.hidden) {
      this.onshow && this.onshow();
      this.hidden = false;
      return this.removeClass("hide");
    }
  };
  WinBox.prototype.minimize = function(state) {
    if (state === false) {
      return this.restore();
    }
    if (is_fullscreen) {
      cancel_fullscreen();
    }
    if (this.max) {
      this.removeClass("max");
      this.max = false;
    }
    if (!this.min) {
      stack_min.push(this);
      update_min_stack();
      this.dom.title = this.title;
      this.addClass("min");
      this.min = true;
      this.onminimize && this.onminimize();
    }
    return this;
  };
  WinBox.prototype.restore = function() {
    if (is_fullscreen) {
      cancel_fullscreen();
    }
    if (this.min) {
      remove_min_stack(this);
      this.resize().move();
      this.onrestore && this.onrestore();
    }
    if (this.max) {
      this.max = false;
      this.removeClass("max").resize().move();
      this.onrestore && this.onrestore();
    }
    return this;
  };
  WinBox.prototype.maximize = function(state) {
    if (state === false) {
      return this.restore();
    }
    if (is_fullscreen) {
      cancel_fullscreen();
    }
    if (this.min) {
      remove_min_stack(this);
    }
    if (!this.max) {
      this.addClass("max").resize(
        root_w - this.left - this.right,
        root_h - this.top - this.bottom,
        true
      ).move(
        this.left,
        this.top,
        true
      );
      this.max = true;
      this.onmaximize && this.onmaximize();
    }
    return this;
  };
  WinBox.prototype.fullscreen = function(state) {
    if (this.min) {
      remove_min_stack(this);
      this.resize().move();
    }
    if (!is_fullscreen || !cancel_fullscreen()) {
      this.body[prefix_request]();
      is_fullscreen = this;
      this.full = true;
      this.onfullscreen && this.onfullscreen();
    } else if (state === false) {
      return this.restore();
    }
    return this;
  };
  function has_fullscreen() {
    return document["fullscreen"] || document["fullscreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"];
  }
  function cancel_fullscreen() {
    is_fullscreen.full = false;
    if (has_fullscreen()) {
      document[prefix_exit]();
      return true;
    }
  }
  WinBox.prototype.close = function(force) {
    if (this.onclose && this.onclose(force)) {
      return true;
    }
    if (this.min) {
      remove_min_stack(this);
    }
    this.unmount();
    this.dom.remove();
    this.dom.textContent = "";
    this.dom["winbox"] = null;
    this.body = null;
    this.dom = null;
    if (last_focus === this) {
      last_focus = null;
    }
  };
  WinBox.prototype.move = function(x, y, _skip_update) {
    if (!x && x !== 0) {
      x = this.x;
      y = this.y;
    } else if (!_skip_update) {
      this.x = x ? x = parse(x, root_w - this.left - this.right, this.width) : 0;
      this.y = y ? y = parse(y, root_h - this.top - this.bottom, this.height) : 0;
    }
    setStyle(this.dom, "left", x + "px");
    setStyle(this.dom, "top", y + "px");
    this.onmove && this.onmove(x, y);
    return this;
  };
  WinBox.prototype.resize = function(w, h, _skip_update) {
    if (!w && w !== 0) {
      w = this.width;
      h = this.height;
    } else if (!_skip_update) {
      this.width = w ? w = parse(
        w,
        this.maxwidth
        /*- this.left - this.right*/
      ) : 0;
      this.height = h ? h = parse(
        h,
        this.maxheight
        /*- this.top - this.bottom*/
      ) : 0;
      w = Math.max(w, this.minwidth);
      h = Math.max(h, this.minheight);
    }
    setStyle(this.dom, "width", w + "px");
    setStyle(this.dom, "height", h + "px");
    this.onresize && this.onresize(w, h);
    return this;
  };
  WinBox.prototype.addControl = function(control) {
    const classname = control["class"];
    const image = control.image;
    const click = control.click;
    const index = control.index;
    const title = control.title;
    const node = document.createElement("span");
    const icons = getByClass(this.dom, "wb-control");
    const self = this;
    if (classname)
      node.className = classname;
    if (image)
      setStyle(node, "background-image", "url(" + image + ")");
    if (click)
      node.onclick = function(event) {
        click.call(this, event, self);
      };
    if (title)
      node.title = title;
    icons.insertBefore(node, icons.childNodes[index || 0]);
    return this;
  };
  WinBox.prototype.removeControl = function(control) {
    control = getByClass(this.dom, control);
    control && control.remove();
    return this;
  };
  WinBox.prototype.addClass = function(classname) {
    addClass(this.dom, classname);
    return this;
  };
  WinBox.prototype.removeClass = function(classname) {
    removeClass(this.dom, classname);
    return this;
  };
  WinBox.prototype.hasClass = function(classname) {
    return hasClass(this.dom, classname);
  };
  WinBox.prototype.toggleClass = function(classname) {
    return this.hasClass(classname) ? this.removeClass(classname) : this.addClass(classname);
  };
})();
//# sourceMappingURL=winbox.js.map
