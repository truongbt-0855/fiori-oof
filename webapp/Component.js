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
      const oData = {
        recipient: {
          name: 'World'
        }
      };
      const oModel = new JSONModel(oData);
      this.setModel(oModel);

      // set i18n model
      const i18nModel = new ResourceModel({
        bundleName: 'com.internal.oof.i18n.i18n'
      });

      this.setModel(i18nModel, 'i18n');

      // set device model
      const oDeviceModel = new JSONModel(Device);
      // We have to set the binding mode to OneWay as the device model is read-only & we want to avoid changing the model accidentally
      // when we bind properties of a control to it.
      // By default, models in OpenUI5 are bidirectional (TwoWay). When the property changes, the bound model value is updated as well.
      oDeviceModel.setDefaultBindingMode('OneWay');
      this.setModel(oDeviceModel, 'device');

      // create the views based on the url/hash
      this.getRouter().initialize();
    },

    getContentDensityClass() {
      return Device.support.touch ? 'sapUiSizeCozy' : 'sapUiSizeCompact';
    }
  });
});
