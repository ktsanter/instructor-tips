//-----------------------------------------------------------------------------------
// NotificationOptions class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class NotificationOptions {
  constructor() {
    this._version = '0.01';
    this._title = 'Notification options';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render(notice) {
    console.log('render');
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
    console.log('update');

    var queryResults = await this._doGetQuery('tipmanager/query', 'notificationoptions');
    this._prepContainerForUpdate();
    
    if (queryResults.success) {       
      this._container.appendChild(this._renderNotificationUI(queryResults.data));
    }
  }
  
  _prepContainerForUpdate() {
    this._removeChildren(this._container);

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    this._container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
  }
  
  _renderNotificationUI(notificationData) {
    var container = CreateElement.createDiv(null, 'notification-contents');

    var handler = (e) => {return this._updateSettings();};
    
    var elemSharedSchedule = this._createSliderSwitch('shared schedules', 'shared schedules', 'notification-control sharedschedule', handler);
    this._setSliderValue(elemSharedSchedule, notificationData.sharedschedule);

    var elemPushReminders = this._createSliderSwitch('reminders', 'reminders', 'notification-control pushreminders', handler);
    this._setSliderValue(elemPushReminders, notificationData.pushreminders);

    var elemSubContainer = CreateElement.createDiv(null, 'notification-contents-container');
    elemSubContainer.appendChild(elemSharedSchedule);
    container.appendChild(elemSubContainer);
        
    elemSubContainer = CreateElement.createDiv(null, 'notification-contents-container');
    elemSubContainer.appendChild(elemPushReminders);
    container.appendChild(elemSubContainer);
    
    var elem
    return container;
  }

  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------    
  async _updateSettings(e) {
    console.log('update settings');
    var elemSharedSchedule = this._container.getElementsByClassName('sharedschedule')[0];
    var elemPushReminders = this._container.getElementsByClassName('pushreminders')[0];
    
    var postData = {
      sharedschedule: this._getSliderValue(elemSharedSchedule),
      pushreminders: this._getSliderValue(elemPushReminders)
    };
    console.log(postData);
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'notificationoptions', postData);
    if (queryResults.success) {
      //this.update();
    }
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
