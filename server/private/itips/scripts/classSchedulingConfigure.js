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
    
    UtilityKTS.denyDoubleQuotes(this.subContainers.add.getElementsByClassName('input-name')[0]);
    UtilityKTS.denyDoubleQuotes(this.subContainers.edit.getElementsByClassName('input-name')[0]);
        
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
    
    this._loadFields(params);
    
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
   
  _loadFields(params) {
    var subContainer = this.subContainers[params.configureType];
    var scheduleInfo = params.scheduleInfo;
    subContainer.setAttribute('original-schedule-info', JSON.stringify(scheduleInfo));

    if (params.configureType == 'add') {
      subContainer.getElementsByClassName('input-name')[0].value = 'default';
      subContainer.getElementsByClassName('input-length')[0].value = 20;
      subContainer.getElementsByClassName('input-start')[0].value = this._formatShortDate(new Date(Date.now()))
      
    } else if (params.configureType == 'edit') {
      subContainer.getElementsByClassName('input-name')[0].value = scheduleInfo.schedulename;
      subContainer.getElementsByClassName('input-start')[0].value = scheduleInfo.schedulestart;
      
    } else if (params.configureType == 'delete') {
      subContainer.getElementsByClassName('schedule-name')[0].innerHTML = scheduleInfo.schedulename;
    }
  }
  
  async _endConfigureOption(save) {
    var result = null;
    
    if (save) {
      var subContainer = this.subContainers[this.configureType];
      var originalScheduleInfo = JSON.parse(subContainer.getAttribute('original-schedule-info'));
  
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
          "scheduleid": originalScheduleInfo.scheduleid,
          "schedulename": this.subContainers.edit.getElementsByClassName('input-name')[0].value,
          "schedulestart": this.subContainers.edit.getElementsByClassName('input-start')[0].value
        }
        
      } else if (this.configureType == 'delete') {
        params = {
          "configureType": this.configureType,
          "scheduleid": originalScheduleInfo.scheduleid
        }
      }
      
      if (params) {
        var dbResult = await this.config.db.saveScheduleConfiguration(params);
        if (dbResult) {
          result = {...params, ...dbResult};
        }
      }
    }
    
    this._setContainerVisibility('all', false);
    this.configureType = null;
    
    this.config.callbackScheduleChange(result);
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
  _formatShortDate(origDate) {
    var splitDate = origDate.toLocaleDateString("en-US").split('/');
    var formattedDate = 
      ('0000' + splitDate[2]).slice(-4) 
      + '-' + ('00' + splitDate[0]).slice(-2) 
      + '-' + ('00' + splitDate[1]).slice(-2);

    return formattedDate;
  }
}
