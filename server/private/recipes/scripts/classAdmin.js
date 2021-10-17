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

    var btnTest = this.config.container.getElementsByClassName('btnTest')[0];
    btnTest.addEventListener('click', (e) => { this._test(e); });
  }
  
  update() {}
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _test(e) {
    console.log('Admin._test: stubbed');
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
