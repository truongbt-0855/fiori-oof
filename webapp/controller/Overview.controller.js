sap.ui.define([
  'sap/ui/core/mvc/Controller'
], function (Controller) {
  'use strict';

  return Controller.extend('com.internal.oof.controller.Overview', {
    
    onCreateSOPress: function () {
      this.getOwnerComponent().getRouter().navTo('create_so');
    },

    onSOListPress: function () {
      this.getOwnerComponent().getRouter().navTo('list_so');
    }
  });
});