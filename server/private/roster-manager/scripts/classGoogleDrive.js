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
  
  _pickerLoaded() {
    console.log('_pickerLoaded');
  }  
  
  //--------------------------------------------------------------
  // initialization
  //--------------------------------------------------------------
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  pickFile(callback) {
    console.log('GoogleDrive.pickFile');
    
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
  
  testReadFile(fileData) {
    console.log('GoogleDrive.testReadFile');
    
    gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: fileData.id,
      range: 'Sheet 1!A1:E3'
      
    })
    .then(
      function(response) {
        var range = response.result;
        if (range.values.length > 0) {
          for (var i = 0; i < range.values.length; i++) {
            var row = range.values[i];
            console.log(row);
          }
        } else {
          console.log('no data found.');
        }

      },       
      function(response) {
        console.log('*** values.get failed: ' + response.result.error.message);
      }
    );
  }
  
  testAddSheet(fileData) {
    console.log('GoogleDrive.testAddSheet');
    
    gapi.client.sheets.spreadsheets.batchUpdate(
    {
        //auth: authClient,
        spreadsheetId: fileData.id,
        resource: {
            requests: [
                {
                    'addSheet':{
                        'properties':{
                            'title': 'FOO'
                        }
                    } 
                }
            ],
        }
    })
    .then(
      function(response) {
        console.log('batchUpdate succeeded');
        console.log(response);
      },
      function(err) {
        console.log('*** batchUpdate failed');
        console.log(err);
      }
    )
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
