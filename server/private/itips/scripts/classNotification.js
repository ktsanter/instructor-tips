//-------------------------------------------------------------------
// Notification
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Notification {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.elemReceiveShareNotification = this.config.container.getElementsByClassName('receive-share-notification')[0];
    this.elemReceiveShareNotification.addEventListener('click', (e) => { this._handleReceiveShareSwitch(e); });
    
    this.reminderContainer = this.config.container.getElementsByClassName('reminder-container')[0];
    this.labelForEmptyReminders = this.config.container.getElementsByClassName('label-for-empty')[0];
    this.reminderTemplate = this.config.container.getElementsByClassName('reminder-template')[0];
  }
  
  async update() {
    var notificationData = await this.config.db.getNotificationSettings();
    if (!notificationData) return;
    this._setReceiveNotification(notificationData.receivesharenotification);
    
    var scheduleList = await this.config.db.getScheduleList();
    if (!scheduleList) return;
    
    this._displayReminderNotifications(notificationData.remindernotifications, scheduleList);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _setReceiveNotification(setOn) {
    this.elemReceiveShareNotification.checked = setOn;
  }
  
  _displayReminderNotifications(reminderNotifications, scheduleList) {
    UtilityKTS.removeChildren(this.reminderContainer);

    var labelNode;
    if (scheduleList.length == 0) {
      labelNode = this.labelForEmptyReminders.cloneNode(true);
      UtilityKTS.setClass(labelNode, this.config.hideClass, false);
      this.reminderContainer.appendChild(labelNode);
    }
    
    for (var i = 0; i < scheduleList.length; i++) {
      var schedule = scheduleList[i];
      
      var reminderNode = this.reminderTemplate.cloneNode(true);
      UtilityKTS.setClass(reminderNode, this.config.hideClass, false);
      
      var reminderNodeSchedule = reminderNode.getElementsByClassName('reminder-schedule')[0];
      reminderNodeSchedule.appendChild(CreateElement.createDiv(null, null, schedule.schedulename));
      
      var reminderNodeDays = reminderNode.getElementsByClassName('reminder-days')[0];
      for (var j = 0; j < reminderNotifications.length; j++) {
        var reminder = reminderNotifications[j];
        if (reminder.scheduleid == schedule.scheduleid) {
          var dayClass = 'dayslider-' + reminder.notificationtype;
          CreateElement.setSliderValue(reminderNodeDays.getElementsByClassName(dayClass)[0], true);
        }
      }
      
      var reminderInputs = reminderNodeDays.getElementsByClassName('switch-input');
      for (var j = 0; j < reminderInputs.length; j++) {
        reminderInputs[j].setAttribute('scheduleid', schedule.scheduleid);
        reminderInputs[j].addEventListener('click', (e) => { this._handleReminderSwitch(e); });
      }
      
      this.reminderContainer.appendChild(reminderNode);
    }
  }
  
  async _saveShareNotificationSetting(notificationOn) {
    var success = this.config.db.saveShareNotification(notificationOn);
  }
  
  async _saveReminderSetting(reminderParams) {
    var success = this.config.db.saveReminderSetting(reminderParams);
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleReceiveShareSwitch(e) {
    await this._saveShareNotificationSetting(e.target.checked);
  }
  
  async _handleReminderSwitch(e) {
    await this._saveReminderSetting({
      "scheduleid": e.target.getAttribute('scheduleid'),
      "notificationtype": e.target.getAttribute('slider-day'),
      "addreminder": e.target.checked
    });
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
