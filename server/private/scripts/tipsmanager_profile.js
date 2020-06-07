//-----------------------------------------------------------------------------------
// TipProfile class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TipProfile {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Profile';
    
    this._HIDE_CLASS = 'tipprofile-hide';

    this._config = {};
    if (config) this._config = config;
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipprofile ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderTitle());

    this._container.appendChild(this._renderContents());
    
    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipprofile-contents');
    
    container.appendChild(this._renderEmail());
    container.appendChild(this._renderPassword());
    container.appendChild(this._renderConfirm());
    
    return container;
  }
  
  _renderSectionTitle(title) {
    var container = CreateElement.createDiv(null, 'tipprofile-sectiontitle');
    
    container.appendChild(CreateElement.createDiv(null, 'tipprofile-sectiontitletext', title));
    
    return container;
  }
  
  _renderEmail() {
    var container = CreateElement.createDiv(null, 'tipprofile-section tipprofile-email');
    
    container.appendChild(this._renderSectionTitle('Email for notification'));
    
    var elem = CreateElement.createTextInput(null, 'tipprofile-emailinput');
    container.appendChild(elem);
    elem.type = 'email';
    elem.placeholder = 'email for notifications';
    elem.maxLength = 80;
    
    return container;
  }
  
  _renderPassword() {
    var container = CreateElement.createDiv(null, 'tipprofile-section tipprofile-password');
    
    container.appendChild(this._renderSectionTitle('Password'));
    
    var elem = CreateElement.createTextInput(null, 'tipprofile-passwordinput password-new');
    container.appendChild(elem);
    elem.type = 'password';
    elem.placeholder = 'new password';
    elem.maxLength = 16;
    elem.autocomplete = 'off';

    elem = CreateElement.createTextInput(null, 'tipprofile-passwordinput password-confirm');
    container.appendChild(elem);
    elem.type = 'password';
    elem.placeholder = 'confirm new password';
    elem.maxLength = 16;
    elem.autocomplete = 'off';

    return container;
  }
    
  _renderConfirm() {
    var container = CreateElement.createDiv(null, 'tipprofile-section tipprofile-confirm');
    
    var handler = (e) => {this._handleConfirm();};
    var elem = CreateElement.createButton(null, 'tipprofile-confirmsave', 'save', 'save profile changes', handler);
    container.appendChild(elem);    
    
    handler = (e) => {this._handleCancel();};
    elem = CreateElement.createButton(null, 'tipprofile-confirmcancel', 'cancel', 'discard profile changes', handler);
    container.appendChild(elem);    

    return container;
  }
    
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    this._showElement(this._container, makeVisible);
  }
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    console.log('TipProfile.update');
    var state = await this._loadStateFromDB();
    
    if (state) {
      this._updateShare(state.share.notificationon);
      this._updateScheduleNotifications(state.schedule);
    }
    
    console.log(state);
  }

  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  _getStateFromControls() {
    console.log('_getStateFromControls');
    return {};
    /*
    var state = {share: {}, schedule: {}};
    
    var elemShare = this._container.getElementsByClassName('tipnotification-sharecontrol')[0];
    state.share.notificationon = (CreateElement.getSliderValue(elemShare) ? 1 : 0);
    
    var elemSchedules = this._container.getElementsByClassName('tipnotification-scheduledetails');
    for (var i = 0; i < elemSchedules.length; i++) {
      var scheduleInfo = elemSchedules[i].scheduleInfo;
      var elemControls = elemSchedules[i].getElementsByClassName('tipnotification-controlitem');
      var controlValues = [];
      for (var j = 0; j < elemControls.length; j++) {
        var control = elemControls[j];
        var controlText = control.controlLabelText;
        if (CreateElement.getSliderValue(control)) controlValues.push(controlText);
      }
      
      state.schedule[scheduleInfo.scheduleid] = {
        schedulename: scheduleInfo.schedulename,
        notification: controlValues
      };
    }
    
    return state;
    */
  }
  
  async _loadStateFromDB() {
    console.log('_loadStateFromDB');
    var state = null;
    
    var queryResults = await this._doGetQuery('tipmanager/query', 'profile');
    if (queryResults.success) {
      state = queryResults.data;
    };
    
    return state;
  }
  
  async _saveStateToDB(state) {
    console.log('_saveStateToDB');
    /*
    await this._doPostQuery('tipmanager/update', 'notification', state);
    //    var queryResults = await this._doPostQuery('tipmanager/update', 'notificationoptions', postData);
    */
  }
  

  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  _handleConfirm(e) {
    console.log('_handleEmailConfirm');
  }
  
  _handleCancel(e) {
    console.log('_handleEmailCancel');
  }

  /*
  _handleShareChange(e) {
    this._saveStateToDB(this._getStateFromControls());
  }
  
  _handleScheduleChange(e) {
    this._saveStateToDB(this._getStateFromControls());
  }
  */
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
  _setClass(elem, className, add) {
    if (elem.classList.contains(className)) elem.classList.remove(className);
    if (add) elem.classList.add(className);
  }
  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }

  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async _doGetQuery(queryType, queryName) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbPost(queryType, queryName, postData);
    if (requestResult.success) {
      resultData = requestResult;
      this._notice.setNotice('');
    } else {
      resultData.details = requestResult.details;
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }  
}
