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
    
    return this._container;;
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
      organized[schoolYear][termName][startType][week] = {"firstDay": firstDay, "referenceRow": calendarData[i]};
      
      selectionSet.add(this._buildSelectionFromComponents(schoolYear, termName, startType));
    }
    
    organized.selectionList = Array.from(selectionSet);
    
    return organized;
  }
  
  _renderUI() {
    var container = CreateElement.createDiv(null, 'tipcalendar-ui');
    
    container.appendChild(this._renderSelectionUI());
    container.appendChild(this._renderCalendar(this._calendarInfo.selectionList[0]));
    
    return container;
  }
  
  _renderSelectionUI() {
    var container = CreateElement.createDiv(null, 'tipcalendar-ui selection-container');
    
    var selections = [];
    
    var selectionList = this._calendarInfo.selectionList;
    for (var i = 0; i < selectionList.length; i++) {
      selections.push({id: i, value: selectionList[i], textval: selectionList[i]});
    }
    
    var handler = (e) => {return this._selectionChange();};
    container.appendChild(CreateElement.createSelect(null, 'tipcalendar-ui calendar-selection select-css', handler, selections));
    
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
    }
    this._removeChildren(container);
        
    if (selection) {
      var components = this._getComponentsFromSelection(selection);
      var calendar = this._calendarInfo[components.schoolYear][components.termName][components.startType];
      var numWeeks = Object.keys(calendar).length;
      
      for (var i = 1; i <= numWeeks; i++) {
        container.appendChild(this._renderWeek(i, calendar[i])  );
      }
    }
  }
  
  _renderWeek(weekNumber, weekInfo) {
    var container = CreateElement.createDiv(null, 'calendar-week', 'week ' + weekNumber + ': ' + weekInfo.firstDay);
    container.referenceRow = weekInfo.referenceRow;
    container.addEventListener('click', (e) => {return this._test(e);});
    
    return container;
  }

  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------    
  async _selectionChange(e) {
    var elemSelect = this._container.getElementsByClassName('calendar-selection')[0];
    var selection = elemSelect[elemSelect.selectedIndex].value;
    this._updateCalendar(selection);
  }
  
  _test(e) {
    console.log(e.target.referenceRow);
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

  _formatTimeStamp(timeStamp) {
    var formatted = timeStamp;
    
    if (this._isValidDate(formatted)) {
      formatted = '';
      if (timeStamp != null & timeStamp != '') {
        var objDate = new Date(timeStamp);
        var day = objDate.getDate();
        var month = objDate.getMonth() + 1;
        var year = objDate.getFullYear();
        formatted = (objDate.getMonth() + 1) + '/' + objDate.getDate() + '/' + objDate.getFullYear();
        formatted += ' ' + objDate.getHours() + ':' + objDate.getMinutes() + ':' + objDate.getSeconds();
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
