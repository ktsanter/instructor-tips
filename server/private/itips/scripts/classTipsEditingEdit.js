//-------------------------------------------------------------------
// TipsEditingEdit
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class TipsEditingEdit {
  constructor(config) {
    this.config = config;
    this.editType = null;
    this.callbackEditComplete = null;
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
    
    if (!this.subContainers.add) {
      this.subContainers.add = this.config.container;
      delete this.subContainers.edit
      delete this.subContainers.delete;
    }
    
    var saveButtons = this.config.container.getElementsByClassName('button-save');
    for (var i = 0; i < saveButtons.length; i++) {
      saveButtons[i].addEventListener('click', (e) => { this._handleSave(e); });
    }
    
    var cancelButtons = this.config.container.getElementsByClassName('button-cancel');
    for(var i = 0; i < cancelButtons.length; i++) {
      cancelButtons[i].addEventListener('click', (e) =>{ this._handleCancel(e); });
    }
    
    var tagInputs = this.config.container.getElementsByClassName('input-tags')
    for (var i = 0; i < tagInputs.length; i++) {
      UtilityKTS.denyDoubleQuotes(tagInputs[i]);
    }
    
    this.tiny = {};
    if (this.config.hasOwnProperty('idTinyElementAdd')) {
      var tinyId = this.config.idTinyElementAdd;
      
      this.tiny.tipContent_add = new MyTinyMCE({
        id: tinyId, 
        selector: '#' + tinyId, 
        changeCallback: (e) => { this._handleEditorChange(e); },
        height: 400
      });
      await this.tiny.tipContent_add.init();
    }
    
    if (this.config.hasOwnProperty('idTinyElementEdit')) {
      var tinyId = this.config.idTinyElementEdit;

      this.tiny.tipContent_edit = new MyTinyMCE({
        id: tinyId, 
        selector: '#' + tinyId, 
        changeCallback: (e) => { this._handleEditorChange(e); },
        height: 400
      });
      await this.tiny.tipContent_edit.init();
    }
  }
  
  beginEditOption(params) {   
    this.callbackEditComplete = params.callbackCompletion;
    
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
    if (this.config.hasOwnProperty('browseContainer')) {
        UtilityKTS.setClass(this.config.browseContainer, this.config.hideClass, showEditContainers);
        UtilityKTS.setClass(this.config.container, this.config.hideClass, !showEditContainers);
        
    } else {
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
  }
   
  _loadFields(params) {
    var subContainer = this.subContainers[params.editType];
    var tipInfo = params.tipInfo;
    subContainer.setAttribute('original-tip-info', JSON.stringify(tipInfo));

    if (params.editType == 'add') {
      this.tiny.tipContent_add.setContent('new tip');
      subContainer.getElementsByClassName('input-tags')[0].value = this._tagListToString([]);
      
    } else if (params.editType == 'edit') {
      this.tiny.tipContent_edit.setContent(tipInfo.tipcontent);
      subContainer.getElementsByClassName('input-tags')[0].value = this._tagListToString(tipInfo.taglist);
      
    } else if (params.editType == 'delete') {
      var usageMsg = '';
      if (tipInfo.usagecount == 1) {
        usageMsg = 'It is currently used in ' + tipInfo.usagecount + ' schedule.';
      } else if (tipInfo.usagecount > 1) {
        usageMsg = 'It is currently used in ' + tipInfo.usagecount + ' schedule(s).';
      }
      subContainer.getElementsByClassName('tipusage-deletion')[0].innerHTML = usageMsg;
      subContainer.getElementsByClassName('tipcontent-deletion')[0].innerHTML = tipInfo.tipcontent;
    }    
  }
  
  async _endEditOption(save) {
    var success = true;
    
    if (save) {
      var subContainer = this.subContainers[this.editType];
      var originalTipInfo = JSON.parse(subContainer.getAttribute('original-tip-info'));
  
      var params = null;
      if (this.editType == 'add') {
        params = {
          "editType": this.editType,
          "tipcontent": this.tiny.tipContent_add.getContent(),
          "taglist": this._tagStringToArray(subContainer.getElementsByClassName('input-tags')[0].value.trim())
        }
        
      } else if (this.editType == 'edit') {
        params = {
          "editType": this.editType,
          "tipid": originalTipInfo.tipid,
          "tipcontent": this.tiny.tipContent_edit.getContent(),
          "taglist": this._tagStringToArray(subContainer.getElementsByClassName('input-tags')[0].value.trim())
        }
        
      } else if (this.editType == 'delete') {
        params = {
          "editType": this.editType,
          "tipid": originalTipInfo.tipid
        }
      }

      if (params) {
        success = await this.config.db.updateTip(params);
        if (success) this.callbackEditComplete();
      }
    }

    if (success) {
      this._setContainerVisibility('all', false);
      this.editType = null;
    }
  }  
  
  _tagListToString(tagList) {
    var tagString = tagList.toString();
    if (tagList.length == 0) tagString = ' ';
    return tagString;
  }
  
  _tagStringToArray(tagList) {
    var tagList = tagList.split(',');
    var tagListCleaned = [];

    for (var i = 0; i < tagList.length; i++) {
      var tag = tagList[i].trim();
      if (tag.length > 0) tagListCleaned.push(tag);
    }

    tagListCleaned = tagListCleaned.sort(function(a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    
    return tagListCleaned;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleEditorChange(e) {
    // do nothing
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
