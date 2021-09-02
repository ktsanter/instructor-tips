//-------------------------------------------------------------------
// EventEditor class (for End date manager)
//-------------------------------------------------------------------
// TODO: styling
//-------------------------------------------------------------------
class EventEditor {
  constructor(config) {
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
    this.tableBody = this._config.eventContainer.getElementsByTagName('tbody')[0];
    
    this._config.eventContainer.getElementsByClassName('header-student')[0].getElementsByTagName('span')[0].addEventListener('click', (e) => { this._handleResort('student'); });
    this._config.eventContainer.getElementsByClassName('header-section')[0].getElementsByTagName('span')[0].addEventListener('click', (e) => { this._handleResort('section'); });
    this._config.eventContainer.getElementsByClassName('header-enddate')[0].getElementsByTagName('span')[0].addEventListener('click', (e) => { this._handleResort('enddate'); });
    //this._config.eventContainer.getElementsByClassName('header-term')[0].getElementsByTagName('span')[0].addEventListener('click', (e) => { this._handleResort('term'); });
    this._config.eventContainer.getElementsByClassName('header-control')[0].getElementsByTagName('span')[0].addEventListener('click', (e) => { this._handleResort('control'); });
    
    this._config.editorOkay.addEventListener('click', (e) => { this._handleEditEnd(true); });
    this._config.editorCancel.addEventListener('click', (e) => { this._handleEditEnd(false); });
    
    this.editorEventIndex = null;
    
    this.elemStudent = this._config.editorContainer.getElementsByClassName('input-student')[0];
    this.elemSection = this._config.editorContainer.getElementsByClassName('input-section')[0];
    this.elemEndDate = this._config.editorContainer.getElementsByClassName('input-enddate')[0];  
    this.elemNotes = this._config.editorContainer.getElementsByClassName('input-notes')[0];      
    this.elemEnrollmentEndDate = this._config.editorContainer.getElementsByClassName('input-enrollmentenddate')[0];
    
    this.filterControls = this._createFilterControls(['enddate', 'section', 'term']);
    this._attachFilterControls(this._config.eventContainer.getElementsByTagName('table')[0]);
  }
   
  update(eventList) {
    this.eventList = eventList;
    this._updateFilterControls();
    this._updateUI(eventList);
  }

  clear() {
    UtilityKTS.removeChildren(this.tableBody);
  }
    
  getEventList(params) {
    var list = [];
    
    for (var i = 0; i < this.eventList.length; i++) {
      var item = this.eventList[i];
      var include = false;
      
      if (!params) {
        include = true;
      } else if (params.queryType == 'eventid') {
        include = (params.eventid == item.eventid);
      } else if (params.queryType == 'enddate') {
        include = (params.enddate == item.enddate);
      }

      if (include) list.push(item)
    }
    
    return list;
  }
  
  clearFilters() {
    for (var key in this.filterControls) this.filterControls[key].clearFilter();
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods - rendering
  //--------------------------------------------------------------
  _updateFilterControls() {
    var valueSets = {};

    // build value set for each filer control
    for (var fieldName in this.filterControls) {
      valueSets[fieldName] = new Set();
    }
    
    for (var i = 0; i < this.eventList.length; i++) {
      var eventItem = this.eventList[i];
      for (var key in eventItem) {
        if (valueSets.hasOwnProperty(key)) {
          valueSets[key].add(eventItem[key]);
        }
      }
    }
    
    // update filter controls
    for (var key in this.filterControls) {
      this.filterControls[key].update(valueSets[key]);
    }    
  }
  
  _updateUI() {
    var displayedEventList = this._filterAndSortEvents(this.eventList);
    UtilityKTS.removeChildren(this.tableBody);
    
    for (var i = 0; i < displayedEventList.length; i++) {
      var item = displayedEventList[i];
      this.tableBody.appendChild(this._renderTableRow(item.eventListIndex, item));
    }  

    this._show('eventlist', true);
    this._show('editor', false);
    this._config.callbackClearFiltersVisibility(this._shouldClearFilterBeVisible());
  }
  
  _filterAndSortEvents(eventList) {
    var augmentedEventList = [];
    for (var i = 0; i < eventList.length; i++) {
      augmentedEventList.push({...{"eventListIndex": i}, ...eventList[i]});
    }
    
    var activeFilters = {};
    for (var fieldName in this.filterControls) {
      activeFilters[fieldName] = {"filterType": 'in', "filterValue": this.filterControls[fieldName].getFilterSettings()};
    }

    var filtered = augmentedEventList.filter(function(a) {
      var result = true;

      for (var fieldName in activeFilters) {
        var filter = activeFilters[fieldName];
        var fieldVal = a[fieldName].toString().toLowerCase();
        var filterVal = filter.filterValue.toString().toLowerCase();
        
        if (filter.filterType == 'like') {
          if (filterVal.length > 0) {
            result = result && fieldVal.includes(filterVal);
          }
          
        } else if (filter.filterType == 'in') {
          result = result && filterVal.includes(fieldVal);
        }
      }
      
      return result;
    });
    
    var sortBy = this.sortBy;
    var sortDirection = this.sortDirection;
    var sorted = filtered.sort(function(a, b) {
      var result;
      if (sortBy == 'control') {
        result = -1 * sortDirection * a.override.toString().localeCompare(b.override.toString());
        
      } else {
        result = sortDirection * a[sortBy].localeCompare(b[sortBy]);
      }
      
      if (result == 0) {
        result = a.student.localeCompare(b.student); 
        if (result == 0) {
          result = a.term.localeCompare(b.term);
          if (result == 0) {
            result = a.section.localeCompare(b.section);
          }
        }        
      }
      
      return result;
    });
    
    return sorted;
    
  }
  
  _renderTableRow(eventDataIndex, eventData) {
    var elemRow = CreateElement._createElement('tr', null, this.rowClassList);
    
    elemRow.eventDataIndex = eventDataIndex;
    var studentCell = this._rendeDataCell(eventData.student);
    elemRow.appendChild(studentCell);
    studentCell.classList.add('student-cell');
    studentCell.title = 'add/edit override';
    studentCell.addEventListener('click', (e) => { this._editItem(e); });
    
    elemRow.appendChild(this._rendeDataCell(eventData.enddate, eventData.override));
    elemRow.appendChild(this._rendeDataCell(eventData.section));
    //elemRow.appendChild(this._rendeDataCell(eventData.term));
    elemRow.appendChild(this._renderControlCell(eventData));
    
    return elemRow;
  }
  
  _rendeDataCell(columnData, markAsAlert) {
    var elemCell = CreateElement._createElement('td', null, this.datacellClassList);
    var html = columnData;
    
    elemCell.innerHTML = html;
    
    return elemCell;
  }

  _renderControlCell(eventData) {
    var elemCell = CreateElement._createElement('td', null, null);
    
    if (eventData.override) {
      var icon = CreateElement.createIcon(null, this.clearIconClassList, null);
      icon.title = 'clear override';
      icon.addEventListener('click', (e) => { this._clearItem(e); });
      elemCell.appendChild(icon);
    }
    
    return elemCell;
  }
  
  _createFilterControls(filterFields) {
    var controls = {};
    for (var i = 0; i < filterFields.length; i++) {
      var fieldName = filterFields[i];
      controls[fieldName] = new FilterControl({
        "fieldName": fieldName,
        "valueSet": new Set(),
        "callbackIconClick": (callingFilter) => { this._callbackFilterOpen(callingFilter, this.filterControls); },
        "callbackSelectChange": (params) => { this._callbackFilterChange(params); this._updateUI(); }
      });
      
      controls[fieldName].render();
    }
    
    return controls;    
  }
  
  _attachFilterControls(table) {
    var headerNodes = table.getElementsByTagName('thead')[0].getElementsByTagName('th');
    for (var i = 0; i < headerNodes.length; i++) {
      var node = headerNodes[i];
      var fieldName = node.getAttribute('field-name');
      if (this.filterControls.hasOwnProperty(fieldName)) {
        this.filterControls[fieldName].attachTo(node, true);
      }
    }    
  }
  
  //--------------------------------------------------------------
  // private methods - updating
  //--------------------------------------------------------------
  async _removeOverride(eventIndex) {
    var eventData = this.eventList[eventIndex];
    
    await this._config.callbackEventChange({action: 'delete', data: eventData});
  }
  
  _beginEventEditing(eventIndex) {
    this._config.callbackModeChange('editing');
    
    this._setCalendarLimits();
    
    this.editorEventIndex = eventIndex;
    this._loadEventDataIntoEditor(this.eventList[this.editorEventIndex]);
    
    this._show('eventlist', false);
    this._show('editor', true);
  }
  
  async _endEventEditing(okay) {
    this._show('eventlist', true);
    this._show('editor', false);

    if (okay) {
      var editedData = this._getEventDataFromEditor();
      var eventData = this.eventList[this.editorEventIndex];

      var currentEndDate = eventData.enddate;
      var enrollmentEndDate = eventData.enrollmentenddate;

      var changeAction = eventData.override ? 'update' : 'add';
      eventData.override = true;
      eventData.enddate = editedData.enddate;
      eventData.currentenddate = currentEndDate;
      eventData.enrollmentenddate = enrollmentEndDate;
      eventData.notes = editedData.notes;

      await this._config.callbackEventChange({action: changeAction, data: eventData});
    }
        
    this._config.callbackModeChange('not editing');
  }
  
  _setCalendarLimits() {
    var now = new Date();
    var minDate = new Date();
    var maxDate = new Date();
    
    minDate.setDate(now.getDate() + 1);
    maxDate.setDate(now.getDate() + 365);
    
    this.elemEndDate.min = minDate.toISOString().slice(0,10);
    this.elemEndDate.max = maxDate.toISOString().slice(0,10);
  }
  
  _loadEventDataIntoEditor(eventData) {
    this.elemStudent.value = eventData.student;
//    this.elemSection.value = eventData.term + ', ' + eventData.section;
    this.elemSection.value = eventData.section;
    this.elemEndDate.value = eventData.enddate;
    this.elemNotes.value = decodeURIComponent(eventData.notes);
    this.elemEnrollmentEndDate.value = eventData.enrollmentenddate;
  }
  
  _getEventDataFromEditor() {
    return {
      enddate: this.elemEndDate.value,
      notes: encodeURIComponent(this.elemNotes.value)
    };
  }

  _shouldClearFilterBeVisible() {
    var noFilters = true;
    
    for (var key in this.filterControls) {
      if (!noFilters) break;
      noFilters = this.filterControls[key].allChecked();
    }
    
    return !noFilters;
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  _callbackFilterChange(params) {
    // handled by _updateUI
  }
  
  _callbackFilterOpen(callingFilter, filterControls) {
    for (var key in filterControls) filterControls[key].closeFilter();
    callingFilter.openFilter();
  }
      
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------  
  _clearItem(e) {
    var row = this._upsearchForRow(e.target);
    if (!row) return;
    
    this._removeOverride(row.eventDataIndex);    
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
    
    this._updateUI();
  }
  
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
