//-------------------------------------------------------------------
// SchedulingConfigure
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class SchedulingConfigure {
  constructor(config) {
    this.config = config;
    this.configureType = null;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.subContainers = {
      "add": this.config.container.getElementsByClassName('subcontainer configure-add')[0],
      "edit": this.config.container.getElementsByClassName('subcontainer configure-edit')[0],
      "delete": this.config.container.getElementsByClassName('subcontainer configure-delete')[0]
    };
        
    var saveButtons = this.config.container.getElementsByClassName('button-save');
    for (var i = 0; i < saveButtons.length; i++) {
      saveButtons[i].addEventListener('click', (e) => { this._handleSave(e); });
    }
    
    var cancelButtons = this.config.container.getElementsByClassName('button-cancel');
    for(var i = 0; i < cancelButtons.length; i++) {
      cancelButtons[i].addEventListener('click', (e) =>{ this._handleCancel(e); });
    }
  }
  
  beginConfigureOption(params) {
    if (params.configureType == 'force-close') {
      this._forceClose();
      return;
    }
    
    this.configureType = params.configureType;
    this._setContainerVisibility(params.configureType, true);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _forceClose() {
    this._setContainerVisibility('all', false);
  }
  
  _setContainerVisibility(configureType, showConfigure) {
    for (var i = 0; i < this.config.otherContainers.length; i++) {
      var containerRow = this.config.otherContainers[i].parentNode.parentNode;
      UtilityKTS.setClass(containerRow, this.config.hideClass, showConfigure);
    }
    
    for (var key in this.subContainers) {
      UtilityKTS.setClass(this.subContainers[key], this.config.hideClass, key != configureType)
    }
    
    var containerRow = this.config.container.parentNode.parentNode
    UtilityKTS.setClass(containerRow, this.config.hideClass, !showConfigure);
  }
    
  async _endConfigureOption(save) {
    if (save) {
      console.log('do save', this.configureType);
      var params = null;
      if (this.configureType == 'add') {
        params = {
          "configureType": this.configureType,
          "schedulename": this.subContainers.add.getElementsByClassName('input-name')[0].value,
          "schedulelength": this.subContainers.add.getElementsByClassName('input-length')[0].value,
          "schedulestart": this.subContainers.add.getElementsByClassName('input-start')[0].value
        };
        
      } else if (this.configureType == 'edit') {
        params = {
          "configureType": this.configureType,
          "scheduleid": '???',
          "schedulename": this.subContainers.edit.getElementsByClassName('input-name')[0].value,
          "schedulestart": this.subContainers.edit.getElementsByClassName('input-start')[0].value
        }
        
      } else if (this.configureType == 'delete') {
        params = {
          "scheduleid": '???'
        }
      }
      
      if (params) {
        console.log('do DB work for', params);
      }
    }
    
    this._setContainerVisibility('all', false);
    this.configureType = null;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleSave(e) {
    await this._endConfigureOption(true);
  }
  
  async _handleCancel(e) {
    await this._endConfigureOption(false);
  }
  
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
