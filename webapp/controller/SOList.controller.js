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

        // Sales Order filter
        const sSalesOrder = this.byId('salesOrderFilter').getValue();
        if (sSalesOrder) {
          aFilters.push(new Filter('SalesOrder', FilterOperator.Contains, sSalesOrder));
        }

        // Customer PO filter
        const sCustomerPO = this.byId('customerPOFilter').getValue();
        if (sCustomerPO) {
          aFilters.push(new Filter('PurchaseOrderByCustomer', FilterOperator.Contains, sCustomerPO));
        }

        // Ship-to PO filter
        const sShipToPO = this.byId('shipToPOFilter').getValue();
        if (sShipToPO) {
          aFilters.push(new Filter('PurchaseOrderByShipToParty', FilterOperator.Contains, sShipToPO));
        }

        // Delivery Date filter
        const oDeliveryDate = this.byId('deliveryDateFilter').getDateValue();
        if (oDeliveryDate) {
          // Format date to match OData format (YYYY-MM-DD)
          const sFormattedDate = oDeliveryDate.toISOString().split('T')[0];
          aFilters.push(new Filter('RequestedDeliveryDate', FilterOperator.EQ, sFormattedDate));
        }

        // Status filter
        const sStatus = this.byId('statusFilter').getSelectedKey();
        if (sStatus) {
          aFilters.push(new Filter('Status', FilterOperator.EQ, sStatus));
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
        this.byId('salesOrderFilter').setValue('');
        this.byId('customerPOFilter').setValue('');
        this.byId('shipToPOFilter').setValue('');
        this.byId('deliveryDateFilter').setValue('');
        this.byId('statusFilter').setSelectedKey('');

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

      // onItemPress: function (oEvent) {
      //   const oItem = oEvent.getSource();
      //   const oContext = oItem.getBindingContext();
      //   const sSalesOrder = oContext.getProperty('SalesOrder');

      //   MessageToast.show('Selected SO: ' + sSalesOrder);
      // },

      onSelectionChange: function (oEvent) {
        const oTable = oEvent.getSource();
        const aSelectedItems = oTable.getSelectedItems();
        const oSubmitButton = this.byId('submitButton');

        // Enable/disable submit button based on selection
        oSubmitButton.setEnabled(aSelectedItems.length > 0);
      },

      onSubmitPress: function () {
        const oTable = this.byId('soTable');
        const aSelectedItems = oTable.getSelectedItems();

        if (aSelectedItems.length === 0) {
          MessageToast.show('Please select at least one sales order');
          return;
        }

        // Get IDs of selected sales orders
        const aSelectedIds = aSelectedItems.map(function (oItem) {
          const oContext = oItem.getBindingContext();
          return oContext.getProperty('ID'); // hoặc 'SalesOrder' tùy API
        });

        // Show confirmation dialog
        const sMessage = `Are you sure you want to submit ${aSelectedIds.length} sales order(s)?`;

        MessageBox.confirm(sMessage, {
          onClose: (oAction) => {
            if (oAction === MessageBox.Action.OK) {
              // User confirmed deletion, perform the action
              this._submitSalesOrders(aSelectedIds);
            }
          },
        });
      },

      _submitSalesOrders: function (aIds) {
        // Call API to submit sales orders
        MessageToast.show(`Submitting ${aIds.length} sales order(s)...`);
        console.log(aIds);
      },
    });
  }
);
