//-------------------------------------------------------------------
// ITipsDB
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ITipsDB {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //-------------------------------------------------------------- 
  async isAdminAllowedForUser() {
    var dbResult = await SQLDBInterface.doGetQuery('itips/query', 'admin-allowed', this.config.notice);
    if (!dbResult.success) return false;
    
    return dbResult.data.adminallowed;
  }
  
  async getScheduleList() {
    var scheduleList = [
      {"schedulename": "second schedule", "scheduleid": 109, "numweeks": 20, "firstdate": '2021-08-28'},
      {"schedulename": "first schedule", "scheduleid": 108, "numweeks": 20, "firstdate": '2021-09-05'},
      {"schedulename": "third schedule", "scheduleid": 110, "numweeks": 13, "firstdate": '2021-09-05'}
    ];
    //scheduleList = [];
    
    scheduleList = scheduleList.sort(function(a, b) {
      return a.schedulename.toLowerCase().localeCompare(b.schedulename.toLowerCase());
    });

    var dbResult = {"success": true, "details": 'query succeeded', "data": scheduleList};
    if (!dbResult.success) return null;
    
    return dbResult.data;
  }
  
  async getScheduleData(scheduleId) {
    var scheduleData = {
      "foo": 'bar'
    };
    
    var dbResult = {"success": true, "details": 'query succeeded', "data": scheduleData};
    if (!dbResult.success) return null;
    
    return dbResult.data;
  }  
  
  async getUserList() {
    var userList = [
      {"userid": 5, "username": "Joe Instructor"},
      {"userid": 6, "username": "Bob Teacher"},
      {"userid": 2, "username": "Taskmaster Phillipa"},
      {"userid": 1, "username": "Professor Zooey"}
    ];

    userList = userList.sort(function(a, b) {
      return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
    })
    
    var dbResult = {"success": true, "details": 'query succeeded', "data": userList};
    if (!dbResult.success) return null;
    
    return dbResult.data;    
  }

  async saveShareNotification(notificationOn) {
    console.log('ITipsDB.saveShareNotification', notificationOn);

    var dbResult = {"success": true, "details": 'save succeeded', "data": null};
    
    return dbResult.success;
  }
  
  async getNotificationSettings() {
    var notificationData = {
      "receivesharenotification": true,
      "remindernotifications": [
        {"scheduleid": 108, "notificationtype": "Sat"},
        {"scheduleid": 108, "notificationtype": "Thu"},
        {"scheduleid": 109, "notificationtype": "Wed"}
      ]
    };
    
    var dbResult = {"success": true, "details": 'query succeeded', "data": notificationData};
    if (!dbResult.success) return null;
    
    return dbResult.data;    
  }
  
  async saveReminderSetting(notificationParams) {
    console.log('ITipsDB.saveReminderSetting', notificationParams);
    
    var dbResult = {"success": true, "details": 'save succeeded', "data": null};
    
    return dbResult.success;
  }
  
  async shareSchedule(shareParams) {
    console.log('ITipsDB.shareSchedule', shareParams);
    
    var dbResult = {"success": true, "details": 'share succeeded', "data": null};
    
    return dbResult.success;
  }
  
  async getPendingSharedSchedules() {
    var sharedScheduleList = [
      {"scheduleid": 1, "schedulename": "some schedule", "comment": 'rando comment', "sharedby": 'Kevin Santer', "dateshared": '2021-09-25 10:58'},
      {"scheduleid": 2, "schedulename": "some other schedule", "comment": '', "sharedby": 'Joe Instructor', "dateshared": '2021-09-20 14:23'},
      {"scheduleid": 3, "schedulename": "one more schedule", "comment": 'enjoy!', "sharedby": 'Sturgis Podmore', "dateshared": '2021-09-22 9:20'},
    ];
    //sharedScheduleList = [];
    
    sharedScheduleList = sharedScheduleList.sort(function(a, b) {
      return a.dateshared.toLowerCase().localeCompare(b.dateshared.toLowerCase());
    })
    
    var dbResult = {"success": true, "details": 'query succeeded', "data": sharedScheduleList};
    if (!dbResult.success) return null;
    
    return dbResult.data;    
  }
  
  async acceptSharedSchedule(shareParams) {
    console.log('ITipsDB.acceptSharedSchedule', shareParams);
    
    var dbResult = {"success": true, "details": "accept succeeded", "data": null};
    
    return dbResult.success;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
