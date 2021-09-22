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
    var containerDetails = this.config.container.getElementsByClassName('scheduling-detail-container')[0];
    var containerConfigure = this.config.container.getElementsByClassName('scheduling-configure-container')[0];
    var containerSelection = this.config.container.getElementsByClassName('scheduling-selection-container')[0];
    
    this.scheduleDetails = new SchedulingDetails({
      "container": containerDetails,
      "hideClass": this.config.hideClass,
      "db": this.config.db
    });
    this.scheduleDetails.render();
    
    this.scheduleConfigure = new SchedulingConfigure({
      "container": containerConfigure,
      "otherContainers": [containerSelection, containerDetails],
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackScheduleChange": (params) => { this._scheduleChange(params); }
    });      
    this.scheduleConfigure.render();  

    this.scheduleSelection = new SchedulingSelection({
      "container": containerSelection,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackScheduleSelect": (scheduleId) => { this.scheduleDetails.setSchedule(scheduleId); },
      "callbackConfigureOption": (params) => { this.scheduleConfigure.beginConfigureOption(params); },
      "callbackSetEditMode": (params) => { this.scheduleDetails.setEditMode(params); }
    });
    this.scheduleSelection.render();  
  }
  
  async update() {
    await this.scheduleSelection.update();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _scheduleChange(params) {
    console.log('Scheduling._scheduleChange', params);
    if (!params) return;
    
    if (params.configureType == 'add' || params.configureType == 'edit') {
      this.scheduleSelection.update(params.scheduleid);
    } else {
      this.scheduleSelection.update(-1);
    }
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
