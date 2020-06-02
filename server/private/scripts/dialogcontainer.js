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
    else if (dialogType == 'add-tip') this._container.appendChild(this._renderAddTip());
    else if (dialogType == 'edit-tip') this._container.appendChild(this._renderEditTip());
    
    // other
    else console.log('unrecognized dialog type: ' + dialogType);    
    
    return this._container;
  }
  
  _renderAddSchedule() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-add');
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-title', 'Create new schedule'));
    
    var subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub');
    container.appendChild(subContainer);
    
    var elemScheduleName = CreateElement.createTextInput(null, 'dialogcontainer-input');
    elemScheduleName.placeholder = 'schedule name';
    elemScheduleName.addEventListener('input', (e) => {this._handleScheduleName(e);});
    
    subContainer.appendChild(elemScheduleName);

    var elemScheduleLength = CreateElement.createSpinner(null, 'dialogcontainer-spinner', 20, 1, 40, 1);
    elemScheduleLength.title = 'schedule length';
    subContainer.appendChild(elemScheduleLength);

    var todayFormatted = this._formatDate(new Date());
    var elemScheduleStart = CreateElement.createDatePicker(null, 'dialogcontainer-date', todayFormatted, '2020-01-01', '2050-12-31');
    elemScheduleStart.title = 'first day for schedule';
    subContainer.appendChild(elemScheduleStart);

    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'dialogcontainer confirmcancel confirm', 'create', 'create new schedule', handler);
    elem.disabled = true;
    container.appendChild(elem);

    handler = (me) => {this._handleCancel(this);};
    container.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'cancel', handler));
    
    return container;
  }
  
  _renderRenameSchedule() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-rename');
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-title', 'Edit schedule parameters'));

    var subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub');
    container.appendChild(subContainer);
    
    var elemScheduleName = CreateElement.createTextInput(null, 'dialogcontainer-input');
    elemScheduleName.placeholder = 'schedule name';
    elemScheduleName.addEventListener('input', (e) => {this._handleScheduleName(e);});
    subContainer.appendChild(elemScheduleName);

    var todayFormatted = this._formatDate(new Date());
    var elemScheduleStart = CreateElement.createDatePicker(null, 'dialogcontainer-date', 'dummy', '2020-01-01', '2050-12-31');
    elemScheduleStart.title = 'first day for schedule';
    subContainer.appendChild(elemScheduleStart);

    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'dialogcontainer confirmcancel confirm', 'save', 'save schedule changes', handler);
    elem.disabled = false;
    container.appendChild(elem);

    handler = (me) => {this._handleCancel(this);};
    container.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'cancel', handler));

    return container;
  }
  
  _renderDeleteSchedule() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-delete');
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-title', 'Delete schedule'));
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-message'));

    var handler = (me) => {this._handleConfirm(this);};
    container.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'confirm', 'delete schedule', handler));

    handler = (me) => {this._handleCancel(this);};
    container.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'do not delete schedule', handler));
    
    return container;
  }
  
  _renderAddTip() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-addtip');
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-title', 'Add new tip'));
    
    // tip text input
    var subContainer = CreateElement.createDiv(null, 'dialogcontainer-sub');
    container.appendChild(subContainer);
    
    var elemTipText = CreateElement.createTextInput(null, 'dialogcontainer-input');
    elemTipText.placeholder = 'tip text';
    elemTipText.addEventListener('input', (e) => {this._handleTipTextChange(e);});
    
    subContainer.appendChild(elemTipText);
    
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
    
    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'dialogcontainer confirmcancel confirm', 'create', 'create new tip', handler);
    elem.disabled = true;
    subContainer.appendChild(elem);

    handler = (me) => {this._handleCancel(this);};
    subContainer.appendChild(CreateElement.createButton(null, 'dialogcontainer confirmcancel', 'cancel', 'cancel', handler));
    
    return container;
  }

  _renderEditTip() {
    var container = CreateElement.createDiv(null, 'dialogcontainer-edittip');
    
    container.appendChild(CreateElement.createDiv(null, 'dialogcontainer-title', 'Edit tip'));
    
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
    var elemName = this._container.getElementsByClassName('dialogcontainer-input')[0];
    elemName.value = '';
    elemName.focus();
    this._category.setSelectedValues([]);
  }
  
  _updateEditTip(params) {
    console.log('_updateEditTip ' + JSON.stringify(params));
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
        category: this._category.value()
      };

    } else {
      console.log('unrecognized dialog type: ' + dialogType); 
    }
    
    return callbackData;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleConfirm(me) {
    me.show(false);
    me._config.confirmcallback(me._packageCallbackData());
  }
  
  _handleCancel(me) {
    me.show(false);
    me._config.cancelcallback();
  }
  
  _handleScheduleName(e) {
    var nameValue = e.target.value.trim();
    this._container.getElementsByClassName('confirm')[0].disabled = (nameValue.length <= 0);
  }
  
  _handleTipTextChange(e) {
    var nameValue = e.target.value.trim();
    this._container.getElementsByClassName('confirm')[0].disabled = (nameValue.length <= 0);
  }
  
  _handleCategoryChange(params) {
    console.log('_handleCategoryChange ' + JSON.stringify(params));
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------   
  _formatDate(d) {
    var y = d.getFullYear();
    var m = ('00' + (d.getMonth() + 1)).slice(-2);
    var d = ('00' + d.getDate()).slice(-2);
    
    return y + '-' + m + '-' + d;    
  }
}
