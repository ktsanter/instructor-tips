//-------------------------------------------------------------------
// MentorViewer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class MentorViewer {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      currentInfo: null,
      selectedMentorInfo: null,
      
      filtering: {
        "mentor": {filterType: 'like', filterValue: ''}
      },
      sorting: {
        "field": 'name',
        "direction": 1
      }
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(currentMentorInfo, currentStudentInfo) {
    this.settings.currentInfo = currentMentorInfo;
    this.settings.currentStudentInfo = currentStudentInfo;

    if (this.settings.selectedMentorInfo) {
      if (!currentMentorInfo.mentorList.includes(this.settings.selectedMentorInfo.name)) {
        this.settings.selectedMentorInfo = null;
      }
    }
    
    this._updateFilterControls();
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    this.statusMessage = this.config.container.getElementsByClassName('status-message')[0];
    
    this.settings.byTermAndSection = this.config.container.getElementsByClassName('mentors-listing')[0];
    this.settings.mentorListContainer = this.config.container.getElementsByClassName('mentors-listing')[0];
    this.settings.singleMentorContainer = this.config.container.getElementsByClassName('single-mentor-listing')[0];
    
    this.config.container.getElementsByClassName('icon-close')[0].addEventListener('click', (e) => { this._handleSingleMentorClose(e); });
    
    this.mentorSelect = this.config.container.getElementsByClassName('mentor-select')[0];
    this.mentorSelectInput = this.mentorSelect.getElementsByClassName('mentor-filter')[0];
    this.mentorSelectInput.addEventListener('input', (e) => { this._handleMentorFilterChange(e); });    
    
    this.settings.filterControls = this._createFilterControls(['section', 'earlieststartdate', 'welcomelettersent']); 

    this.clearFilterContainer = this.config.container.getElementsByClassName('clear-filter-container')[0]
    this.clearFilterButton = this.clearFilterContainer.getElementsByClassName('btn-clearfilter')[0];
    this.clearFilterButton.addEventListener('click', (e) => { this._handleClearFilters(e); });    
  }

  _updateUI() {
    UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, true);

    if (!this.settings.currentInfo || this.settings.currentInfo.mentorList.length == 0) {
      this.statusMessage.innerHTML = 'no mentor data available';
      UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, false);
      
    } else {
      var filteredAndSortedMentors = this._filterAndSortMentors(this.settings.currentInfo.mentorsByTermAndSection);
      this._renderMentorTable(filteredAndSortedMentors, this.settings.mentorListContainer);
      
      UtilityKTS.setClass(this.mentorSelect, this.settings.hideClass, false);
      UtilityKTS.setClass(this.clearFilterContainer, this.settings.hideClass, false);
      UtilityKTS.setClass(this.settings.mentorListContainer, this.settings.hideClass, false);
      UtilityKTS.setClass(this.settings.singleMentorContainer, this.settings.hideClass, true);

      if (this.settings.selectedMentorInfo) this._selectMentor(this.settings.selectedMentorInfo.name);
      
      this._setClearFilterVisibility();
    }
  }
  
  _filterAndSortMentors(mentorsByTermAndSection) {
    var mentorsBySection = {};
    for (var term in mentorsByTermAndSection) {
      var termInfo = mentorsByTermAndSection[term];
      for (var section in termInfo) {
        if (!mentorsBySection.hasOwnProperty(section)) mentorsBySection[section] = {};
        var sectionInfo = termInfo[section];
        for (var mentor in sectionInfo) {
          var mentorInfo = sectionInfo[mentor];
          if (!mentorsBySection[section].hasOwnProperty(mentor)) {
            mentorsBySection[section][mentor] = mentorInfo;
            mentorsBySection[section][mentor].termSet = new Set();
          }
          mentorsBySection[section][mentor].termSet.add(term);
        }
      }
    }
    
    for (var section in mentorsBySection) {
      var sectionInfo = mentorsBySection[section];
      for (var mentor in sectionInfo) {
        var mentorInfo = sectionInfo[mentor];
        mentorInfo.earlieststartdate = this._findEarliestStartDate(section, mentor, this.settings.currentStudentInfo.students);
      }
    }
    
    var flattened = [];
    for (var section in mentorsBySection) {
      for (var mentor in mentorsBySection[section]) {
        var mentorInfo = mentorsBySection[section][mentor];
        flattened.push({"section": section, "name": mentor, ...mentorInfo});
      }
    }
    
    var activeFilters = {};
    activeFilters["name"] = {"filterType": 'like', "filterValue": this.mentorSelectInput.value};
    for (var fieldName in this.settings.filterControls) {
      activeFilters[fieldName] = {"filterType": 'in', "filterValue": this.settings.filterControls[fieldName].getFilterSettings()};
    }

    var filtered = flattened.filter(function(a) { 
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
    
    var sortField = this.settings.sorting.field;
    var sortDirection = this.settings.sorting.direction;
    var sorted = filtered.sort(function(a,b) {
      var aValue = a[sortField];
      var bValue = b[sortField];
      
      var compare = sortDirection * aValue.toString().localeCompare(bValue.toString());
      if (compare == 0) {
        compare = a.name.localeCompare(b.name);
      }
      
      return compare;
    });
    
    return sorted;
  }
  
  _findEarliestStartDate(section, mentor, studentInfo) {
    var earliestStartDate = null;

    for (var student in studentInfo) {
      var studentMentorList = studentInfo[student].mentors;
      for (var i = 0; i < studentMentorList.length; i++) {
        var studentMentorItem = studentMentorList[i];
        if (studentMentorItem.section == section && studentMentorItem.name == mentor) {
          var enrollments = studentInfo[student].enrollments;
          for (var j = 0; j < enrollments.length; j++) {
            if (enrollments[j].section == section) {
              var startDate = enrollments[j].startdate;
              if (!earliestStartDate || earliestStartDate.localeCompare(startDate) > 0) earliestStartDate = startDate;
            }
          }
        }
      }
    }
    
    if (!earliestStartDate) {
      console.log('cannot find earliest start date for ', section, mentor);
      earliestStartDate = '???';
    }
    
    return earliestStartDate;
  }
    
  _renderMentorTable(mentorData, container) {
    UtilityKTS.removeChildren(container);
    
    var headerArray = ['mentor', 'section', 'email', 'phone', 'first start', 'welcome'];
    var headerFields = ['name', 'section', 'email', 'phone', 'earlieststartdate', 'welcomelettersent'];
    var tableClasses = 'mentor-table table table-striped table-hover table-sm';
    
    var table = CreateElement.createTable(null, tableClasses, headerArray, []);
    container.appendChild(table);
    table.getElementsByTagName('thead')[0].classList.add('table-primary');
    
    var headerCells = table.getElementsByTagName('th');
    for (var i = 0; i < headerCells.length; i++) {
      var cell = headerCells[i];
      var labelText = cell.innerHTML;
      var fieldName = headerFields[i];

      cell.classList.add('roster-headercol');
      cell.classList.add('roster-headercol-' + fieldName);
      cell.setAttribute('field-name', fieldName);
      
      var span = CreateElement.createSpan(null, 'roster-headerlabel', labelText);
      cell.innerHTML = '';
      cell.appendChild(span);
      span.setAttribute("field-name", fieldName);
      
      span.addEventListener('click', (e) => { this._handleSortBy(e); });
      
      if (fieldName == 'email') {
        var icon = CreateElement.createIcon(null, 'icon-copyemail far fa-copy');
        cell.appendChild(icon);
        icon.title = 'copy all emails';
        icon.addEventListener('click', (e) => { this._handleCopyMentorEmail(e); });
      }
    }
    
    var tbody = table.getElementsByTagName('tbody')[0];
    for (var i = 0; i < mentorData.length; i++) {
      var mentorItem = mentorData[i];
      var mentorName = mentorItem.name;
      var row = CreateElement._createElement('tr');
      tbody.appendChild(row);
      
      var cell = CreateElement._createElement('td', null, 'mentor-selection');
      row.appendChild(cell);
      cell.innerHTML = mentorItem.name;
      cell.setAttribute('filter-value', mentorItem.name);
      cell.addEventListener('click', (e) => { this._handleMentorSelect(e); });      
      
      var cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      cell.innerHTML = mentorItem.section;
      cell.setAttribute('filter-value', mentorItem.section);      
      
      var cell = CreateElement._createElement('td', null, 'col-mentoremail');
      row.appendChild(cell);
      cell.innerHTML = mentorItem.email;
      cell.setAttribute('filter-value', mentorItem.email);      
      
      var cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      cell.innerHTML = mentorItem.phone;
      cell.setAttribute('filter-value', mentorItem.phone);      
      
      var cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      cell.innerHTML = mentorItem.earlieststartdate;
      cell.setAttribute('filter-value', mentorItem.earlieststartdate);   

      var checkVal = JSON.stringify(mentorItem);
      var checked = mentorItem.welcomelettersent;
      var handler = (e) => { this._handleMentorWelcomeClick(e); };

      var cell = CreateElement._createElement('td', null, null);
      row.appendChild(cell);
      var check = CreateElement.createCheckbox(null, 'mentor-welcome-control', 'mentor-welcome', checkVal, '', checked, handler);
      check.getElementsByTagName('input')[0].classList.add('form-check-input');      
      check.getElementsByTagName('input')[0].classList.add('ms-4');
      cell.appendChild(check);      
    }   

    this._attachFilterControls(table);    
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
  
  _createFilterControls(fieldNameList) {
    var filterControls = {};
    for (var i = 0; i < fieldNameList.length; i++) {
      var fieldName = fieldNameList[i];
      filterControls[fieldName] = new FilterControl({
        "fieldName": fieldName,
        "valueSet": new Set(),
        "callbackIconClick": (callingFilter) => { this._callbackFilterOpen(callingFilter, this.settings.filterControls); },
        "callbackSelectChange": (params) => {this._callbackFilterChange(params); this._updateUI(); }
      })
      
      var elem = filterControls[fieldName].render();
    }
    
    return filterControls;
  }  
  
  _attachFilterControls(table) {
    var headerNodes = table.getElementsByTagName('thead')[0].getElementsByTagName('th');
    for (var i = 0; i < headerNodes.length; i++) {
      var node = headerNodes[i];
      var fieldName = node.getAttribute('field-name');
      if (this.settings.filterControls.hasOwnProperty(fieldName)) {
        this.settings.filterControls[fieldName].attachTo(node, true);
      }
    }
  }  
  
  _updateFilterControls() {
    var valueSets = {};
    var studentInfo = this.settings.currentInfo.students;

    for (var fieldName in this.settings.filterControls) {
      valueSets[fieldName] = new Set();      
    }
    
    for (var term in this.settings.currentInfo.mentorsByTermAndSection) {
      var termItem = this.settings.currentInfo.mentorsByTermAndSection[term];
      for (var section in termItem) {
        var sectionItem = termItem[section];
        valueSets["section"].add(section);
        
        for (var mentor in sectionItem) {
          valueSets["earlieststartdate"].add(this._findEarliestStartDate(section, mentor, this.settings.currentStudentInfo.students));
          
          var mentorItem = sectionItem[mentor];
          valueSets["welcomelettersent"].add(mentorItem.welcomelettersent);
        }
      }
    }
    
    for (var key in this.settings.filterControls) {
      this.settings.filterControls[key].update(valueSets[key]);
    }
  }
    
  async _saveMentorWelcomeSetting(target) {
    var mentorItem = JSON.parse(target.value);
    
    var params = {
      "property": "welcomelettersent",
      "term": '[any]',
      "section": mentorItem.section,
      "name": mentorItem.name,
      "welcomelettersent": target.checked
    };
    
    var result = await this.config.callbackPropertyChange(params);
    if (result.success) {
      for (var term in this.settings.currentInfo.mentorsByTermAndSection) {
        var termInfo = this.settings.currentInfo.mentorsByTermAndSection[term];
        
        for (var section in termInfo) {
          var sectionInfo = termInfo[section];
          if (section == mentorItem.section) {
            
            for (var mentor in sectionInfo) {
              var mentorInfo = sectionInfo[mentor];
              if (mentor == mentorItem.name) {
                mentorInfo.welcomelettersent = target.checked;
              }
            }
          }
        }
      }
    }
  }
  
  _selectMentor(mentorName) {
    this.settings.selectedMentorInfo = this.settings.currentInfo.mentors[mentorName];
    
    var info = this.settings.selectedMentorInfo;    
    var studentInfo = this._getStudentsForMentor(info);
    var container = this.settings.singleMentorContainer;
    
    container.getElementsByClassName('mentor-name')[0].innerHTML = info.name;
    container.getElementsByClassName('mentor-email')[0].innerHTML = info.email;
    container.getElementsByClassName('mentor-phone')[0].innerHTML = info.phone;
    container.getElementsByClassName('mentor-affiliation')[0].innerHTML = info.affiliation;
    container.getElementsByClassName('mentor-affiliation-phone')[0].innerHTML = info.affiliationphone;
    
    var studentBody = container.getElementsByTagName('tbody')[0];
    UtilityKTS.removeChildren(studentBody);
    for (var i = 0; i < studentInfo.length; i++) {
      var tr = CreateElement._createElement('tr');
      studentBody.appendChild(tr);
      
      var td = CreateElement._createElement('td');
      tr.appendChild(td);
      td.innerHTML = studentInfo[i].student;
      
      var td = CreateElement._createElement('td');
      tr.appendChild(td);
      td.innerHTML = studentInfo[i].term;
      
      var td = CreateElement._createElement('td');
      tr.appendChild(td);
      td.innerHTML = studentInfo[i].section;
      
      var td = CreateElement._createElement('td');
      tr.appendChild(td);
      td.innerHTML = studentInfo[i].startdate;
      
      var td = CreateElement._createElement('td');
      tr.appendChild(td);
      td.innerHTML = studentInfo[i].enddate;
      if (studentInfo[i].override) {
        td.innerHTML = studentInfo[i].override;
        td.setAttribute('filter-value', studentInfo[i].override);
        var icon = CreateElement.createIcon(null, 'icon-rosterinfo fas fa-info-circle');
        icon.title = 'original end date ' + studentInfo[i].enddate
        td.appendChild(icon);
      }
    }
    
    UtilityKTS.setClass(this.settings.mentorListContainer, this.settings.hideClass, true);
    UtilityKTS.setClass(this.clearFilterContainer, this.settings.hideClass, true);    
    UtilityKTS.setClass(this.settings.singleMentorContainer, this.settings.hideClass, false);
    UtilityKTS.setClass(this.mentorSelect, this.settings.hideClass, true);    
  }
  
  _getStudentsForMentor(mentorInfo) {
    var studentInfo = [];
    var mentorName = mentorInfo.name;
    
    for (var student in this.settings.currentStudentInfo.students) {
      var item = this.settings.currentStudentInfo.students[student];
      var mentors = item.mentors;
      var enrollments = item.enrollments;
      var overrides = item.enddateoverride;
      
      for (var i = 0; i < mentors.length; i++) {
        if (mentors[i].name == mentorName) {
          var studentMentorItem = {
            "student": mentors[i].student,
            "term": mentors[i].term,
            "section": mentors[i].section,
            "startdate": null,
            "enddate": null,
            "override": null
          }
          
          for (var j = 0; j < enrollments.length; j++) {
            if (enrollments[j].term == mentors[i].term &&
                enrollments[j].section == mentors[i].section) {
              studentMentorItem.startdate = enrollments[j].startdate;
              studentMentorItem.enddate = enrollments[j].enddate;
              
              for (var k = 0; k < overrides.length; k++) {
                if (overrides[k].section == mentors[i].section) studentMentorItem.override = overrides[i].enddate; 
              }
            }
          }
          studentInfo.push(studentMentorItem);
        }
      }
    }
    
    studentInfo = studentInfo.sort(function(a, b) {
      return a.student.localeCompare(b.student);
    });
        
    return studentInfo;
  }

  _copyMentorEmails() {
    var table = this.config.container.getElementsByClassName('mentor-table')[0];
    var cells = table.getElementsByClassName('col-mentoremail');
    
    var emailSet = new Set();
    for (var i = 0; i < cells.length; i++) {
      emailSet.add(cells[i].innerHTML);
    }
    
    var emailList = Array.from(emailSet).sort();
    var emailString = '';
    for (var i = 0; i < emailList.length; i++) {
      if (i > 0) emailString += ';';
      emailString += emailList[i];
    }
    
    this._copyToClipboard(emailString);
  }
  
  _setClearFilterVisibility() {
    var noFilters = this.mentorSelectInput.value.length == 0;
    
    for (var key in this.settings.filterControls) {
      if (!noFilters) break;
      noFilters = this.settings.filterControls[key].allChecked();
    }
    
    UtilityKTS.setClass(this.clearFilterButton, this.settings.hideClass, noFilters);
  }
    
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  _callbackFilterChange(params) {
    // handled by updateUI
  }
  
  _callbackFilterOpen(callingFilter, filterControls) {
    for (var key in filterControls) filterControls[key].closeFilter();
    callingFilter.openFilter();
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleSortBy(e) {
    this._sortRosterBy(e.target.getAttribute('field-name'));
  }  
  
  _handleMentorSelect(e) {
    this._selectMentor(e.target.innerHTML);
  }
  
  _handleSingleMentorClose(e) {
    this.settings.selectedMentorInfo = null;
    this._updateUI();
  }  
  
  async _handleMentorWelcomeClick(e) {
    await this._saveMentorWelcomeSetting(e.target);
    this._updateUI();
  }
  
  _handleCopyMentorEmail(e) {
    this._copyMentorEmails();
  }

  _handleMentorFilterChange(e) {
    this.settings.filtering['mentor'] = this.mentorSelectInput.value;
    this._updateUI();
  }
  
  _handleClearFilters(e) {
    this.mentorSelectInput.value = '';

    for (var key in this.settings.filterControls) {
      this.settings.filterControls[key].clearFilter();
    }

    this._updateUI();
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  _copyToClipboard(txt) {
    if (!this.settings.clipboard) this.settings.clipboard = new ClipboardCopy(this.config.container, 'plain');

    this.settings.clipboard.copyToClipboard(txt);
	}	  
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _upsearchForRow(target) {
    var row = null;
    var node = target;
    for (var node = target; !row; node = node.parentNode) {
      if (node.nodeName == 'TR') row = node;
    }
    
    return row;
  }
}
