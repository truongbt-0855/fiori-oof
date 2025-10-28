sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/m/MessageToast',
    'sap/m/MessageBox'
], function (Controller, MessageToast, MessageBox) {
    'use strict';

    return Controller.extend('com.internal.oof.controller.SODetail', {
        
        onInit: function () {
            // Initialize detail model
            const oDetailModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oDetailModel, "detailModel");
        },
        
        formatStatus: function (iStatus) {
            const statusMap = {
                1: 'Draft',
                2: 'Submitted', 
                8: 'Error'
            };
            return statusMap[+iStatus] || 'Unknown';
        },

        formatStatusState: function (iStatus) {
            const stateMap = {
                1: 'Warning',
                2: 'Success',
                8: 'Error'
            };
            return stateMap[+iStatus] || 'None';
        },
        
        onCloseDetailPress: function () {
            // Communicate back to parent controller
            const oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.publish("SODetail", "close", {});
        },

        onEditDetailPress: function () {
            const oDetailModel = this.getView().getModel("detailModel");
            const sSalesOrder = oDetailModel.getProperty("/SalesOrder");
            MessageToast.show("Edit functionality for SO " + sSalesOrder);
        },

        onDeleteDetailPress: function () {
            const oDetailModel = this.getView().getModel("detailModel");
            const sSalesOrder = oDetailModel.getProperty("/SalesOrder");
            const sId = oDetailModel.getProperty("/ID");
            
            MessageBox.confirm(`Are you sure you want to delete Sales Order ${sSalesOrder}?`, {
                onOK: function() {
                    // Communicate back to parent controller
                    const oEventBus = sap.ui.getCore().getEventBus();
                    oEventBus.publish("SODetail", "delete", { id: sId });
                }
            });
        },
        
        loadDetail: function(sSalesOrderId) {
            const sUrl = `https://803f6caftrial-dev-oof-backend-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/admin/SalesOrders/${sSalesOrderId}`;
            
            // Show loading
            this.byId("detailPanel").setBusy(true);
            
            fetch(sUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Set detail data to model
                    const oDetailModel = this.getView().getModel("detailModel");
                    oDetailModel.setData(data);
                    
                    this.byId("detailPanel").setBusy(false);
                    MessageToast.show("Sales Order details loaded");
                })
                .catch(error => {
                    this.byId("detailPanel").setBusy(false);
                    MessageBox.error("Failed to load sales order details: " + error.message);
                    console.error('Error:', error);
                });
        },
        
        showPanel: function() {
            const oDetailPanel = this.byId("detailPanel");
            oDetailPanel.setVisible(true);
            
            // Add animation class
            setTimeout(() => {
                oDetailPanel.addStyleClass("show");
                oDetailPanel.removeStyleClass("hide");
            }, 50);
        },
        
        hidePanel: function() {
            const oDetailPanel = this.byId("detailPanel");
            
            // Add hide animation
            oDetailPanel.addStyleClass("hide");
            oDetailPanel.removeStyleClass("show");
            
            // Hide panel completely after animation
            setTimeout(() => {
                oDetailPanel.setVisible(false);
            }, 300);
        }
    });
});