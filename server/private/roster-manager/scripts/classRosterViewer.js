//-------------------------------------------------------------------
// RosterViewer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class RosterViewer {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      currentInfo: null,
      editIconClasses: 'fas fa-edit',
      selectedStudentInfo: null,
      filtering: {
        "student": false,
        "iep": false,
        "504": false,
        "homeschooled": false
      },
      sorting: {
        "field": 'student', 
        "direction": 1
      }
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(updatedInfo) {
    this.settings.currentInfo = updatedInfo;
    if (this.settings.selectedStudentInfo) {
      if (!updatedInfo.studentList.includes(this.settings.selectedStudentInfo.student)) {
        this.settings.selectedStudentInfo = null;
      }
    }
    
    this._updateUI();
  }
    
  closeDialogs() {
    this._finishNoteEdit(false);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    UtilityKTS.setClass(this.config.container, 'hide-me', true);
    
    this.statusMessage = this.config.container.getElementsByClassName('status-message')[0];
    
    this.studentImages = this.config.container.getElementsByClassName('item-images')[0];
    this.studentImageIEP = this.studentImages.getElementsByClassName('item-image image-iep')[0];
    this.studentImage504 = this.studentImages.getElementsByClassName('item-image image-504')[0];
    this.studentIconHomeSchooled = this.config.container.getElementsByClassName('item-icon icon-homeschooled')[0];
    this.studentImageInfo = this.studentImages.getElementsByClassName('item-image image-info')[0];
    
    this.studentSelect = this.config.container.getElementsByClassName('student-select')[0];
    this.studentSelectInput = this.studentSelect.getElementsByClassName('student-filter')[0];
    
    this.rosterContent = this.config.container.getElementsByClassName('view-roster')[0];
    this.studentContent = this.config.container.getElementsByClassName('view-content')[0];
        
    this.studentSelectInput.addEventListener('input', (e) => { this._handleStudentFilterChange(e); });

    var noteButton = this.config.containerNoteEditor.getElementsByClassName('button-editor-okay')[0];
    noteButton.addEventListener('click', (e) => { this._finishNoteEdit(true); });
    
    noteButton = this.config.containerNoteEditor.getElementsByClassName('button-editor-cancel')[0];
    noteButton.addEventListener('click', (e) => { this._finishNoteEdit(false); });

    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, true);
  }

  _updateUI() {
    UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, true); 

    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, true);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, true);

    this._clearRosterTable();
    
    if (!this.settings.currentInfo || this.settings.currentInfo.studentList.length == 0) {
      this.statusMessage.innerHTML = 'no student data available';
      UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, false);

    } else {
      this._buildRosterTable();
      UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, false); 

      if (this.settings.selectedStudentInfo) this._selectStudent(this.settings.selectedStudentInfo.student);  
    }
    
    UtilityKTS.setClass(this.config.container, this.settings.hideClass, false);
    this._setNoteEditVisiblity(false);    
  }
  
  _clearRosterTable() {
    UtilityKTS.removeChildren(this.rosterContent);    
  }
  
  _buildRosterTable() {
    var studentList = this.settings.currentInfo.studentList;
    var rosterInfo = this._filterAndSortRoster(this.settings.currentInfo.students);
    
    var headerArray = ['student', 'section', 'start date', 'end date', 'IEP', '504', 'home', 'term'];
    var headerFields = ['student', 'section', 'startdate', 'enddate', 'iep', '504', 'homeschooled', 'term'];
    var tableClasses = 'table table-striped table-hover table-sm';
    
    var table = CreateElement.createTable(null, tableClasses, headerArray, []);
    this.rosterContent.appendChild(table);
    table.getElementsByTagName('thead')[0].classList.add('table-primary');
    
    var headerCells = table.getElementsByTagName('th');
    for (var i = 0; i < headerCells.length; i++) {
      var cell = headerCells[i];
      var labelText = cell.innerHTML;
      var fieldName = headerFields[i];

      cell.classList.add('roster-headercol');
      cell.classList.add('roster-headercol-' + fieldName);
      
      var span = CreateElement.createSpan(null, 'roster-headerlabel', labelText);
      cell.innerHTML = '';
      cell.appendChild(span);
      span.setAttribute("field-name", fieldName);
      
      span.addEventListener('click', (e) => { this._handleSortBy(e); });
      if (fieldName == 'iep' || fieldName == '504' || fieldName == 'homeschooled') {
        cell.appendChild(this._createFilterIcon(fieldName));
      }
    }
    
    var tbody = table.getElementsByTagName('tbody')[0];
    for (var i = 0; i < rosterInfo.length; i++) {
      var rosterItem = rosterInfo[i];
      var studentName = rosterItem.student;
      var row = CreateElement._createElement('tr');
      tbody.appendChild(row);
      
      var cell = CreateElement._createElement('td', 'test1', 'student-from-roster');
      row.appendChild(cell);
      cell.innerHTML = studentName;
      cell.addEventListener('click', (e) => { this._handleRosterSelect(e); });

      cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      cell.innerHTML = rosterItem.section;
      
      cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      cell.innerHTML = rosterItem.startdate;
      
      cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      cell.innerHTML = rosterItem.enddate;
      var override = this._checkForOverride(rosterItem.section, rosterItem.enddateoverride);
      if (override) {
        cell.innerHTML = override;
        cell.appendChild(this._createOverrideIcon(rosterItem.enddate));
      }

      cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      if (rosterItem.iep) {
        cell.classList.add('has-icon');
        cell.appendChild(this._createCheckIcon('student has IEP'));
      }
      
      cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      if (rosterItem['504']) {
        cell.classList.add('has-icon');
        cell.appendChild(this._createCheckIcon('student has 504'));
      }
      
      cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      if (rosterItem.homeschooled) {
        cell.classList.add('has-icon');
        cell.appendChild(this._createCheckIcon('student is homeschooled'));
      }      
        
      cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      cell.innerHTML = rosterItem.term;
    }

    UtilityKTS.setClass(this.rosterContent, this.settings.hideClass, false);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, true);
    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, true);
  }
  
  _sortRosterBy(fieldToSortBy) {
    var currentSorting = this.settings.sorting;
    
    if (!currentSorting || currentSorting.field != fieldToSortBy) {
      this.settings.sorting = {
        "field": fieldToSortBy,
        "direction": 1
      };
      
    } else {
      this.settings.sorting.direction *= -1;
    }
    
    this._updateUI();
  }
    
  _filterRosterBy(filterType, turnFilteringOn) {
    this.settings.filtering[filterType] = turnFilteringOn;
    
    this._updateUI();
  }
  
  _filterAndSortRoster(rosterInfo) {
    var flattened = [];
    for (var studentName in rosterInfo) {
      var rosterItem = {...rosterInfo[studentName]};
      var enrollmentList = rosterItem.enrollments;
      for (var i = 0; i < enrollmentList.length; i++) {
        var enrollmentItem = enrollmentList[i];
        var flattenedItem = rosterItem;
        delete flattenedItem.enrollments;
        flattenedItem = {
          ...flattenedItem, 
          ...enrollmentItem
        };
        flattened.push(flattenedItem);
      }
    }
    
    var activeFilters = {};
    for (var fieldName in this.settings.filtering) {
      if (this.settings.filtering[fieldName]) {
        var filterValue, matchType;
        
        if (fieldName == 'student') {
          filterValue = this.studentSelectInput.value;
          matchType = 'like';
          
        } else {
          filterValue = true
          matchType = 'exact';
        }
        
        activeFilters[fieldName] = {
          "filterValue": filterValue,
          "matchType": matchType
        };
      }
    }
    
    var filtered = flattened.filter(function(a) {
      var result = true;

      for (var fieldName in activeFilters) {
        var filter = activeFilters[fieldName];
        var fieldVal = a[fieldName].toString().toLowerCase();
        var filterVal = filter.filterValue.toString().toLowerCase();
        
        if (filter.matchType == 'like') {
          result = result && fieldVal.includes(filterVal);
          
        } else if (filter.matchType == 'exact') {
          result = result && (fieldVal == filterVal);
        }
      }
      
      return result;
    });
    
    var sortField = this.settings.sorting.field;
    var sortDirection = this.settings.sorting.direction;
    var sorted = filtered.sort(function(a, b) {
      var compare = sortDirection * a[sortField].toString().localeCompare(b[sortField].toString());

      if (compare == 0) {
        compare = a.student.localeCompare(b.student);
        if (compare == 0) {
          compare = a.term.localeCompare(b.term);
          if (compare == 0) {
            compare = a.section.localeCompare(b.section);
          }
        }
      }

      return compare;
    });

    return sorted;
  }

  _createFilterIcon(filterType) {
    var elem = CreateElement.createIcon(null, 'icon-rosterfilter filter-off fas fa-filter');
    elem.addEventListener('click', (e) => { this._handleFilterBy(e, filterType); });
    UtilityKTS.setClass(elem, 'filter-off', !this.settings.filtering[filterType]);
    
    return elem;
  }
  
  _createCheckIcon(titleText) {
    var elem = CreateElement.createIcon(null, 'icon-rostercheck far fa-check-square');
    elem.title = titleText;
    return elem;
  }
  
  _createOverrideIcon(originalEndDate) {
    var elem = CreateElement.createIcon(null, 'icon-rosterinfo fas fa-info-circle');
    elem.title = 'original end date ' + originalEndDate;
    return elem;
  }
    
  
  _checkForOverride(section, overrideList) {
    var overrideResult = null;
    for (var i = 0; i < overrideList.length && !overrideResult; i++) {
      var override = overrideList[i];
      if (section == override.section) {
        overrideResult = override.enddate;
      }
    }
    
    return overrideResult;  
  }
  
  _selectStudent(studentName) {
    var info = this.settings.currentInfo.students[studentName];
    this.settings.selectedStudentInfo = {...{"student": studentName, ...info}};

    UtilityKTS.removeChildren(this.studentContent);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, false);

/*
    UtilityKTS.setClass(this.studentImageIEP, this.settings.hideClass, !info.iep);       
    UtilityKTS.setClass(this.studentImage504, this.settings.hideClass, !info["504"]);
    UtilityKTS.setClass(this.studentIconHomeSchooled, this.settings.hideClass, !info.homeschooled);

    var infoTitle = this._determineStudentInfoMessage(info);
    this.studentImageInfo.title = infoTitle;
    UtilityKTS.setClass(this.studentImageInfo, this.settings.hideClass, infoTitle == '');    
*/
    
    this.studentContent.appendChild(this._renderWindowClose());
    
    this.studentContent.appendChild(this._renderProperty("student", info.enrollments[0].student));
    this.studentContent.appendChild(this._renderProperty("affiliation", info.enrollments[0].affiliation));
    this.studentContent.appendChild(this._renderProperty('email', info.enrollments[0].email));
    
    var handler = (a, b, c) => { this._handlePropertyEdit(a, b, c); };
    var elem = this._renderProperty('preferred name', info.preferredname, 'preferredname', handler);
    this.studentContent.appendChild(elem);
    var span = elem.getElementsByTagName('span')[1];
    span.classList.add('hover-decorate');
    span.title = 'edit preferred name';
    if (info.preferredname.length == 0) {
      span.innerHTML = 'no preferred name';
      span.classList.add('no-preferredname');
    }

    this.studentContent.appendChild(this._renderFlags(info));    

    var enrollmentTable = this._renderPropertyArray(
      ['term', 'section', 'startdate', 'enddate'], 
      ['term', 'section', 'start date', 'end date'],
      info.enrollments, 
      this.studentContent
    );
    if (enrollmentTable) this._addEndDateOverrides(enrollmentTable, info.enddateoverride);

    this._renderPropertyArray(
      ['name', 'email', 'phone', 'affiliationphone'], 
      ['mentor', 'email', 'phone', 'affiliation phone'],
      info.mentors, 
      this.studentContent
    );

    this._renderPropertyArray(
      ['name', 'email', 'phone'], 
      ['guardian', 'email', 'phone'],
      info.guardians, 
      this.studentContent
    );
    
    this._renderPropertyArray(
      ['datestamp', 'notetext', '[edit-delete-icons]'], 
      ['date', 'note', '[add-icon]'],
      info.notes, 
      this.studentContent,
      'limit-second-col',
      true
    );
    
    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, true);     
    UtilityKTS.setClass(this.rosterContent, this.settings.hideClass, true);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, false); 
  }
  
  _renderProperty(label, value, property, handler) {
    var row = CreateElement.createDiv(null, 'row');
    
    var col1 = CreateElement.createDiv(null, 'col-sm-3');
    row.appendChild(col1);
    col1.appendChild(CreateElement.createSpan(null, 'item-label', label));
    
    var col2 = CreateElement.createDiv(null, 'col-sm');
    row.appendChild(col2);
    
    var elem = CreateElement.createSpan(null, null, value);
    col2.appendChild(elem);

    if (handler) {
      var wrapperHandler = this._makePropertyEditHandler(label, property, elem, handler);
      elem.addEventListener('click', wrapperHandler);
    }
    
    return row;
  }
  
  _renderFlags(studentInfo) {
    var row = CreateElement.createDiv(null, 'row');
    
    var col1 = CreateElement.createDiv(null, 'col-sm-3');
    row.appendChild(col1);
    col1.appendChild(CreateElement.createSpan(null, 'item-label', 'flags'));
    
    var col2 = CreateElement.createDiv(null, 'col-sm');
    row.appendChild(col2);
    
    if (studentInfo.iep) col2.appendChild(this.studentImageIEP.cloneNode(true));
    if (studentInfo['504']) col2.appendChild(this.studentImage504.cloneNode(true));
    if (studentInfo.homeschooled) col2.appendChild(this.studentIconHomeSchooled.cloneNode(true));
    
    return row;
  }
  
  _renderWindowClose() {
    var elem = CreateElement.createIcon(null, 'item-icon icon-close far fa-window-close');
    elem.addEventListener('click', (e) => { this._handleStudentViewClose(e); });
    return elem;
  }
  
  _makePropertyEditHandler(label, property, targetElement, origHandler) {
    return function() {
      origHandler(label, property, targetElement);
    }
  }
    
  _renderPropertyArray(propertyArray, labelArray, source, container, extraClasses, renderIfEmpty) {
    var tableContents = [];
    var itemValues = [];
    
    for (var i = 0; i < source.length; i++) {
      var item = source[i];
      var rowContents = [];
      itemValues.push(item);
      
      for (var j = 0; j < propertyArray.length; j++) {
        var property = propertyArray[j];
        var value = item[property];
        if (property == 'startdate' || property == 'enddate') value = value.slice(0, 10);
        if (property == '[edit-delete-icons]') value = property;
        rowContents.push(value);
      }
      
      tableContents.push(rowContents);
    }
    
    if (source.length > 0 || renderIfEmpty) {
      var classes = 'table table-striped table-hover table-sm mt-3';
      if (extraClasses) classes += ' ' + extraClasses;
      var table = CreateElement.createTable(null, classes, labelArray, tableContents);
      container.append(table);
      table.getElementsByTagName('thead')[0].classList.add('table-primary');

      this._replaceTableIconElements(table, itemValues);
    }
    
    return table;
  }
  
  _replaceTableIconElements(table, itemValues) {
    var commonClasses = 'rosterviewer-icon ps-1 py-1';

    var headers = table.getElementsByTagName('th');
    var handler = (e) => { this._handleTableEdit(e, 'add', table); };
    
    for (var i = 0; i < headers.length; i++) {
      var headerCell = headers[i];
      if (headerCell.innerHTML == '[add-icon]') {
        headerCell.innerHTML = '';
        var icon = CreateElement.createIcon(null, commonClasses + ' far fa-plus-square', null, handler);
        headerCell.appendChild(icon);
      }
    }

    var rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var item = itemValues[r];
      
      var cells = row.getElementsByTagName('td');    
      for (var i = 0; i < cells.length; i++) {
        var bodyCell = cells[i];
        if (bodyCell.innerHTML == '[edit-delete-icons]') {          
          bodyCell.innerHTML = '';
          var handler = (e) => { this._handleTableEdit(e, 'delete', table); };
          var icon = CreateElement.createIcon(null, commonClasses + ' fas fa-trash-alt', null, handler);
          bodyCell.appendChild(icon);
          icon.setAttribute('item', JSON.stringify(item));
          
          var handler = (e) => { this._handleTableEdit(e, 'edit', table); };
          bodyCell.previousSibling.classList.add('hover-decorate');
          bodyCell.previousSibling.addEventListener('click', handler);
          bodyCell.previousSibling.setAttribute('item', JSON.stringify(item));
        }
      }
    }
  }
  
  _addEndDateOverrides(table, overrides) {
    for (var i = 0; i < overrides.length; i++) {
      var override = overrides[i];
      var bodyRows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
      for (var j = 0; j < bodyRows.length; j++) {
        var cols = bodyRows[j].getElementsByTagName('td');
        if (cols[1].innerHTML == override.section) {
          var origDate = cols[3].innerHTML;
          cols[3].innerHTML = override.enddate;
          var infoIcon = CreateElement.createIcon(null, 'fas fa-info-circle rosterviewer-infoicon ps-1', 'original end date ' + origDate);
          cols[3].appendChild(infoIcon);
        }
      }
    }
  }

  async _doPropertyEdit(label, property, targetElement) {
    var currentValue = targetElement.innerHTML;

    var msg = 'Please enter a value for "' + label + '"';
    var result = prompt(msg, currentValue);
    if (!result || result == currentValue) return;
    result = this._sanitizeText(result);
    
    var studentName = this.settings.selectedStudentInfo.student;
    
    var result = await this.config.callbackPropertyChange({"student": studentName, "property": property, "value": result});
    if (!result.success) return;
  }
  
  _beginNoteEdit(student, item) {
    var elemStudent = this.config.containerNoteEditor.getElementsByClassName('input-student')[0];
    var elemNote = this.config.containerNoteEditor.getElementsByClassName('input-note')[0];
    
    elemStudent.value = student;
    elemNote.setAttribute('item', JSON.stringify({"student": student, ...item}));
    
    var noteText = '';
    if (item) noteText = item.notetext;
    elemNote.value = noteText;
    
    this._setNoteEditVisiblity(true);
  }
  
  async _finishNoteEdit(saveResults) {
    if (saveResults) {
      var elemNote = this.config.containerNoteEditor.getElementsByClassName('input-note')[0];
      var item = JSON.parse(elemNote.getAttribute('item'));

      var params = {};
      params.student = item.student;
      params.notetext = this._sanitizeText(elemNote.value);
      params.datestamp = this._shortDateStamp();
      
      if (item.noteid) {
        params.action = 'update';
        params.noteid = item.noteid;

      } else {
        params.action = 'add';
        params.noteid = null;
      }
      
      var result = await this.config.callbackNoteChange(params);
      if (!result.success) return;
    }
    
    this._setNoteEditVisiblity(false);
  }
  
  async _deleteNote(student, item) {
    var msg = 'This note for ' + student + ' will be permanently deleted';
    msg += '\n"' + item.notetext + '"';
    msg += '\n\nChoose "OK" to continue';
    if (!confirm(msg)) return;
    
    var result = await this.config.callbackNoteChange({"action": 'delete', ...item});
    if (!result.success) return;
  }
  
  _setNoteEditVisiblity(visible) {
    var mainView = this.config.container;
    var editView = this.config.containerNoteEditor;
    UtilityKTS.setClass(mainView, this.settings.hideClass, visible);
    UtilityKTS.setClass(editView, this.settings.hideClass, !visible);
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleStudentFilterChange(e) {
    this._filterRosterBy('student', e.target.value.length > 0);
  }
  
  _handleFilterBy(e, filterType) {
    if (e.target.classList.contains('filter-off')) {
      this._filterRosterBy(filterType, true);
      UtilityKTS.setClass(e.target, 'filter-off', false);
      
    } else {
      this._filterRosterBy(filterType, false);
      UtilityKTS.setClass(e.target, 'filter-off', true);
    }    
  }
  
  _handleSortBy(e) {
    this._sortRosterBy(e.target.getAttribute('field-name'));
  }  
  
  _handleRosterSelect(e) {
    this._selectStudent(e.target.innerHTML);
  }
  
  _handleStudentViewClose(e) {
    this.settings.selectedStudentInfo = null;
    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, false);
    UtilityKTS.setClass(this.rosterContent, this.settings.hideClass, false);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, true);
  }

  async _handlePropertyEdit(label, property, targetElement) {
    await this._doPropertyEdit(label, property, targetElement);
  }
  
  _handleTableEdit(e, editType, table) {
    var student = this.settings.selectedStudentInfo.student;
    var item = JSON.parse(e.target.getAttribute('item'));
    
    if (editType == 'add') {
      this._beginNoteEdit(student, null);

    } else if (editType == 'edit') {
      this._beginNoteEdit(student, item);
      
    } else if (editType == 'delete') {
      this._deleteNote(student, item);
    }
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
  
  _formatDate(str) {
    return str.slice(0, 10);
  }
  
  _shortDateStamp() {
     var now = new Date();
     var y = String(now.getFullYear()).padStart(4, '0');
     var m = String(now.getMonth() + 1).padStart(2, '0');
     var d = String(now.getDate()).padStart(2, '0');
     
     return y + '-' + m + '-' + d;
  }
  
  _sanitizeText(str) {
    var sanitized = str;
    
    sanitized = sanitized.replace(/[^A-Za-z0-9\s'\.\/\-]/g, '');
    
    return sanitized;
  }
}
