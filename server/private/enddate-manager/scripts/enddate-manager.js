//-----------------------------------------------------------------------
// End date manager
//-----------------------------------------------------------------------
// TODO: finish help
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const DEBUGMODE = true;
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/enddate-manager/help',
    logoutURL: '/usermanagement/logout/enddate-manager',
    
    dirtyBit: {
      "navManage": false,
      "navOptions": false
    },
    
    google: {
      obj: null,
      clientId:  '780404244540-nug55q7bnd7daf3dpj5k5g8qob9uqv41.apps.googleusercontent.com',
      apiKey: 'AIzaSyDOa6Dc0pWvBBCmsQYShBaWuYsBEEFMIlI',
      scopes: 'https://www.googleapis.com/auth/calendar.events',
      isSignedIn: false,
      objCalendar: null
    },
    
    configuration: null,
    
    eventLocation: 'End date manager'
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {    
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);

    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, 'hide-me', true);
    
    page.contents = page.body.getElementsByClassName('contents')[0];    
    
    await _initializeProfile(sodium);

    page.notice.setNotice('');
    
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    _renderContents();
    _initializeGoogleStuff();

    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
  }
  
  async function _initializeProfile(sodium) {
    settings.profile = new ASProfile({
      id: "myProfile",
      "sodium": sodium,
      navbarElements: {
        "save": page.navbar.getElementsByClassName('navSave')[0],
        "reload": page.navbar.getElementsByClassName('navReload')[0],
        "icon": page.navbar.getElementsByClassName('icon-profile')[0],
        "pic": page.navbar.getElementsByClassName('pic-profile')[0]
      },
      hideClass: 'hide-me'
    });

    await settings.profile.init();
  }
    
  function _initializeGoogleStuff() {
    settings.google.obj = new GoogleManagement({
      "clientId": settings.google.clientId,
      "apiKey": settings.google.apiKey,
      "scopes": settings.google.scopes,
      "signInChange": _signInChangeForGoogle
    });

    settings.google.objCalendar = new GoogleCalendar({});    
  }
  
  //-----------------------------------------------------------------------------
	// navbar
	//-----------------------------------------------------------------------------
  function _attachNavbarHandlers() {
    var handler = (e, me) => { _navDispatch(e); }
    var navItems = page.navbar.getElementsByClassName(settings.navItemClass);
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', handler);
    }
  }
  	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function _renderContents() {
    _enableNavOption('navGoogle', false, false);
    
    _renderManage();
    _renderOptions();
    _renderDebug();
  }
  
  function _renderManage() {
    page.navManage = page.contents.getElementsByClassName('contents-navManage')[0];

    var elems = page.navManage.getElementsByClassName('enddate-option');
    for (var i = 0; i < elems.length; i++) {
      elems[i].addEventListener('change', (e) => { _handleEnddateSourceChange(e); } );
    }
    page.navManage.getElementsByClassName('uploadfile')[0].addEventListener('change', (e) => { _uploadEnrollments(e); });
  }
  
  function _renderOptions() {
    page.navOptions = page.contents.getElementsByClassName('contents-navOptions')[0];
  }
  
  function _renderDebug() {
    page.navDebug = page.contents.getElementsByClassName('contents-navDebug')[0];
    
    page.navDebug.getElementsByClassName('btnAddEvent')[0].addEventListener('click', (e) => { _testAddEvent(e); });
    page.navDebug.getElementsByClassName('btnDeleteEvent')[0].addEventListener('click', (e) => { _testDeleteEvent(e); });
    page.navDebug.getElementsByClassName('btnTestDB')[0].addEventListener('click', (e) => { _testDB(e); });
    page.navDebug.getElementsByClassName('btnSignout')[0].addEventListener('click', (e) => { _handleGoogleSignout(e); });
  }
    
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  async function _showContents(contentsId) {
    settings.currentNavOption = contentsId;
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    if (contentsId == 'navManage') _showManage();
    if (contentsId == 'navOptions') _showOptions();
    if (contentsId == 'navDebug') _showDebug();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showManage() {
  }
  
  function _showOptions() {
  }
  
  function _showDebug() {
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    
    if (opt == 'navManage') {
      /*
      var enable = settings.dirtyBit[settings.currentNavOption];
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
      */
      
    } else if (opt == 'navOptions') {

    } else if (opt == 'navDebug') {
      
    }else if (opt == 'navProfile') {
      var enable = settings.profile.isDirty();
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
    }
  }
    
  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  function _setDirtyBit(dirty) {
    settings.dirtyBit[settings.currentNavOption] = dirty;
    _setNavOptions();
  }
    
  function _setMainUIEnable(enable) {
    console.log('_setMainUIEnable: ' + enable);
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      if (containers[i].classList.contains('contents-navManage') ||
          containers[i].classList.contains('contents-navOptions') ||
          containers[i].classList.contains('contents-navDebug')) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }

  function _updateUI() {
    console.log('_updateUI');
    
    var standarizedOverrides = _standardizeOverrides();
    var source = _getSourceSelection();
    
    if (source == 'enddate-calender') {
      var standardizedCalendarEvents = _standardizeCalendarEvents();
      console.log(' - use calendar event data');
      console.log(' - reconcile calendarEvents with enddateOverrides');
      console.log(' - display table of results');

      console.log(standardizedCalendarEvents);
      console.log(standarizedOverrides);

      _setDirtyBit(false);
      
    } else {
      var standardizedEnrollments = _standardizeEnrollments();
      console.log(' - use enrollment data');
      console.log(' - reconcile enrollmentList with enddateOverrides');
      console.log(' - display table of results');

      console.log(standardizedEnrollments);
      console.log(standarizedOverrides);
      
      _setDirtyBit(true);
    }
    
    _showDebugResults();
    _updateEventUI();
    _updateCalendarSelectOptions();    
    _setMainUIEnable(settings.google.isSignedIn);
  }
  
  function _updateEventUI() {
    console.log('_updateEventUI');
    
    var container = page.navManage.getElementsByClassName('event-container')[0];
    UtilityKTS.removeChildren(container);
    console.log('pick up here by rendering then updating EventEditor object');
  }
  
  function _showDebugResults() {
    console.log('_showDebugResults');
    
    var elemResults = page.navDebug.getElementsByClassName('result-container')[0];
    var msg = '';
    msg += 'calendarId: ' + settings.configuration.calendarId;
    msg += '<br><br>calendarList (' + settings.configuration.calendarList.length + '):';
    for (var i = 0; i < settings.configuration.calendarList.length; i++) {
      var item = settings.configuration.calendarList[i];
      msg += '<br>';
      msg += '&nbsp;&nbsp;' + settings.configuration.calendarList[i].summary;
      if (item.id == settings.configuration.calendarId) msg += ' <em>selected</em>';
    }
    
    msg += '<br><br>calendarEvents (' + settings.configuration.calendarEvents.length + '):';
    for (var i = 0; i < settings.configuration.calendarEvents.length; i++) {
      var item = settings.configuration.calendarEvents[i];
      msg += '<br>&nbsp;&nbsp;' + item.enddate;
      for (j = 0; j < item.studentList.length; j++) {
        var subItem = item.studentList[j];
        msg += '<br>&nbsp;&nbsp;&nbsp;&nbsp;' + subItem.enddate + ' ' + subItem.student + ' ' + subItem.section;
      }
    }
    
    msg += '<br><br>enddateOverrides ' + settings.configuration.enddateOverrides.length + '):';
    for (var i = 0; i < settings.configuration.enddateOverrides.length; i++) {
      var item = settings.configuration.enddateOverrides[i];
      msg += '<br>&nbsp;&nbsp;' + item.enddate + ' ' + item.student + ' ' + item.enddate + ' ' + item.notes;
    }
    
    msg += '<br><br>enrollmentList (' + settings.configuration.enrollmentList.length + '):';
    for (var i = 0; i < settings.configuration.enrollmentList.length; i++) {
      var item = settings.configuration.enrollmentList[i];
      msg += '<br>&nbsp;&nbsp;' + _formatAsShortDate(item.enddate) + ' ' + item.student + ' ' + item.section;
    }
    
    elemResults.innerHTML = msg;    
  }
  
  function _getSourceSelection() {
    var elems = page.navManage.getElementsByClassName('enddate-option');
    var source = '';
    for (var i = 0; i < elems.length; i++) {
      if (elems[i].checked) source = elems[i].id;
    }
    return source;
  }
  
  function _standardizeCalendarEvents() {
    console.log('_standardizeCalendarEvents');
    
    var standardized = {
      list: [],
      byStudent: {},
      byDate: {},
      bySection: {},
    }

    for (var i = 0; i < settings.configuration.calendarEvents.length; i++) {
      var item = settings.configuration.calendarEvents[i];
      for (var j = 0; j < item.studentList.length; j++) {
        var subItem = item.studentList[j];
        var standardizedItem = {
          "enddate": item.enddate,
          "student": subItem.student,
          "section": subItem.section,
          "override": false,
          "notes": ''
        }
        
        standardized.list.push(standardizedItem);
      }
    }
    
    standardized.byStudent = _collateStandardizedList(standardized.list, 'student');
    standardized.byDate = _collateStandardizedList(standardized.list, 'enddate');
    standardized.bySection = _collateStandardizedList(standardized.list, 'section');
    
    return standardized;
  }
  
  function _standardizeOverrides() {
    console.log('_standardizeOverrides');
    
    var standardized = {
      list: [],
      byStudent: {},
      byDate: {},
      bySection: {},
    }

    for (var i = 0; i < settings.configuration.enddateOverrides.length; i++) {
      var item = settings.configuration.enddateOverrides[i];
        var standardizedItem = {
          "enddate": item.enddate,
          "student": item.student,
          "section": item.section,
          "override": true,
          "notes": item.notes
        }
        
        standardized.list.push(standardizedItem);
    }
    
    standardized.byStudent = _collateStandardizedList(standardized.list, 'student');
    standardized.byDate = _collateStandardizedList(standardized.list, 'enddate');
    standardized.bySection = _collateStandardizedList(standardized.list, 'section');
        
    return standardized;
  }
  
  function _standardizeEnrollments() {
    console.log('_standardizeEnrollments');

    var standardized = {
      list: [],
      byStudent: {},
      byDate: {},
      bySection: {},
    }

    for (var i = 0; i < settings.configuration.enrollmentList.length; i++) {
      var item = settings.configuration.enrollmentList[i];
      var standardizedItem = {
        "enddate": _formatAsShortDate(item.enddate),
        "student": item.student,
        "section": item.section,
        "override": false,
        "notes": ''
      }
      
      standardized.list.push(standardizedItem);
    }
    
    standardized.byStudent = _collateStandardizedList(standardized.list, 'student');
    standardized.byDate = _collateStandardizedList(standardized.list, 'enddate');
    standardized.bySection = _collateStandardizedList(standardized.list, 'section');
    
    return standardized;
  }
  
  function _collateStandardizedList(standardizedList, collateBy) {
    var collated = {};
    
    for (var i = 0; i < standardizedList.length; i++) {
      var item = standardizedList[i];
      var collateValue = item[collateBy];
      if (!collated.hasOwnProperty(collateValue)) collated[collateValue] = [];
      collated[collateValue].push(item);
    }
    return collated;
  }
    
  function _updateCalendarSelectOptions() {
    var elemSelect = page.navOptions.getElementsByClassName('calendar-selection')[0];
    UtilityKTS.removeChildren(elemSelect);

    var calendarList = settings.configuration.calendarList;
    
    for (var i = 0; i < calendarList.length; i++) {
      var item = calendarList[i];
      var elemOption = CreateElement.createOption(null, null, JSON.stringify(item), item.summary);      
      
      if (settings.configuration.calendarId == item.id) elemOption.selected = true;
      elemSelect.appendChild(elemOption);
    }
  }

  function _addEndDateEvent(params) {
    var description = 'Term end date scheduled for:';
    for (var i = 0; i < params.enrollments.length; i++) {
      var item = params.enrollments[i];
      description += '\n' + item.studentLast + ', ' + item.studentFirst + ' (' + item.section + ')';
    }

    settings.google.objCalendar.addAllDayEvent({
        "calendarId": params.calendarId,
        "date": params.date,
        "summary": "End date",
        "description": description,
        "location": settings.eventLocation,
        "reminders": params.reminders
      },
      _callbackAddEndDateEvent
    );
  }
  
  function _removeEndDateEvent(params) {
    console.log('_removeEndDateEvent (disabled)');
    console.log(params);
    return;
    
    settings.google.objCalendar.removeEvent({
      "calendarId": params.calendarId,
      "eventId": params.eventId
    });    
  }
    
  //--------------------------------------------------------------------------
  // callbacks
	//--------------------------------------------------------------------------
  function _calendarInfoCallback(success, results) {
    console.log('_calendarInfoCallback');
    
    if (!success) {
      console.log('error: ' + JSON.stringify(results));
      return;
    }      
    
    var fullCalendarList = results.items.sort(function(a,b) {
      return a.summary.localeCompare(b.summary);
    });
    var filteredCalendarList = [];
    
    for (var i = 0; i < fullCalendarList.length; i++) {
      var item = fullCalendarList[i];
      if (item.accessRole == 'owner') {
        filteredCalendarList.push(item);

        if (settings.configuration.calendarId == null && item.hasOwnProperty('primary') && item.primary) {
          settings.configuration.calendarId = item.id;
        }
      }
    }
    
    settings.configuration.calendarList = filteredCalendarList;

    settings.google.objCalendar.getEventInfo({
        calendarId: settings.configuration.calendarId
      }, 
      _eventInfoCallback
    );      
  }
  
  function _eventInfoCallback(success, results) {
    console.log('_eventInfoCallback');
    
    if (!success) {
      console.log('error: ' + JSON.stringify(results));
      return;
    }
    
    settings.configuration.calendarEvents = [];
    settings.configuration.enrollmentList = [];
    
    for (var i = 0; i < results.items.length; i++) {
      var item = results.items[i];
      if (item.location == settings.eventLocation) settings.configuration.calendarEvents.push(_parseCalendarEvent(item));
    }

    _updateUI();
  }
  
  function _callbackAddEndDateEvent(success, results) {
    console.log('_callbackAddEndDateEvent: ' + success);
    console.log(results);
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _navDispatch(e) {
    var dispatchTarget = e.target.id;
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    var dispatchMap = {
      "navManage": function() { _showContents('navManage');},
      "navOptions": function() { _showContents('navOptions'); },
      "navDebug": function() { _showContents('navDebug');},
      "navGoogle": function() { _handleGoogleSignIn(); },
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e, false);}
    }
    dispatchMap[dispatchTarget]();
  }
  
  async function _handleSave(e) {
    if (settings.currentNavOption == 'navManage') {
      console.log('_handleSave: navManage');
      
    } else if (settings.currentNavOption == 'navOptions') {
      console.log('_handleSave: navOptions');
      
    } else if (settings.currentNavOption == 'navDebug') {
      console.log('_handleSave: navDebug');
      
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.save();
    }
    
    _setDirtyBit(false);
  }  
    
  async function _handleReload(e, skipConfirm) {
    if (!skipConfirm) {
      var msg = 'Any changes will be lost.\nChoose "OK" to continue with reloading';
      if (!confirm(msg)) return;
    }
    
    if (settings.currentNavOption == 'navManage') {
      console.log('_handlReload: navManage');
      
    } else if (settings.currentNavOption == 'navOptions') {
      console.log('_handleReload: navOptions');
      
    } else if (settings.currentNavOption == 'navDebug') {
      console.log('_handleReload: navDebug');
      
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
    }
    
    _setDirtyBit(false);
  }
  
  function _handleGoogleSignIn() {
    settings.google.obj.trySignIn();
  }
  
  function _handleGoogleSignout() {
    settings.google.obj.signout();
  }
  
  async function _signInChangeForGoogle(isSignedIn) {
    console.log('_signInChangeForGoogle: isSignedIn = ' + isSignedIn);
    settings.google.isSignedIn = isSignedIn;

    _setMainUIEnable(false);
    
    if (isSignedIn) {    
      var configOkay = await _loadConfiguration();
      if (!configOkay) {
        page.notice.setNotice('failed to load configuration');
        return;
      }

      settings.google.objCalendar.getCalendarInfo(_calendarInfoCallback);
    }

    _enableNavOption('navGoogle', !isSignedIn, !isSignedIn);    
  }
  
  function _handleEnddateSourceChange(e) {
    var selection = e.target.id;

    var elemFileUpload = page.navManage.getElementsByClassName('uploadfile')[0];
    var elemFileUploadLabel = page.navManage.getElementsByClassName('uploadfile-label')[0];

    elemFileUpload.value = null;
    elemFileUploadLabel.innerHTML = 'choose file...';
    
    if (selection == 'enddate-calender') {
      elemFileUpload.disabled = true;
      settings.google.objCalendar.getCalendarInfo(_calendarInfoCallback);
      
    } else if (selection == 'enddate-enrollment') {
      elemFileUpload.disabled = false;
    }
  }  
      
  async function _uploadEnrollments(e) {
    console.log('_uploadEnrollments');
    var elem = page.navManage.getElementsByClassName('uploadfile')[0];
    var fileList = elem.files;
    if (fileList.length == 0) {
      console.log('no file chosen');
      return;
    }

    page.navManage.getElementsByClassName('uploadfile-label')[0].innerHTML = fileList[0].name;
    
    var result = await _formPost('/usermanagement/routeToApp/enddate-manager/upload', fileList[0]);
    var enrollmentList = [];
    if (result.success) enrollmentList = result.data;
    
    settings.configuration.enrollmentList = enrollmentList;
    settings.configuration.calendarEvents = [];
    _updateUI();    
  }
  
  //----------------------------------------
  // enrollment report post
  //----------------------------------------
  async function _formPost(url, fileToPost) {
    const METHOD_TITLE = 'formPost';
    
    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE};
    var data = new FormData();
    data.append('file', fileToPost)

    try {
      const resp = await fetch(
        url, 
        {
          method: 'post', 
          //headers: {'Content-Type': 'multipart/form-data; charset=utf-8'}, //browser will fill in appropriately (?)
          body: data
        }
      );
      const json = await resp.json();
      //console.log(json);
      
      if (!json.success) {
        var errmsg = '*ERROR: in ' + METHOD_TITLE + ', ' + JSON.stringify(json.details);
        console.log(errmsg);
        //console.log('url: ' + url);
        //console.log('postData: ' + JSON.stringify(postData));
        result.details = errmsg;
      } else {
        result = json;
      }
      
    } catch (error) {
      var errmsg = '**ERROR: in ' + METHOD_TITLE + ', ' + error;
      console.log(errmsg);
      result.details = errmsg;
    }
    
    return result;
  }
  
  //---------------------------------------
  // DB interface
  //----------------------------------------  
  async function _loadConfiguration() {
    settings.configuration = {
      calendarId: "c_h702bj3dk5fjqjgqi8psg8q1mg@group.calendar.google.com",
      //calendarId: null,
      calendarList: [],
      enddateOverrides: [
        {"student": "Holmes, Sherlock", section: "Fingerprinting 101", enddate: "2021-07-04", notes: "some reason"},
        {"student": "Watson, John", section: "Creative Writing", enddate: "2021-07-05", notes: "an important reason"},
      ],
      enrollmentList: []
    }
    return true;
  }

  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  
  function _enableNavOption(navOption, visible, enable) {
    var elem = document.getElementById(navOption);
    UtilityKTS.setClass(elem, 'hide-me', !visible);
    elem.disabled = !enable;    
  }
  
  function _parseCalendarEvent(item) {
    var parsedItem = {};
    parsedItem.original = item;
    parsedItem.enddate = item.end.date;
    
    var descriptionLines = item.description.split('\n');
    
    var studentList = [];
    for (var i = 1; i < descriptionLines.length; i++) {
      var parsedLine = descriptionLines[i].split('(');
      var student = parsedLine[0].trim();
      var section = parsedLine[1].slice(0, -1);
      studentList.push({"student": student, "section": section, "enddate": item.end.date});
    }

    parsedItem.studentList = studentList;
    
    return parsedItem;
  }
  
  function _formatAsShortDate(date) {
    /*
      var d = new Date(date),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();

      if (month.length < 2) 
          month = '0' + month;
      if (day.length < 2) 
          day = '0' + day;

      return [year, month, day].join('-');
    */
    
    // hack due to time zone problems
    return date.toString().slice(0,10);
  }

  //--------------------------------------------------------------------------
  // test stuff
	//--------------------------------------------------------------------------  
  function _testAddEvent(e) {
    console.log('_testAddEvent');
    var elemCalendar = page.navDebug.getElementsByClassName('calendar-selection')[0];
    var calendarId = settings.configuration.calendarId;
    var eventDay = Math.floor(Math.random() * (30 - 26) + 26);
    
    var studentList = [
      {studentLast: "Smith", studentFirst: "Bob", section: "Basic Web Design"},
      {studentLast: "Doe", studentFirst: "Jane",  section: "Java Programming A"},
      {studentLast: "Weasley", studentFirst: "Fred",  section: "Potions"},
      {studentLast: "Longbottom", studentFirst: "Neville",  section: "Herbology"},
      {studentLast: "Granger", studentFirst: "Hermione", section: "Arithmancy"},
      {studentLast: "Potter", studentFirst: "Harry", section: "Defense Against the Dark Arts"},
      {studentLast: "Malfoy", studentFirst: "Draco", section: "Intro to Skullduggery"},
      {studentLast: "Ahab", studentFirst: "Trevor", section: "Whaling 101"},
      {studentLast: "Baggins", studentFirst: "Frodo", section: "Unmaking Rings"}
    ];
    
    var numEnrollments = Math.floor(Math.random() * (5 - 1) + 1);
    var enrollmentList = [];
    for (var i = 0; i < numEnrollments; i++) enrollmentList.push(studentList[i]);

    var params = {
      "calendarId": calendarId,
      "date": '2021-05-' + eventDay,
      "enrollments": enrollmentList,
      "reminders": [
        {method: 'email', minutes: 6 * 60},
        {method: 'popup', minutes: 12 * 60}
      ]
    }
    
    _addEndDateEvent(params);
  }
  
  function _testDeleteEvent(e) {
    console.log('_testDeleteEvent (disabled)');
    return;
    
    var params = {
      "calendarId":  xxxx,
      "eventId": xxxx
    };
    _removeEndDateEvent(params);    
  }
      
  async function _testDB(e) {
    console.log('test DB');
    dbResult = await SQLDBInterface.doGetQuery('enddate-manager/query', 'test');

    console.log(dbResult);
  }

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();