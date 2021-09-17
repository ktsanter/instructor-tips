//-------------------------------------------------------------------
// TipsEditingEdit
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class TipsEditingEdit {
  constructor(config) {
    this.config = config;
    this.editType = null;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async render() {
    this.subContainers = {
      "add": this.config.container.getElementsByClassName('subcontainer tipsediting-add')[0],
      "edit": this.config.container.getElementsByClassName('subcontainer tipsediting-edit')[0],
      "delete": this.config.container.getElementsByClassName('subcontainer tipsediting-delete')[0]
    };
    
    var saveButtons = this.config.container.getElementsByClassName('button-save');
    for (var i = 0; i < saveButtons.length; i++) {
      saveButtons[i].addEventListener('click', (e) => { this._handleSave(e); });
    }
    
    var cancelButtons = this.config.container.getElementsByClassName('button-cancel');
    for(var i = 0; i < cancelButtons.length; i++) {
      cancelButtons[i].addEventListener('click', (e) =>{ this._handleCancel(e); });
    }
    
    this.tiny = {};
    this.tiny.tipContent = new MyTinyMCE({
      id: 'tipeditor', 
      selector: '#tipeditor', 
      changeCallback: (e) => { this._handleEditorChange(e); },
      height: 450
    });
    
    await this.tiny.tipContent.init();
  }
  
  beginEditOption(params) {   
    if (params.showEditContainers == 'force-close') {
      this._forceClose();
      return;
    }
    
    this.editType = params.editType;
    
    this._loadFields(params);
    
    this._setContainerVisibility(params.editType, true);
  }
    
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------  
  _forceClose() {
    this._setContainerVisibility('all', false);
  }
  
  _setContainerVisibility(editType, showEditContainers) {
    for (var i = 0; i < this.config.otherContainers.length; i++) {
      var containerRow = this.config.otherContainers[i].parentNode.parentNode;
      UtilityKTS.setClass(containerRow, this.config.hideClass, showEditContainers);
    }
    
    for (var key in this.subContainers) {
      UtilityKTS.setClass(this.subContainers[key], this.config.hideClass, key != editType)
    }
    
    var containerRow = this.config.container.parentNode.parentNode
    UtilityKTS.setClass(containerRow, this.config.hideClass, !showEditContainers);
  }
   
  _loadFields(params) {
    var subContainer = this.subContainers[params.editType];
    var tipInfo = params.tipInfo;
    subContainer.setAttribute('original-tip-info', JSON.stringify(tipInfo));

    if (params.editType == 'add') {
      console.log('_loadFields: "add" is stubbed');
      /*
      subContainer.getElementsByClassName('input-name')[0].value = 'default';
      subContainer.getElementsByClassName('input-length')[0].value = 20;
      subContainer.getElementsByClassName('input-start')[0].value = this._formatShortDate(new Date(Date.now()))
      */
      
    } else if (params.editType == 'edit') {
      this.tiny.tipContent.setContent(tipInfo.tipcontent);
      subContainer.getElementsByClassName('input-tags')[0].value = this._tagListToString(tipInfo.taglist);
      
    } else if (params.editType == 'delete') {
      subContainer.getElementsByClassName('tipcontent-deletion')[0].innerHTML = tipInfo.tipcontent;
    }    
  }
  
  async _endEditOption(save) {
    if (save) {
      var subContainer = this.subContainers[this.editType];
      var originalTipInfo = JSON.parse(subContainer.getAttribute('original-tip-info'));
  
      var params = null;
      if (this.editType == 'add') {
        console.log('_endEditOption: "add" is stubbed');
        /*
        params = {
          "editType": this.editType
        };
        */
        
      } else if (this.editType == 'edit') {
        params = {
          "editType": this.editType,
          "scheduleid": originalTipInfo.tipid,
          "tipcontent": this.tiny.tipContent.getContent(),
          "taglist": this._tagStringToArray(subContainer.getElementsByClassName('input-tags')[0].value.trim())
        }
        
      } else if (this.editType == 'delete') {
        params = {
          "editType": this.editType,
          "scheduleid": originalTipInfo.tipid
        }
      }

      if (params) {
        var success = await this.config.db.updateTip(params);
      }
    }

    this._setContainerVisibility('all', false);
    this.editType = null;
  }  
  
  _tagListToString(tagList) {
    var tagString = tagList.toString();
    if (tagList.length == 0) tagString = ' ';
    return tagString;
  }
  
  _tagStringToArray(tagList) {
    var tagList = tagList.split(',');
    for (var i = 0; i < tagList.length; i++) {
      tagList[i] = tagList[i].trim();
    }
    return tagList;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleEditorChange(e) {
    console.log('_handleEditorChange');
  }
  
  async _handleSave(e) {
    await this._endEditOption(true);
  }
  
  async _handleCancel(e) {
    await this._endEditOption(false);
  }
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
