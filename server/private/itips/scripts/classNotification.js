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
    this.daySliderTemplate = this.config.container.getElementsByClassName('reminder-days-template')[0];
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
    console.log('_displayReminderNotifications', reminderNotifications, scheduleList);
    console.log(this.daySliderTemplate);
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
