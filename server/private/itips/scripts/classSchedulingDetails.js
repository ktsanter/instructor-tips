//-------------------------------------------------------------------
// SchedulingDetails
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class SchedulingDetails {
  constructor(config) {
    this.config = config;
    
    this.editMode = false;
    this.tipBrowsing = false;

    this.scheduleId = null;
    this.scheduleData = null;    
    this.weekIndex = 0;
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
      this.tipBrowsingInputs[key].addEventListener('click', (e) => { this._handleTipBrowseInput(e); });
    }
    
    this.subContainers["singleweek-noneditmode"].getElementsByClassName('weekwcontrol-icon icon-previous')[0].addEventListener(
      'click', (e) => { this._handleSingleWeekNavigation(e, "singleweek-noneditmode", "previous"); }
    );
    this.subContainers["singleweek-noneditmode"].getElementsByClassName('weekcontrol-current')[0].addEventListener(
      'click', (e) => { this._handleSingleWeekNavigation(e, "singleweek-noneditmode", "current"); }
    );
    this.subContainers["singleweek-noneditmode"].getElementsByClassName('weekwcontrol-icon icon-next')[0].addEventListener(
      'click', (e) => { this._handleSingleWeekNavigation(e, "singleweek-noneditmode", "next"); }
    );
  }
  
  setEditMode(params) {
    this.editMode = params.editMode;
    this.update();
  }
  
  setSchedule(scheduleId) {
    this.scheduleId = scheduleId;
    this.weekIndex = 0;
    this.update();
  }
  
  async update() {
    console.log('SchedulingDetails.update', this.editMode, this.tipBrowsing);
    var scheduleData = await this.config.db.getScheduleData(this.scheduleId);
    if (!scheduleData) return;
    this.scheduleData = scheduleData;
    console.log(scheduleData);
    
    this.setContainerVisibility();
    this._setTipBrowsingInputs();
    
    if (this.editMode) {
      this._updateSingleWeekEditing();

      if (this.tipBrowsing) {
        this._updateTipBrowsing();
      } else {
        this._updateFullScheduleEditing();
      }

    } else {
      this._updateSingleWeekNonEditing();
      this._updateFullScheduleNonEditing();
    }
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
  
  _updateSingleWeekNonEditing() {
    console.log('SchedulingDetails._updateSingleWeekNonEditing');
    var weekData = this.scheduleData.tiplist[this.weekIndex];
    console.log(weekData);

    var subContainer = this.subContainers['singleweek-noneditmode'];
    var weekLabel = subContainer.getElementsByClassName('single-week-label')[0];
    var tipsContainer = subContainer.getElementsByClassName('single-week-tips')[0];
    var tipTemplate = subContainer.getElementsByClassName('single-week-tip')[0];

    weekLabel.innerHTML = this._calculateWeekDate(this.scheduleData.firstdate, this.weekIndex);
    
    UtilityKTS.removeChildren(tipsContainer);
    for (var i = 0; i < weekData.length; i++) {
      var elemWeek = tipTemplate.cloneNode(true);
      UtilityKTS.setClass(elemWeek, 'template', false);
      UtilityKTS.setClass(elemWeek, this.config.hideClass, false);
      
      var tip = weekData[i];
      elemWeek.getElementsByClassName('single-week-tip-content')[0].innerHTML = tip.tipcontent;
      elemWeek.getElementsByClassName('tip-check')[0].checked = (tip.tipstate == 'checked');
      
      var elemTipCheck = elemWeek.getElementsByClassName('tip-check')[0];
      elemTipCheck.setAttribute('tip-info', JSON.stringify(tip));
      elemTipCheck.addEventListener('click', (e) => { this._handleTipCheck(e); });
      
      tipsContainer.appendChild(elemWeek);
    }
  }
  
  _updateSingleWeekEditing() {
    console.log('SchedulingDetails._updateSingleWeekEditing');
  }
  
  _updateFullScheduleNonEditing() {
    console.log('SchedulingDetails._updateFullScheduleNonEditing');
  }
  
  _updateFullScheduleEditing() {
    console.log('SchedulingDetails._updateFullScheduleEditing');
  }
  
  _updateTipBrowsing() {
    console.log('SchedulingDetails._updateTipBrowsing');
  }  
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleTipBrowseInput(e) {
    this.tipBrowsing = e.target.checked;
    this.update();
  }
  
  _handleSingleWeekNavigation(e, subContainerLabel, action) {
    console.log('_handleSingleWeekNavigation', subContainerLabel, action);
  }
  
  _handleTipCheck(e) {
    var tipInfo = JSON.parse(e.target.getAttribute('tip-info'));
    console.log('_handleTipCheck', tipInfo.tipid, e.target.checked);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _calculateWeekDate(firstDate, weekIndex) {
    console.log('_calculateWeekDate', firstDate, weekIndex);
    return firstDate;
  }
}
