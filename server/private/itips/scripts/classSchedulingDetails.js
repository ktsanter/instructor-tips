//-------------------------------------------------------------------
// SchedulingDetails
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class SchedulingDetails {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {}
  
  async update(scheduleId, db) {
    var scheduleData = await db.getScheduleData(scheduleId);
    if (!scheduleData) return;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  
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
