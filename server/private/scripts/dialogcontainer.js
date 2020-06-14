//-------------------------------------------------------------------
// DialogContainer class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class DialogContainer {
  constructor(config) {
    this._version = '0.01';
    this._HIDE_CLASS = 'dialogcontainer-hide';
    
    this._config = config;
    if (!this._config.hasOwnProperty('showUsageInfo')) this._config.showUsageInfo = false;
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'dialogcontainer' + ' ' + this._HIDE_CLASS);
    
    var dialogType = this._config.dialogtype;
    
    // schedule dialogs
    if (dialogType == 'add-schedule') this._container.appendChild(this._renderAddSchedule());
    else if (dialogType == 'rename-schedule') this._container.appendChild(this._renderRenameSchedule());
    else if (dialogType == 'delete-schedule') this._container.appendChild(this._renderDeleteSchedule());
    
    // tip dialogs
    else if (dialogType == 'add-tip') this._container.appendChild(this._renderAddEditTip(dialogType));
    else if (dialogType == 'edit-tip') this._container.appendChild(this._renderAddEditTip(dialogType));
    else if (dialogType == 'delete-tip') this._container.appendChild(this._renderDeleteTip(dialogType));
    
    // schedule sharing dialogs
    else if (dialogType == 'accept-share') this._container.appendChild(this._renderAcceptShare(dialogType));
    
    // other
    else console.log('unrecognized dialog type: ' + dialogType);    
    
    return this._container;
  }
  
  _renderAddSchedule() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-add');
    
    container.appendChild(this._renderTitle('Create new schedule'));
    
    var subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub');
    container.appendChild(subContainer);
    
    var elemScheduleName = CreateElement.createTextInput(null, 'dialogcontainer-input');
    elemScheduleName.placeholder = 'schedule name';
    elemScheduleName.maxLength = 200;
    elemScheduleName.addEventListener('input', (e) => {this._handleScheduleName(e);});
    UtilityKTS.denyDoubleQuotes(elemScheduleName);
    
    subContainer.appendChild(elemScheduleName);

    var elemScheduleLength = CreateElement.createSpinner(null, 'dialogcontainer-spinner', 20, 1, 40, 1);
    elemScheduleLength.title = 'schedule length';
    subContainer.appendChild(elemScheduleLength);

    var todayFormatted = this._formatDate(new Date());
    var elemScheduleStart = CreateElement.createDatePicker(null, 'dialogcontainer-date', todayFormatted, '2020-01-01', '2050-12-31');
    elemScheduleStart.title = 'first day for schedule';
    subContainer.appendChild(elemScheduleStart);

    subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub confirmcancel');
    container.appendChild(subContainer);
    
    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'dialogcontainer confirmcancel confirm', 'create', 'create new schedule', handler);
    elem.disabled = true;
    subContainer.appendChild(elem);

    handler = (me) => {this._handleCancel(this);};
    subContainer.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'cancel', handler));
    
    return container;
  }
  
  _renderRenameSchedule() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-rename');
    
    container.appendChild(this._renderTitle('Edit schedule parameters'));

    var subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub');
    container.appendChild(subContainer);
    
    var elemScheduleName = CreateElement.createTextInput(null, 'dialogcontainer-input');
    elemScheduleName.placeholder = 'schedule name';
    elemScheduleName.maxLength = 200;    
    elemScheduleName.addEventListener('input', (e) => {this._handleScheduleName(e);});
    UtilityKTS.denyDoubleQuotes(elemScheduleName);
    subContainer.appendChild(elemScheduleName);

    var todayFormatted = this._formatDate(new Date());
    var elemScheduleStart = CreateElement.createDatePicker(null, 'dialogcontainer-date', 'dummy', '2020-01-01', '2050-12-31');
    elemScheduleStart.title = 'first day for schedule';
    subContainer.appendChild(elemScheduleStart);

    subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub confirmcancel');
    container.appendChild(subContainer);

    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'dialogcontainer confirmcancel confirm', 'save', 'save schedule changes', handler);
    elem.disabled = false;
    subContainer.appendChild(elem);

    handler = (me) => {this._handleCancel(this);};
    subContainer.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'cancel', handler));

    return container;
  }
  
  _renderDeleteSchedule() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-delete');
    
    container.appendChild(this._renderTitle('Delete schedule'));
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-message'));

    var handler = (me) => {this._handleConfirm(this);};
    container.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'confirm', 'delete schedule', handler));

    handler = (me) => {this._handleCancel(this);};
    container.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'do not delete schedule', handler));
    
    return container;
  }
  
  _renderAddEditTip(dialogType) {
    var container = CreateElement.createDiv(null, 'dialogcontainer-addtip');
    
    var titleText = (dialogType == 'add-tip' ? 'Add new tip' : 'Edit tip');
    container.appendChild(this._renderTitle(titleText));
    
    // tip text input
    var subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub');
    container.appendChild(subContainer);
    
    var elemTipText = CreateElement.createTextArea(null, 'dialogcontainer-input');
    elemTipText.placeholder = 'tip text';
    elemTipText.maxLength = 800;
    elemTipText.addEventListener('input', (e) => {this._handleTipTextChange(e);});
    UtilityKTS.denyDoubleQuotes(elemTipText);    
    
    subContainer.appendChild(elemTipText);
    
    // tip text preview
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-preview'));
    
    // usage info for tip
    if (this._config.showUsageInfo) {
      container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-usage', 'usage'));
    }
    
    // category selection
    var params = {
      placeholder: 'category',
      valueList: this._config.categorylist,
      selectedValueList: [],
      changeCallback: (params) => {this._handleCategoryChange(params);}      
    }    
    this._category = new LookupInput(params);
    container.appendChild(this._category.render());
    this._category.show(true);
    
    // confirm/cancel controls
    subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub');
    container.appendChild(subContainer);
    
    var confirmText = (dialogType == 'add-tip' ? 'create' : 'save');
    var confirmTitle = (dialogType == 'add-tip' ? 'create new tip' : 'save changes');
    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'dialogcontainer confirmcancel confirm', confirmText, confirmTitle, handler);
    elem.disabled = true;
    subContainer.appendChild(elem);

    handler = (me) => {this._handleCancel(this);};
    subContainer.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'cancel', handler));
    
    return container;
  }
  
  _renderDeleteTip() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-delete');
    
    container.appendChild(this._renderTitle('Delete tip'));
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-message'));
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-deletetip'));

    var handler = (me) => {this._handleConfirm(this);};
    container.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'confirm', 'delete tip', handler));

    handler = (me) => {this._handleCancel(this);};
    container.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'do not delete tip', handler));
    
    return container;
  }
  
  _renderAcceptShare() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-add');
    
    container.appendChild(this._renderTitle('Accept shared schedule'));
    container.appendChild(this._renderSharedScheduleInfo());

    var subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub');
    container.appendChild(subContainer);
    
    var elemScheduleName = CreateElement.createTextInput(null, 'dialogcontainer-input');
    elemScheduleName.placeholder = 'new schedule name';
    elemScheduleName.maxLength = 200;    
    elemScheduleName.addEventListener('input', (e) => {this._handleScheduleName(e);});
    UtilityKTS.denyDoubleQuotes(elemScheduleName);
    
    subContainer.appendChild(elemScheduleName);

    subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub confirmcancel');
    container.appendChild(subContainer);
    
    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'dialogcontainer confirmcancel confirm', 'accept', 'accept and create new schedule', handler);
    elem.disabled = true;
    subContainer.appendChild(elem);

    handler = (me) => {this._handleCancel(this);};
    subContainer.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'cancel', handler));
    
    return container;
  }
  
  _renderSharedScheduleInfo() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-sharedschedule');
    
    return container;
  }
  
  _renderTitle(titleText) {
    var container = CreateElement.createDiv(null, 'dialogcontainer-title');
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-titletext', titleText));
    
    return container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(params) {
    var dialogType = this._config.dialogtype;
    
    // schedule dialogs
    if (dialogType == 'add-schedule') this._updateAddSchedule(params); 
    else if (dialogType == 'rename-schedule') this._updateRenameSchedule(params); 
    else if (dialogType == 'delete-schedule') this._updateDeleteSchedule(params); 
    
    // tip dialogs
    else if (dialogType == 'add-tip') this._updateAddTip(params); 
    else if (dialogType == 'edit-tip') this._updateEditTip(params); 
    else if (dialogType == 'delete-tip') this._updateDeleteTip(params); 
    
    // schedule sharing dialogs
    else if (dialogType == 'accept-share') this._updateAcceptShare(params); 
    
    // other
    else console.log('unrecognized dialog type: ' + dialogType);    
  }
  
  _updateAddSchedule(params) {
    var elemName = this._container.getElementsByClassName('dialogcontainer-input')[0];
    elemName.value = '';
    elemName.focus();
  }
  
  _updateRenameSchedule(params) {
    var elemName = this._container.getElementsByClassName('dialogcontainer-input')[0];
    var elemStart = this._container.getElementsByClassName('dialogcontainer-date')[0];
    elemName.value = params.schedulename;
    elemName.scheduleId = params.scheduleid; 
    elemStart.value = params.schedulestartdate;    
    elemName.focus();
  }

  _updateDeleteSchedule(params) {
    var elemMsg = this._container.getElementsByClassName('dialogcontainer-message')[0];
    var msg = 'The schedule named: "' + params.schedulename + '" will be deleted.' +
              '<br>Deletions cannot be undone<br><br>Are you sure you want to delete this schedule?';
    
    elemMsg.innerHTML = msg;
    elemMsg.scheduleId = params.scheduleid;    
  }
  
  _updateAddTip(params) {
    this._config.params = params;

    var elemTipText = this._container.getElementsByClassName('dialogcontainer-input')[0];
    elemTipText.value = '';
    elemTipText.focus();
    
    var elemPreview = this._container.getElementsByClassName('dialogcontainer-preview')[0];
    elemPreview.innerHTML = 'preview';
    UtilityKTS.setClass(elemPreview, 'preview-default', true);

    this._category.setSelectedValues([]);
  }
  
  _updateEditTip(params) {
    if (!params.editable) {
      console.log('attempted to edit tip where editable=false');
      this._handleCancel(this);
      return;
    }
    
    this._config.params = params;

    var elemTipText = this._container.getElementsByClassName('dialogcontainer-input')[0];
    elemTipText.value = params.tiptext;
    elemTipText.focus();

    this._updateTipTextPreview(params.tiptext);
    if (this._config.showUsageInfo) this._updateUsageInfo(params);
    
    this._category.setSelectedValues(params.category);
    
    var elemConfirm = this._container.getElementsByClassName('confirm')[0];
    elemConfirm.disabled = (params.tiptext.trim().length == 0);
  }
  
  _updateTipTextPreview(tipText) {
    var elemPreview = this._container.getElementsByClassName('dialogcontainer-preview')[0];
    var cleanText = MarkdownToHTML.convert(this._sanitizeText(tipText));
    elemPreview.innerHTML = cleanText;
    if (tipText.length == 0) elemPreview.innerHTML = 'preview';
    UtilityKTS.setClass(elemPreview, 'preview-default', tipText.length == 0);
  }
  
  _updateUsageInfo(tipInfo) {
    var container = this._container.getElementsByClassName('dialogcontainer-usage')[0];
    UtilityKTS.removeChildren(container);
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-usagelabel', 'This tip is'));
    
    var items = [];
    if (tipInfo.common) items.push('<strong>marked as "common"</strong>');
    var schedMsg = 'used in ' + tipInfo.schedulecount + ' location';
    schedMsg += (tipInfo.schedulecount == 1 ? '' : 's') + ' on schedules';
    items.push(schedMsg);

    var shareschedMsg = 'used in ' + tipInfo.shareschedulecount + ' location';
    shareschedMsg += (tipInfo.shareschedulecount == 1 ? '' : 's') + ' on shared schedules';
    items.push(shareschedMsg);
    
    container.appendChild(CreateElement.createUL(null, 'dialogcontainer-usageitems', items));
   }
  
  _updateDeleteTip(params) {
    if (!params.deletable) {
      console.log('attempted to delete tip where deletable=false');
      this._handleCancel(this);
      return;
    }

    var elemMsg = this._container.getElementsByClassName('dialogcontainer-message')[0];
    var msg = 'This tip will be deleted and deletions cannot be undone.' +
              '<br><br>Are you sure you want to delete this tip?';
    
    elemMsg.innerHTML = msg;
    elemMsg.tipId = params.tipid;

    var elemTipText = this._container.getElementsByClassName('dialogcontainer-deletetip')[0];
    var cleanText = MarkdownToHTML.convert(this._sanitizeText(params.tiptext));
    elemTipText.innerHTML = cleanText;
  }
  
  _updateAcceptShare(params) {
    var shareInfo = params.scheduleinfo;
    var container = this._container.getElementsByClassName('dialogcontainer-sharedschedule')[0];
    var elemName = this._container.getElementsByClassName('dialogcontainer-input')[0];
    
    UtilityKTS.removeChildren(container);
    container.sharedScheduleInfo = shareInfo;
    container.appendChild(this._updateAcceptShareOriginalInfo(shareInfo));

    this._updateConfirm(shareInfo.schedulename.length > 0);
    elemName.value = 'copy of ' + shareInfo.schedulename;
    elemName.focus();
  }
  
  _updateAcceptShareOriginalInfo(shareInfo) {
    var container = CreateElement.createDiv(null, 'dialogcontainer-sharedscheduleinner');
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-sharename', '"' + shareInfo.schedulename + '"'));
    
    var msg = '<br>shared by ' + shareInfo.username + ' on ' + shareInfo.datestamp;
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-sharedby', msg));
    
    var comment = shareInfo.comment.trim();
    if (comment.length > 0) {
      msg = '<br><em>comment</em>: ' + comment;
      container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-sharecomment', msg));
    }

    return container;
  }
  
  _updateConfirm(enable) {
    this._container.getElementsByClassName('confirm')[0].disabled = !enable;
  }  

  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  //--------------------------------------------------------------
  // package callback data
  //--------------------------------------------------------------   
  _packageCallbackData() {
    var callbackData = {};
    
    var dialogType = this._config.dialogtype;
    if (dialogType == 'add-schedule') {
      var elemName = this._container.getElementsByClassName('dialogcontainer-input')[0];
      var elemLength = this._container.getElementsByClassName('dialogcontainer-spinner')[0];
      var elemStart = this._container.getElementsByClassName('dialogcontainer-date')[0];
      
      callbackData = {
        schedulename: elemName.value,
        schedulelength: elemLength.value,
        schedulestart: elemStart.value
      };
      
    } else if (dialogType == 'rename-schedule') {
      var elemName = this._container.getElementsByClassName('dialogcontainer-input')[0];
      var elemStart = this._container.getElementsByClassName('dialogcontainer-date')[0];

      callbackData = {
        scheduleid: elemName.scheduleId, 
        schedulename: elemName.value,
        schedulestart: elemStart.value
      };
      
    } else if (dialogType == 'delete-schedule') {
      var elemMsg = this._container.getElementsByClassName('dialogcontainer-message')[0];
      callbackData = {scheduleid: elemMsg.scheduleId};
      
    } else if (dialogType == 'add-tip') {
      var elemTipText = this._container.getElementsByClassName('dialogcontainer-input')[0];
      
      callbackData = {
        tiptext: elemTipText.value,
        category: this._category.value(),
        params: this._config.params
      };

    } else if (dialogType == 'edit-tip') {
      var elemTipText = this._container.getElementsByClassName('dialogcontainer-input')[0];
      
      callbackData = {
        tiptext: elemTipText.value,
        category: this._category.value(),
        params: this._config.params
      };
      
    } else if (dialogType == 'delete-tip') {
      var elemMsg = this._container.getElementsByClassName('dialogcontainer-message')[0];
      callbackData = {tipid: elemMsg.tipId};
      
    } else if (dialogType = 'accept-share') {
      var elemName = this._container.getElementsByClassName('dialogcontainer-input')[0];
      var elemOrigInfo = this._container.getElementsByClassName('dialogcontainer-sharedschedule')[0];
      
      callbackData = {
        schedulename: elemName.value,
        sharedcheduleinfo: elemOrigInfo.sharedScheduleInfo
      };
      
    } else {
      console.log('unrecognized dialog type: ' + dialogType); 
    }
    
    return callbackData;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _handleConfirm(me) {
    await me._config.confirmcallback(me._packageCallbackData());
    me.show(false);
  }
  
  _handleCancel(me) {
    me.show(false);
    me._config.cancelcallback();
  }
  
  _handleScheduleName(e) {
    var nameValue = e.target.value.trim();
    this._updateConfirm(nameValue.length > 0);
  }
  
  _handleTipTextChange(e) {
    var tipText = e.target.value.trim();
    
    this._updateTipTextPreview(tipText);
    this._updateConfirm(tipText.length > 0);
  }
  
  _handleCategoryChange(params) {}
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------      
  _formatDate(d) {
    var y = d.getFullYear();
    var m = ('00' + (d.getMonth() + 1)).slice(-2);
    var d = ('00' + d.getDate()).slice(-2);
    
    return y + '-' + m + '-' + d;    
  }
  
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
    //cleaned = cleaned.replace(/&(.*?);/g, '$1');  // replace ampersand characters
    
    return cleaned;
  }
}
