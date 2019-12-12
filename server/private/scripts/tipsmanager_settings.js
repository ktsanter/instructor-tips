//-----------------------------------------------------------------------------------
// Settings class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class Settings {
  constructor() {
    this._version = '0.01';
    this._title = 'Settings';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render(notice) {
    this._container = CreateElement.createDiv(null, 'notification ' + this._HIDE_CLASS);

    this._notice = notice;
    
    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------  
  async show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    var queryResults = await this._doGetQuery('tipmanager/query', 'notificationoptions');
    this._prepContainerForUpdate();
    
    if (queryResults.success) {       
      this._container.appendChild(this._renderNotificationUI(queryResults.data));
      this._container.appendChild(this._renderPasswordUI());
    }
  }
  
  _prepContainerForUpdate() {
    this._removeChildren(this._container);

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
  }
  
  _renderNotificationUI(notificationData) {
    var container = CreateElement.createDiv(null, 'notification-contents');

    var handler = (e) => {return this._updateSettings();};
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', 'Notification settings'));
    
    var elemSharedSchedule = this._createSliderSwitch('shared schedules', 'shared schedules', 'notification-control sharedschedule', handler);
    this._setSliderValue(elemSharedSchedule, notificationData.sharedschedule);
    elemSharedSchedule.title = 'receive email notifications when a schedule is shared with you';

    var elemPushReminders = this._createSliderSwitch('reminders', 'reminders', 'notification-control pushreminders', handler);
    this._setSliderValue(elemPushReminders, notificationData.pushreminders);
    elemPushReminders.title = 'receive weekly reminders about your schedule';

    var elemEmail = CreateElement.createTextInput(null, 'notification-control email', notificationData.email);
    elemEmail.placeholder = 'email';
    var elemEmailConfirm = CreateElement.createButton(null, 'notification-control email-confirm', 'save', 'save email', handler);
    
    var elemSubContainer = CreateElement.createDiv(null, 'notification-contents-container');
    elemSubContainer.appendChild(elemSharedSchedule);
    container.appendChild(elemSubContainer);
        
    elemSubContainer = CreateElement.createDiv(null, 'notification-contents-container');
    elemSubContainer.appendChild(elemPushReminders);
    container.appendChild(elemSubContainer);
    
    elemSubContainer = CreateElement.createDiv(null, 'notification-contents-container2');
    container.appendChild(elemSubContainer);
    elemSubContainer.appendChild(elemEmail);
    elemSubContainer.appendChild(elemEmailConfirm);    

    return container;
  }

  _renderPasswordUI() {
    var container = CreateElement.createDiv(null, 'notification-contents');
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', 'Change password')); 

    var elemForm = CreateElement._createElement('form', null, 'password-form');
    container.appendChild(elemForm);
    elemForm.action = '/change_password';
    elemForm.method = 'post';    
    
    var passwordInputHandler = (e) => {return this._validatePassword(e);};
    
    var subContainer = CreateElement.createDiv(null, null);
    elemForm.appendChild(subContainer);
    var elemPassword = CreateElement._createElement('input', null, 'password-new');
    subContainer.appendChild(elemPassword);
    elemPassword.type = 'password';
    elemPassword.name = 'newPassword';
    elemPassword.placeholder = 'new password';
    elemPassword.autocomplete = 'off';
    elemPassword.addEventListener('input', passwordInputHandler);
    
    subContainer = CreateElement.createDiv(null, null);
    elemForm.appendChild(subContainer);
    elemPassword = CreateElement._createElement('input', null, 'password-confirm');
    subContainer.appendChild(elemPassword);
    elemPassword.type = 'password';
    elemPassword.placeholder = 'confirm password';
    elemPassword.autocomplete = 'off';
    elemPassword.addEventListener('input', passwordInputHandler);
    
    var elemSaveButton = CreateElement.createButton(null, 'password-control', 'save', 'save new password', (e) => {return this._saveNewPassword(e)});
    elemForm.appendChild(elemSaveButton);
    elemSaveButton.type = 'button';
    elemSaveButton.disabled = true;
    
    return container;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------    
  async _updateSettings(e) {
    var elemSharedSchedule = this._container.getElementsByClassName('sharedschedule')[0];
    var elemPushReminders = this._container.getElementsByClassName('pushreminders')[0];
    var elemEmail = this._container.getElementsByClassName('email')[0];
    
    var postData = {
      sharedschedule: this._getSliderValue(elemSharedSchedule),
      pushreminders: this._getSliderValue(elemPushReminders),
      email: elemEmail.value
    };
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'notificationoptions', postData);
  }

  _validatePassword(e) {
    var elemNewPassword = this._container.getElementsByClassName('password-new')[0];
    var elemConfirmPassword = this._container.getElementsByClassName('password-confirm')[0];
    var elemSaveButton = this._container.getElementsByClassName('password-control')[0];
    
    var validation = this._newPasswordIsValid();
    if (validation.newIsValid) {
      elemNewPassword.style.color = 'black';
    } else {
      elemNewPassword.style.color = 'red';
    }
    
    if (validation.confirmIsValid) {
      elemConfirmPassword.style.color = 'black';
    } else {
      elemConfirmPassword.style.color = 'red';
    }
    
    elemSaveButton.disabled = !validation.valid;
  }
  
  _newPasswordIsValid() {
    var newPassword = this._container.getElementsByClassName('password-new')[0].value;
    var confirmPassword = this._container.getElementsByClassName('password-confirm')[0].value;
    var result = {}

    result.newIsValid = (newPassword.length > 3);
    result.confirmIsValid = (newPassword == confirmPassword);
    result.valid = (result.newIsValid && result.confirmIsValid);
    
    return result;
  }
  
  async _saveNewPassword(e) {
    var validation = this._newPasswordIsValid();
    if (!validation.valid) return;
    
    var elemForm = this._container.getElementsByClassName('password-form')[0];
    
    elemForm.submit();
  }
  
  //--------------------------------------------------------------
  // slider switch
  //--------------------------------------------------------------
  _createSliderSwitch(dataOnLabel, dataOffLabel, addedClassList, handler, useTwoChoice) {
    var classList = 'switch';
    if (useTwoChoice) {
      classList += ' switch-two-choice';
    } else {
      classList += ' switch-yes-no';
    }
    if (addedClassList && addedClassList != '') classList += ' ' + addedClassList;
    var container = CreateElement._createElement('label', null, classList);
    
    
    var elemCheckbox = CreateElement._createElement('input', null, 'switch-input');
    elemCheckbox.type = 'checkbox';
    container.appendChild(elemCheckbox);
    if (handler) elemCheckbox.addEventListener('click', e => handler(e));
    
    var elemDataSpan = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemDataSpan);
    elemDataSpan.setAttribute('data-on', dataOnLabel);
    elemDataSpan.setAttribute('data-off', dataOffLabel);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));
    return container;
  }

  _createSliderRadio(groupName, dataOnLabel, dataOffLabel, addedClassList, handler) {
    var classList = 'switch switch-yes-no';
    if (addedClassList && addedClassList != '') classList += ' ' + addedClassList;
    var container = CreateElement._createElement('label', null, classList);
    
    
    var elemRadio = CreateElement._createElement('input', null, 'switch-input');
    elemRadio.type = 'radio';
    elemRadio.name = groupName;
    container.appendChild(elemRadio);
    if (handler) elemRadio.addEventListener('click', e => handler(e));
    
    var elemDataSpan = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemDataSpan);
    elemDataSpan.setAttribute('data-on', dataOnLabel);
    elemDataSpan.setAttribute('data-off', dataOffLabel);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));
    return container;
  }

  _getSliderValue(elem) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];    
    return elemInput.checked;
  }

  _setSliderValue(elem, checked) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];
    elemInput.checked = checked;
  }
    
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------    
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
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }  
}
