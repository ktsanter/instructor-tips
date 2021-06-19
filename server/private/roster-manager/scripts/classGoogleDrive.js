//-------------------------------------------------------------------
// Google Drive managing tools
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class GoogleDrive {
  constructor(config) {
    this.objGoogleManagement = config.googleManagement;
    
    gapi.load('picker', this._initialize(this));
  }
  
  _initialize(me) {
    return function() {
      me._initClient(me);
    }
  }  
  
  //--------------------------------------------------------------
  // initialization
  //--------------------------------------------------------------
  _initialize(me) {
    console.log('GoogleDrive._initialize');
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  test() {
    var apiKey = this.objGoogleManagement._config.apiKey;

    var view = new google.picker.DocsView(google.picker.ViewId.SPREADSHEETS);
    view.setMode(google.picker.DocsViewMode.GRID);
    view.setQuery(window.dataFeedName);
    view.setIncludeFolders(true);

    var picker = 
        new google.picker.PickerBuilder()
          .setAppId(this.objGoogleManagement._config.appId)
          .setOAuthToken(this.objGoogleManagement.getOAuthToken())
          .addView(view)
          .setCallback(this._pickerCallback)
          //.setDeveloperKey(apiKey)
          .build();

     picker.setVisible(true);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  _pickerCallback(data) {
    console.log('_pickerCallback');

    if (data.action == 'picked') {
      console.log('picked: "' + data.docs[0].name + '"');
      
    } else {
      console.log(data.action);
    }
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
