//-------------------------------------------------------------------
// ITipsDB
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ITipsDB {
  constructor(config) {
    this.config = config;
    console.log('ITipsDB constructor', this.config);
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async getScheduleList() {
    // temp -----------------
    
    var scheduleList = [
      {"schedulename": "first schedule", "id": 108, "numweeks": 20, "firstdate": '2021-09-05'},
      {"schedulename": "second schedule", "id": 109, "numweeks": 20, "firstdate": '2021-08-28'},
      {"schedulename": "third schedule", "id": 110, "numweeks": 13, "firstdate": '2021-09-05'}
    ];
    //scheduleList = [];
    
    // end of temp ------------

    return this._success('query succeeded', scheduleList);    
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _success(details, data) {
    return {
      "success":  true,
      "details": details,
      "data": data
    }
  }
  
  _failure(details, showNotice) {
    if (showNotice) this.config.callbackSetNotice(details);
    console.log('ITipsDB._failure', details);
    
    return {
      "success":  false,
      "details": details,
      "data": null
    }
  }

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
