//-------------------------------------------------------------------
// CommentBuddyDB class
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class CommentBuddyDB {
  constructor(config) {
    this._config = config;  
    
    this._apiInfo = {
      apibase: 'https://script.google.com/macros/s/AKfycbxgZL5JLJhR-6jWqbxb3s7aWG5aqkb-EDENYyIdnBT4vVpKHq8/exec',
      apikey: 'MV_commentbuddy2'
    };   

    this._storageKeys = {
      sheetid: 'cb2_fileid',
      sheeturl: 'cb2_fileurl'
    };    
    
    this._loadSettings();
  }
    
  //--------------------------------------------------------------
  // spreadsheet info and status
  //--------------------------------------------------------------
  settingsValid() {
    return (
      this._sheetId != null && 
      this._sheetId != '' &&
      this._sheetURL != null &&
      this._sheetURL != ''
    );
  }
  
  getSpreadsheetURL() {
    return this._sheetURL;
  }
  
  async storeConfiguration(proposedURL) {
    var success = false;
    
    var sID = proposedURL.match(/\?id=([a-zA-Z0-9-_]+)/);
    if (sID != null) {
      sID = sID[0].slice(4);
    } else {
      sID = proposedURL.match(/\/([a-zA-Z0-9-_]+)\/edit\?usp/);
      if (sID != null) {
        sID = sID[0].slice(1, -9);
      } else {
        sID = '';
      }
    }

    if (await this._validateDataSource(sID)) {
      this._storeSettings(sID, proposedURL);
      success = true;
    }
    
    return success;
  }
  
  openSource() {
    if (!this.settingsValid()) {
      console.log('ERROR: in openSource');
      console.log('invalid spreadsheet info');
      return;
    }
    
    window.open(this._sheetURL, '_blank');
  }
    
  _loadSettings() {
    this._sheetId = window.localStorage.getItem(this._storageKeys.sheetid);
    this._sheetURL = window.localStorage.getItem(this._storageKeys.sheeturl);
  }

  _storeSettings(spreadsheetId, spreadsheetURL) {
    window.localStorage.setItem(this._storageKeys.sheetid, spreadsheetId);
    window.localStorage.setItem(this._storageKeys.sheeturl, spreadsheetURL);
    this._loadSettings();
  }

  //--------------------------------------------------------------
  // DB interaction
  //--------------------------------------------------------------
  async getCommentData() {
    if (!this.settingsValid()) {
      return {
        success: false,
        details: 'spreadsheet info not valid',
        data: null
      };
    }
    
    var params = {sourcefileid: this._sheetId};
    var requestResult = await googleSheetWebAPI.webAppGet(this._apiInfo, 'cbdata', params);
    
    if (!requestResult.success) {
      console.log('ERROR: in getCommentData' );
      console.log(requestResult.details);
    }
    
    return requestResult;
  }
  
  async _validateDataSource(spreadsheetid) {
    var requestResult  = await googleSheetWebAPI.webAppGet(
      this._apiInfo, 'validate', 
      {commentbuddy_spreadsheetid: spreadsheetid}
    );
    
    if (!requestResult.success) {
      console.log('spreadsheet validation failed: ' + spreadsheetid);
      console.log(requestResult.details);
    }
          
    return requestResult.success;
  }

  async saveNewComment(params) {
    console.log('saveNewComment');

    if (!this.settingsValid()) {
      console.log('ERRROR: in saveNewComment');
      console.log('invalid spreadsheet info');
      return false;
    }
    
    var postParams = {
      ...params,
      "sourcefileid": this._sheetId,
    }

    var requestResult = await googleSheetWebAPI.webAppPost(this._apiInfo, 'newcomment', postParams);
    if (!requestResult.success) {
      console.log('ERROR: in saveNewComment' );
      console.log(requestResult.details);
    }
    
    return requestResult.success;
  }    
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
