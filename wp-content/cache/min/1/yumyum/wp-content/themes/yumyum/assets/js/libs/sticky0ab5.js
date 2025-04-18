(function ($, elementorFrontend, elementorModules) {
  "use strict";
  var _sticky = elementorModules.frontend.handlers.Base.extend({
    currentConfig: {},
    debouncedReactivate: null,
    bindEvents() {
      elementorFrontend.addListenerOnce(
        this.getUniqueHandlerID() + "sticky",
        "resize",
        this.reactivateOnResize
      );
    },
    unbindEvents() {
      elementorFrontend.removeListeners(
        this.getUniqueHandlerID() + "sticky",
        "resize",
        this.reactivateOnResize
      );
    },
    isStickyInstanceActive() {
      return undefined !== this.$element.data("sticky");
    },
    getResponsiveSetting(setting) {
      const elementSettings = this.getElementSettings();
      return elementorFrontend.getCurrentDeviceSetting(
        elementSettings,
        setting
      );
    },
    getResponsiveSettingList(setting) {
      const breakpoints = Object.keys(
        elementorFrontend.config.responsive.activeBreakpoints
      );
      return ["", ...breakpoints].map((suffix) => {
        return suffix ? `${setting}_${suffix}` : setting;
      });
    },
    getConfig() {
      const elementSettings = this.getElementSettings(),
        stickyOptions = {
          to: elementSettings.sticky,
          offset: this.getResponsiveSetting("sticky_offset"),
          effectsOffset: this.getResponsiveSetting("sticky_effects_offset"),
          classes: {
            sticky: "elementor-sticky",
            stickyActive:
              "elementor-sticky--active elementor-section--handles-inside",
            stickyEffects: "elementor-sticky--effects",
            spacer: "elementor-sticky__spacer",
          },
          isRTL: elementorFrontend.config.is_rtl,
          handleScrollbarWidth: elementorFrontend.isEditMode(),
        },
        $wpAdminBar = elementorFrontend.elements.$wpAdminBar,
        isParentContainer =
          this.isContainerElement(this.$element[0]) &&
          !this.isContainerElement(this.$element[0].parentElement);
      if (
        $wpAdminBar.length &&
        "top" === elementSettings.sticky &&
        "fixed" === $wpAdminBar.css("position")
      ) {
        stickyOptions.offset += $wpAdminBar.height();
      }
      if (elementSettings.sticky_parent && !isParentContainer) {
        stickyOptions.parent =
          ".e-container, .e-container__inner, .e-con, .e-con-inner, .elementor-widget-wrap";
      }
      return stickyOptions;
    },
    activate() {
      this.currentConfig = this.getConfig();
      this.$element.sticky(this.currentConfig);
    },
    deactivate() {
      if (!this.isStickyInstanceActive()) {
        return;
      }
      this.$element.sticky("destroy");
    },
    run(refresh) {
      if (!this.getElementSettings("sticky")) {
        this.deactivate();
        return;
      }
      var currentDeviceMode = elementorFrontend.getCurrentDeviceMode(),
        activeDevices = this.getElementSettings("sticky_on");
      if (-1 !== activeDevices.indexOf(currentDeviceMode)) {
        if (!0 === refresh) {
          this.reactivate();
        } else if (!this.isStickyInstanceActive()) {
          this.activate();
        }
      } else {
        this.deactivate();
      }
    },
    reactivateOnResize() {
      clearTimeout(this.debouncedReactivate);
      this.debouncedReactivate = setTimeout(() => {
        const config = this.getConfig(),
          isDifferentConfig =
            JSON.stringify(config) !== JSON.stringify(this.currentConfig);
        if (isDifferentConfig) {
          this.run(!0);
        }
      }, 300);
    },
    reactivate() {
      this.deactivate();
      this.activate();
    },
    onElementChange(settingKey) {
      if (-1 !== ["sticky", "sticky_on"].indexOf(settingKey)) {
        this.run(!0);
      }
      const settings = [
        ...this.getResponsiveSettingList("sticky_offset"),
        ...this.getResponsiveSettingList("sticky_effects_offset"),
        "sticky_parent",
      ];
      if (-1 !== settings.indexOf(settingKey)) {
        this.reactivate();
      }
    },
    onDeviceModeChange() {
      setTimeout(() => this.run(!0));
    },
    onInit() {
      elementorModules.frontend.handlers.Base.prototype.onInit.apply(
        this,
        arguments
      );
      if (elementorFrontend.isEditMode()) {
        elementor.listenTo(elementor.channels.deviceMode, "change", () =>
          this.onDeviceModeChange()
        );
      }
      this.run();
    },
    onDestroy() {
      elementorModules.frontend.handlers.Base.prototype.onDestroy.apply(
        this,
        arguments
      );
      this.deactivate();
    },
    isContainerElement(element) {
      const containerClasses = [
        "e-container",
        "e-container__inner",
        "e-con",
        "e-con-inner",
      ];
      return containerClasses.some((containerClass) => {
        return element?.classList.contains(containerClass);
      });
    },
  });
  $(window).on("elementor/frontend/init", () => {
    const addHandler = ($element) => {
      elementorFrontend.elementsHandler.addHandler(_sticky, { $element });
    };
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/section",
      addHandler
    );
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/container",
      addHandler
    );
    elementorFrontend.hooks.addAction(
      "frontend/element_ready/widget",
      addHandler
    );
  });
})(jQuery, window.elementorFrontend, window.elementorModules);
