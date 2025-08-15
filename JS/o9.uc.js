// ==UserScript==
// @name           o9-core.uc.js
// @description    Central engine for o9 with modules (Polyfill + TitlebarNavBarURLBarBackgrounds + MediaCoverArt)
// @author         o9
// @version        v9.9
// @include        main
// @grant          none
// ==/UserScript==

(function() {
  'use strict';

  if (window.o9) {
    window.o9.destroy();
  }

  window.o9 = {
    _modules: [],
    _initialized: false,

    logger: {
      _prefix: '[o9]',
      log(msg) { console.log(`${this._prefix} ${msg}`); },
      warn(msg) { console.warn(`${this._prefix} ${msg}`); },
      error(msg) { console.error(`${this._prefix} ${msg}`); }
    },

    runOnLoad(callback) {
      if (document.readyState === 'complete') callback();
      else document.addEventListener('DOMContentLoaded', callback, { once: true });
    },

    register(name, ModuleClass) {
      if (this._modules.find(m => m._name === name)) {
        this.logger.warn(`Module "${name}" already registered.`);
        return;
      }
      const instance = new ModuleClass();
      instance._name = name;
      this._modules.push(instance);
      if (this._initialized && typeof instance.init === 'function') {
        try {
          instance.init();
        } catch (err) {
          this.logger.error(`Module "${name}" failed to init:\n${err}`);
        }
      }
    },

    getModule(name) {
      return this._modules.find(m => m._name === name);
    },

    observePresence(selector, attrName) {
      const update = () => {
        const found = !!document.querySelector(selector);
        document.documentElement.toggleAttribute(attrName, found);
      };
      const observer = new MutationObserver(update);
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
      update();
      return observer;
    },

    init() {
      this.logger.log('⏳ Initializing core...');
      this._initialized = true;
      this.runOnLoad(() => {
        this._modules.forEach(m => {
          try {
            m.init?.();
          } catch (err) {
            this.logger.error(`Module "${m._name}" failed to init:\n${err}`);
          }
        });
      });
      window.addEventListener('unload', () => this.destroy(), { once: true });
    },

    destroy() {
      this._modules.forEach(m => {
        try {
          m.destroy?.();
        } catch (err) {
          this.logger.error(`Module "${m._name}" failed to destroy:\n${err}`);
        }
      });
      this.logger.log('🧹 All modules destroyed.');
      delete window.o9;
    },

    debug: {
      listModules() {
        return o9._modules.map(m => m._name || 'Unnamed');
      },
      destroyModule(name) {
        const mod = o9._modules.find(m => m._name === name);
        try {
          mod?.destroy?.();
        } catch (err) {
          o9.logger.error(`Module "${name}" failed to destroy:\n${err}`);
        }
      },
      reload() {
        o9.destroy();
        location.reload();
      }
    }
  };

 // ========== o9PolyfillModule ==========
  class o9PolyfillModule {
    constructor() {
      this.compactObserver = null;
      this.modeObserver = null;
      this.root = document.documentElement;
      this.gradientSlider = null;
      this.updateGradientOpacityAttr = null;
    }

    init() {
      // Compact mode detection
      this.compactObserver = o9.observePresence(
        '[zen-compact-mode="true"]',
        'o9-compact-mode'
      );

      // Toolbar mode detection (single, multi, collapsed)
      this.modeObserver = new MutationObserver(() => this.updateToolbarModes());
      this.modeObserver.observe(this.root, { attributes: true });
      this.updateToolbarModes();

      // Gradient contrast detection
      this.gradientSlider = document.querySelector("#PanelUI-zen-gradient-generator-opacity");
      if (this.gradientSlider) {
        this.updateGradientOpacityAttr = () => {
          const isMin = Number(this.gradientSlider.value) === Number(this.gradientSlider.min);
          this.root.toggleAttribute("o9-zen-gradient-contrast-zero", isMin);
        };
        this.gradientSlider.addEventListener("input", this.updateGradientOpacityAttr);
        this.updateGradientOpacityAttr();
      } else {
        o9.logger.warn("⚠️ [Polyfill] Gradient slider not found.");
      }

      o9.logger.log('✅ [Polyfill] Detection active.');
    }

    updateToolbarModes() {
      const hasSidebar = this.root.hasAttribute('zen-sidebar-expanded');
      const isSingle = this.root.hasAttribute('zen-single-toolbar');

      this.root.toggleAttribute('o9-single-toolbar', isSingle);
      this.root.toggleAttribute('o9-multi-toolbar', hasSidebar && !isSingle);
      this.root.toggleAttribute('o9-collapsed-toolbar', !hasSidebar && !isSingle);
    }

    destroy() {
      this.compactObserver?.disconnect();
      this.modeObserver?.disconnect();
      this.gradientSlider?.removeEventListener("input", this.updateGradientOpacityAttr);
      this.root.removeAttribute("o9-zen-gradient-contrast-zero");
      o9.logger.log('🧹 [Polyfill] Destroyed.');
    }
  }

  // ========== o9TitlebarBackgroundModule ==========
  class o9TitlebarBackgroundModule {
    constructor() {
      this.root = document.documentElement;
      this.browser = document.getElementById("browser");
      this.titlebar = document.getElementById("titlebar");
      this.overlay = null;
      this.lastRect = {};
      this.lastVisible = false;
      this.animationFrameId = null;
    }

    init() {
      if (!this.browser || !this.titlebar) {
        o9.logger.warn("⚠️ [TitlebarBackground] Required elements not found.");
        return;
      }

      this.overlay = document.createElement("div");
      this.overlay.id = "o9-titlebar-background";
      Object.assign(this.overlay.style, {
        position: "absolute",
        display: "none"
      });
      this.browser.appendChild(this.overlay);

      this.update = this.update.bind(this);
      requestAnimationFrame(this.update);

      o9.logger.log("✅ [TitlebarBackground] Tracking initialized.");
    }

    update() {
      const isCompact = this.root.hasAttribute("o9-compact-mode");

      if (!isCompact) {
        if (this.lastVisible) {
          this.overlay.classList.remove("visible");
          this.overlay.style.display = "none";
          this.lastVisible = false;
        }
        this.animationFrameId = requestAnimationFrame(this.update);
        return;
      }

      const rect = this.titlebar.getBoundingClientRect();
      const style = getComputedStyle(this.titlebar);

      const isReallyVisible = (
        rect.width > 5 &&
        rect.height > 5 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight
      );

      const changed = (
        rect.top !== this.lastRect.top ||
        rect.left !== this.lastRect.left ||
        rect.width !== this.lastRect.width ||
        rect.height !== this.lastRect.height
      );

      this.lastRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };

      if (isReallyVisible) {
        Object.assign(this.overlay.style, {
          top: `${rect.top + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          display: "block"
        });

        if (!this.lastVisible) {
          this.overlay.classList.add("visible");
          this.lastVisible = true;
        }
      } else {
        if (this.lastVisible) {
          this.overlay.classList.remove("visible");
          this.overlay.style.display = "none";
          this.lastVisible = false;
        }
      }

      this.animationFrameId = requestAnimationFrame(this.update);
    }

    destroy() {
      cancelAnimationFrame(this.animationFrameId);
      this.overlay?.remove();
      this.overlay = null;
      this.lastVisible = false;
      o9.logger.log("🧹 [TitlebarBackground] Destroyed.");
    }
  }

  // ========== o9NavbarBackgroundModule ==========
  class o9NavbarBackgroundModule {
    constructor() {
      this.root = document.documentElement;
      this.browser = document.getElementById("browser");
      this.navbar = document.getElementById("nav-bar");
      this.overlay = null;
      this.lastRect = {};
      this.lastVisible = false;
      this.animationFrameId = null;
    }

    init() {
      if (!this.browser || !this.navbar) {
        o9.logger.warn("⚠️ [NavbarBackground] Required elements not found.");
        return;
      }

      this.overlay = document.createElement("div");
      this.overlay.id = "o9-navbar-background";
      Object.assign(this.overlay.style, {
        position: "absolute",
        display: "none"
      });
      this.browser.appendChild(this.overlay);

      this.update = this.update.bind(this);
      requestAnimationFrame(this.update);

      o9.logger.log("✅ [NavbarBackground] Tracking initialized.");
    }

    update() {
      const isCompact = this.root.hasAttribute("o9-compact-mode");

      if (!isCompact) {
        if (this.lastVisible) {
          this.overlay.classList.remove("visible");
          this.overlay.style.display = "none";
          this.lastVisible = false;
        }
        this.animationFrameId = requestAnimationFrame(this.update);
        return;
      }

      const rect = this.navbar.getBoundingClientRect();
      const changed = (
        rect.top !== this.lastRect.top ||
        rect.left !== this.lastRect.left ||
        rect.width !== this.lastRect.width ||
        rect.height !== this.lastRect.height
      );

      this.lastRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };

      const isVisible = (
        rect.width > 5 &&
        rect.height > 5 &&
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight
      );

      if (isVisible) {
        Object.assign(this.overlay.style, {
          top: `${rect.top + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          display: "block"
        });

        if (!this.lastVisible) {
          this.overlay.classList.add("visible");
          this.lastVisible = true;
        }
      } else {
        if (this.lastVisible) {
          this.overlay.classList.remove("visible");
          this.overlay.style.display = "none";
          this.lastVisible = false;
        }
      }

      this.animationFrameId = requestAnimationFrame(this.update);
    }

    destroy() {
      cancelAnimationFrame(this.animationFrameId);
      this.overlay?.remove();
      this.overlay = null;
      this.lastVisible = false;
      o9.logger.log("🧹 [NavbarBackground] Destroyed.");
    }
  }

  // ========== o9URLBarBackgroundModule ==========
  class o9URLBarBackgroundModule {
    constructor() {
      this.root = document.documentElement;
      this.browser = document.getElementById("browser");
      this.urlbar = document.getElementById("urlbar");
      this.overlay = null;
      this.lastRect = {};
      this.lastVisible = false;
      this.animationFrameId = null;
    }

    init() {
      if (!this.browser || !this.urlbar) {
        o9.logger.warn("⚠️ [URLBarBackground] Required elements not found.");
        return;
      }

      this.overlay = document.createElement("div");
      this.overlay.id = "o9-urlbar-background";
      Object.assign(this.overlay.style, {
        position: "absolute",
        display: "none"
      });
      this.browser.appendChild(this.overlay);

      this.update = this.update.bind(this);
      requestAnimationFrame(this.update);

      o9.logger.log("✅ [URLBarBackground] Tracking initialized.");
    }

    update() {
      const isOpen = this.urlbar.hasAttribute("open");

      if (!isOpen) {
        if (this.lastVisible) {
          this.overlay.classList.remove("visible");
          this.overlay.style.display = "none";
          this.lastVisible = false;
        }
        this.animationFrameId = requestAnimationFrame(this.update);
        return;
      }

      const rect = this.urlbar.getBoundingClientRect();
      const changed = (
        rect.top !== this.lastRect.top ||
        rect.left !== this.lastRect.left ||
        rect.width !== this.lastRect.width ||
        rect.height !== this.lastRect.height
      );

      this.lastRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };

      const isVisible = (
        rect.width > 5 &&
        rect.height > 5 &&
        rect.top >= 0 &&
        rect.bottom <= window.innerHeight
      );

      if (isVisible) {
        Object.assign(this.overlay.style, {
          top: `${rect.top + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          display: "block"
        });

        if (!this.lastVisible) {
          this.overlay.classList.add("visible");
          this.lastVisible = true;
        }
      } else {
        if (this.lastVisible) {
          this.overlay.classList.remove("visible");
          this.overlay.style.display = "none";
          this.lastVisible = false;
        }
      }

      this.animationFrameId = requestAnimationFrame(this.update);
    }

    destroy() {
      cancelAnimationFrame(this.animationFrameId);
      this.overlay?.remove();
      this.overlay = null;
      this.lastVisible = false;
      o9.logger.log("🧹 [URLBarBackground] Destroyed.");
    }
  }

  
  // ========== o9MediaCoverArtModule ==========
  class o9MediaCoverArtModule {
    constructor() {
      this.OVERLAY_ID = 'o9-media-cover-art';
      this.TOOLBAR_ITEM_SELECTOR = '#zen-media-controls-toolbar > toolbaritem';
      
      this.lastArtworkUrl = null;
      this.originalSetupMediaController = null;
      this._metadataChangeHandler = this._metadataChangeHandler.bind(this);
    }

    init() {
      this._waitForController();
    }
    
    _waitForController() {
      if (typeof window.gZenMediaController?.setupMediaController === 'function') {
        this._onControllerReady();
      } else {
        setTimeout(() => this._waitForController(), 300);
      }
    }

    _onControllerReady() {
      if (this.originalSetupMediaController) return;

      this.originalSetupMediaController = gZenMediaController.setupMediaController.bind(gZenMediaController);
      gZenMediaController.setupMediaController = this._setupMediaControllerPatcher.bind(this);

      const initialController = gZenMediaController._currentMediaController;
      if (initialController) {
        this._setBackgroundFromMetadata(initialController);
        initialController.addEventListener("metadatachange", this._metadataChangeHandler);
      } else {
        this._manageOverlayElement(false);
      }

      o9.logger.log("✅ [MediaCoverArt] Hooked into MediaPlayer.");
    }

    _setupMediaControllerPatcher(controller, browser) {
      this._setBackgroundFromMetadata(controller);
      
      if (controller) {
        controller.removeEventListener("metadatachange", this._metadataChangeHandler);
        controller.addEventListener("metadatachange", this._metadataChangeHandler);
      }

      return this.originalSetupMediaController(controller, browser);
    }

    _metadataChangeHandler(event) {
      const controller = event.target;
      if (controller && typeof controller.getMetadata === 'function') {
        this._setBackgroundFromMetadata(controller);
      } else {
        this._cleanupToDefaultState();
      }
    }

    _setBackgroundFromMetadata(controller) {
      const metadata = controller?.getMetadata?.();
      const artwork = metadata?.artwork;
      let coverUrl = null;

      if (Array.isArray(artwork) && artwork.length > 0) {
        const sorted = [...artwork].sort((a, b) => {
          const [aw, ah] = a.sizes?.split("x").map(Number) || [0, 0];
          const [bw, bh] = b.sizes?.split("x").map(Number) || [0, 0];
          return (bw * bh) - (aw * ah);
        });
        coverUrl = sorted[0]?.src || null;
      }
      
      if (coverUrl === this.lastArtworkUrl) return;
      
      this.lastArtworkUrl = coverUrl;
      this._manageOverlayElement(!!coverUrl);
      this._updateOverlayState(coverUrl);
    }
    
    _manageOverlayElement(shouldExist) {
        const toolbarItem = document.querySelector(this.TOOLBAR_ITEM_SELECTOR);
        if (!toolbarItem) return;

        let overlay = toolbarItem.querySelector(`#${this.OVERLAY_ID}`);
        if (shouldExist && !overlay) {
            overlay = document.createElement('div');
            overlay.id = this.OVERLAY_ID;
            toolbarItem.prepend(overlay);
        } else if (!shouldExist && overlay) {
            overlay.remove();
        }
    }

    _updateOverlayState(coverUrl) {
      const overlay = document.getElementById(this.OVERLAY_ID);
      if (!overlay) return;

      if (coverUrl) {
        overlay.style.backgroundImage = `url("${coverUrl}")`;
        overlay.classList.add('visible');
      } else {
        overlay.style.backgroundImage = 'none';
        overlay.classList.remove('visible');
      }
    }

    _cleanupToDefaultState() {
      this.lastArtworkUrl = null;
      this._updateOverlayState(null);
      this._manageOverlayElement(false);
    }
    
    destroy() {
      if (this.originalSetupMediaController) {
        gZenMediaController.setupMediaController = this.originalSetupMediaController;
        this.originalSetupMediaController = null;
      }
      
      const currentController = gZenMediaController?._currentMediaController;
      if (currentController) {
        currentController.removeEventListener("metadatachange", this._metadataChangeHandler);
      }

      this._cleanupToDefaultState();

      o9.logger.log("🧹 [MediaCoverArt] Destroyed.");
    }
  }

  // Register modules
  o9.register("o9PolyfillModule", o9PolyfillModule);
  o9.register("o9TitlebarBackgroundModule", o9TitlebarBackgroundModule);
  o9.register("o9NavbarBackgroundModule", o9NavbarBackgroundModule);
  o9.register("o9URLBarBackgroundModule", o9URLBarBackgroundModule);
  o9.register("o9MediaCoverArtModule", o9MediaCoverArtModule);

  // Start the core
  o9.init();
})();