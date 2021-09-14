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
    var dbResult = await SQLDBInterface.doGetQuery('roster-manager/query', 'admin-allowed', this.config.notice);
    if (!dbResult.success) return false;
    
    return dbResult.data.adminallowed;
  }
  
  async getScheduleList() {
    var scheduleList = [
      {"schedulename": "first schedule", "scheduleid": 108, "numweeks": 20, "firstdate": '2021-09-05'},
      {"schedulename": "second schedule", "scheduleid": 109, "numweeks": 20, "firstdate": '2021-08-28'},
      {"schedulename": "third schedule", "scheduleid": 110, "numweeks": 13, "firstdate": '2021-09-05'}
    ];
    //scheduleList = [];

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
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
