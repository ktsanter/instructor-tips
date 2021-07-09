//-------------------------------------------------------------------
// MentorViewer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class MentorViewer {
  constructor(config) {
    console.log('MentorViewer.constructor', config);
    
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      currentInfo: null
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(currentInfo) {
    console.log('MentorViewer.update', currentInfo);
    this.settings.currentInfo = currentInfo;
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    console.log('MentorViewer._initUI');
    return;
  }

  _updateUI() {
    console.log('MentorViewer._updateUI');
    return;   
  }
  
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
