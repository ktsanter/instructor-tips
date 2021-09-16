//-------------------------------------------------------------------
// TipsEditing
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class TipsEditing {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    var containerMain = this.config.container.getElementsByClassName('tipsediting-main-container')[0];
    var containerEdit = this.config.container.getElementsByClassName('tipsediting-edit-container')[0];
    
    this.tipsEditingMain = new TipsEditingMain({
      "container": containerMain,
      "hideClass": this.config.hideClass,
      "db": this.config.db
    });
    this.tipsEditingMain.render();
    
    this.tipsEditingEdit = new TipsEditingEdit({
      "container": containerEdit,
      "hideClass": this.config.hideClass,
      "db": this.config.db
    });
    this.tipsEditingEdit.render();
  }
  
  async update() {
    await this.tipsEditingMain.update();    
  }
  
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
