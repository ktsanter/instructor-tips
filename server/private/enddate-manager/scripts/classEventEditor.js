//-------------------------------------------------------------------
// EventEditor class (for End date manager)
//-------------------------------------------------------------------
// TODO: styling
//-------------------------------------------------------------------
class EventEditor {
  constructor(config) {
    console.log('EventEditor.constructor');
    this._config = config;  
    
    this.rowClassList = 'eventlist-row';
    this.datacellClassList = 'eventlist-datacell';
    this.controlcellClassList = 'eventlist-controlcell';
    
    this.alertIconClassList = 'event-icon event-alerticon fas fa-exclamation-circle';
    this.editIconClassList = 'event-icon event-editicon fas fa-pencil-alt';
    this.clearIconClassList = 'event-icon event-clearicon fas fa-cloud-sun';
    
    this.sortBy = 'student';
    this.sortDirection = 1;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------
  show(showMe) {
    _show('eventist', showMe);
    _show('editor', false);
  }
  
  render() { 
    console.log('EventEditor.render');
    this.tableBody = this._config.eventContainer.getElementsByTagName('tbody')[0];
    
    this._config.eventContainer.getElementsByClassName('header-student')[0].addEventListener('click', (e) => { this._handleResort('student'); });
    this._config.eventContainer.getElementsByClassName('header-section')[0].addEventListener('click', (e) => { this._handleResort('section'); });
    this._config.eventContainer.getElementsByClassName('header-enddate')[0].addEventListener('click', (e) => { this._handleResort('enddate'); });
    
    this._config.editorOkay.addEventListener('click', (e) => { this._handleEditEnd(true); });
    this._config.editorCancel.addEventListener('click', (e) => { this._handleEditEnd(false); });
    
    this.editorEventIndex = null;
    
    this.elemStudent = this._config.editorContainer.getElementsByClassName('input-student')[0];
    this.elemSection = this._config.editorContainer.getElementsByClassName('input-section')[0];
    this.elemEndDate = this._config.editorContainer.getElementsByClassName('input-enddate')[0];  
    this.elemNotes = this._config.editorContainer.getElementsByClassName('input-notes')[0];      
  }
   
  update(eventList) {
    console.log('EventEditor.update');
    
    this.eventList = this._sortEvents(eventList);
    UtilityKTS.removeChildren(this.tableBody);
    
    for (var i = 0; i < eventList.length; i++) {
      var item = eventList[i];
      //console.log(item);
      this.tableBody.appendChild(this._renderTableRow(i, item));
    }  

    this._show('eventlist', true);
    this._show('editor', false);
  }

  clear() {
    UtilityKTS.removeChildren(this.tableBody);
  }
    
  getEventList() {
    console.log('EventEditor.getEventList');
    
    return this.eventList;
  }
  
  //--------------------------------------------------------------
  // private methods - rendering
  //--------------------------------------------------------------
  _sortEvents(eventList) {
    console.log('_sortEvents');
    console.log(this.sortBy);
    console.log(eventList);
    
    var sortBy = this.sortBy;
    var sortDirection = this.sortDirection;
    
    var sorted = eventList.sort(function(a, b) {
      return sortDirection * a[sortBy].localeCompare(b[sortBy]);
    });
    
    return sorted;
    
  }
  
  _renderTableRow(eventDataIndex, eventData) {
    var elemRow = CreateElement._createElement('tr', null, this.rowClassList);
    
    elemRow.eventDataIndex = eventDataIndex;
    elemRow.appendChild(this._rendeDataCell(eventData.student));
    elemRow.appendChild(this._rendeDataCell(eventData.section));
    elemRow.appendChild(this._rendeDataCell(eventData.enddate, eventData.override));
    elemRow.appendChild(this._renderControlCell(eventData));
    
    return elemRow;
  }
  
  _rendeDataCell(columnData, markAsAlert) {
    var elemCell = CreateElement._createElement('td', null, this.datacellClassList);
    var html = columnData;
    
    /*
    if (markAsAlert) {
      var icon = CreateElement.createIcon(null, this.alertIconClassList, null);
      icon.title = 'has override';
      html += icon.outerHTML;
    }
    */
    elemCell.innerHTML = html;
    
    return elemCell;
  }

  _renderControlCell(eventData) {
    var elemCell = CreateElement._createElement('td', null, null);
    
    var icon = CreateElement.createIcon(null, this.editIconClassList, null);
    icon.title = 'add/edit override';
    icon.addEventListener('click', (e) => { this._editItem(e); });
    elemCell.appendChild(icon);
    
    if (eventData.override) {
      icon = CreateElement.createIcon(null, this.clearIconClassList, null);
      icon.title = 'clear override';
      icon.addEventListener('click', (e) => { this._clearItem(e); });
      elemCell.appendChild(icon);
    }
    
    return elemCell;
  }
  
  //--------------------------------------------------------------
  // private methods - updating
  //--------------------------------------------------------------
  _beginEventEditing(eventIndex) {
    console.log('_beginEventEditing');
    
    this.editorEventIndex = eventIndex;
    this._loadEventDataIntoEditor(this.eventList[this.editorEventIndex]);
    
    this._show('eventlist', false);
    this._show('editor', true);
  }
  
  _endEventEditing(okay) {
    console.log('_endEventEditing: ' + okay);
    if (okay) {
      var eventData = this.eventList[this.editorEventIndex];
      console.log(eventData);
    }
    
    this._show('eventlist', true);
    this._show('editor', false);
  }
  
  _loadEventDataIntoEditor(eventData) {
    this.elemStudent.value = eventData.student;
    this.elemSection.value = eventData.section;
    this.elemEndDate.value = eventData.enddate;
    this.elemNotes.value = eventData.notes;
    console.log('_loadEventDataIntoEditor');
    console.log(eventData);
  }
  
  _getEventDataFromEditor() {
    console.log('_getEventDataFromEditor');
    
    return 'abc';
  }
  
  /*
  _initiateRowEdit(clue) {
    this.clueBeingEdited = clue;
  
    this.elemPrompt.value = clue.prompt;
    this.elemResponse.value = clue.response;
    this.elemConfirmation.value = clue.confirmation;
    
    this.elemActionSelect.value = clue.action.type;
    this.elemActionSearchFor.value = clue.action.searchfor;
    this.elemActionURL.value = clue.action.target;
    this.elemActionEffectSelect.value = clue.action.effecttype;
    this.elemActionEffectMessage.value = clue.action.message;
    
    this.elemActionSelect.dispatchEvent(new Event("change"));

    this._config.callbackShowSaveReload(false);
    UtilityKTS.setClass(this.elemTableContainer, this._config.hideClass, true);
    UtilityKTS.setClass(this.elemEditContainer, this._config.hideClass, false);
  }
  
  _endRowEdit(saveChanges) {
    if (saveChanges) {
      var updatedClue = {...this.clueBeingEdited};

      updatedClue.prompt = this.elemPrompt.value;
      updatedClue.response = this.elemResponse.value;
      updatedClue.confirmation = this.elemConfirmation.value;
      
      updatedClue.action = {
        type: this.elemActionSelect.value,
        searchfor: this.elemActionSearchFor.value,
        target: this.elemActionURL.value,
        effecttype: this.elemActionEffectSelect.value,
        message: this.elemActionEffectMessage.value
      };

      this._updateTableRow(updatedClue);
      this._config.callbackClueChange();
    }
    
    this._config.callbackShowSaveReload(true);
    
    UtilityKTS.setClass(this.elemTableContainer, this._config.hideClass, false);
    UtilityKTS.setClass(this.elemEditContainer, this._config.hideClass, true);  
  }
  
  _updateTableRow(updatedClue) {
    var foundClueIndex = null;
    for (var i = 0; i < this.clueList.length && !foundClueIndex; i++) {
      if (this.clueList[i].clueid == updatedClue.clueid) foundClueIndex = i; 
    }

    if (foundClueIndex != null) {
      var updatedClueList = [...this.clueList];
      updatedClueList[foundClueIndex] = updatedClue;
      this.update(updatedClueList);
    }  
  }
  
  _addClue() {
    var updatedClueList = [...this.clueList];

    var clueNumber = updatedClueList.length + 1;
    var clueId = 'tempid' + clueNumber;

    updatedClueList.push({
      clueid: clueId,
      number: clueNumber,
      prompt: 'default prompt',
      response: 'default response',
      confirmation: 'default confirmation',
      action: {
        type: 'none',
        effecttype: '',
        target: '',
        message: '',
        searchfor: ''
      }
    });
      
    this.update(updatedClueList);
    this._config.callbackClueChange();    
    this._config.callbackShowSaveReload(true);      
  }
  
  _deleteClue(clue) {
    var clueIndex = clue.number - 1;
    var updatedClueList = [...this.clueList];
    updatedClueList.splice(clueIndex, 1);
    
    for (var i = 0; i < updatedClueList.length; i++) {
      updatedClueList[i].number = (i + 1);
    }
    
    this.update(updatedClueList);
    this._config.callbackClueChange();    
    this._config.callbackShowSaveReload(true);      
  }
  
  _moveClueUp(clue) {
    var clueIndex = clue.number - 1;
    
    this.clueList[clueIndex].number--;
    this.clueList[clueIndex - 1].number++;
    
    this.clueList = this.clueList.sort( function(a, b) {
      return (a.number - b.number);
    });
    
    this.update(this.clueList);
    this._config.callbackClueChange();    
    this._config.callbackShowSaveReload(true);     
  }
  */
      
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------  
  _clearItem(e) {
    var row = this._upsearchForRow(e.target);
    if (!row) return;
    
    var eventData = this.eventList[row.eventDataIndex];
    var original = eventData.original;
    eventData = original;
    eventData.original = original;
    this.eventList[row.eventDataIndex] = eventData;
    
    this.update(this.eventList);
  }
  
  _editItem(e) {  
    var row = this._upsearchForRow(e.target);
    if (!row) return;
    
    this._beginEventEditing(row.eventDataIndex);
  }
  
  _handleEditEnd(okay) {
    this._endEventEditing(okay);
  }
  
  _handleResort(sortBy) {
    if (sortBy == this.sortBy) {
      this.sortDirection *= -1;
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 1;
    }
    
    this.update(this.eventList);
  }

/*  
  _handleEditorChange(edit) {}
  
  _handleRowEditInitiation(e) {
    var target = e.target;
    while (!target.classList.contains('clues-table-row')) {
      target = target.parentNode;
    }

    this._initiateRowEdit({...target.clue});
  }
  
  _handleRowEditEnd(saveChanges) {
    this._endRowEdit(saveChanges);
  }
  
  _handleActionChange(e) {
    var action = this.elemActionSelect.value;
    UtilityKTS.setClass(this.elemActionSearchFor.parentNode, this._config.hideClass, action != 'google_search');
    UtilityKTS.setClass(this.elemActionURL.parentNode, this._config.hideClass, action != 'url');
    UtilityKTS.setClass(this.elemActionEffectSelect.parentNode, this._config.hideClass, action != 'effect');
    UtilityKTS.setClass(this.elemActionEffectMessage.parentNode, this._config.hideClass, action != 'effect');
  }

  _handleRowAdd(e) {
    this._addClue();
  }
  
  _handleRowControl(e, controlType) {
    var target = e.target;
    while (!target.classList.contains('clues-table-row')) {
      target = target.parentNode;
    }
    if (controlType == 'move') {
      this._moveClueUp(target.clue);
    } else {
      this._deleteClue(target.clue);
    }
  }
  */

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------        
  _upsearchForRow(startNode) {
    var row = null;
    
    var node = startNode;
    while(!row && node.parentNode != null) {
      if (node.nodeName == 'TR') {
        row = node;
      } else {
        node = node.parentNode;
      }
    }
    
    
    return row;
  }
  
  _show(containerName, showMe) {
    var container = this._config.eventContainer;
    if (containerName == 'editor') container = this._config.editorContainer;

    UtilityKTS.setClass(container, this._config.hideClass, !showMe);
  }  
}
