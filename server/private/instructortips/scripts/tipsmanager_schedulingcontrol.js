//-----------------------------------------------------------------------------------
// TipManagerSchedulingControl class
//-----------------------------------------------------------------------------------
// TODO:
//-----------------------------------------------------------------------------------

class TipManagerSchedulingControl {
  constructor(params) {
    this._version = '0.01';
    
    this._HIDE_CLASS = 'schedulecontrol-hide';
    
    this._disableCallback = params.disableCallback;
    this._updateCallback = params.updateCallback;
    this._scheduleInfo = {};

    this._container = CreateElement.createDiv(null, 'schedulecontrol');
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  async render(notice) {
    this._notice = notice;
    
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
    
    this._container.appendChild(await this._buildUI());

    this._renderDialogs();    
        
    return this._container;
  }
  
  _renderDialogs() {
    this._addDialog = new DialogContainer({
      dialogtype: 'add-schedule',
      confirmcallback: (arg) => {this._finishAdd(arg)},
      cancelcallback: () => {this._cancelAdd()}
    });
    this._container.appendChild(this._addDialog.render());

    this._renameDialog = new DialogContainer({
      dialogtype: 'rename-schedule',
      confirmcallback: (arg) => {this._finishRename(arg)},
      cancelcallback: () => {this._cancelRename()}
    });
    this._container.appendChild(this._renameDialog.render());
    
    this._deleteDialog = new DialogContainer({
      dialogtype: 'delete-schedule',
      confirmcallback: (arg) => {this._finishDelete(arg)},
      cancelcallback: () => {this._cancelDelete()}
    });
    this._container.appendChild(this._deleteDialog.render());
  }

  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    this._showMainUI(makeVisible);
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
      this._addDialog.show(false);
      this._renameDialog.show(false);
      this._deleteDialog.show(false);
    }
  }
  
  state() {
    var elemSelect = this._container.getElementsByClassName('schedulecontrol-select')[0];
    var elemBrowse = this._container.getElementsByClassName('schedulecontrol-browse')[0];

    var currentState = {
      scheduleid: elemSelect.selectedIndex < 0 ? null : elemSelect.value,
      schedulename: elemSelect.selectedIndex < 0 ? "" : elemSelect.options[elemSelect.selectedIndex].text,      
      showbrowse: CreateElement.getSliderValue(elemBrowse)
    };
    
    return currentState;
  }
    
  async _buildUI() {
    var container = CreateElement.createDiv(null, 'schedulecontrol-ui');

    var scheduleList = [];
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'schedule-list', this._notice);
    if (queryResults.success) {
      scheduleList = queryResults.schedules;
    }
    
    var valueList = [];
    this._scheduleInfo = {};
    for (var i = 0; i < scheduleList.length; i++) {
      var sched = scheduleList[i];
      valueList.push({id: i, value: sched.scheduleid, textval: sched.schedulename});
      this._scheduleInfo[sched.scheduleid] = {
        schedulename: sched.schedulename,
        schedulelength: sched.schedulelength,
        schedulestartdate: sched.schedulestartdate
      };
    }    
    
    var subcontainer = CreateElement.createDiv(null, 'schedulecontrol-options notshown');
    container.appendChild(subcontainer);
    subcontainer.addEventListener('mouseover', (e) => {return this._optionsFlyout(true);});
    subcontainer.addEventListener('mouseout', (e) => {return this._optionsFlyout(false);});

    var iconcontainer = CreateElement.createDiv(null, 'schedulecontrol-iconcontainer notshown');
    subcontainer.appendChild(iconcontainer);
    
    iconcontainer.appendChild(CreateElement.createIcon(null, 'schedulecontrol-icon fas fa-cog', 'add/edit/delete schedule'));
    
    var subsubcontainer = CreateElement.createDiv(null, 'schedulecontrol-suboptions notshown');
    subcontainer.appendChild(subsubcontainer);

    handler = (e) => {return this._handleScheduleAdd(e);};
    subsubcontainer.appendChild(CreateElement.createIcon(null, 'schedulecontrol-icon subicon add far fa-plus-square', 'create new schedule', handler));
    
    handler = (e) => {return this._handleScheduleRename(e);};
    subsubcontainer.appendChild(CreateElement.createIcon(null, 'schedulecontrol-icon subicon edit fas fa-edit', 'edit the parameters for this schedule', handler));
    
    handler = (e) => {return this._handleScheduleDelete(e);};
    subsubcontainer.appendChild(CreateElement.createIcon(null, 'schedulecontrol-icon subicon delete far fa-trash-alt trash', 'delete this schedule', handler));
    
    var handler = (e) => {return this._handleScheduleSelect(e);};
    var elemSelect = CreateElement.createSelect(null, 'schedulecontrol-select select-css', handler, valueList);
    container.appendChild(elemSelect);
    
    container.appendChild(CreateElement.createSpan(null, 'schedulecontrol-selectmessage'));

    handler = (e) => {return this._handleBrowseTips(e);};   
    var elemBrowse = CreateElement.createSliderSwitch('browse tips', 'browse tips', 'schedulecontrol-browse', handler, false);
    elemBrowse.title = 'search and select from tip list';
    container.appendChild(elemBrowse);
    
    return container;
  } 
  
  async update() {
    var scheduleList = [];
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'schedule-list', this._notice);
    if (queryResults.success) {
      scheduleList = queryResults.schedules;
    }

    var valueList = [];
    this._scheduleInfo = {};
    for (var i = 0; i < scheduleList.length; i++) {
      var sched = scheduleList[i];
      valueList.push({id: i, value: sched.scheduleid, textval: sched.schedulename});
      this._scheduleInfo[sched.scheduleid] = {
        schedulename: sched.schedulename,
        schedulelength: sched.schedulelength,
        schedulestartdate: sched.schedulestartdate
      };
    }    
    
    var elemOldSelect = this._container.getElementsByClassName('schedulecontrol-select')[0];
    var handler = (e) => {return this._handleScheduleSelect(e);};
    var elemNewSelect = CreateElement.createSelect(null, 'schedulecontrol-select select-css', handler, valueList);
    elemOldSelect.parentNode.replaceChild(elemNewSelect, elemOldSelect);
    
    queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'controlstate-scheduling', this._notice);
    if (queryResults.success) {
      if (queryResults.controlstate.length > 0) {
        var state = JSON.parse(queryResults.controlstate[0].state);
        
        var elemSelect = this._container.getElementsByClassName('schedulecontrol-select')[0];
        elemSelect.value = -1;
        if (state.scheduleid != null) {
          elemSelect.value = state.scheduleid;
        }
        this._disableOptions(state.scheduleid == null);
        
        var elemBrowse = this._container.getElementsByClassName('schedulecontrol-browse')[0];
        CreateElement.setSliderValue(elemBrowse, state.scheduleid && state.showbrowse);
        elemBrowse.style.visibility = state.scheduleid ? 'visible' : 'hidden';
      }
      
      var elemSelectMessage = this._container.getElementsByClassName('schedulecontrol-selectmessage')[0];
      var msg = (valueList.length == 0 ? 'You currently have no schedules. You can use the gear icon to create one.' : '');
      elemSelectMessage.innerHTML = msg;
    }
  }
  
  _disableOptions(disable) {
    var elemOptionIcons = this._container.getElementsByClassName('schedulecontrol-suboptions')[0];
    var elemEdit = elemOptionIcons.getElementsByClassName('edit')[0];
    var elemDelete = elemOptionIcons.getElementsByClassName('delete')[0];
    
    if (elemEdit.classList.contains('disable')) elemEdit.classList.remove('disable');
    if (elemDelete.classList.contains('disable')) elemDelete.classList.remove('disable');
    if (disable) {
      elemEdit.classList.add('disable');
      elemDelete.classList.add('disable');
    }
  }
  
  async _saveState(stateToSave) {
    var elemBrowse = this._container.getElementsByClassName('schedulecontrol-browse')[0];
    elemBrowse.style.visibility = stateToSave.scheduleid ? 'visible' : 'hidden';
    
    this._disableOptions(stateToSave.scheduleid == null);

    await SQLDBInterface.doPostQuery('tipmanager/update', 'controlstate-scheduling', stateToSave, this._notice);
  }
  
  _showMainUI(makeVisible) {
    var mainUIContainer = this._container.getElementsByClassName('schedulecontrol-ui')[0];
    if (mainUIContainer.classList.contains(this._HIDE_CLASS)) {
      mainUIContainer.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      mainUIContainer.classList.add(this._HIDE_CLASS);
    }    
    
    this._disableCallback(!makeVisible);
  }
  
  //------------------------------------------
  // add, rename, delete schedule
  //------------------------------------------
  _startAdd() {
    this._showMainUI(false);
    this._addDialog.show(true);
    this._addDialog.update();
  }
  
  async _finishAdd(params) {
    var queryParams = {
      schedulename: params.schedulename, 
      schedulelength: params.schedulelength,
      schedulestartdate: params.schedulestart
    };
    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/insert', 'schedule', queryParams, this._notice);

    if (!queryResults.success) {
       if (queryResults.details.indexOf('duplicate schedule name') >= 0) {
        this._notice.setNotice('');
        alert('You already have a schedule with this name. Please try again with a different name');
      }

    } else {      
      var newState = this.state();
      newState.scheduleid = queryResults.data.scheduleid;
      newState.schedulename = params.schedulename;
      await this._saveState(newState);
      await this.update();
    }
    
    await this._updateCallback(true);
    this._showMainUI(true);  }
  
  _cancelAdd() {
    this._showMainUI(true);
  }
  
  _startRename() {
    if (this.state().scheduleid == null) return;
    this._showMainUI(false);
    
    var schedId = this.state().scheduleid;
    var sched = this._scheduleInfo[schedId];
    this._renameDialog.show(true);
    this._renameDialog.update({
      scheduleid: schedId,
      schedulename: this.state().schedulename,
      schedulelength: sched.schedulelength,
      schedulestartdate: sched.schedulestartdate
    });
  }
  
  async _finishRename(params) {
    var queryParams = {
      scheduleid: params.scheduleid,
      schedulename: params.schedulename,
      schedulestartdate: params.schedulestart
    };

    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/update', 'schedule', queryParams, this._notice);
    if (!queryResults.success) {
       if (queryResults.details.indexOf('duplicate schedule name') >= 0) {
        this._notice.setNotice('');
        alert('You already have a schedule with this name. Please try again with a different name');
      }
    }

    await this._updateCallback(true);
    this._showMainUI(true);
  }
  
  _cancelRename() {
    this._showMainUI(true);
  }
  
  _startDelete() {
    if (this.state().scheduleid == null) return;
    this._showMainUI(false);
    this._deleteDialog.update(this.state());
    this._deleteDialog.show(true);
  }
  
  async _finishDelete(params) {
    var queryParams = {scheduleid: params.scheduleid};
    var queryResult = await SQLDBInterface.doPostQuery('tipmanager/delete', 'schedule', queryParams, this._notice);
    if (!queryResult.success) return;
    
    var newState = this.state();
    newState.scheduleid = null;
    await this._saveState(newState);
    await this.update();    
    await this._updateCallback(true);
    this._showMainUI(true);
  }
  
  _cancelDelete() {
    this._showMainUI(true);
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleScheduleSelect(e) {
    await this._saveState(this.state());
    this._updateCallback(false);
  }
  
  _optionsFlyout(showContents) {
    var container = this._container.getElementsByClassName('schedulecontrol-options')[0];
    var iconcontainer = container.getElementsByClassName('schedulecontrol-iconcontainer')[0];
    var subcontainer = container.getElementsByClassName('schedulecontrol-suboptions')[0];
    
    if (showContents) {
      container.classList.remove('notshown');
      iconcontainer.classList.remove('notshown');
      subcontainer.classList.remove('notshown');
    } else {
      container.classList.add('notshown');
      iconcontainer.classList.add('notshown');
      subcontainer.classList.add('notshown');
    }
  }
  
  _handleScheduleAdd() {
    this._startAdd();
  }
  
  _handleScheduleRename() {
    this._startRename();
  }
  
  _handleScheduleDelete() {
    this._startDelete();
  }
  
  async _handleBrowseTips(e) {
    await this._saveState(this.state());
    this._updateCallback(false);
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------
  _showElement(elem, makeVisible, override) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
    
    if (override) {
      if (makeVisible) {
        elem.style.display = 'inline-block';
      } else {
        elem.style.display = 'none';
      }
    }
  }
}
