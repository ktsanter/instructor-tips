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
  pickFile(params) {
    var view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS);
    view.setMode(google.picker.DocsViewMode.GRID);
    view.setQuery(window.dataFeedName);
    view.setIncludeFolders(true);
    
    var funcSpreadsheetInfo = this.getSpreadsheetInfo;

    var picker =        
      new google.picker.PickerBuilder()
        .setOAuthToken(this.objGoogleManagement.getOAuthToken())
        .addView(view)
        
        .setCallback(
          async function(result) {
            if (result.action == 'picked') {
              var fileData = result.docs[0];
              
              var fileInfo = null;
              if (params.includeFileInfo) {
                fileInfo = await funcSpreadsheetInfo(fileData);
              }
              
              params.callback({
                "id": fileData.id,
                "title": fileData.name,
                "url": fileData.url,
                "fileInfo": fileInfo
              });
              
            } else if (result.action == 'cancel') {
              params.callback(null);
            }
          } 
        )
        
        .build();

     picker.setVisible(true);    
  }
  
  async getSpreadsheetInfo(fileData) {
    var params = {
      spreadsheetId: fileData.id
    };
    
    return await gapi.client.sheets.spreadsheets.get(params)
      .then(
        function(response) {
          var sheetInfo = [];
          for (var i = 0; i < response.result.sheets.length; i++) {
            var sheet = response.result.sheets[i];
            sheetInfo.push({
              "title": sheet.properties.title,
              "index": sheet.properties.index,
              "id": sheet.properties.sheetId
            });
          }
          
          var resultData = {
            "title": response.result.properties.title,
            "id": response.result.spreadsheetId,
            "url": response.result.spreadsheetUrl,
            "sheetInfo": sheetInfo
          };
            
          return {success: true, ...resultData};

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
