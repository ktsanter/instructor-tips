//-------------------------------------------------------------------
// SchedulingDetails
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class SchedulingDetails {
  constructor(config) {
    this.config = config;
    
    this.editMode = false;
    this.tipBrowsing = true;

    this.scheduleId = null;
    this.scheduleData = null;    
    this.weekIndex = 0;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async render() {
    this.subContainers = {
      "singleweek-editmode": this.config.container.getElementsByClassName('subcontainer single-week editmode')[0],
      "singleweek-noneditmode": this.config.container.getElementsByClassName('subcontainer single-week non-editmode')[0],
      "fullschedule-editmode": this.config.container.getElementsByClassName('subcontainer full-schedule editmode')[0],
      "fullschedule-noneditmode": this.config.container.getElementsByClassName('subcontainer full-schedule non-editmode')[0],
      "tipbrowsing-editmode": this.config.container.getElementsByClassName('subcontainer tip-browsing editmode')[0]
    };
    
    this._renderViewModeInputs();
    await this._renderTipBrowser();
    this._setContainerVisibility(true);
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
      if (params.value >= 0 && params.value <= this.scheduleData.schedulelength - 1) {
        this.weekIndex = params.value;
        success = true;
      }        
      
    } else if (params.action == 'next') {
      if (this.weekIndex < this.scheduleData.schedulelength - 1) {
        this.weekIndex++;
        success = true;
      }
      
    } else if (params.action == 'previous') {
      if (this.weekIndex > 0) {
        this.weekIndex --;
        success = true;
      }
      
    } else if (params.action == 'current') {
      this.weekIndex = this._getCurrentWeekIndex(this.scheduleData.schedulelength, this.scheduleData.schedulestart);
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
  _renderViewModeInputs() {
    this.viewModeInputs = {
      'fs-full-schedule': this.config.container.getElementsByClassName('viewmodecontrol-fullschedule fullschedule')[0],
      'tb-full-schedule': this.config.container.getElementsByClassName('viewmodecontrol-tipbrowsing fullschedule')[0],
      'fs-tip-browsing': this.config.container.getElementsByClassName('viewmodecontrol-fullschedule tipbrowsing')[0],
      'tb-tip-browsing': this.config.container.getElementsByClassName('viewmodecontrol-tipbrowsing tipbrowsing')[0]
    };
    
    for (var key in this.viewModeInputs) {
      this.viewModeInputs[key].addEventListener('click', (e) => { this._handleViewModeControl(e); });
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

    this.subContainers["singleweek-editmode"].getElementsByClassName('weekwcontrol-icon icon-previous')[0].addEventListener(
      'click', (e) => { this._handleSingleWeekNavigation(e, "previous"); }
    );
    this.subContainers["singleweek-editmode"].getElementsByClassName('weekcontrol-current')[0].addEventListener(
      'click', (e) => { this._handleSingleWeekNavigation(e, "current"); }
    );
    this.subContainers["singleweek-editmode"].getElementsByClassName('weekwcontrol-icon icon-next')[0].addEventListener(
      'click', (e) => { this._handleSingleWeekNavigation(e, "next"); }
    );
    
    this.subContainers["fullschedule-noneditmode"].getElementsByClassName('check-full-schedule')[0].addEventListener(
      'click', (e) => { this._handleFullScheduleHide(e); }
    );
  }
  
  async _renderTipBrowser() {
    this.tipListBody = this.config.container.getElementsByClassName('tiplist-body')[0];
    this.tipListTemplateRow = this.config.container.getElementsByClassName('tiplist-templaterow')[0];
    
    var elemAddNewTip = this.config.container.getElementsByClassName('subcontainer tip-browsing')[0].getElementsByClassName('icon-addtip')[0];
    
    this.tipSearch = new FilteredTipSearch({
      "db": this.config.db,
      "elemSearch": this.config.container.getElementsByClassName('input-search')[0],
      "elemTagContainer": this.config.container.getElementsByClassName('tagselect-container')[0],
      "callbackChange": () => { this._tipSearchChange(); },
      "callbackAddTip": {"elem": elemAddNewTip, "callback": () => { this._addNewTip(); }}
    });
    this.tipSearch.render();

    var tipListHead = this.config.container.getElementsByClassName('tiplist-head')[0];
    
    var containerEdit = this.config.container.getElementsByClassName('tipadd-container')[0];
    var containerTipBrowse = this.config.container.getElementsByClassName('subcontainer tip-browsing')[0];
    
    this.tipAddDialog = new TipsEditingEdit({
      "container": containerEdit,
      "otherContainers": [],
      "browseContainer": containerTipBrowse,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "idTinyElementAdd": 'tipeditorAdd_Browsing'
    });
    await this.tipAddDialog.render();    
  }
  
  async _fetchSchedule() {
    var scheduleData = await this.config.db.getScheduleData(this.scheduleId);
    if (!scheduleData) return false;
 
    this.scheduleData = scheduleData;
    return true;
  }
  
  async _updateWithoutFetch() {
    this._setContainerVisibility(false);
    this._setViewModeInputs();
    
    if (this.editMode) {
      this._updateSingleWeekEditing();

      if (this.tipBrowsing) {
        await this._updateTipBrowsing();
      } else {
        this._updateFullScheduleEditing();
      }

    } else {
      this._updateSingleWeekNonEditing();
      this._updateFullScheduleNonEditing();
    }
  }
  
  _setContainerVisibility(hideAll) {
    var showClass = 'editmode';
    if (!this.editMode) showClass = 'non-editmode';
    
    for (var key in this.subContainers) {
      var subContainer = this.subContainers[key];
      
      if (hideAll) {
        UtilityKTS.setClass(subContainer, this.config.hideClass, true);
        
      } else {
        var showContainer = subContainer.classList.contains(showClass);
        
        if (showContainer && key == 'fullschedule-editmode') showContainer = !this.tipBrowsing
        if (showContainer && key == 'tipbrowsing-editmode') showContainer = this.tipBrowsing;
        
        UtilityKTS.setClass(subContainer, this.config.hideClass, !showContainer);
      }
    }
  }
  
  _setViewModeInputs() {
    this.viewModeInputs['fs-full-schedule'].checked = !this.tipBrowsing;
    this.viewModeInputs['fs-tip-browsing'].checked = this.tipBrowsing;
    this.viewModeInputs['tb-full-schedule'].checked = !this.tipBrowsing;
    this.viewModeInputs['tb-tip-browsing'].checked = this.tipBrowsing;
  }
  
  _updateSingleWeekNonEditing() {
    var weekData = this.scheduleData.tiplist[this.weekIndex];

    var subContainer = this.subContainers['singleweek-noneditmode'];
    var weekLabel = subContainer.getElementsByClassName('single-week-label')[0];
    var tipsContainer = subContainer.getElementsByClassName('single-week-tips')[0];
    var tipTemplate = subContainer.getElementsByClassName('single-week-tip')[0];

    var strWeekLabel = (this.weekIndex + 1) + ': ' +
      this._calculateWeekDate(this.scheduleData.schedulestart, this.weekIndex);
    weekLabel.innerHTML = strWeekLabel;
    
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
      elemTipCheck.addEventListener('click', (e) => { this._handleTipStateChange(e); });
      
      tipsContainer.appendChild(elemWeek);
    }
  }
  
  _updateSingleWeekEditing() {
    var weekData = this.scheduleData.tiplist[this.weekIndex];

    var subContainer = this.subContainers['singleweek-editmode'];
    var weekLabel = subContainer.getElementsByClassName('single-week-label')[0];
    var tipsContainer = subContainer.getElementsByClassName('single-week-tips')[0];
    var tipTemplate = subContainer.getElementsByClassName('single-week-tip')[0];

    var strWeekLabel = (this.weekIndex + 1) + ': ' +
      this._calculateWeekDate(this.scheduleData.schedulestart, this.weekIndex);
    weekLabel.innerHTML = strWeekLabel;
    
    UtilityKTS.removeChildren(tipsContainer);
    UtilityKTS.removeChildren(tipsContainer);
    for (var i = 0; i < weekData.length; i++) {
      var elemWeek = tipTemplate.cloneNode(true);
      UtilityKTS.setClass(elemWeek, 'template', false);
      UtilityKTS.setClass(elemWeek, this.config.hideClass, false);
      
      var tip = weekData[i];
      elemWeek.getElementsByClassName('single-week-tip-content')[0].innerHTML = tip.tipcontent;
      
      var weekAndTipInfo = {
        ...tip,
        ...{"weekindex": this.weekIndex}
      };

      var elemUpControl = elemWeek.getElementsByClassName('tip-icon icon-moveup')[0];
      elemUpControl.setAttribute('tip-info', JSON.stringify(weekAndTipInfo));
      elemUpControl.addEventListener('click', (e) => { this._handleTipOrderChange(e, 'up'); });
      UtilityKTS.setClass(elemUpControl, 'invisible-me', i == 0);

      var elemRemoveControl = elemWeek.getElementsByClassName('tip-icon icon-remove')[0];
      elemRemoveControl.setAttribute('tip-info', JSON.stringify(weekAndTipInfo));
      elemRemoveControl.addEventListener('click', (e) => { this._handleRemoveTipFromWeek(e); });
      
      tipsContainer.appendChild(elemWeek);
    }
  }
  
  _updateFullScheduleNonEditing() {
    var subContainer = this.subContainers["fullschedule-noneditmode"];

    var scheduleContainer = subContainer.getElementsByClassName('full-schedule-weeks')[0];
    var showSchedule = subContainer.getElementsByClassName('check-full-schedule')[0].checked;
    UtilityKTS.setClass(scheduleContainer, this.config.hideClass, !showSchedule);
    if (!showSchedule) return;
    
    UtilityKTS.removeChildren(scheduleContainer);

    var weekTemplate = subContainer.getElementsByClassName('full-schedule-week')[0];
    var tipTemplate = subContainer.getElementsByClassName('full-schedule-tip')[0];
    
    for (var i = 0; i < this.scheduleData.schedulelength; i++) {
      var elemWeek = weekTemplate.cloneNode(true);
      UtilityKTS.setClass(elemWeek, 'template', false);
      UtilityKTS.setClass(elemWeek, this.config.hideClass, false);
      
      var weekDate = (i + 1) + ': ' + this._calculateWeekDate(this.scheduleData.schedulestart, i);
      var elemWeekLabel = elemWeek.getElementsByClassName('full-schedule-week-label')[0]
      elemWeekLabel.innerHTML = weekDate;
      elemWeekLabel.setAttribute('week-index', i);
      elemWeekLabel.addEventListener('click', (e) => { this._handleFullScheduleNavigation(e); });

      var weekData = this.scheduleData.tiplist[i];
      for (var j = 0; j < weekData.length; j++) {
        var tip = weekData[j];
        var elemTip = tipTemplate.cloneNode(true);
        UtilityKTS.setClass(elemTip, 'template', false);
        UtilityKTS.setClass(elemTip, this.config.hideClass, false);
        
        elemTip.getElementsByClassName('full-schedule-tip-content')[0].innerHTML = tip.tipcontent;
        
        var elemTipCheck = elemTip.getElementsByClassName('tip-check')[0];
        var weekAndTipInfo = {
          ...tip,
          ...{"weekindex": i}
        };
        elemTipCheck.checked = (tip.tipstate == 'checked');
        elemTipCheck.setAttribute('tip-info', JSON.stringify(weekAndTipInfo));
        elemTipCheck.addEventListener('click', (e) => { this._handleTipStateChange(e); });

        elemWeek.appendChild(elemTip);
      }
      
      scheduleContainer.appendChild(elemWeek);
    }      
  }
  
  _updateFullScheduleEditing() {
    var subContainer = this.subContainers["fullschedule-editmode"];

    var scheduleContainer = subContainer.getElementsByClassName('full-schedule-weeks')[0];    
    UtilityKTS.removeChildren(scheduleContainer);
    var weekTemplate = subContainer.getElementsByClassName('full-schedule-week')[0];
    var tipTemplate = subContainer.getElementsByClassName('full-schedule-tip')[0];
    
    for (var i = 0; i < this.scheduleData.schedulelength; i++) {
      var elemWeek = weekTemplate.cloneNode(true);
      UtilityKTS.setClass(elemWeek, 'template', false);
      UtilityKTS.setClass(elemWeek, this.config.hideClass, false);
      
      var weekDate = (i + 1) + ': ' + this._calculateWeekDate(this.scheduleData.schedulestart, i);
      var elemWeekLabel = elemWeek.getElementsByClassName('full-schedule-week-label')[0]
      elemWeekLabel.innerHTML = weekDate;
      elemWeekLabel.setAttribute('week-index', i);
      elemWeekLabel.addEventListener('click', (e) => { this._handleFullScheduleNavigation(e); });
      
      var elemWeekInsert = elemWeek.getElementsByClassName('icon-insert')[0];
      elemWeekInsert.setAttribute('week-index', i);
      elemWeekInsert.addEventListener('click', (e) => { this._handleWeekInsert(e); });
      
      var elemWeekRemove = elemWeek.getElementsByClassName('icon-remove')[0];
      elemWeekRemove.setAttribute('week-index', i);
      elemWeekRemove.addEventListener('click', (e) => { this._handleWeekRemove(e); });

      var weekData = this.scheduleData.tiplist[i];
      for (var j = 0; j < weekData.length; j++) {
        var tip = weekData[j];
        var elemTip = tipTemplate.cloneNode(true);
        UtilityKTS.setClass(elemTip, 'template', false);
        UtilityKTS.setClass(elemTip, this.config.hideClass, false);
        
        elemTip.getElementsByClassName('full-schedule-tip-content')[0].innerHTML = tip.tipcontent;

        elemWeek.appendChild(elemTip);
      }
      
      scheduleContainer.appendChild(elemWeek);
    }      
  }
  
  async _updateTipBrowsing() {
    await this.tipSearch.update();
    this._updateTipBrowsingTable();    
  }  
  
  _updateTipBrowsingTable() {
    UtilityKTS.removeChildren(this.tipListBody);
    var tipList = this.tipSearch.selectedTips().sort(function(a,b) {
      return a.tipcontent.toLowerCase().localeCompare(b.tipcontent.toLowerCase());
    });
    
    for (var i = 0; i < tipList.length; i++) {
      var tip = tipList[i];
      var tipRow = this.tipListTemplateRow.cloneNode(true);
      UtilityKTS.setClass(tipRow, 'templaterow', false);
      
      var addControl = tipRow.getElementsByClassName('tiplist-add')[0];
      addControl.setAttribute('tip-info', JSON.stringify(tip));
      addControl.addEventListener('click', (e) => { this._handleAddTipToWeek(e); });

      tipRow.getElementsByClassName('tiplist-content')[0].innerHTML = tip.tipcontent;
      
      this.tipListBody.appendChild(tipRow);    }
  }
  
  _getCurrentWeekIndex(scheduleLength, scheduleStart) {
    var weekIndex = 0;
    
    var strNowDate = this._formatShortDate(new Date());
    var strFirstDate = this._formatShortDate(this._addDays(new Date(scheduleStart), 1));
    var strLastDate = this._formatShortDate(this._addDays(new Date(strFirstDate), 7 * scheduleLength - 1));
     
    var strLastDayInWeek = this._formatShortDate(this._addDays(new Date(strFirstDate), 6));
    
    for (var weekIndex = 0; weekIndex < scheduleLength - 1; weekIndex++) {
      if (strNowDate <= strLastDayInWeek) break;
      strLastDayInWeek = this._formatShortDate(this._addDays(new Date(strLastDayInWeek), 7));
    }
    
    return weekIndex;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleViewModeControl(e) {
    this.tipBrowsing = e.target.classList.contains('tipbrowsing');
    this._updateWithoutFetch();
  }
  
  _handleSingleWeekNavigation(e, action) {
    if (this.setWeek({"action": action})) {
      this._updateWithoutFetch();
    };
  }
  
  _handleFullScheduleHide(e) {
    this._updateWithoutFetch();
  }
  
  _handleFullScheduleNavigation(e) {
    var weekIndex = e.target.getAttribute('week-index');
    if (this.setWeek({"action": 'index', "value": weekIndex * 1})) {
      this._updateWithoutFetch();
    }
  }

  async _handleWeekInsert(e) {
    var weekIndex = e.target.getAttribute('week-index');
    
    var success = await this.config.db.insertWeekIntoSchedule({ 
      "scheduleid": this.scheduleId,
      "action": "after", 
      "weekindex": weekIndex 
    });
    
    if (success) {
      this.update();
    }
  }

  async _handleWeekRemove(e) {
    var weekIndex = e.target.getAttribute('week-index');
    
    var success = await this.config.db.removeWeekFromSchedule({ 
      "scheduleid": this.scheduleId,
      "action": "after", 
      "weekindex": weekIndex 
    });
    
    if (success) {
      this.update();
    }
  }
  
  async _handleAddTipToWeek(e) {
    var tipInfo = JSON.parse(e.target.getAttribute('tip-info'));
    
    var success = await this.config.db.addTipToWeek({ 
      "scheduleid": this.scheduleId, 
      "weekindex": this.weekIndex, 
      "tipid": tipInfo.tipid
    });
    if (success) {
      this.update();
    }
  }

  async _handleRemoveTipFromWeek(e) {
    var tipInfo = JSON.parse(e.target.getAttribute('tip-info'));
    
    var success = await this.config.db.removeTipFromWeek({ 
      "scheduleid": this.scheduleId, 
      "weekindex": this.weekIndex, 
      "tipid": tipInfo.tipid
    });
    if (success) {
      this.update();
    }
  }

  async _handleTipStateChange(e) {
    var tipInfo = JSON.parse(e.target.getAttribute('tip-info'));
    
    var success = await this.config.db.changeTipState({ 
      "scheduleid": this.scheduleId,
      "weekindex": tipInfo.weekindex,
      "tipid": tipInfo.tipid, 
      "value": e.target.checked 
    });
    if (success) {
      this.update();
    }
  }
  
  async _handleTipOrderChange(e, direction) {
    var tipInfo = JSON.parse(e.target.getAttribute('tip-info'));

    var success = await this.config.db.changeTipOrderInSchedule({ 
      "scheduleid": this.scheduleId,
      "weekindex": this.weekIndex,
      "tipid": tipInfo.tipid, 
      "direction": direction
    });
    if (success) {
      this.update();
    }
  }
    
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------
  _tipSearchChange() {
    this._updateTipBrowsingTable();
  }
  
  _addNewTip() {
    this.tipAddDialog.beginEditOption({
      "editType": 'add',
      "tipInfo": null,
      "callbackCompletion": () => { this.update(); }
    });
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _calculateWeekDate(scheduleStart, weekIndex) {   
    var weekDate = this._addDays( new Date(scheduleStart), weekIndex * 7 + 1);

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
