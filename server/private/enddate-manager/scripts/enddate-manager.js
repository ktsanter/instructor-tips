//-----------------------------------------------------------------------
// End date manager
//-----------------------------------------------------------------------
// TODO: finish help
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
//calendarId: "c_h702bj3dk5fjqjgqi8psg8q1mg@group.calendar.google.com"  
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
    
    configuration: {
      calendarList: [],
      calendarEvents: [],
      enrollmentList: []
    },
    
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
    
    var configOkay = await _loadConfiguration();
    if (!configOkay) {
      page.notice.setNotice('failed to load configuration');
      return;
    }

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
    
    settings.eventEditor = new EventEditor({
      hideClass: settings.hideClass,
      eventContainer: page.navManage,
      editorContainer: page.contents.getElementsByClassName('eventlist-editor-container')[0],
      editorOkay: page.contents.getElementsByClassName('button-editor-okay')[0],
      editorCancel: page.contents.getElementsByClassName('button-editor-cancel')[0],
      callbackEventChange: _callbackEditorEventChange,
      callbackModeChange: _callbackEditorModeChange
    });
    settings.eventEditor.render();

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
    page.navDebug.getElementsByClassName('btnBatchAddEvent')[0].addEventListener('click', (e) => { _testBatchAddEvent(e); });
    page.navDebug.getElementsByClassName('btnDeleteEvent')[0].addEventListener('click', (e) => { _testDeleteEvent(e); });
    page.navDebug.getElementsByClassName('btnSignout')[0].addEventListener('click', (e) => { _handleGoogleSignout(e); });
    page.navDebug.getElementsByClassName('btnTestEventEditor')[0].addEventListener('click', (e) => { _testEventEditorGetList(e); });
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
    
    if (opt == 'navProfile') {
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
    var standarizedOverrides = _standardizeOverrides();
    var source = _getSourceSelection();
    
    if (source == 'enddate-calendar') {
      _updateEventUI(_standardizeCalendarEvents(), _standardizeOverrides());
      
    } else {
      _updateEventUI(_standardizeEnrollments(), _standardizeOverrides());
    }
    
    _showDebugResults();    
    _updateCalendarSelectOptions();    
    _setMainUIEnable(settings.google.isSignedIn);
  }
  
  function _updateEventUI(eventList, overrideList) {
    var reconciled = [];
    for (var i = 0; i < eventList.length; i++) {
      var item = eventList[i];
      var original = JSON.parse(JSON.stringify(item));
      
      var overrideItem = _findMatchInList(item, overrideList);
      if (overrideItem) {
        var enrollmentEndDate = item.enrollmentenddate;
        var eventId = item.eventid;
        item = JSON.parse(JSON.stringify(overrideItem));
        item.enrollmentenddate = enrollmentEndDate;
        item.eventid = eventId;
      }
        
      item.original = original;
      reconciled.push(item);
    }
    
    settings.eventEditor.update(reconciled);
  }
  
  function _findMatchInList(item, list) {
    var match = null;
    
    for (var i = 0; i < list.length && !match; i++) {
      if (item.student == list[i].student && item.section == list[i].section) match = list[i];
    }
    
    return match;
  }    
  
  function _showDebugResults() {
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
    
    msg += '<br><br>enddateOverrides (' + settings.configuration.enddateOverrides.length + '):';
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
    var standardized = [];

    for (var i = 0; i < settings.configuration.calendarEvents.length; i++) {
      var item = settings.configuration.calendarEvents[i];

      for (var j = 0; j < item.studentList.length; j++) {
        var subItem = item.studentList[j];
        var standardizedItem = {
          "eventid": item.eventid,
          "enddate": item.enddate,
          "enrollmentenddate": subItem.enrollmentenddate,
          "student": subItem.student,
          "section": subItem.section,
          "notes": '',
          "override": false,
          "overrideid": null
        }

        standardized.push(standardizedItem);
      }
    }
    
    return standardized;
  }
  
  function _standardizeOverrides() {
    var standardized = [];

    for (var i = 0; i < settings.configuration.enddateOverrides.length; i++) {
      var item = settings.configuration.enddateOverrides[i];
        var standardizedItem = {
          "enddate": item.enddate,
          "enrollmentenddate": null,
          "student": item.student,
          "section": item.section,
          "notes": item.notes,
          "override": true,
          "overrideid": item.overrideid
        }
        
        standardized.push(standardizedItem);
    }
    
    return standardized;
  }
  
  function _standardizeEnrollments() {
    var standardized = [];

    for (var i = 0; i < settings.configuration.enrollmentList.length; i++) {
      var item = settings.configuration.enrollmentList[i];
      var standardizedItem = {
        "enddate": _formatAsShortDate(item.enddate),
        "enrollmentenddate": null,
        "student": item.student,
        "section": item.section,
        "notes": '',
        "override": false,
        "overrideid": null
      }
      
      standardized.push(standardizedItem);
    }
    
    return standardized;
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

  async function _addEndDateEventToCalendar(params) {
    var description = 'Term end date scheduled for:';
    for (var i = 0; i < params.enrollments.length; i++) {
      var item = params.enrollments[i];
      description += '\n' + item.studentLast + ', ' + item.studentFirst + ' (' + item.section + ') original end date: ' + item.originalEndDate;
    }

    var result = await settings.google.objCalendar.addEvent({
        "calendarId": params.calendarId,
        "date": params.date,
        "summary": "End date",
        "description": description,
        "location": settings.eventLocation,
        "reminders": params.reminders
      }
    );
    
    console.log(result);
  }
  
  async function _removeEndDateEventFromCalendar(params) {
    var result = await settings.google.objCalendar.removeEvent({
      "calendarId": params.calendarId,
      "eventId": params.eventId
    });    
    
    console.log(result);
  }
  
  async function _reloadConfigurationAndEvents() {
    var configOkay = await _loadConfiguration();
    if (!configOkay) {
      page.notice.setNotice('failed to load configuration');
      _setMainUIEnable(false);
      return;
    }
    
    var sourceSelection = _getSourceSelection();
    
    console.log('_reloadConfigurationAndEvents: ' + sourceSelection);
    
    if (sourceSelection == 'enddate-calendar') {
      settings.google.objCalendar.getCalendarInfo(_calendarInfoCallback);
    } else {
      _updateUI();
    }
  }  
  
  async function _replaceEvent(eventId, changedItem) {
    console.log('_replaceEvent');
    
    console.log('remove event: ' + eventId);
    var currentCalendarEvents = settings.eventEditor.getEventList(eventId);
    var newCalendarEvents = [];
    for (var i = 0; i < currentCalendarEvents.length; i++) {
      var item = currentCalendarEvents[i];
      if (item.student == changedItem.student && item.section == changedItem.section) {
        console.log('restore enrollment date: ' + JSON.stringify(item))
      } else {
        console.log('remake: ' + JSON.stringify(item))
      }
    }      
  }
    
  //--------------------------------------------------------------------------
  // callbacks
	//--------------------------------------------------------------------------
  function _calendarInfoCallback(success, results) {
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
  
  function _callbackAddEndDateEventBatch(results) {
    console.log('_callbackBatchAddEndDateEvent: ');
    console.log(results);
  }
  
  async function _callbackEditorEventChange(params) {
    var queryType = null;
    if (params.action == 'add') {
      queryType = 'insert';
      
    } else if (params.action == 'update') {
      queryType = 'update';
      
    } else if (params.action == 'delete') {
      _replaceEvent(params.data.eventid, params.data);
      //queryType = 'delete';
    }
    
    if (queryType) {
      dbResult = await SQLDBInterface.doPostQuery('enddate-manager/' + queryType, 'eventoverride', params.data);
      if (!dbResult.success) {
        page.setNotice('event update failed');
        console.log(dbResult.details);
      } else {
        await _reloadConfigurationAndEvents();
      }
    }
  }
  
  function _callbackEditorModeChange(mode) {
    var enable = (mode != 'editing');
    
    var menuIds = ['navManage', 'navOptions', 'navDebug'];
    for (var i = 0; i < menuIds.length; i++) {
      var elem = document.getElementById(menuIds[i]);
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
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
    if (settings.currentNavOption == 'navProfile') {
      settings.profile.save();
    }
    
    _setDirtyBit(false);
  }  
    
  async function _handleReload(e, skipConfirm) {
    if (!skipConfirm) {
      var msg = 'Any changes will be lost.\nChoose "OK" to continue with reloading';
      if (!confirm(msg)) return;
    }
    
    if (settings.currentNavOption == 'navProfile') {
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
    settings.google.isSignedIn = isSignedIn;

    _setMainUIEnable(false);
    
    if (isSignedIn) {    
      settings.google.objCalendar.getCalendarInfo(_calendarInfoCallback);
    }

    _enableNavOption('navGoogle', !isSignedIn, !isSignedIn);    
  }
  
  function _handleEnddateSourceChange(e) {
    var selection = e.target.id;

    settings.eventEditor.clear();
    
    var elemFileUpload = page.navManage.getElementsByClassName('uploadfile')[0];
    var elemFileUploadLabel = page.navManage.getElementsByClassName('uploadfile-label')[0];

    elemFileUpload.value = null;
    elemFileUploadLabel.innerHTML = 'choose file...';
    
    if (selection == 'enddate-calendar') {
      elemFileUpload.disabled = true;
      _setMainUIEnable(false);
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
    
    _setMainUIEnable(false);
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
    dbResult = await SQLDBInterface.doGetQuery('enddate-manager/query', 'configuration');

    if (dbResult.success) {
      var configData = dbResult.data.configuration[0];
      var overrideData = dbResult.data.eventoverride;
      
      var config = JSON.parse(JSON.stringify(settings.configuration));
      
      config.calendarId = configData.calendarid;
      config.emailNotificationMinutes = configData.emailnotificationminutes;
      config.popupNotificationMinutes = configData.popupnotificationminutes;
      
      config.calendarList = [];
      config.calendarEvents = [];
      
      config.enddateOverrides = [];
      for (var i = 0; i < overrideData.length; i++) {
        var item = overrideData[i];
        config.enddateOverrides.push({
          student: item.student,
          section: item.section,
          enddate: item.enddate,
          notes: item.notes,
          overrideid: item.eventoverrideid
        });
      }
      
      settings.configuration = config;      
    }
    
    return dbResult.success;
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
    parsedItem.enddate = item.start.date;
    parsedItem.eventid = item.id;
    
    var descriptionLines = item.description.split('\n');
    
    var studentList = [];
    for (var i = 1; i < descriptionLines.length; i++) {
      var parsedLine = descriptionLines[i].split('(');
      var student = parsedLine[0].trim();
      
      var delimiter1 = parsedLine[1].indexOf(')');
      var delimiter2 = parsedLine[1].indexOf('original end date:') + 'original end date: '.length;
      var section = parsedLine[1].slice(0, delimiter1).trim();
      var enrollmentEndDate = parsedLine[1].slice(delimiter2).trim();
      studentList.push({"student": student, "section": section, "enddate": item.end.date, "enrollmentenddate": enrollmentEndDate});
    }

    parsedItem.studentList = studentList;
    
    return parsedItem;
  }
  
  function _formatAsShortDate(date) {
    // hack due to time zone problems
    return date.toString().slice(0,10);
  }
  
  function _getSourceSelection() {
    var sourceSelection = null;
    
    var elems = page.navManage.getElementsByClassName('enddate-option');
    for (var i = 0; i < elems.length && !sourceSelection; i++) {
      var item = elems[i];
      if (item.checked) sourceSelection = item.id;
    }
    return sourceSelection;
  }

  //--------------------------------------------------------------------------
  // test stuff
	//--------------------------------------------------------------------------  
  function _testAddEvent(e) {
    var elemCalendar = page.navDebug.getElementsByClassName('calendar-selection')[0];
    
    var enrollmentList = [
      {studentLast: "Baggins", studentFirst: "Frodo", section: "Unmaking Rings", originalEndDate: '2021-09-02'},
    ];
    
    var params = {
      "calendarId": settings.configuration.calendarId,
      "date": '2021-06-01',
      "enrollments": enrollmentList,
      "reminders": [
        {method: 'email', minutes: 6 * 60},
        {method: 'popup', minutes: 12 * 60}
      ]
    }
    
    _addEndDateEventToCalendar(params);
  }
  
  function _testDeleteEvent(e) {
    var eventId = prompt('event id');
    if (!eventId) return;
    
    var params = {
      "calendarId":  settings.configuration.calendarId,
      "eventId": eventId
    };

    _removeEndDateEventFromCalendar(params);    
  }
    
  function _testBatchAddEvent(e) {
    console.log('_testBatchAddEvent');
    
    settings.google.objCalendar.addBatchOfAllDayEvents(
      [
        {
          "calendarId": settings.configuration.calendarId,
          "date": '2021-06-27',
          "summary": "End date",
          "description": 'batch test 1',
          "location": settings.eventLocation,
          "reminders": null //params.reminders
        },
        {
          "calendarId": settings.configuration.calendarId,
          "date": '2021-06-28',
          "summary": "End date",
          "description": 'batch test 1',
          "location": settings.eventLocation,
          "reminders": null //params.reminders
        }
      ],
      
      _callbackAddEndDateEventBatch
    );    
  }
        
  function _testEventEditorGetList(e) {
    console.log(settings.eventEditor.getEventList());
  }

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();