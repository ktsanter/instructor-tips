//-------------------------------------------------------------------
// Google authorization
//-------------------------------------------------------------------
// TODO: standardize/generalize error handling and display
//-------------------------------------------------------------------
class GoogleManagement {
  constructor(config) {
    this._config = config;
    
    this._config.isSignedIn = false;

    gapi.load('client:auth2', this._callInitClient(this));
  }
  
  _callInitClient(me) {
    return function() {
      me._initClient(me);
    }
  }
  
  //--------------------------------------------------------------
  // initialization
  //--------------------------------------------------------------
  _initClient(me) {
    gapi.client.init({
      apiKey: this._config.apiKey,
      clientId: this._config.clientId,
      discoveryDocs: this._config.discoveryDocs,
      scope: this._config.scopes
      
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(me._callUpdateSigninStatus(me));

      // Handle the initial sign-in state.
      me._updateSigninStatus();
      
    }, function(error) {
      console.log('GoogleAuth: gapi.client.init error');
      console.log(error);
    });  
  }
  
  _callUpdateSigninStatus(me) {
    return function() {
      me._updateSigninStatus(me);
    }
  }
    
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  isSignedIn() {
    return this._config.isSignedIn;
  }
  
  trySignIn() {
    gapi.auth2.getAuthInstance().signIn().then(
      function () {
        //console.log('sign-in okeydokey');
      },

      function(objErr) {
        console.log(objErr);
        if (objErr.error == 'popup_closed_by_user') {
          console.log('popup closed by user - ignore');
        } else {
          console.log('sign-in error: ' + objErr.error);
        }
      });
  }
  
  signout() {
    gapi.auth2.getAuthInstance().signOut();
  }
  
  getOAuthToken() {
    return gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _updateSigninStatus(context) {
    var isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();

    var callback = this._config.signInChange;
    if (context != null) {
      callback = context._config.signInChange;
      context._config.isSignedIn = isSignedIn;
    }
    
    if (callback != null) callback(isSignedIn);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
