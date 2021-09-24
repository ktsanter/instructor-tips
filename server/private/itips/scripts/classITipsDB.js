//-------------------------------------------------------------------
// ITipsDB
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ITipsDB {
  constructor(config) {
    this.config = config;
    
    /*
    this.dummyScheduleList = [
      {"schedulename": "second schedule", "scheduleid": 109, "numweeks": 20, "firstdate": '2021-08-28'},
      {"schedulename": "first schedule", "scheduleid": 108, "numweeks": 20, "firstdate": '2021-09-05'},
      {"schedulename": "third schedule", "scheduleid": 110, "numweeks": 13, "firstdate": '2021-09-05'}
    ];
    */
    this.dummyScheduleData = {
      "scheduleid": 1,
      "numweeks": 17,
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
          {"tipid": 2, "tipcontent": "<p>example BB", "tipstate": "unchecked" },
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
        [
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
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
          {"tipid": 2, "tipcontent": "<p>example BB", "tipstate": "unchecked" },
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
        [
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
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
          {"tipid": 2, "tipcontent": "<p>example BB", "tipstate": "unchecked" },
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
        [
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
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
          {"tipid": 2, "tipcontent": "<p>example BB", "tipstate": "unchecked" },
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
        [
          {"tipid": 3, "tipcontent": "<p>example CC", "tipstate": "checked" }        
        ],
        [
          {"tipid": 1, "tipcontent": "<p>example AA", "tipstate": "unchecked" },
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
      {"tipid": 15, "tipcontent": "<p>some tip1</p>", "taglist": [], "usagecount": 2},
      {"tipid": 14, "tipcontent": "<p>another tip1</p>", "taglist": ['aa', 'bb', 'cc'], "usagecount": 1},
      {"tipid": 13, "tipcontent": "<p>important info1</p>", "taglist": ['bb', 'cc'], "usagecount": 2},
      {"tipid": 12, "tipcontent": "<p>xyzzy1</p>", "taglist": ['aa'], "usagecount": 0},
      {"tipid": 11, "tipcontent": "<p>pflugh1</p>", "taglist": [], "usagecount": 1},
      {"tipid": 25, "tipcontent": "<p>some tip2</p>", "taglist": [], "usagecount": 2},
      {"tipid": 24, "tipcontent": "<p>another tip2</p>", "taglist": ['aa', 'bb', 'cc'], "usagecount": 1},
      {"tipid": 23, "tipcontent": "<p>important info2</p>", "taglist": ['bb', 'cc'], "usagecount": 2},
      {"tipid": 22, "tipcontent": "<p>xyzzy2</p>", "taglist": ['aa'], "usagecount": 0},
      {"tipid": 21, "tipcontent": "<p>pflugh2</p>", "taglist": [], "usagecount": 1},
      {"tipid": 35, "tipcontent": "<p>some tip3</p>", "taglist": [], "usagecount": 2},
      {"tipid": 34, "tipcontent": "<p>another tip3</p>", "taglist": ['aa', 'bb', 'cc'], "usagecount": 1},
      {"tipid": 33, "tipcontent": "<p>important info3</p>", "taglist": ['bb', 'cc'], "usagecount": 2},
      {"tipid": 32, "tipcontent": "<p>xyzzy3</p>", "taglist": ['aa'], "usagecount": 0},
      {"tipid": 31, "tipcontent": "<p>pflugh3</p>", "taglist": [], "usagecount": 1},
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
    console.log('ITipsDB.getScheduleList');
    var dbResult = await SQLDBInterface.doGetQuery('itips/query', 'schedule-list', this.config.notice);;
    if (!dbResult.success) return null;

    var scheduleList = dbResult.data.sort(function(a, b) {
      return a.schedulename.toLowerCase().localeCompare(b.schedulename.toLowerCase());
    });
    
    return scheduleList;
  }
  
  async getScheduleData(scheduleId) {
    var scheduleData = this.dummyScheduleData;
    
    var dbResult = {"success": true, "details": 'query succeeded', "data": scheduleData};
    if (!dbResult.success) return null;
    
    return dbResult.data;
  }
  
  async saveScheduleConfiguration(params) {
    var result = null;

    var dbResult = {"success": false, "details": 'unrecognized action', "data": null};
    
    if (params.configureType == 'add') {
      dbResult = await SQLDBInterface.doPostQuery('itips/insert', 'schedule', params, this.config.notice);
      
    } else if (params.configureType == 'edit') {
      dbResult = await SQLDBInterface.doPostQuery('itips/update', 'schedule', params, this.config.notice);
      
    } else if (params.configureType == 'delete') {
      dbResult = await SQLDBInterface.doPostQuery('itips/delete', 'schedule', params, this.config.notice);
    }

    if (dbResult.success) {
      result = dbResult.data;
    }
    
    return result;
  }
  
  async getTipList() {
    console.log('_getTipList');
    
    var dbResult = await SQLDBInterface.doGetQuery('itips/query', 'tip-list', this.config.notice);

    if (!dbResult.success) return null;

    var tipList = dbResult.data.sort(function(a, b) {
      return a.tipcontent.toLowerCase().localeCompare(b.tipcontent.toLowerCase());
    })
    
    
    return tipList;    
  }
  
  async updateTip(params) {
    console.log('ITipsDB.updateTip', params);
    
    var dbResult = {"success": false, "details": 'updateTip - unrecognized editType: ' + params.editType, "data": null};
    
    if (params.editType == 'add') {
      dbResult = await SQLDBInterface.doPostQuery('itips/insert', 'tip', params, this.config.notice);
      
    } else if (params.editType == 'edit') {
      dbResult = await SQLDBInterface.doPostQuery('itips/update', 'tip', params, this.config.notice);
      
    } else if (params.editType == 'delete') {
      dbResult = await SQLDBInterface.doPostQuery('itips/delete', 'tip', params, this.config.notice);
    }
    
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
  
  async insertWeekIntoSchedule(params) {
    console.log('ITipsDB.insertWeekIntoSchedule', params);
    
    var dbResult = {"success": true, "details": "insert succeeded", "data": null};
    
    return dbResult.success;
  }
  
  async removeWeekFromSchedule(params) {
    console.log('ITipsDB.removeWeekFromSchedule', params);
    
    var dbResult = {"success": true, "details": "remove succeeded", "data": null};
    
    return dbResult.success;
  }
  
  async addTipToWeek(params) {
    console.log('ITipsDB.addTipToWeek', params);
    
    var dbResult = {"success": true, "details": "add succeeded", "data": null};
    
    return dbResult.success;
  }
  
  async removeTipFromWeek(params) {
    console.log('ITipsDB.removeTipFromWeek', params);
    
    var dbResult = {"success": true, "details": "remove succeeded", "data": null};
    
    return dbResult.success;
  }
  
  async changeTipOrderInSchedule(params) {
    console.log('ITipsDB.changeTipOrderInSchedule', params);
    
    var dbResult = {"success": true, "details": "remove succeeded", "data": null};
    
    return dbResult.success;
  }

  async changeTipState(params) {
    console.log('ITipsDB.changeTipState', params);
    
    var dbResult = {"success": true, "details": "query succeeded", "data": null};
    
    return dbResult.success;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
  