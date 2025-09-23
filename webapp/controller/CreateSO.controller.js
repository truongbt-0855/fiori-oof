sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/m/MessageToast',
  'sap/m/MessageBox',
  'sap/ui/core/ValueState',
  'sap/ui/model/json/JSONModel',
  'sap/ui/core/Fragment',
  'sap/ui/core/format/DateFormat',
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator'
], (Controller, MessageToast, MessageBox, ValueState, JSONModel, Fragment, DateFormat, Filter, FilterOperator) => {
  'use strict';

  return Controller.extend('com.internal.oof.controller.CreateSO', {
    onInit() {
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
      
      // Initialize form data model
      this._initializeModel();
      
      // Initialize customer data (mock data for demo)
      this._loadCustomers();
      
      // Set minimum delivery date to today
      this._setMinimumDeliveryDate();
    },

    _initializeModel: function() {
      const oModel = new JSONModel({
        // Header Information
        soldToCustomer: "",
        shipToCustomer: "",
        poNumber: "",
        requestDeliveryDate: "",
        incoterms: "",
        
        // Line Items
        lineItems: [],
        selectedLineItemIndex: -1,
        
        // Calculated Values
        totalItems: 0,
        netAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        currency: "USD",
        
        // Attachments
        attachedFiles: [],
        
        // Master Data
        customers: [],
        incotermsList: [],
        uomList: [],
        plantsList: [],
        
        // Form Validation
        formValid: false,
        minDeliveryDate: new Date(),
        
        // Value states for validation
        soldToState: ValueState.None,
        soldToStateText: "",
        shipToState: ValueState.None,
        shipToStateText: "",
        poNumberState: ValueState.None,
        poNumberStateText: "",
        requestDeliveryDateState: ValueState.None,
        requestDeliveryDateStateText: "",
        incotermsState: ValueState.None,
        incotermsStateText: ""
      });
      
      this.getView().setModel(oModel);
    },

    _loadCustomers: function() {
      // Mock customer data - in real app, this would come from S/4HANA
      const aCustomers = [
        { customerID: "CUST001", customerName: "ABC Corporation" },
        { customerID: "CUST002", customerName: "XYZ Industries" },
        { customerID: "CUST003", customerName: "Global Solutions Ltd" },
        { customerID: "CUST004", customerName: "Tech Innovations Inc" }
      ];
      
      const oModel = this.getView().getModel();
      oModel.setProperty("/customers", aCustomers);
      
      // Auto-select first customer for sold-to
      oModel.setProperty("/soldToCustomer", aCustomers[0].customerID);
      oModel.setProperty("/shipToCustomer", aCustomers[0].customerID);
      
      // Load other master data
      this._loadIncoterms();
      this._loadUoM();
      this._loadPlants();
    },

    _loadIncoterms: function() {
      // Mock Incoterms data based on customer master
      const aIncoterms = [
        { code: "FOB", description: "Free on Board" },
        { code: "CIF", description: "Cost, Insurance & Freight" },
        { code: "EXW", description: "Ex Works" },
        { code: "DDP", description: "Delivered Duty Paid" },
        { code: "CPT", description: "Carriage Paid To" }
      ];
      
      const oModel = this.getView().getModel();
      oModel.setProperty("/incotermsList", aIncoterms);
      // Set default Incoterms
      oModel.setProperty("/incoterms", aIncoterms[0].code);
    },

    _loadUoM: function() {
      const aUoM = [
        { code: "EA", description: "Each" },
        { code: "PC", description: "Piece" },
        { code: "SET", description: "Set" },
        { code: "KG", description: "Kilogram" },
        { code: "LB", description: "Pound" }
      ];
      
      const oModel = this.getView().getModel();
      oModel.setProperty("/uomList", aUoM);
    },

    _loadPlants: function() {
      const aPlants = [
        { plantCode: "1000", plantName: "Plant Hamburg" },
        { plantCode: "1200", plantName: "Plant Berlin" },
        { plantCode: "1400", plantName: "Plant Munich" },
        { plantCode: "2000", plantName: "Plant New York" }
      ];
      
      const oModel = this.getView().getModel();
      oModel.setProperty("/plantsList", aPlants);
    },

    _setMinimumDeliveryDate: function() {
      const oToday = new Date();
      const oModel = this.getView().getModel();
      oModel.setProperty("/minDeliveryDate", oToday);
    },

    onPageCreateSONavButtonPress: function() {
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("overview");
    },

    onCustomersComboBoxSelectionChange: function(oEvent) {
      // This method is kept for backward compatibility
      const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
      const oModel = this.getView().getModel();
      
      oModel.setProperty("/soldToCustomer", sSelectedKey);
      oModel.setProperty("/soldToState", ValueState.None);
      oModel.setProperty("/soldToStateText", "");
      
      this._validateForm();
      MessageToast.show("Customer selected: " + sSelectedKey);
    },

    onSoldToComboBoxSelectionChange: function(oEvent) {
      const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
      const oModel = this.getView().getModel();
      
      oModel.setProperty("/soldToCustomer", sSelectedKey);
      oModel.setProperty("/soldToState", ValueState.None);
      oModel.setProperty("/soldToStateText", "");
      
      // Auto-populate ship-to with sold-to if empty
      if (!oModel.getProperty("/shipToCustomer")) {
        oModel.setProperty("/shipToCustomer", sSelectedKey);
      }
      
      // Load default Incoterms for this customer
      this._loadCustomerDefaultIncoterms(sSelectedKey);
      
      this._validateForm();
      MessageToast.show("Sold-to customer selected: " + sSelectedKey);
    },

    onShipToComboBoxSelectionChange: function(oEvent) {
      const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
      const oModel = this.getView().getModel();
      
      oModel.setProperty("/shipToCustomer", sSelectedKey);
      oModel.setProperty("/shipToState", ValueState.None);
      oModel.setProperty("/shipToStateText", "");
      
      this._validateForm();
      MessageToast.show("Ship-to customer selected: " + sSelectedKey);
    },

    onPONumberInputChange: function(oEvent) {
      this._validatePONumber();
      this._validateForm();
    },

    onRequestDeliveryDatePickerChange: function(oEvent) {
      this._validateRequestDeliveryDate();
      this._validateForm();
    },

    onIncotermsComboBoxSelectionChange: function(oEvent) {
      const sSelectedKey = oEvent.getParameter("selectedItem").getKey();
      const oModel = this.getView().getModel();
      
      oModel.setProperty("/incoterms", sSelectedKey);
      oModel.setProperty("/incotermsState", ValueState.None);
      oModel.setProperty("/incotermsStateText", "");
      
      this._validateForm();
      MessageToast.show("Incoterms selected: " + sSelectedKey);
    },

    _loadCustomerDefaultIncoterms: function(sCustomerID) {
      // Mock customer-specific default Incoterms from S/4HANA Customer Master
      const mCustomerIncoterms = {
        "CUST001": "FOB",
        "CUST002": "CIF", 
        "CUST003": "DDP",
        "CUST004": "EXW"
      };
      
      const sDefaultIncoterms = mCustomerIncoterms[sCustomerID] || "FOB";
      const oModel = this.getView().getModel();
      oModel.setProperty("/incoterms", sDefaultIncoterms);
    },

    // Line Items Management
    onButtonAddLineItemPress: function() {
      const oModel = this.getView().getModel();
      const aLineItems = oModel.getProperty("/lineItems") || [];
      
      const oNewLineItem = {
        itemNumber: (aLineItems.length + 1) * 10,
        materialID: "",
        materialDescription: "",
        quantity: "",
        uom: "EA",
        unitPrice: 0,
        totalPrice: 0,
        plant: "",
        storageLocation: "",
        currency: "USD",
        
        // Storage locations for selected plant
        storageLocations: [],
        
        // Validation states
        materialIDState: ValueState.None,
        materialIDStateText: "",
        quantityState: ValueState.None,
        quantityStateText: "",
        uomState: ValueState.None,
        uomStateText: "",
        priceState: ValueState.None,
        priceStateText: "",
        plantState: ValueState.None,
        plantStateText: "",
        storageLocationState: ValueState.None,
        storageLocationStateText: ""
      };
      
      aLineItems.push(oNewLineItem);
      oModel.setProperty("/lineItems", aLineItems);
      
      this._calculateTotals();
      MessageToast.show("New line item added");
    },

    onButtonDeleteLineItemPress: function() {
      const oModel = this.getView().getModel();
      const iSelectedIndex = oModel.getProperty("/selectedLineItemIndex");
      
      if (iSelectedIndex >= 0) {
        const aLineItems = oModel.getProperty("/lineItems");
        aLineItems.splice(iSelectedIndex, 1);
        
        // Renumber items
        aLineItems.forEach((oItem, index) => {
          oItem.itemNumber = (index + 1) * 10;
        });
        
        oModel.setProperty("/lineItems", aLineItems);
        oModel.setProperty("/selectedLineItemIndex", -1);
        
        this._calculateTotals();
        MessageToast.show("Line item deleted");
      }
    },

    onColumnListItemPress: function(oEvent) {
      const oModel = this.getView().getModel();
      const oSelectedItem = oEvent.getSource();
      const oContext = oSelectedItem.getBindingContext();
      const iIndex = parseInt(oContext.getPath().split("/")[2]);
      
      oModel.setProperty("/selectedLineItemIndex", iIndex);
    },

    // Line Item Field Changes
    onLineItemMaterialChange: function(oEvent) {
      const oSource = oEvent.getSource();
      const oContext = oSource.getBindingContext();
      const sMaterialID = oEvent.getParameter("value");
      
      if (sMaterialID) {
        this._lookupLineItemMaterial(oContext, sMaterialID);
      }
      
      this._validateLineItem(oContext);
    },

    onLineItemQuantityChange: function(oEvent) {
      const oSource = oEvent.getSource();
      const oContext = oSource.getBindingContext();
      
      this._calculateLineItemTotal(oContext);
      this._validateLineItem(oContext);
      this._calculateTotals();
    },

    onLineItemUoMChange: function(oEvent) {
      const oSource = oEvent.getSource();
      const oContext = oSource.getBindingContext();
      
      this._validateLineItem(oContext);
    },

    onLineItemPriceChange: function(oEvent) {
      const oSource = oEvent.getSource();
      const oContext = oSource.getBindingContext();
      
      this._calculateLineItemTotal(oContext);
      this._validateLineItem(oContext);
      this._calculateTotals();
    },

    onLineItemPlantChange: function(oEvent) {
      const oSource = oEvent.getSource();
      const oContext = oSource.getBindingContext();
      const sSelectedPlant = oEvent.getParameter("selectedItem").getKey();
      
      // Load storage locations for selected plant
      this._loadStorageLocationsForPlant(oContext, sSelectedPlant);
      
      this._validateLineItem(oContext);
    },

    onLineItemStorageLocationChange: function(oEvent) {
      const oSource = oEvent.getSource();
      const oContext = oSource.getBindingContext();
      
      this._validateLineItem(oContext);
    },

    _lookupLineItemMaterial: function(oContext, sMaterialID) {
      // Mock material lookup - in real app, this would call S/4HANA
      const aMaterials = [
        { 
          materialID: "MAT001", 
          materialDescription: "Laptop Computer Dell XPS 13",
          unitPrice: 1299.99,
          baseUoM: "EA"
        },
        { 
          materialID: "MAT002", 
          materialDescription: "Monitor 27 inch 4K",
          unitPrice: 599.99,
          baseUoM: "EA"
        }
      ];
      
      const oFoundMaterial = aMaterials.find(m => m.materialID === sMaterialID);
      const oModel = this.getView().getModel();
      
      if (oFoundMaterial) {
        oModel.setProperty(oContext.getPath() + "/materialDescription", oFoundMaterial.materialDescription);
        oModel.setProperty(oContext.getPath() + "/unitPrice", oFoundMaterial.unitPrice);
        oModel.setProperty(oContext.getPath() + "/uom", oFoundMaterial.baseUoM);
        
        this._calculateLineItemTotal(oContext);
      }
    },

    _calculateLineItemTotal: function(oContext) {
      const oModel = this.getView().getModel();
      const sPath = oContext.getPath();
      
      const fQuantity = parseFloat(oModel.getProperty(sPath + "/quantity")) || 0;
      const fUnitPrice = parseFloat(oModel.getProperty(sPath + "/unitPrice")) || 0;
      const fTotal = fQuantity * fUnitPrice;
      
      oModel.setProperty(sPath + "/totalPrice", fTotal.toFixed(2));
    },

    _loadStorageLocationsForPlant: function(oContext, sPlantCode) {
      // Mock storage locations for plant
      const mPlantStorageLocations = {
        "1000": [
          { locationCode: "0001", locationName: "Raw Materials" },
          { locationCode: "0002", locationName: "Finished Goods" }
        ],
        "1200": [
          { locationCode: "0001", locationName: "Main Storage" },
          { locationCode: "0003", locationName: "Quality Control" }
        ]
      };
      
      const aStorageLocations = mPlantStorageLocations[sPlantCode] || [];
      const oModel = this.getView().getModel();
      
      oModel.setProperty(oContext.getPath() + "/storageLocations", aStorageLocations);
      
      // Auto-select first storage location
      if (aStorageLocations.length > 0) {
        oModel.setProperty(oContext.getPath() + "/storageLocation", aStorageLocations[0].locationCode);
      }
    },

    _calculateTotals: function() {
      const oModel = this.getView().getModel();
      const aLineItems = oModel.getProperty("/lineItems") || [];
      
      let fNetAmount = 0;
      let iTotalItems = aLineItems.length;
      
      aLineItems.forEach(oItem => {
        fNetAmount += parseFloat(oItem.totalPrice) || 0;
      });
      
      const fTaxAmount = fNetAmount * 0.19; // 19% VAT
      const fTotalAmount = fNetAmount + fTaxAmount;
      
      oModel.setProperty("/totalItems", iTotalItems);
      oModel.setProperty("/netAmount", fNetAmount.toFixed(2));
      oModel.setProperty("/taxAmount", fTaxAmount.toFixed(2));
      oModel.setProperty("/totalAmount", fTotalAmount.toFixed(2));
    },

    // File Upload Handlers
    onFileUploaderChange: function(oEvent) {
      const oFileUploader = oEvent.getSource();
      const sFileName = oFileUploader.getValue();
      
      if (sFileName) {
        const oModel = this.getView().getModel();
        const aAttachedFiles = oModel.getProperty("/attachedFiles") || [];
        
        const oFile = {
          fileName: sFileName,
          fileType: sFileName.split('.').pop().toUpperCase(),
          fileSize: "Unknown", // In real app, get actual file size
          uploadDate: new Date().toLocaleDateString()
        };
        
        aAttachedFiles.push(oFile);
        oModel.setProperty("/attachedFiles", aAttachedFiles);
        
        MessageToast.show("File attached: " + sFileName);
      }
    },

    onStandardListItemPress: function(oEvent) {
      const oItem = oEvent.getSource();
      const oContext = oItem.getBindingContext();
      const sFileName = oContext.getProperty("fileName");
      
      MessageToast.show("File selected: " + sFileName);
    },

    onMaterialIDInputValueHelpRequest: function() {
      // Open material value help dialog
      this._openMaterialValueHelp();
    },

    _openMaterialValueHelp: function() {
      if (!this._oMaterialDialog) {
        Fragment.load({
          id: this.getView().getId(),
          name: "com.internal.oof.fragment.MaterialValueHelp",
          controller: this
        }).then(function(oDialog) {
          this._oMaterialDialog = oDialog;
          this.getView().addDependent(this._oMaterialDialog);
          this._loadMaterialData();
          this._oMaterialDialog.open();
        }.bind(this));
      } else {
        this._loadMaterialData();
        this._oMaterialDialog.open();
      }
    },

    _loadMaterialData: function() {
      // Mock material data - in real app, this would come from S/4HANA
      const aMaterials = [
        { 
          materialID: "MAT001", 
          materialDescription: "Laptop Computer Dell XPS 13",
          unitPrice: 1299.99,
          availability: "Available",
          availableQuantity: 150
        },
        { 
          materialID: "MAT002", 
          materialDescription: "Monitor 27 inch 4K",
          unitPrice: 599.99,
          availability: "Available",
          availableQuantity: 75
        },
        { 
          materialID: "MAT003", 
          materialDescription: "Wireless Mouse Logitech MX",
          unitPrice: 89.99,
          availability: "Limited",
          availableQuantity: 25
        },
        { 
          materialID: "MAT004", 
          materialDescription: "Mechanical Keyboard RGB",
          unitPrice: 159.99,
          availability: "Out of Stock",
          availableQuantity: 0
        }
      ];

      if (this._oMaterialDialog) {
        const oMaterialModel = new JSONModel({ materials: aMaterials });
        this._oMaterialDialog.setModel(oMaterialModel, "materials");
      }
    },

    onSelectDialogConfirm: function(oEvent) {
      const aSelectedItems = oEvent.getParameter("selectedItems");
      if (aSelectedItems && aSelectedItems.length > 0) {
        const oSelectedItem = aSelectedItems[0];
        const oContext = oSelectedItem.getBindingContext("materials");
        const oSelectedMaterial = oContext.getObject();
        
        const oModel = this.getView().getModel();
        oModel.setProperty("/materialID", oSelectedMaterial.materialID);
        oModel.setProperty("/materialDescription", oSelectedMaterial.materialDescription);
        oModel.setProperty("/unitPrice", oSelectedMaterial.unitPrice);
        
        // Set availability status
        this._setAvailabilityStatus(oSelectedMaterial);
        
        // Clear validation state
        oModel.setProperty("/materialIDState", ValueState.None);
        oModel.setProperty("/materialIDStateText", "");
        
        // Recalculate price
        this._calculateTotalPrice();
        this._validateForm();
        
        MessageToast.show("Material selected: " + oSelectedMaterial.materialID);
      }
    },

    onSelectDialogCancel: function() {
      // Dialog closes automatically
    },

    onSelectDialogSearch: function(oEvent) {
      const sValue = oEvent.getParameter("value");
      this._filterMaterials(sValue);
    },

    onSelectDialogLiveChange: function(oEvent) {
      const sValue = oEvent.getParameter("value");
      this._filterMaterials(sValue);
    },

    _filterMaterials: function(sValue) {
      if (this._oMaterialDialog) {
        const oBinding = this._oMaterialDialog.getBinding("items");
        if (oBinding) {
          const aFilters = [];
          if (sValue) {
            aFilters.push(new Filter("materialID", FilterOperator.Contains, sValue));
            aFilters.push(new Filter("materialDescription", FilterOperator.Contains, sValue));
            const oOrFilter = new Filter({
              filters: aFilters,
              and: false
            });
            oBinding.filter([oOrFilter]);
          } else {
            oBinding.filter([]);
          }
        }
      }
    },

    onMaterialSelect: function(oEvent) {
      const oSelectedItem = oEvent.getParameter("listItem");
      const oContext = oSelectedItem.getBindingContext("materials");
      const oSelectedMaterial = oContext.getObject();
      
      const oModel = this.getView().getModel();
      oModel.setProperty("/materialID", oSelectedMaterial.materialID);
      oModel.setProperty("/materialDescription", oSelectedMaterial.materialDescription);
      oModel.setProperty("/unitPrice", oSelectedMaterial.unitPrice);
      
      // Set availability status
      this._setAvailabilityStatus(oSelectedMaterial);
      
      // Clear validation state
      oModel.setProperty("/materialIDState", ValueState.None);
      oModel.setProperty("/materialIDStateText", "");
      
      // Recalculate price
      this._calculateTotalPrice();
      
      this._oMaterialDialog.close();
      this._validateForm();
      
      MessageToast.show("Material selected: " + oSelectedMaterial.materialID);
    },

    onMaterialDialogCancel: function() {
      this._oMaterialDialog.close();
    },

    onMaterialIDInputChange: function(oEvent) {
      const sValue = oEvent.getParameter("value");
      const oModel = this.getView().getModel();
      
      if (sValue) {
        // Simulate material lookup
        this._lookupMaterial(sValue);
      } else {
        oModel.setProperty("/materialDescription", "");
        oModel.setProperty("/unitPrice", 0);
        this._clearAvailabilityStatus();
        this._calculateTotalPrice();
      }
      
      this._validateMaterialID();
      this._validateForm();
    },

    _lookupMaterial: function(sMaterialID) {
      // Simulate S/4HANA material lookup
      const aMaterials = [
        { 
          materialID: "MAT001", 
          materialDescription: "Laptop Computer Dell XPS 13",
          unitPrice: 1299.99,
          availability: "Available",
          availableQuantity: 150
        },
        { 
          materialID: "MAT002", 
          materialDescription: "Monitor 27 inch 4K",
          unitPrice: 599.99,
          availability: "Available",
          availableQuantity: 75
        }
      ];
      
      const oFoundMaterial = aMaterials.find(m => m.materialID === sMaterialID);
      const oModel = this.getView().getModel();
      
      if (oFoundMaterial) {
        oModel.setProperty("/materialDescription", oFoundMaterial.materialDescription);
        oModel.setProperty("/unitPrice", oFoundMaterial.unitPrice);
        this._setAvailabilityStatus(oFoundMaterial);
        this._calculateTotalPrice();
      } else {
        oModel.setProperty("/materialDescription", "Material not found");
        oModel.setProperty("/unitPrice", 0);
        this._clearAvailabilityStatus();
        this._calculateTotalPrice();
      }
    },

    _setAvailabilityStatus: function(oMaterial) {
      const oModel = this.getView().getModel();
      
      let sState, sIcon;
      switch (oMaterial.availability) {
        case "Available":
          sState = "Success";
          sIcon = "sap-icon://accept";
          break;
        case "Limited":
          sState = "Warning";
          sIcon = "sap-icon://warning";
          break;
        case "Out of Stock":
          sState = "Error";
          sIcon = "sap-icon://decline";
          break;
        default:
          sState = "None";
          sIcon = "";
      }
      
      oModel.setProperty("/availabilityText", oMaterial.availability + " (" + oMaterial.availableQuantity + " units)");
      oModel.setProperty("/availabilityState", sState);
      oModel.setProperty("/availabilityIcon", sIcon);
    },

    _clearAvailabilityStatus: function() {
      const oModel = this.getView().getModel();
      oModel.setProperty("/availabilityText", "");
      oModel.setProperty("/availabilityState", "None");
      oModel.setProperty("/availabilityIcon", "");
    },

    onQuantityInputChange: function(oEvent) {
      this._validateQuantity();
      this._calculateTotalPrice();
      this._validateForm();
    },

    onDeliveryDateDatePickerChange: function(oEvent) {
      this._validateDeliveryDate();
      this._validateForm();
    },

    _calculateTotalPrice: function() {
      const oModel = this.getView().getModel();
      const fUnitPrice = parseFloat(oModel.getProperty("/unitPrice")) || 0;
      const fQuantity = parseFloat(oModel.getProperty("/quantity")) || 0;
      const fTotalPrice = fUnitPrice * fQuantity;
      
      oModel.setProperty("/totalPrice", fTotalPrice.toFixed(2));
    },

    _validateForm: function() {
      const bSoldToValid = this._validateSoldTo();
      const bShipToValid = this._validateShipTo();
      const bPONumberValid = this._validatePONumber();
      const bRequestDeliveryDateValid = this._validateRequestDeliveryDate();
      const bIncotermsValid = this._validateIncoterms();
      const bLineItemsValid = this._validateAllLineItems();
      
      const bFormValid = bSoldToValid && bShipToValid && bPONumberValid && 
                        bRequestDeliveryDateValid && bIncotermsValid && bLineItemsValid;
      
      const oModel = this.getView().getModel();
      oModel.setProperty("/formValid", bFormValid);
      
      return bFormValid;
    },

    _validateSoldTo: function() {
      const oModel = this.getView().getModel();
      const sSoldTo = oModel.getProperty("/soldToCustomer");
      
      if (!sSoldTo) {
        oModel.setProperty("/soldToState", ValueState.Error);
        oModel.setProperty("/soldToStateText", "Sold-to customer is required");
        return false;
      }
      
      oModel.setProperty("/soldToState", ValueState.None);
      oModel.setProperty("/soldToStateText", "");
      return true;
    },

    _validateShipTo: function() {
      const oModel = this.getView().getModel();
      const sShipTo = oModel.getProperty("/shipToCustomer");
      
      if (!sShipTo) {
        oModel.setProperty("/shipToState", ValueState.Error);
        oModel.setProperty("/shipToStateText", "Ship-to customer is required");
        return false;
      }
      
      oModel.setProperty("/shipToState", ValueState.None);
      oModel.setProperty("/shipToStateText", "");
      return true;
    },

    _validatePONumber: function() {
      const oModel = this.getView().getModel();
      const sPONumber = oModel.getProperty("/poNumber");
      
      if (!sPONumber) {
        oModel.setProperty("/poNumberState", ValueState.Error);
        oModel.setProperty("/poNumberStateText", "PO Number is required");
        return false;
      }
      
      if (sPONumber.length < 3) {
        oModel.setProperty("/poNumberState", ValueState.Error);
        oModel.setProperty("/poNumberStateText", "PO Number must be at least 3 characters");
        return false;
      }
      
      oModel.setProperty("/poNumberState", ValueState.None);
      oModel.setProperty("/poNumberStateText", "");
      return true;
    },

    _validateRequestDeliveryDate: function() {
      const oModel = this.getView().getModel();
      const sDeliveryDate = oModel.getProperty("/requestDeliveryDate");
      
      if (!sDeliveryDate) {
        oModel.setProperty("/requestDeliveryDateState", ValueState.Error);
        oModel.setProperty("/requestDeliveryDateStateText", "Request delivery date is required");
        return false;
      }
      
      const oDeliveryDate = new Date(sDeliveryDate);
      const oToday = new Date();
      oToday.setHours(0, 0, 0, 0);
      
      if (oDeliveryDate < oToday) {
        oModel.setProperty("/requestDeliveryDateState", ValueState.Error);
        oModel.setProperty("/requestDeliveryDateStateText", "Delivery date cannot be in the past");
        return false;
      }
      
      oModel.setProperty("/requestDeliveryDateState", ValueState.None);
      oModel.setProperty("/requestDeliveryDateStateText", "");
      return true;
    },

    _validateIncoterms: function() {
      const oModel = this.getView().getModel();
      const sIncoterms = oModel.getProperty("/incoterms");
      
      if (!sIncoterms) {
        oModel.setProperty("/incotermsState", ValueState.Error);
        oModel.setProperty("/incotermsStateText", "Incoterms is required");
        return false;
      }
      
      oModel.setProperty("/incotermsState", ValueState.None);
      oModel.setProperty("/incotermsStateText", "");
      return true;
    },

    _validateAllLineItems: function() {
      const oModel = this.getView().getModel();
      const aLineItems = oModel.getProperty("/lineItems") || [];
      
      if (aLineItems.length === 0) {
        MessageToast.show("At least one line item is required");
        return false;
      }
      
      let bAllValid = true;
      aLineItems.forEach((oItem, index) => {
        const sPath = "/lineItems/" + index;
        const oContext = { getPath: () => sPath };
        if (!this._validateLineItem(oContext)) {
          bAllValid = false;
        }
      });
      
      return bAllValid;
    },

    _validateLineItem: function(oContext) {
      const oModel = this.getView().getModel();
      const sPath = oContext.getPath();
      
      let bValid = true;
      
      // Validate Material ID
      const sMaterialID = oModel.getProperty(sPath + "/materialID");
      if (!sMaterialID) {
        oModel.setProperty(sPath + "/materialIDState", ValueState.Error);
        oModel.setProperty(sPath + "/materialIDStateText", "Material is required");
        bValid = false;
      } else {
        oModel.setProperty(sPath + "/materialIDState", ValueState.None);
        oModel.setProperty(sPath + "/materialIDStateText", "");
      }
      
      // Validate Quantity
      const sQuantity = oModel.getProperty(sPath + "/quantity");
      const fQuantity = parseFloat(sQuantity);
      if (!sQuantity || isNaN(fQuantity) || fQuantity <= 0) {
        oModel.setProperty(sPath + "/quantityState", ValueState.Error);
        oModel.setProperty(sPath + "/quantityStateText", "Valid quantity is required");
        bValid = false;
      } else {
        oModel.setProperty(sPath + "/quantityState", ValueState.None);
        oModel.setProperty(sPath + "/quantityStateText", "");
      }
      
      // Validate UoM
      const sUoM = oModel.getProperty(sPath + "/uom");
      if (!sUoM) {
        oModel.setProperty(sPath + "/uomState", ValueState.Error);
        oModel.setProperty(sPath + "/uomStateText", "Unit of measure is required");
        bValid = false;
      } else {
        oModel.setProperty(sPath + "/uomState", ValueState.None);
        oModel.setProperty(sPath + "/uomStateText", "");
      }
      
      // Validate Plant
      const sPlant = oModel.getProperty(sPath + "/plant");
      if (!sPlant) {
        oModel.setProperty(sPath + "/plantState", ValueState.Error);
        oModel.setProperty(sPath + "/plantStateText", "Plant is required");
        bValid = false;
      } else {
        oModel.setProperty(sPath + "/plantState", ValueState.None);
        oModel.setProperty(sPath + "/plantStateText", "");
      }
      
      // Validate Storage Location
      const sStorageLocation = oModel.getProperty(sPath + "/storageLocation");
      if (!sStorageLocation) {
        oModel.setProperty(sPath + "/storageLocationState", ValueState.Error);
        oModel.setProperty(sPath + "/storageLocationStateText", "Storage location is required");
        bValid = false;
      } else {
        oModel.setProperty(sPath + "/storageLocationState", ValueState.None);
        oModel.setProperty(sPath + "/storageLocationStateText", "");
      }
      
      return bValid;
    },

    _validateCustomerID: function() {
      // Keep for backward compatibility
      return this._validateSoldTo();
    },

    _validateMaterialID: function() {
      // Keep for backward compatibility
      return true;
    },

    _validateQuantity: function() {
      // Keep for backward compatibility
      return true;
    },

    _validateDeliveryDate: function() {
      // Keep for backward compatibility
      return this._validateRequestDeliveryDate();
    },

    onButtonCancelPress: function() {
      MessageBox.confirm("Are you sure you want to cancel? All changes will be lost.", {
        onClose: function(sAction) {
          if (sAction === MessageBox.Action.OK) {
            this.onPageCreateSONavButtonPress();
          }
        }.bind(this)
      });
    },

    onButtonSavePress: function() {
      if (this._validateForm()) {
        this._saveSalesOrder();
      } else {
        MessageToast.show("Please correct all validation errors before saving");
      }
    },

    _saveSalesOrder: function() {
      const oModel = this.getView().getModel();
      const oData = oModel.getData();
      
      // Prepare sales order data for S/4HANA
      const oSalesOrderData = {
        header: {
          soldToCustomer: oData.soldToCustomer,
          shipToCustomer: oData.shipToCustomer,
          poNumber: oData.poNumber,
          requestDeliveryDate: oData.requestDeliveryDate,
          incoterms: oData.incoterms,
          currency: oData.currency,
          netAmount: oData.netAmount,
          taxAmount: oData.taxAmount,
          totalAmount: oData.totalAmount
        },
        lineItems: oData.lineItems.map(item => ({
          itemNumber: item.itemNumber,
          materialID: item.materialID,
          quantity: item.quantity,
          uom: item.uom,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          plant: item.plant,
          storageLocation: item.storageLocation
        })),
        attachments: oData.attachedFiles
      };
      
      // Simulate saving to S/4HANA
      console.log("Sales Order Data to be saved:", oSalesOrderData);
      
      MessageBox.success(
        "Sales Order created successfully!\n\n" +
        "Sold-to: " + oData.soldToCustomer + "\n" +
        "Ship-to: " + oData.shipToCustomer + "\n" +
        "PO Number: " + oData.poNumber + "\n" +
        "Line Items: " + oData.lineItems.length + "\n" +
        "Total Amount: " + oData.totalAmount + " " + oData.currency + "\n" +
        "Attachments: " + oData.attachedFiles.length + " file(s)", 
        {
          onClose: function() {
            this.onPageCreateSONavButtonPress();
          }.bind(this)
        }
      );
    }
  });
});
