//-------------------------------------------------------------------
// ITipsDB
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ITipsDB {
  constructor(config) {
    this.config = config;
    
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
    var dbResult = await SQLDBInterface.doGetQuery('itips/query', 'schedule-list', this.config.notice);;
    if (!dbResult.success) return null;

    var scheduleList = dbResult.data.sort(function(a, b) {
      return a.schedulename.toLowerCase().localeCompare(b.schedulename.toLowerCase());
    });
    
    return scheduleList;
  }
  
  async getScheduleData(scheduleId) {
    var params = { "scheduleid": scheduleId };
    
    var dbResult = await SQLDBInterface.doPostQuery('itips/query', 'schedule-data', params, this.config.notice);;
    if (!dbResult.success) return null;
    
    var scheduleData = dbResult.data;
    var tipList = scheduleData.tiplist;
    for (var i = 0; i < tipList.length; i++) {
      var tipsForWeek = tipList[i];
      for (var j = 0; j < tipsForWeek.length; j++) {
        var decoded = decodeURIComponent(tipsForWeek[j].tipcontent);
        tipsForWeek[j].tipcontent = decoded;
      }
    }

    return scheduleData;
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
    var dbResult = await SQLDBInterface.doGetQuery('itips/query', 'tip-list', this.config.notice);

    if (!dbResult.success) return null;
    var tipList = dbResult.data;
    for (var i = 0; i < tipList.length; i++) {
      var decoded = decodeURIComponent(tipList[i].tipcontent);
      tipList[i].tipcontent = decoded;
    }
    
    var tipList = tipList.sort(function(a, b) {
      return a.tipcontent.toLowerCase().localeCompare(b.tipcontent.toLowerCase());
    })
        
    return tipList;    
  }
  
  async updateTip(params) {
    var dbResult = {"success": false, "details": 'updateTip - unrecognized editType: ' + params.editType, "data": null};

    params.tipcontent = encodeURIComponent(params.tipcontent);
    
    if (params.editType == 'add') {
      dbResult = await SQLDBInterface.doPostQuery('itips/insert', 'tip', params, this.config.notice);
      
    } else if (params.editType == 'edit') {
      dbResult = await SQLDBInterface.doPostQuery('itips/update', 'tip', params, this.config.notice);
      
    } else if (params.editType == 'delete') {
      dbResult = await SQLDBInterface.doPostQuery('itips/delete', 'tip', params, this.config.notice);
    }
    
    if (!dbResult.success && dbResult.details && dbResult.details.includes('duplicate')) {
      this.config.notice.setNotice('this tip already exists');
    }
    
    return dbResult.success;
  }
  
  async getUserList() {
    var dbResult = await SQLDBInterface.doGetQuery('itips/query', 'user-list', this.config.notice);

    if (!dbResult.success) return null;
    
    var userList = dbResult.data.sort(function(a, b) {
      return a.username.toLowerCase().localeCompare(b.username.toLowerCase());
    })
    
    return userList;    
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
    var dbResult = await SQLDBInterface.doPostQuery('itips/insert', 'share-schedule', shareParams, this.config.notice);
    
    return dbResult.success;
  }
  
  async getPendingSharedSchedules() {
    var dbResult = await SQLDBInterface.doGetQuery('itips/query', 'pending-shares', this.config.notice);
    
    if (!dbResult.success) return null;
    
    return dbResult.data;    
  }
  
  async acceptSharedSchedule(shareParams) {
    console.log('ITipsDB.acceptSharedSchedule', shareParams);
    
    var dbResult = await SQLDBInterface.doPostQuery('itips/update', 'accept-shared-schedule', shareParams, this.config.notice);
    
    return dbResult;
  }
  
  async removeSharedSchedule(shareParams) {
    var dbResult = await SQLDBInterface.doPostQuery('itips/delete', 'shared-schedule', shareParams, this.config.notice);
    
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
    var dbResult = await SQLDBInterface.doPostQuery('itips/insert', 'add-tip-to-week', params, this.config.notice);;

    if (!dbResult.success && dbResult.details.includes('"duplicate"')) {
      this.config.notice.setNotice('this tip is already included for the week');
    }
    
    return dbResult.success;
  }
  
  async removeTipFromWeek(params) {
    var dbResult = await SQLDBInterface.doPostQuery('itips/insert', 'remove-tip-from-week', params, this.config.notice);;
    
    return dbResult.success;
  }
  
  async changeTipOrderInSchedule(params) {
    console.log('ITipsDB.changeTipOrderInSchedule', params);
    
    var dbResult = {"success": true, "details": "remove succeeded", "data": null};
    
    return dbResult.success;
  }

  async changeTipState(params) {
    var dbResult = await SQLDBInterface.doPostQuery('itips/update', 'change-tip-state', params, this.config.notice);;
    
    return dbResult.success;
  }
  
  async getSchedulesUsingTip(params) {
    var dbResult = await SQLDBInterface.doPostQuery('itips/query', 'schedules-using-tip', params, this.config.notice);;
    if (!dbResult.success) return null;

    return dbResult.data;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
  