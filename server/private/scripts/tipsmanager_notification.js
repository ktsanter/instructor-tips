//-----------------------------------------------------------------------------------
// TipNotification class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TipNotification {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Notification';
    
    this._HIDE_CLASS = 'tipnotification-hide';

    this._config = {};
    if (config) this._config = config;
    this._config.controlText = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipnotification ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    //this._container.appendChild(this._renderTitle());

    this._container.appendChild(this._renderContents());
    
    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipnotification-contents');
    
    container.appendChild(this._renderShareNotifications());
    container.appendChild(this._renderScheduleNotifications());
    
    return container;
  }  
  
  _renderShareNotifications() {
    var container = CreateElement.createDiv(null, 'tipnotification-share tipnotification-section');
    
    container.appendChild(this._renderSectionTitle('shared schedules'));
    
    var handler = (e) => {this._handleShareChange(e);}
    var elem = CreateElement.createSliderSwitch('yes', 'no', 'tipnotification-sharecontrol', handler);
    container.appendChild(elem);
    container.appendChild(CreateElement.createDiv(null, 'tipnotification-sharelabel', 'Receive notification when a schedule is shared with you'));
    
    return container;
  }

  _renderScheduleNotifications() {
    var container = CreateElement.createDiv(null, 'tipnotification-schedulecontainer tipnotification-section');
    
    container.appendChild(this._renderSectionTitle('reminder notifications for schedules'));
    container.appendChild(CreateElement.createDiv(null, 'tipnotification-schedule'));
        
    return container;
  }
  
  _renderSectionTitle(title) {
    var container = CreateElement.createDiv(null, 'tipnotification-sectiontitle');
    
    container.appendChild(CreateElement.createDiv(null, 'tipnotification-sectiontitletext', title));
    
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
    var state = await this._loadStateFromDB();
    
    if (state) {
      this._updateShare(state.share.notificationon);
      this._updateScheduleNotifications(state.schedule);
    }
  }
  
  _updateShare(shareOn) {
    var elemShareControl = this._container.getElementsByClassName('tipnotification-sharecontrol')[0];
    CreateElement.setSliderValue(elemShareControl, shareOn == 1);
  }
  
  _updateScheduleNotifications(scheduleData) {
    var container = this._container.getElementsByClassName('tipnotification-schedule')[0];
    UtilityKTS.removeChildren(container);
    
    //container.appendChild(CreateElement.createDiv(null, 'tipnotification-schedulelabel', 'Receive notification reminders'));

    var count = 0;    
    for (var scheduleId in scheduleData) {
      var schedule = scheduleData[scheduleId];
      schedule.scheduleid = scheduleId;
      container.appendChild(this._renderScheduleNotification(schedule, count % 2 == 0));   
      count++;      
    }
    
    if (count == 0) {
      container.appendChild(CreateElement.createDiv(null, 'tipnotification-noschedules', 'you currently have no schedules'));
    }
  }
  
  _renderScheduleNotification(schedule, evenEntry) {
    var classString = 'tipnotification-scheduledetails' + (evenEntry ? ' even' : ' odd');
    var container = CreateElement.createDiv(null, classString);
    container.scheduleInfo = schedule
    
    container.appendChild(CreateElement.createDiv(null, 'tipnotification-schedulename', schedule.schedulename));
    
    var controls = CreateElement.createDiv(null, 'tipnotification-schedulecontrols');
    container.appendChild(controls);
    
    var notificationSet = new Set(schedule.notification);
    var handler = (e) => this._handleScheduleChange(e);
    for (var i = 0; i < this._config.controlText.length; i++) {
      var txt = this._config.controlText[i];
      var elem = CreateElement.createSliderSwitch(txt, txt, 'tipnotification-controlitem', handler);
      controls.appendChild(elem);
      CreateElement.setSliderValue(elem, notificationSet.has(txt));
      elem.controlLabelText = txt;
    }
    
    return container;
  }


  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  _getStateFromControls() {
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
  }
  
  async _loadStateFromDB() {
    var state = null;
    
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'notification', this._notice);
    if (queryResults.success) {
      state = queryResults.data;
    };
    
    return state;
  }
  
  async _saveStateToDB(state) {
    await SQLDBInterface.doPostQuery('tipmanager/update', 'notification', state, this._notice);
  }
  

  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  _handleShareChange(e) {
    this._saveStateToDB(this._getStateFromControls());
  }
  
  _handleScheduleChange(e) {
    this._saveStateToDB(this._getStateFromControls());
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
 
}
