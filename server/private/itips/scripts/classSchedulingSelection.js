//-------------------------------------------------------------------
// SchedulingSelection
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class SchedulingSelection {
  constructor(config) {
    this.config = config;
    this.scheduleList = [];
    this.selectedSchedule = null;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.inputSelect = this.config.container.getElementsByClassName('scheduling-select')[0];
    this.inputSelect.addEventListener('change', (e) => { this._handleScheduleSelect(e); });
    
    this.controlsContainer = this.config.container.getElementsByClassName('scheduling-selection-controls')[0];
    this.controlMain = this.controlsContainer.getElementsByClassName('main-control')[0]
    this.controlAdd = this.controlsContainer.getElementsByClassName('add-control')[0];
    this.controlEdit = this.controlsContainer.getElementsByClassName('edit-control')[0]
    this.controlDelete = this.controlsContainer.getElementsByClassName('delete-control')[0];
    
    this.controlMain.addEventListener('click', (e) => { this._handleMainControl(e); });
    this.controlAdd.addEventListener('click', (e) => { this._handleAdd(e); });
    this.controlEdit.addEventListener('click', (e) => { this._handleEdit(e); });
    this.controlDelete.addEventListener('click', (e) => { this._handleDelete(e); });

    this.controlEditMode = this.config.container.getElementsByClassName('schedule-editingmode')[0];
    this.controlEditMode.addEventListener('click', (e) => { this._handleScheduleEditMode(e); });
  }
  
  async update(initialScheduleId) {
    if (initialScheduleId && initialScheduleId >= 0) this.selectedSchedule.scheduleid = initialScheduleId;
    if (initialScheduleId && initialScheduleId == 0) this.selectedSchedule = null;
    
    this.config.callbackConfigureOption({"configureType": 'force-close'});
    
    UtilityKTS.removeChildren(this.inputSelect);

    var scheduleList = await this.config.db.getScheduleList();
    if (!scheduleList) return;
    this.scheduleList = scheduleList;
    
    UtilityKTS.setClass(this.controlsContainer, 'collapsed', true);
    
    UtilityKTS.removeChildren(this.inputSelect);
    var selectedItem = null;
    for (var i = 0; i < scheduleList.length; i++) {
      var item = scheduleList[i];
      
      var elemOption = CreateElement._createElement('option', null, 'schedule-item');
      elemOption.value = item.scheduleid;
      elemOption.innerHTML = item.schedulename;
      elemOption.setAttribute("scheduleInfo", JSON.stringify(item));
      
      elemOption.selected = (this.selectedSchedule && this.selectedSchedule.scheduleid == item.scheduleid);
      if (elemOption.selected) selectedItem = item; 
      
      this.inputSelect.appendChild(elemOption);
    }
    
    if (!selectedItem && scheduleList.length > 0) selectedItem = scheduleList[0];
    
    if (!selectedItem) return;
    
    await this._doSelection(selectedItem);
  }
  
  getSelectedSchedule() {
    return this.selectedSchedule;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------  
  async _doSelection(scheduleInfo) {
    console.log('_doSelection', scheduleInfo);
    
    this.selectedSchedule = scheduleInfo;
    await this.config.callbackScheduleSelect(this.selectedSchedule.scheduleid, this.config.db);
  }
  
  _getSelectedScheduleInfo() {
    if (this.inputSelect.selectedIndex < 0) return null;
    
    var selectedOption = this.inputSelect[this.inputSelect.selectedIndex];
    var scheduleInfo = JSON.parse(selectedOption.getAttribute('scheduleInfo'));
    
    return scheduleInfo;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleScheduleSelect(e) {
    this._doSelection(this._getSelectedScheduleInfo());
  }
  
  _handleMainControl(e) {
    var collapse = !this.controlsContainer.classList.contains('collapsed');
    UtilityKTS.setClass(this.controlsContainer, 'collapsed', collapse);

    if (!collapse) {
      var noSchedules = (this.scheduleList.length == 0);
      UtilityKTS.setClass(this.controlEdit, 'disable-me', noSchedules);
      UtilityKTS.setClass(this.controlDelete, 'disable-me', noSchedules);
    }
  }
  
  _handleAdd(e) {
    if (e.target.classList.contains('disable-me')) return;
    this.config.callbackConfigureOption({
      "configureType": 'add',
      "scheduleInfo": null,
      "callbackCompletion": (params) => { this.update; }
    });
  }
  
  _handleEdit(e) {
    if (e.target.classList.contains('disable-me')) return;
    this.config.callbackConfigureOption({
      "configureType": 'edit',
      "scheduleInfo": this._getSelectedScheduleInfo(),
      "callbackCompletion": this.update
    });
  }
  
  _handleDelete(e) {
    if (e.target.classList.contains('disable-me')) return;
    this.config.callbackConfigureOption({
      "configureType": 'delete',
      "scheduleInfo": this._getSelectedScheduleInfo(),
      "callbackCompletion": this.update
    });
  }
  
  _handleScheduleEditMode(e) {
    if (e.target.classList.contains('disable-me')) return;
    this.config.callbackSetEditMode({
      "editMode": e.target.checked
    });
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
