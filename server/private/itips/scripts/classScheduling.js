//-------------------------------------------------------------------
// Scheduling
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Scheduling {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.scheduleSelection = new SchedulingSelection({
      "container": this.config.container.getElementsByClassName('scheduling-selection-container')[0],
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackScheduleSelect": this._displayDetails
    });
    this.scheduleSelection.render();
    
    this.scheduleDetails = new SchedulingDetails({
      "container": this.config.container.getElementsByClassName('scheduling-detail-container')[0],
      "hideClass": this.config.hideClass,
      "db": this.config.db
    });
    this.scheduleDetails.render();
  }
  
  async update() {
    console.log('Scheduling.update');
    await this.scheduleSelection.update();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _displayDetails(scheduleInfo) {
    console.log('Scheduling._displayDetails', scheduleInfo);
    console.log('clear details');
    if (!scheduleInfo) return;
    console.log('display details for ' + scheduleInfo.id);
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
