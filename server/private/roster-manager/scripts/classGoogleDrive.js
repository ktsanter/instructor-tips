//-------------------------------------------------------------------
// Google Drive managing tools
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class GoogleDrive {
  constructor(config) {
    this.objGoogleManagement = config.googleManagement;
    
    gapi.load('picker', this._pickerLoaded());
  }
  
  _pickerLoaded() {}  
  
  //--------------------------------------------------------------
  // initialization
  //--------------------------------------------------------------
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  pickFile(callback) {
    var view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS);
    view.setMode(google.picker.DocsViewMode.GRID);
    view.setQuery(window.dataFeedName);
    view.setIncludeFolders(true);

    var picker = 
        new google.picker.PickerBuilder()
          .setAppId(this.objGoogleManagement._config.appId)
          .setOAuthToken(this.objGoogleManagement.getOAuthToken())
          .addView(view)
          
          .setCallback(
            function(result) {
              if (result.action == 'picked') {
                var fileData = result.docs[0];
                callback({
                  "id": fileData.id,
                  "name": fileData.name,
                  "url": fileData.url
                });
                
              } else if (result.action == 'cancel') {
                callback(null);
              }
            } 
          )
          
          .build();

     picker.setVisible(true);    
  }
  
  async testGetSSInfo(fileData) {
    var params = {
      spreadsheetId: fileData.id
    };
    
    return await gapi.client.sheets.spreadsheets.get(params)
      .then(
        function(response) {
          return {success: true, ...response.result};

        },       
        function(err) {
          return {success: false, message: err.result.error.message};
        }
      );    
  }
    
  async testReadFile(fileData) {
    var params = {
      spreadsheetId: fileData.id,
      range: 'Sheet1!A1:E3'
    };
    
    return await gapi.client.sheets.spreadsheets.values.get(params)
      .then(
        function(response) {
          return {success: true, ...response.result};

        },       
        function(err) {
          return {success: false, message: err.result.error.message};
        }
      );
  }
  
  async testAddSheet(fileData) {
    var resource = {
      requests: [
        {
          'addSheet': {
            'properties'  : {
              'title': 'FOO'
            }
          } 
        }
      ]
    };
    
    var params = {
      spreadsheetId: fileData.id,
      "resource": resource
    };      
    
    return await gapi.client.sheets.spreadsheets.batchUpdate(params)
      .then(
        function(response) {
          return {success: true, ...response.result};
        },
        function(err) {
          return {success: false, message: err.result.error.message};
        }
      );
  }    

  async testWriteFile(fileData) {
    var myRange = 'FOO!B3';
    
    var resource = {
      "range": myRange,
      "values": [
        [
          'test test'
        ]
      ]
    };
    
    var params = {
      spreadsheetId: fileData.id,
      range: myRange,
      "resource": resource,
      valueInputOption: 'USER_ENTERED'
    };
    
    var valueRangeBody = {};
    
    return await gapi.client.sheets.spreadsheets.values.update(params, valueRangeBody)
      .then(
        function(response) {
          return {success: true, ...response.result};

        },       
        function(err) {
          return {success: false, message: err.result.error.message};
        }
      );
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
