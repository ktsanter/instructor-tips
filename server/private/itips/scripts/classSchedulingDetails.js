//-------------------------------------------------------------------
// SchedulingDetails
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class SchedulingDetails {
  constructor(config) {
    this.config = config;
    this.scheduleId = null;
    this.editMode = false;
    this.tipBrowsing = false;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.subContainers = {
      "singleweek-editmode": this.config.container.getElementsByClassName('subcontainer single-week editmode')[0],
      "singleweek-noneditmode": this.config.container.getElementsByClassName('subcontainer single-week non-editmode')[0],
      "fullschedule-editmode": this.config.container.getElementsByClassName('subcontainer full-schedule editmode')[0],
      "fullschedule-noneditmode": this.config.container.getElementsByClassName('subcontainer full-schedule non-editmode')[0],
      "tipbrowsing-editmode": this.config.container.getElementsByClassName('subcontainer tip-browsing editmode')[0]
    };
    
    this.tipBrowsingInputs = {
      'full-schedule': this.config.container.getElementsByClassName('check-browse full-schedule')[0],
      'tip-browsing': this.config.container.getElementsByClassName('check-browse tip-browsing')[0]
    };
    
    for (var key in this.tipBrowsingInputs) {
      console.log(key);
      this.tipBrowsingInputs[key].addEventListener('click', (e) => { this._handleTipBrowseInput(e); });
    }
  }
  
  setEditMode(params) {
    this.editMode = params.editMode;
    this.update();
  }
  
  setSchedule(scheduleId) {
    this.scheduleId = scheduleId;
    this.update();
  }
  
  async update() {
    var scheduleData = await this.config.db.getScheduleData(this.scheduleId);
    if (!scheduleData) return;
    //console.log('scheduleData', scheduleData);
    
    this.setContainerVisibility();
    this._setTipBrowsingInputs();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  setContainerVisibility() {
    var showClass = 'editmode';
    if (!this.editMode) showClass = 'non-editmode';
    
    for (var key in this.subContainers) {
      var subContainer = this.subContainers[key];
      var showContainer = subContainer.classList.contains(showClass);
      
      if (showContainer && key == 'fullschedule-editmode') showContainer = !this.tipBrowsing
      if (showContainer && key == 'tipbrowsing-editmode') showContainer = this.tipBrowsing;
      
      UtilityKTS.setClass(subContainer, this.config.hideClass, !showContainer);
    }
  }
  
  _setTipBrowsingInputs() {
    for (var key in this.tipBrowsingInputs) {
      this.tipBrowsingInputs[key].checked = this.tipBrowsing;
    }    
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleTipBrowseInput(e) {
    this.tipBrowsing = e.target.checked;
    this.update();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
