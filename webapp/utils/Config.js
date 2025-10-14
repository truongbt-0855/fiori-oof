sap.ui.define([], function() {
  'use strict';
  
  return {
    // Environment-specific URLs
    ENDPOINTS: {
      DEVELOPMENT: {
        MATERIAL_API: "https://803f6caftrial-dev-oof-backend-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/materials/loadMaterial",
        BASE_URL: "https://staging-803f6caftrial-dev-oof-backend-srv.cfapps.us10-001.hana.ondemand.com"
      },
      STAGING: {
        MATERIAL_API: "https://803f6caftrial-dev-oof-backend-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/materials/loadMaterial",
        BASE_URL: "https://staging-803f6caftrial-dev-oof-backend-srv.cfapps.us10-001.hana.ondemand.com"
      },
      PRODUCTION: {
        MATERIAL_API: "https://803f6caftrial-dev-oof-backend-srv.cfapps.us10-001.hana.ondemand.com/odata/v4/materials/loadMaterial",
        BASE_URL: "https://803f6caftrial-dev-oof-backend-srv.cfapps.us10-001.hana.ondemand.com"
      }
    },
    
    // Get current environment
    getCurrentEnvironment: function() {
      const sHostname = window.location.hostname;
      
      if (sHostname === "localhost" || sHostname === "127.0.0.1") {
        return "DEVELOPMENT";
      } else if (sHostname.includes("staging")) {
        return "STAGING";
      } else {
        return "PRODUCTION";
      }
    },
    
    // Get API URL for current environment
    getMaterialApiUrl: function() {
      const sEnv = this.getCurrentEnvironment();
      return this.ENDPOINTS[sEnv].MATERIAL_API;
    }
  };
});