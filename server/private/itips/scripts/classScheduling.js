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
      "db": this.config.db
    });      
    this.scheduleConfigure.render();  

    this.scheduleSelection = new SchedulingSelection({
      "container": containerSelection,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackScheduleSelect": this.scheduleDetails.update,
      "callbackConfigureOption": (params) => { this.scheduleConfigure.beginConfigureOption(params); }
    });
    this.scheduleSelection.render();  
  }
  
  async update() {
    await this.scheduleSelection.update();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
