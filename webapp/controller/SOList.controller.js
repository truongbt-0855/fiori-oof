// filepath: webapp/controller/SOList.controller.js
sap.ui.define(
  [
    'sap/ui/core/mvc/Controller',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
  ],
  function (Controller, Filter, FilterOperator, MessageToast, MessageBox) {
    'use strict';

    return Controller.extend('com.internal.oof.controller.SOList', {
      onInit: function () {
        const oComponent = this.getOwnerComponent();
        const oModel = oComponent.getModel();
        this.getView().setModel(oModel);
        // Initialize view
      },

      onSearchPress: function () {
        const aFilters = this._buildFilters();
        this._applyTableFilters(aFilters);
      },

      _buildFilters: function () {
        const aFilters = [];

        // Sold-to filter
        const sSoldTo = this.byId('soldToFilter').getValue();
        if (sSoldTo) {
          aFilters.push(new Filter('SoldToParty', FilterOperator.Contains, sSoldTo));
        }

        // Ship-to filter (sử dụng PurchaseOrderByShipToParty)
        const sShipTo = this.byId('shipToFilter').getValue();
        if (sShipTo) {
          aFilters.push(new Filter('PurchaseOrderByShipToParty', FilterOperator.Contains, sShipTo));
        }

        // PO Number filter
        const sPONumber = this.byId('poNumberFilter').getValue();
        if (sPONumber) {
          aFilters.push(new Filter('PurchaseOrderByCustomer', FilterOperator.Contains, sPONumber));
        }

        return aFilters;
      },

      _applyTableFilters: function (aFilters) {
        const oTable = this.byId('soTable');
        const oBinding = oTable.getBinding('items');

        if (oBinding) {
          oBinding.filter(aFilters);
          MessageToast.show('Search completed');
        }
      },

      onClearPress: function () {
        // Clear all filters
        this.byId('soldToFilter').setValue('');
        this.byId('shipToFilter').setValue('');
        this.byId('poNumberFilter').setValue('');

        // Clear table filters
        const oTable = this.byId('soTable');
        const oBinding = oTable.getBinding('items');
        if (oBinding) {
          oBinding.filter([]);
        }

        MessageToast.show('Filters cleared');
      },

      formatStatus: function (iStatus) {
        switch (iStatus) {
          case 1:
            return 'Draft';
          case 2:
            return 'Submitted';
          case '8':
            return 'Error';
          default:
            return 'Unknown';
        }
      },

      formatStatusState: function (iStatus) {
        switch (iStatus) {
          case 1:
            return 'Warning';
          case 2:
            return 'Success';
          case 8:
            return 'Error';
          default:
            return 'None';
        }
      },

      onSoldToValueHelp: function () {
        this._openValueHelpDialog('SoldToParty', 'soldToFilter');
      },

      onShipToValueHelp: function () {
        this._openValueHelpDialog('ShipToParty', 'shipToFilter');
      },

      _openValueHelpDialog: function (sProperty, sInputId) {
        MessageToast.show('Value help for ' + sProperty);
      },

      onItemPress: function (oEvent) {
        const oItem = oEvent.getSource();
        const oContext = oItem.getBindingContext();
        const sSalesOrder = oContext.getProperty('SalesOrder');

        MessageToast.show('Selected SO: ' + sSalesOrder);
      },

      onCreateSOPress: function () {
        this.getOwnerComponent().getRouter().navTo('create_so');
      },

      onEditPress: function (oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const sSalesOrder = oContext.getProperty('SalesOrder');

        MessageToast.show('Edit SO: ' + sSalesOrder);
      },

      onDeletePress: function (oEvent) {
        const oContext = oEvent.getSource().getBindingContext();
        const sSalesOrder = oContext.getProperty('SalesOrder');

        MessageBox.confirm('Are you sure you want to delete SO ' + sSalesOrder + '?', {
          onClose: function (sAction) {
            if (sAction === MessageBox.Action.OK) {
              this._deleteSalesOrder(oContext);
            }
          }.bind(this),
        });
      },

      _deleteSalesOrder: function (oContext) {
        const oModel = this.getView().getModel();

        oModel.delete(oContext.getPath(), {
          success: function () {
            MessageToast.show('Sales Order deleted successfully');
          },
          error: function (oError) {
            MessageBox.error('Error deleting Sales Order: ' + oError.message);
          },
        });
      },

      onExportPress: function () {
        MessageToast.show('Export functionality to be implemented');
      },

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo('overview');
      },
    });
  }
);
