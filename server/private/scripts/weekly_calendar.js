//-------------------------------------------------------------------
// Instructor Tips "Weekly Calendar" tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const appInfo = {
    appName: 'Weekly calendar'
  };
  
	const page = {};
  
	const settings = {
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    var queryResults = await _doGetQuery('admin/query', 'calendars');
    if (!queryResults.success) return;
    
    settings.calendarData = _organizeCalendar(queryResults.data);
    
    page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.body.appendChild(await _renderPage());
    
    setTimeout(function() {_update();}, 0);
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async function _renderPage() {
    var container = CreateElement.createDiv(null, null);
    
    container.appendChild(_renderTitle());
    container.appendChild(_renderSelectionControls());
    container.appendChild(_renderCalendarContainer());
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'title-container');
    
    var titleLabel = CreateElement.createDiv(null, 'title', appInfo.appName);
    container.appendChild(titleLabel);
    
    return container;
  }
  
  function _renderSelectionControls() {
    var container = CreateElement.createDiv(null, 'controls-container');
    
    var calendarSelections = [];
    for (var name in settings.calendarData) {
      calendarSelections.push({id: null, value: name, textval: name});
    }
    
    var handler = (e) => {return _selectionChange(e);};
    container.appendChild(CreateElement.createSelect(null, 'controls-selection select-css', handler, calendarSelections));
    
    var handler = (e) => {return _update();}
    container.appendChild(_createSliderRadio('term', 'Sem 1', 'Sem 1', 'controls-term', handler));
    _setSliderValue(container.lastChild, true)
    container.appendChild(_createSliderRadio('term', 'Sem 2', 'Sem 2', 'controls-term', handler));
    container.appendChild(_createSliderRadio('term', 'Tri 1', 'Tri 1', 'controls-term', handler));
    container.appendChild(_createSliderRadio('term', 'Tri 2', 'Tri 2', 'controls-term', handler));
    container.appendChild(_createSliderRadio('term', 'Tri 3', 'Tri 3', 'controls-term', handler));
    container.appendChild(_createSliderRadio('term', 'Summer', 'Summer', 'controls-term', handler));
    
    return container;
  }
  
  function _renderCalendarContainer() {
    var container = CreateElement.createDiv(null, 'calendar-container');
    
    return container;
  }
  
  function _update() {
    var container = page.body.getElementsByClassName('calendar-container')[0];
    _removeChildren(container);
    
    var elemSelect = page.body.getElementsByClassName('controls-selection')[0];
    if (elemSelect.selectedIndex < 0) return;
    
    var selectedCalendarName = elemSelect[elemSelect.selectedIndex].value;
    var fullCalendar = settings.calendarData[selectedCalendarName];
    
    var termElements = page.body.getElementsByClassName('controls-term');
    var termName = '';
    for (var i = 0; i < termElements.length && termName == ''; i++) {
      var elemLabel = termElements[i].getElementsByClassName('switch-label')[0];
      if (_getSliderValue(termElements[i])) termName = elemLabel.getAttribute('data-on');
    }
    
    var termCalendars = fullCalendar[termName];
    for (var calendarKey in termCalendars) {
      container.appendChild(_displayCalendar(calendarKey, termCalendars[calendarKey]));
    }
  }
  
  function _displayCalendar(calendarName, calendar) {
    const MAX_TERM_LENGTH = 18;
    var container = CreateElement.createDiv(null, 'single-calendar');
    
    container.appendChild(CreateElement.createDiv(null, 'single-calendar calendar-label', calendarName));
    
    var table = CreateElement.createTable(null, null);
    container.appendChild(table);
    
    var row = CreateElement.createTableRow(null, null, table);
    CreateElement.createTableCell(null, null, 'week', true, row);
    CreateElement.createTableCell(null, null, 'start', true, row);
    
    var currentWeek = null;
    var today = new Date();
    console.log(today);
    
    for (var i = 1; i <= MAX_TERM_LENGTH; i++) {
      if (calendar.hasOwnProperty(i)) {
        var classList = null;
        
        row = CreateElement.createTableRow(null, classList, table);
        CreateElement.createTableCell(null, null, i, false, row);
        var dayForWeek = _formatDate(calendar[i].firstDay);
        CreateElement.createTableCell(null, null, dayForWeek, false, row);
        
        if (today >= new Date(dayForWeek)) currentWeek = row;
      }
    }
    
    if (currentWeek != null) currentWeek.classList.add('currentweek');
    
    return container;
  }
  
	//-----------------------------------------------------------------------------
	// data processing
	//-----------------------------------------------------------------------------  
  function _organizeCalendar(calendarData) {
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
    }
    
    return organized;
  }
  
	//-----------------------------------------------------------------------------
	// handlers
	//-----------------------------------------------------------------------------  
  function _selectionChange(e) {
    _update();
  }
  
  
  //--------------------------------------------------------------
  // slider switch
  //--------------------------------------------------------------
  function _createSliderSwitch(dataOnLabel, dataOffLabel, addedClassList, handler, useTwoChoice) {
    var classList = 'switch';
    if (useTwoChoice) {
      classList += ' switch-two-choice';
    } else {
      classList += ' switch-yes-no';
    }
    if (addedClassList && addedClassList != '') classList += ' ' + addedClassList;
    var container = CreateElement._createElement('label', null, classList);
    
    
    var elemCheckbox = CreateElement._createElement('input', null, 'switch-input');
    elemCheckbox.type = 'checkbox';
    container.appendChild(elemCheckbox);
    if (handler) elemCheckbox.addEventListener('click', e => handler(e));
    
    var elemDataSpan = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemDataSpan);
    elemDataSpan.setAttribute('data-on', dataOnLabel);
    elemDataSpan.setAttribute('data-off', dataOffLabel);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));
    return container;
  }

  function _createSliderRadio(groupName, dataOnLabel, dataOffLabel, addedClassList, handler) {
    var classList = 'switch switch-yes-no';
    if (addedClassList && addedClassList != '') classList += ' ' + addedClassList;
    var container = CreateElement._createElement('label', null, classList);
    
    
    var elemRadio = CreateElement._createElement('input', null, 'switch-input');
    elemRadio.type = 'radio';
    elemRadio.name = groupName;
    container.appendChild(elemRadio);
    if (handler) elemRadio.addEventListener('click', e => handler(e));
    
    var elemDataSpan = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemDataSpan);
    elemDataSpan.setAttribute('data-on', dataOnLabel);
    elemDataSpan.setAttribute('data-off', dataOffLabel);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));
    return container;
  }

  function _getSliderValue(elem) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];    
    return elemInput.checked;
  }

  function _setSliderValue(elem, checked) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];
    elemInput.checked = checked;
  }
  
  //--------------------------------------------------------------
  // server functions
  //--------------------------------------------------------------     
  async function _doGetQuery(queryType, queryName) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      resultData.details = 'DB error: ' + JSON.stringify(requestResult.details);
      console.log('DB error: ' + JSON.stringify(requestResult.details));
      console.log('queryType = ' + queryType + ' queryName=' + queryName);
    }
    
    return resultData;
  } 
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------    
  function _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }  

  function _formatDate(d) {
    var formatted = d;
    
    if (_isValidDate(formatted)) {
      formatted = '';
      if (d != null & d != '') {
        var objDate = new Date(d);
        var day = ('00' + objDate.getDate()).slice(-2);
        var month = ('00' + (objDate.getMonth() + 1)).slice(-2);
        var year = ('0000' + objDate.getFullYear()).slice(-2);
        //formatted =  year  + '-' + month + '-' + day;
        formatted = month + '/' + day + '/' + year;
      }
    }
    
    return formatted;
  }
  
  function _isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
