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
      'click', (e) => { this._handleSingleWeekNavigation(e, "previous"); }
    );
    this.subContainers["singleweek-noneditmode"].getElementsByClassName('weekcontrol-current')[0].addEventListener(
      'click', (e) => { this._handleSingleWeekNavigation(e, "current"); }
    );
    this.subContainers["singleweek-noneditmode"].getElementsByClassName('weekwcontrol-icon icon-next')[0].addEventListener(
      'click', (e) => { this._handleSingleWeekNavigation(e, "next"); }
    );
  }
  
  setEditMode(params) {
    this.editMode = params.editMode;
    this._updateWithoutFetch();
  }
  
  async setSchedule(scheduleId) {
    this.scheduleId = scheduleId;
    var fetchSuccess = await this._fetchSchedule();
    if (!fetchSuccess) return;
    
    this.setWeek({
      "action": 'index',
      "value": 0
    });
    
    this._updateWithoutFetch();
  }
  
  setWeek(params) {
    var success = false;
    
    if (params.action == 'index') {
      if (params.value >= 0 && params.value <= this.scheduleData.numweeks - 1) {
        this.weekIndex = params.value;
        success = true;
      }        
      
    } else if (params.action == 'next') {
      if (this.weekIndex < this.scheduleData.numweeks - 1) {
        this.weekIndex++;
        success = true;
      }
      
    } else if (params.action == 'previous') {
      if (this.weekIndex > 0) {
        this.weekIndex --;
        success = true;
      }
      
    } else if (params.action == 'current') {
      this.weekIndex = this._getCurrentWeekIndex(this.scheduleData.numweeks, this.scheduleData.firstdate);
      success = true;
    }
    
    return success;
  }
  
  async update() {
    var fetchSuccess = await this._fetchSchedule();
    if (!fetchSuccess) return;
    
    this._updateWithoutFetch();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------
  async _fetchSchedule() {
    var scheduleData = await this.config.db.getScheduleData(this.scheduleId);
    if (!scheduleData) return false;
 
    this.scheduleData = scheduleData;
    return true;
  }
  
  _updateWithoutFetch() {
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
    var weekData = this.scheduleData.tiplist[this.weekIndex];

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
      var weekAndTipInfo = {
        ...tip,
        ...{"weekindex": this.weekIndex}
      };
      elemTipCheck.setAttribute('tip-info', JSON.stringify(weekAndTipInfo));
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
  
  _getCurrentWeekIndex(numWeeks, firstDate) {
    var weekIndex = 0;
    
    var strNowDate = this._formatShortDate(new Date());
    var strFirstDate = this._formatShortDate(this._addDays(new Date(firstDate), 1));
    var strLastDate = this._formatShortDate(this._addDays(new Date(strFirstDate), 7 * numWeeks - 1));
     
    var strLastDayInWeek = this._formatShortDate(this._addDays(new Date(strFirstDate), 6));
    
    for (var weekIndex = 0; weekIndex < numWeeks - 1; weekIndex++) {
      if (strNowDate <= strLastDayInWeek) break;
      strLastDayInWeek = this._formatShortDate(this._addDays(new Date(strLastDayInWeek), 7));
    }
    
    return weekIndex;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleTipBrowseInput(e) {
    this.tipBrowsing = e.target.checked;
    this._updateWithoutFetch();
  }
  
  _handleSingleWeekNavigation(e, action) {
    if (this.setWeek({"action": action})) {
      this._updateWithoutFetch();
    };
  }
  
  _handleTipCheck(e) {
    var tipInfo = JSON.parse(e.target.getAttribute('tip-info'));
    console.log('_handleTipCheck', tipInfo.weekindex, tipInfo.tipid, e.target.checked);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _calculateWeekDate(firstDate, weekIndex) {   
    var weekDate = this._addDays( new Date(firstDate), weekIndex * 7 + 1);

    return this._formatShortDate(weekDate);
  }
  
  _formatShortDate(origDate) {
    var splitDate = origDate.toLocaleDateString("en-US").split('/');
    var formattedDate = 
      ('0000' + splitDate[2]).slice(-4) 
      + '-' + ('00' + splitDate[0]).slice(-2) 
      + '-' + ('00' + splitDate[1]).slice(-2);

    return formattedDate;
  }  
  
  _addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }  
}
