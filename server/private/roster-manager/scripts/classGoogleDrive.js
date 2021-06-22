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
    const METHODNAME = 'GoogleDrive._batchGet';
    var thisObj = this;

    var params = {
      spreadsheetId: fileData.id
    };
    
    return await gapi.client.sheets.spreadsheets.get(params)
      .then(
        (response) => {
          var sheetInfo = [];
          var sheetSet = new Set();
          for (var i = 0; i < response.result.sheets.length; i++) {
            var sheet = response.result.sheets[i];
            sheetInfo.push({
              "title": sheet.properties.title,
              "index": sheet.properties.index,
              "id": sheet.properties.sheetId
            });
            sheetSet.add(sheet.properties.title);
          }
          
          var resultData = {
            "title": response.result.properties.title,
            "id": response.result.spreadsheetId,
            "url": response.result.spreadsheetUrl,
            "sheetInfo": sheetInfo,
            "sheetSet": sheetSet
          };
            
          return {success: true, ...resultData};

        },   
        
        (err) => {
          return thisObj._failResult('** error: ' + METHODNAME + ' failed - ' + err.result.error.message);
        }
      );    
  }
  
  async getRanges(spreadsheetId, ranges) {
    const METHODNAME = 'GoogleDrive.getRanges';
    
    var params = {
      "spreadsheetId": spreadsheetId,
      "ranges": ranges
    }

    return gapi.client.sheets.spreadsheets.values.batchGet(params)
    .then(
      (response) => {
        return {success: true, details: METHODNAME + ' succeeded', data: response.result.valueRanges};
      },
      
      (err) => {
        return  this._failResult('**error: ' + METHODNAME + ' failed - ' + err.result.error.message);
      }
    );
  }
  
  async addSheet(spreadsheetId, sheetName) {
    const METHODNAME = 'GoogleDrive.addSheet';
    
    var thisObj = this;
    
    var resource = { requests: [{ 'addSheet': { 'properties'  : { 'title': sheetName } } } ] };
    
    var params = {
      "spreadsheetId": spreadsheetId,
      "resource": resource
    };      
    
    return await gapi.client.sheets.spreadsheets.batchUpdate(params)
      .then(
        (response) => {
          return {success: true, ...response.result};
        },
        
        (err) => {
          return thisObj._failResult('** error: ' + METHODNAME + ' failed - ' + err.result.error.message);
        }
      );
  }
  
  async clearRange(spreadsheetId, range) {
    const METHODNAME = 'GoogleDrive.clearSheet';

    var params = {
      "spreadsheetId": spreadsheetId,
      "range": range,
      "resource": {}
    };      
    
    return await gapi.client.sheets.spreadsheets.values.clear(params)
      .then(
        (response) => {
          return {success: true, ...response.result};
        },
        
        (err) => {
          return thisObj._failResult('** error: ' + METHODNAME + ' failed - ' + err.result.error.message);
        }
      );
  }
  
  async writeRange(spreadsheetId, range, values) {
    const METHODNAME = 'GoogleDrive.writeRange';
    
    var myRange = 'FOO!B3';
    
    var resource = {
      "range": range,
      "values": values
    };
    
    var params = {
      "spreadsheetId": spreadsheetId,
      "range": range,
      "resource": resource,
      "valueInputOption": 'USER_ENTERED'
    };
    
    var valueRangeBody = {};
    
    return await gapi.client.sheets.spreadsheets.values.update(params, valueRangeBody)
      .then(
        (response) => {
          return {success: true, ...response.result};
        },
        
        (err) => {
          return thisObj._failResult('** error: ' + METHODNAME + ' failed - ' + err.result.error.message);
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
  _failResult(msg, methodName) {
    if (methodName) msg += ' in ' + methodName;
    
    return {
      success: false,
      details: msg,
      data: null
    };
  }  
}
