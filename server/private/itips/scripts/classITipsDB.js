//-------------------------------------------------------------------
// ITipsDB
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ITipsDB {
  constructor(config) {
    this.config = config;
    
    this.dummyScheduleList = [
      {"schedulename": "second schedule", "scheduleid": 109, "numweeks": 20, "firstdate": '2021-08-28'},
      {"schedulename": "first schedule", "scheduleid": 108, "numweeks": 20, "firstdate": '2021-09-05'},
      {"schedulename": "third schedule", "scheduleid": 110, "numweeks": 13, "firstdate": '2021-09-05'}
    ];
    
    this.dummyScheduleData = {
      "scheduleid": 1,
      "firstdate": '2021-09-16',
      "tiplist": [
        [
          {"tipid": 1, "tipcontent": "<p>example AA", "tipstate": "checked" },
          {"tipid": 2, "tipcontent": "<p>example BB", "tipstate": "unchecked" },
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
        [
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
        [
          {"tipid": 1, "tipcontent": "<p>example AA", "tipstate": "checked" },
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ]
      ]
    };
    
    this.dummyTipList = [
      {"tipid": 5, "tipcontent": "<p>some tip</p>", "taglist": [], "usagecount": 2},
      {"tipid": 4, "tipcontent": "<p>another tip</p>", "taglist": ['aa', 'bb', 'cc'], "usagecount": 1},
      {"tipid": 3, "tipcontent": "<p>important info</p>", "taglist": ['bb', 'cc'], "usagecount": 2},
      {"tipid": 2, "tipcontent": "<p>xyzzy</p>", "taglist": ['aa'], "usagecount": 0},
      {"tipid": 1, "tipcontent": "<p>pflugh</p>", "taglist": [], "usagecount": 1},
      {"tipid": 6, "tipcontent": "<p>inconceivable!</p>", "taglist": [], "usagecount": 3}
    ];
    
    this.dummySharedScheduleList = [
      {"scheduleid": 1, "schedulename": "some schedule", "comment": 'rando comment', "sharedby": 'Kevin Santer', "dateshared": '2021-09-25 10:58'},
      {"scheduleid": 2, "schedulename": "some other schedule", "comment": '', "sharedby": 'Joe Instructor', "dateshared": '2021-09-20 14:23'},
      {"scheduleid": 3, "schedulename": "one more schedule", "comment": 'enjoy!', "sharedby": 'Sturgis Podmore', "dateshared": '2021-09-22 9:20'},
    ];
    
    this.dummyUserList = [
      {"userid": 5, "username": "Joe Instructor"},
      {"userid": 6, "username": "Bob Teacher"},
      {"userid": 2, "username": "Taskmaster Phillipa"},
      {"userid": 1, "username": "Professor Zooey"}
    ];
    
    this.dummyNotificationData = {
      "receivesharenotification": true,
      "remindernotifications": [
        {"scheduleid": 108, "notificationtype": "Sat"},
        {"scheduleid": 108, "notificationtype": "Thu"},
        {"scheduleid": 109, "notificationtype": "Wed"}
      ]
    };
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
    var scheduleList = this.dummyScheduleList
    //scheduleList = [];
    
    scheduleList = scheduleList.sort(function(a, b) {
      return a.schedulename.toLowerCase().localeCompare(b.schedulename.toLowerCase());
    });

    var dbResult = {"success": true, "details": 'query succeeded', "data": scheduleList};
    if (!dbResult.success) return null;
    
    return dbResult.data;
  }
  
  async getScheduleData(scheduleId) {
    var scheduleData = this.dummyScheduleData;
    
    var dbResult = {"success": true, "details": 'query succeeded', "data": scheduleData};
    if (!dbResult.success) return null;
    
    return dbResult.data;
  }
  
  async saveScheduleConfiguration(params) {
    console.log('ITipsDB.saveScheduleConfiguration', params);

    var dbResult = {"success": true, "details": 'save succeeded', "data": null};
    
    return dbResult.success;
  }
  
  async getTipList() {
    var tipList = this.dummyTipList;

    tipList = tipList.sort(function(a, b) {
      return a.tipcontent.toLowerCase().localeCompare(b.tipcontent.toLowerCase());
    })
    
    var dbResult = {"success": true, "details": 'query succeeded', "data": tipList};
    if (!dbResult.success) return null;
    
    return dbResult.data;    
  }
  
  async updateTip(params) {
    console.log('ITipsDB.updateTip', params);

    var dbResult = {"success": true, "details": 'update succeeded', "data": null};
    
    return dbResult.success;
  }
  
  async getUserList() {
    var userList = this.dummyUserList;

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
    var notificationData = this.dummyNotificationData;
    
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
    var sharedScheduleList = this.dummySharedScheduleList;
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
  
  async removeSharedSchedule(shareParams) {
    console.log('ITipsDB.removeSharedSchedule', shareParams);
    
    var dbResult = {"success": true, "details": "remove succeeded", "data": null};
    
    return dbResult.success;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
  