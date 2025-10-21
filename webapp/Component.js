sap.ui.define([
  'sap/ui/core/UIComponent',
  'sap/ui/model/json/JSONModel',
  'sap/ui/model/resource/ResourceModel',
  'sap/ui/Device'
], (UIComponent, JSONModel, ResourceModel, Device) => {
  'use strict';

  return UIComponent.extend('com.internal.oof.Component', {
    metadata: {
      interfaces: ['sap.ui.core.IAsyncContentCreation'],
      manifest: 'json'
    },

    init() {
      // call the init function of the parent
      UIComponent.prototype.init.apply(this, arguments);
      // set data model on view

      // set i18n model
      const i18nModel = new ResourceModel({
        bundleName: 'com.internal.oof.i18n.i18n'
      });

      this.setModel(i18nModel, 'i18n');

      // create the views based on the url/hash
      this.getRouter().initialize();
    },

    getContentDensityClass() {
      return Device.support.touch ? 'sapUiSizeCozy' : 'sapUiSizeCompact';
    }
  });
});
