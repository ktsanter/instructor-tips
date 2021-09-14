//-------------------------------------------------------------------
// Admin
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Admin {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    var btnToggle = this.config.container.getElementsByClassName('btnToggleAdmin')[0];
    var toggleHandler = this.config.callbackAdminToggle;
    btnToggle.addEventListener('click', (e) => { toggleHandler(e); });
  }
  
  update() {}
  
  //--------------------------------------------------------------
  // private methods
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
