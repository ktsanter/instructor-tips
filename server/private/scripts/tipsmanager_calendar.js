//-----------------------------------------------------------------------------------
// TipCalendar class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipCalendar {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Calendars';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
    this._config = config;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render(notice) {
    this._container = CreateElement.createDiv(null, 'tipcalendar ' + this._HIDE_CLASS);

    this._notice = notice;
    
    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------  
  show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    var queryResults = await this._doGetQuery('admin/query', 'calendars');
    
    this._prepContainerForUpdate();
    
    if (queryResults.success) {
      this._calendarInfo = this._organizeCalendar(queryResults.data);
      this._container.appendChild(this._renderUI());      
    }
  }
  
  _prepContainerForUpdate() {
    this._removeChildren(this._container);

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    this._container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
  }

  _organizeCalendar(calendarData) {
    var selectionSet = new Set();
    var organized = {};
    
    for (var i = 0; i < calendarData.length; i++) {
      var schoolYear = calendarData[i].schoolyear;
      var termName = calendarData[i].termname;
      var startType = calendarData[i].starttype;
      var week = calendarData[i].week;
      var firstDay = calendarData[i].firstday;

      if (!organized.hasOwnProperty(schoolYear)) organized[schoolYear] = {};
      if (!organized[schoolYear].hasOwnProperty(termName)) organized[schoolYear][termName] = {};
      if (!organized[schoolYear][termName].hasOwnProperty(startType)) organized[schoolYear][termName][startType] = {};

      if (week == 998) {
        organized[schoolYear][termName][startType].startDate = {"firstDay": firstDay, "referenceRow": calendarData[i]};
        
      } else if (week == 999) {
        organized[schoolYear][termName][startType].endDate = {"firstDay": firstDay, "referenceRow": calendarData[i]};
        
      } else {
        organized[schoolYear][termName][startType][week] = {"firstDay": firstDay, "referenceRow": calendarData[i]};
      }
      selectionSet.add(this._buildSelectionFromComponents(schoolYear, termName, startType));
    }
    
    organized.selectionList = Array.from(selectionSet);

    return organized;
  }
  
  _renderUI() {
    var container = CreateElement.createDiv(null, 'tipcalendar-ui');
    
    container.appendChild(this._renderControls());
    container.appendChild(this._renderCalendar(this._calendarInfo.selectionList[0]));
    
    return container;
  }
  
  _renderControls() {
    var container = CreateElement.createDiv(null, 'tipcalendar-ui selection-container');
    
    var selections = [];
    
    var selectionList = this._calendarInfo.selectionList;
    for (var i = 0; i < selectionList.length; i++) {
      selections.push({id: i, value: selectionList[i], textval: selectionList[i]});
    }
    
    var handler = (e) => {return this._selectionChange();};
    var subContainer = CreateElement.createDiv(null, 'tipcalendar-ui calendar-subcontainer');
    container.appendChild(subContainer);
    subContainer.appendChild(CreateElement.createSelect(null, 'tipcalendar-ui calendar-selection select-css', handler, selections));
    subContainer.appendChild(CreateElement.createIcon(null, 'calendar-dirtybit fas fa-asterisk', 'unsaved changes'))
    
    subContainer = CreateElement.createDiv(null, 'calendary-secondary-subcontainer');
    container.appendChild(subContainer);
    subContainer.appendChild(CreateElement.createButton(
      null, 
      'calendar-control calendar-create', 
      'create', 
      'create a set of calendars for a new school year', 
      () => {return this._handleButton('create')}
    ));
    subContainer.appendChild(CreateElement.createButton(
      null, 
      'calendar-control calendar-delete', 
      'delete', 
      'delete the entire school year\'s calendar', 
      () => {return this._handleButton('delete')}
    ));

    subContainer = CreateElement.createDiv(null, 'calendary-secondary-subcontainer');
    container.appendChild(subContainer);
    subContainer.appendChild(CreateElement.createButton(
      null, 
      'calendar-control calendar-save', 
      'save', 
      'save changes for this term', 
      () => {return this._handleButton('save')}
    ));
    subContainer.appendChild(CreateElement.createButton(
      null, 
      'calendar-control calendar-save', 
      'discard', 
      'discard changes for this term', 
      () => {return this._handleButton('discard')}
    ));
    
    return container;
  }
  
  _renderCalendar(selection) {
    var container = CreateElement.createDiv(null, 'tipcalendar-ui calendar-container');
    
    this._updateCalendar(selection, container);
    
    return container;
  }
  
  _updateCalendar(selection, optionalContainer) {
    var container = optionalContainer;
    if (!optionalContainer) {
      container = this._container.getElementsByClassName('calendar-container')[0];
      this._container.getElementsByClassName('calendar-dirtybit')[0].style.display = 'none';
    }
    this._removeChildren(container);
        
    if (selection) {
      var components = this._getComponentsFromSelection(selection);
      var calendar = this._calendarInfo[components.schoolYear][components.termName][components.startType];
      var numWeeks = Object.keys(calendar).length - 2;
      
      container.appendChild(this._renderWeek('open', calendar.startDate, false, true));
      for (var i = 1; i <= numWeeks; i++) {
        container.appendChild(this._renderWeek(i, calendar[i], (i < numWeeks), false));
      }
      container.appendChild(this._renderWeek('close', calendar.endDate, false, true));
      
      this._markOutOfSequence(container);
    }
  }
  
  _renderWeek(weekLabel, weekInfo, includeDropFill, isStartEndDate) {
    var classList = 'calendar-week';
    if (isStartEndDate) classList = 'calendar-week-startend';    
    var container = CreateElement.createDiv(null, classList);
    container.referenceRow = weekInfo.referenceRow;
    container.addEventListener('mouseenter', (e) => {return this._weekEnterExit(e, true);});
    container.addEventListener('mouseleave', (e) => {return this._weekEnterExit(e, false);});
    
    container.appendChild(CreateElement.createDiv(null, 'calendar-weeknumber', weekLabel));
    
    var elemFirstDay = CreateElement.createTextInput(null, 'calendar-weekfirstday', weekInfo.firstDay);
    container.appendChild(elemFirstDay);
    elemFirstDay.type = 'date';
    elemFirstDay.addEventListener('change', (e) => {return this._handleFirstDayChange(e);});
    
    if (includeDropFill) {
      container.append(CreateElement.createIcon(null, 'calendar-dropfill fas fa-arrow-circle-down', 'fill following weeks', (e) => {return this._handleDropFill(e)}));
    }
    
    return container;
  }
  
  _markOutOfSequence(container) {
    var elemListWeeks = container.getElementsByClassName('calendar-week');
    var prevWeekFirstDay = elemListWeeks[0].getElementsByClassName('calendar-weekfirstday')[0].value;
    
    for (var i = 1; i < elemListWeeks.length; i++) {
      var firstDay = elemListWeeks[i].getElementsByClassName('calendar-weekfirstday')[0].value; 

      var diffTime = new Date(firstDay).getTime() - new Date(prevWeekFirstDay).getTime();
      var diffDays = diffTime / (1000 * 3600 * 24);
      
      var elemWeekNumber = elemListWeeks[i].getElementsByClassName('calendar-weeknumber')[0];
      
      if (elemWeekNumber.classList.contains('out-of-sequence')) elemWeekNumber.classList.remove('out-of-sequence');
      elemWeekNumber.title = '';
      if (diffDays != 7) {
        elemWeekNumber.classList.add('out-of-sequence');
        elemWeekNumber.title = 'out of sequence';
      }
      
      prevWeekFirstDay = firstDay;      
    }      
  }
  
  _getFirstDayFromContainer(weekContainer) {
    return weekContainer
  }

  //--------------------------------------------------------------
  // create/save/delete
  //--------------------------------------------------------------    
  async _createCalendar() {
    var schoolYearName = prompt('Enter the name for the new school year calendar (max 30 characters, no quotes):');
    if (schoolYearName == null) return;
    if (schoolYearName.length == '0' || schoolYearName.length > 30) {
      console.log('invalid school year name');
      return;
    } 
 
    var postData = {schoolyear: schoolYearName};
    var queryResult = await this._doPostQuery('admin/insert', 'schoolyear-calendar', postData );

    if (queryResult.success) {
      this.update();
    }
  }
  
  
  async _deleteCalendar() {
    var selection = this._getCalendarSelection();
    var selectionComponents = this._getComponentsFromSelection(selection);
    var schoolYearName = selectionComponents.schoolYear;
    
    var msg = 'All calendars for the school year "' + schoolYearName + '" will be deleted.';
    msg += '\n\nAre you sure you want to do this?';
    if (!confirm(msg)) return;
    
    var postData = {schoolyear: schoolYearName};
    var queryResult = await this._doPostQuery('admin/delete', 'schoolyear-calendar', postData );

    if (queryResult.success) {
      this.update();
    }
  }

  async _saveCalendarChanges() {
    var elemWeekList = this._container.getElementsByClassName('calendar-week');
    var updateData = [];
    
    for (var i = 0; i < elemWeekList.length; i++) {
      var elemWeek = elemWeekList[i];
      var calendarId = elemWeek.referenceRow.calendarid;
      var firstDay = elemWeek.getElementsByClassName('calendar-weekfirstday')[0].value;
      updateData.push({'calendarid': calendarId, 'firstday': firstDay});
    }
    
    elemWeekList = this._container.getElementsByClassName('calendar-week-startend');
    for (var i = 0; i < elemWeekList.length; i++) {
      var elemWeek = elemWeekList[i];
      var calendarId = elemWeek.referenceRow.calendarid;
      var firstDay = elemWeek.getElementsByClassName('calendar-weekfirstday')[0].value;
      updateData.push({'calendarid': calendarId, 'firstday': firstDay});
    }
    
    var postData = {'updateData': updateData};
    
    var queryResult = await this._doPostQuery('admin/update', 'schoolyear-calendar', postData);
    if (queryResult.success) {
      var selection = this._getCalendarSelection();
      await this.update();
      this._updateCalendar(selection);
    }
  }
  
  async _discardCalendarChanges() {
    var elemSelect = this._container.getElementsByClassName('calendar-selection')[0];
    this._updateCalendar(this._getCalendarSelection());
  }
  
  _getCalendarSelection() {
    var elemSelect = this._container.getElementsByClassName('calendar-selection')[0];
    return elemSelect[elemSelect.selectedIndex].value;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------    
  async _selectionChange(e) {
    var elemSelect = this._container.getElementsByClassName('calendar-selection')[0];
    var selection = elemSelect[elemSelect.selectedIndex].value;
    this._updateCalendar(this._getCalendarSelection());
  }
  
  _handleButton(changeType) {
    if (changeType == 'create') {
      this._createCalendar();

    } else if (changeType == 'save') {
      this._saveCalendarChanges();

    } else if (changeType == 'discard') {
      this._discardCalendarChanges();

    } else if (changeType == 'delete') {
      this._deleteCalendar();
    }
  }
  
  _handleDropFill(e) {
    var startWeekNumber = e.target.parentNode.referenceRow.week;
    
    var firstDay = new Date(e.target.parentNode.getElementsByClassName('calendar-weekfirstday')[0].value);
    
    var weekElements = this._container.getElementsByClassName('calendar-week');
    for (var i = 0; i < weekElements.length; i++) {
      var elemWeek = weekElements[i];
      var weekNumber = elemWeek.referenceRow.week;
      if (weekNumber > startWeekNumber) {
        var weekDiff = weekNumber - startWeekNumber;
        var calculatedDate = new Date(firstDay);
        calculatedDate.setDate(firstDay.getDate() + weekDiff * 7 + 1);
        elemWeek.getElementsByClassName('calendar-weekfirstday')[0].value = this._formatDate(calculatedDate);
      }
    }
    
    this._markOutOfSequence(this._container.getElementsByClassName('calendar-container')[0]);
    this._container.getElementsByClassName('calendar-dirtybit')[0].style.display = 'inline-block';    
  }
  
  _weekEnterExit(e, enter) {
    var elemIcon = e.target.getElementsByClassName('calendar-dropfill')[0];
    if (enter) {
      if (elemIcon) elemIcon.style.display = 'inline-block';
    } else {
      if (elemIcon) elemIcon.style.display = 'none';
    }
  }
  
  _handleFirstDayChange(e) {
    this._markOutOfSequence(this._container.getElementsByClassName('calendar-container')[0]);
    this._container.getElementsByClassName('calendar-dirtybit')[0].style.display = 'inline-block';
  }

  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------    
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }  
  
  _buildSelectionFromComponents(schoolYear, termName, startType) {
    return schoolYear + ', ' + termName + ', ' + startType;
  }
  
  _getComponentsFromSelection(selection) {
    var componentList = selection.split(', ');
    return {
      schoolYear: componentList[0],
      termName: componentList[1],
      startType: componentList[2]
    };
  }

  _formatDate(d) {
    var formatted = d;
    
    if (this._isValidDate(formatted)) {
      formatted = '';
      if (d != null & d != '') {
        var objDate = new Date(d);
        var day = ('00' + objDate.getDate()).slice(-2);
        var month = ('00' + (objDate.getMonth() + 1)).slice(-2);
        var year = objDate.getFullYear();
        formatted =  year  + '-' + month + '-' + day;
      }
    }
    
    return formatted;
  }
  
  _isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
  }
  
  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async _doGetQuery(queryType, queryName) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbPost(queryType, queryName, postData);
    if (requestResult.success) {
      resultData = requestResult;
      this._notice.setNotice('');
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }  
}
