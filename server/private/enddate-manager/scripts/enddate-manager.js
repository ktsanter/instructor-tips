//-----------------------------------------------------------------------
// End date manager
//-----------------------------------------------------------------------
// TODO: eliminate use of settings.configuration.enrollmentList
// TODO: disable and spinner when add/edit/delete override
// TODO: work out how to reconcile overrides with enrollment upload
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
      calendarId: null,
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
  }
  
  function _renderOptions() {
    page.navOptions = page.contents.getElementsByClassName('contents-navOptions')[0];
    
    page.navOptions.getElementsByClassName('uploadfile')[0].addEventListener('change', (e) => { _uploadEnrollments(e); });
    page.navOptions.getElementsByClassName('calendar-selection')[0].addEventListener('change', (e) => { _handleCalendarSelectChange(e); });
  }
  
  function _renderDebug() {
    page.navDebug = page.contents.getElementsByClassName('contents-navDebug')[0];
    
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
    var elemFileUpload = page.navOptions.getElementsByClassName('uploadfile')[0];
    var elemFileUploadLabel = page.navOptions.getElementsByClassName('uploadfile-label')[0];

    elemFileUpload.value = null;
    elemFileUploadLabel.innerHTML = 'enrollment report';
    
    console.log(settings.configuration.calendarList);
    console.log(' - set notification options and amounts');
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
    _updateEventUI(_standardizeCalendarEvents(), _standardizeOverrides());
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
          
    _setMainUIEnable(settings.google.isSignedIn);
  }
  
  function _updateEventUI(eventList, overrideList) {
    var reconciled = [];
    for (var i = 0; i < eventList.length; i++) {
      var item = eventList[i];
      
      var overrideItem = _findMatchInList(item, overrideList);
      if (overrideItem) {
        var enrollmentEndDate = item.enrollmentenddate;
        var eventId = item.eventid;
        item = JSON.parse(JSON.stringify(overrideItem));
        item.enrollmentenddate = enrollmentEndDate;
        item.eventid = eventId;
      }
        
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
  
  function _makeEndDateEventParams(eventInfo) {
    var description = 'Term end date scheduled for:';
    for (var i = 0; i < eventInfo.enrollments.length; i++) {
      var item = eventInfo.enrollments[i];
      description += '\n' + item.student + ' | ' + item.section + ' | original end date: ' + item.originalEndDate;
    }
    
    var reminders = [
      {"method": 'email', "minutes": 360},
      {"method": 'popup', "minutes": 720}
    ];

    return {
        "calendarId": settings.configuration.calendarId,
        "date": eventInfo.date,
        "summary": "End date",
        "description": description,
        "location": settings.eventLocation,
        "reminders": reminders
      }
  }
  
  async function _replaceEvent(eventParams) {
    if (eventParams.enddate == eventParams.currentenddate) {
      console.log('new and current are same date');
      return true;
    }
    
    var itemsWithSameId = settings.eventEditor.getEventList({queryType: 'eventid', eventid: eventParams.eventid});
    var itemsWithSameTargetDate = settings.eventEditor.getEventList({queryType: 'enddate', enddate: eventParams.enddate});

    var eventsToRemove = new Set([eventParams.eventid]);
    for (var i = 0; i < itemsWithSameTargetDate.length; i++) {
      var item = itemsWithSameTargetDate[i];
      if (item.eventid != eventParams.eventid) eventsToRemove.add(item.eventid);
    }
    
    var objEventsToAdd = [];
    objEventsToAdd[eventParams.enddate] = {
      enrollments: [{
        student: eventParams.student,
        section: eventParams.section,
        originalEndDate: eventParams.enrollmentenddate
      }]
    };
    
    for (var i = 0; i < itemsWithSameId.length; i++) {
      var item = itemsWithSameId[i];
      var enddate = item.enddate;
      if (item.student != eventParams.student || item.section != eventParams.section) {
        if (!objEventsToAdd.hasOwnProperty(enddate)) {
          objEventsToAdd[enddate] = { enrollments: [] };
        }

        objEventsToAdd[enddate].enrollments.push({
          student: item.student,
          section: item.section,
          originalEndDate: item.enrollmentenddate
        });
      }
    }
    
    for (var i = 0; i < itemsWithSameTargetDate.length; i++) {
      var item = itemsWithSameTargetDate[i];
      if (item.student != eventParams.student || item.section != eventParams.section) {
        var enddate = item.enddate;
        if (!objEventsToAdd.hasOwnProperty(enddate)) {
          objEventsToAdd[enddate] = { enrollments: [] };
        }

        objEventsToAdd[enddate].enrollments.push({
          student: item.student,
          section: item.section,
          originalEndDate: item.enrollmentenddate
        });
      }
    }
    
    var eventsToAdd = [];
    for (var enddate in objEventsToAdd) {
      eventsToAdd.push(_makeEndDateEventParams({"date": enddate, "enrollments": objEventsToAdd[enddate].enrollments}));
    }
    
    var removeResult = await settings.google.objCalendar.removeEventBatch(settings.configuration.calendarId, Array.from(eventsToRemove));
    if (!removeResult) return false;

    var addResult = await settings.google.objCalendar.addEventBatch(eventsToAdd);
    if (!addResult) return false;
  
    return true;
  }
    
  async function _reloadConfigurationAndEvents() {
    var configOkay = await _loadConfiguration();
    if (!configOkay) {
      page.notice.setNotice('failed to load configuration');
      _setMainUIEnable(false);
      return;
    }

    settings.google.objCalendar.getCalendarInfo(_calendarInfoCallback);
  }  
  
  function _loadCalendarSelect(calendarList, calendarId) {
    var elemSelect = page.navOptions.getElementsByClassName('calendar-selection')[0];    
    UtilityKTS.removeChildren(elemSelect);
    
    for (var i = 0; i < calendarList.length; i++) {
      var item = calendarList[i];
      var elem = CreateElement.createOption(null, null, item.id, item.summary);
      elemSelect.appendChild(elem);
      if (item.id ==   calendarId) elemSelect.selectedIndex = i;
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
    _loadCalendarSelect(settings.configuration.calendarList, settings.configuration.calendarId);

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
  
  async function _callbackEditorEventChange(params) {
    var queryType = null;
    if (params.action == 'add') {
      queryType = 'insert';  
      
    } else if (params.action == 'update') {
      queryType = 'update';
      
    } else if (params.action == 'delete') {
      queryType = 'delete';
    }
    
    if (!queryType) return;
    
    dbResult = await SQLDBInterface.doPostQuery('enddate-manager/' + queryType, 'eventoverride', params.data);
    
    if (!dbResult.success) {
      page.notice.setNotice('event update failed');
      console.log(dbResult.details);
      return;
    }

    var calendarSuccess = await _replaceEvent({
      eventid: params.data.eventid,
      student: params.data.student,
      section: params.data.section,
      enddate:( queryType == 'delete') ? params.data.enrollmentenddate : params.data.enddate,
      currentenddate: params.data.currentenddate,
      enrollmentenddate: params.data.enrollmentenddate
    });
    if (!calendarSuccess) return;
    
    await _reloadConfigurationAndEvents();
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
      
  async function _uploadEnrollments(e) {
    var elem = page.navOptions.getElementsByClassName('uploadfile')[0];
    var fileList = elem.files;
    if (fileList.length == 0) {
      console.log('no file chosen');
      return;
    }

    page.navOptions.getElementsByClassName('uploadfile-label')[0].innerHTML = fileList[0].name;

    page.notice.setNotice('loading...', true);
    _setMainUIEnable(false);
    var result = await _formPost('/usermanagement/routeToApp/enddate-manager/upload', fileList[0]);
    if (result.success) {
      
      var removeResult = await _removeCalendarEvents();
      console.log('removeResult: ' + JSON.stringify(removeResult));
      
      var addResult = await _addEnrollmentListToCalendar(result.data);
      console.log('addResult: ' + JSON.stringify(addResult));
      
      page.notice.setNotice('');
      page.navbar.getElementsByClassName(settings.navItemClass)[0].click()
      _reloadConfigurationAndEvents();
    }  
  }
  
  async function _removeCalendarEvents() {
    var removeList = [];
    for (var i = 0; i < settings.configuration.calendarEvents.length; i++) {
      var item = settings.configuration.calendarEvents[i];
      removeList.push(item.eventid);
    }
    
    return await settings.google.objCalendar.removeEventBatch(settings.configuration.calendarId, removeList);
  }
  
  async function _addEnrollmentListToCalendar(enrollmentList) {
    var collated = _collateEnrollments(enrollmentList);
    
    var addList = [];
    for (var enddate in collated) {
      var item = collated[enddate];
      addList.push(_makeEndDateEventParams(item));
    }
    
    console.log('reconcile overrides with new events');
   
    return await settings.google.objCalendar.addEventBatch(addList);
  }
  
  function _collateEnrollments(enrollmentList) {
    var standardized = [];

    for (var i = 0; i < enrollmentList.length; i++) {
      var item = enrollmentList[i];
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
    
    var collated = [];
    for (var i = 0; i < standardized.length; i++) {
      var item = standardized[i];
      var enddate = item.enddate;
      if (!collated.hasOwnProperty(enddate)) {
        collated[enddate] = {
          "date": enddate,
          "calendarId": settings.configuration.calendarId,
          "reminders": [
            {"method": "email", "minutes": 360},
            {"method": "popup", "minutes": 720}
          ],
          enrollments: []
        };
      }
      
      collated[enddate].enrollments.push({
        "originalEndDate": enddate,
        "section": item.section,
        "student": item.student
      });
    }
    
    return collated;
  }

  function _handleCalendarSelectChange(e) {
    console.log('_handleCalendarSelectChange');
    var elem = e.target[e.target.selectedIndex];
    console.log(' - confirm change');
    console.log(' - remove all calendar events from current');
    console.log(' - change calendar to: ' + elem.value);
    console.log(' - add calendar events to new');
    console.log(' - select "manage"');
    console.log(' - call _reloadConfigurationAndEvents');
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
    parsedItem.enddate = item.start.date;
    parsedItem.eventid = item.id;
    
    var descriptionLines = item.description.split('\n');
    
    var studentList = [];
    for (var i = 1; i < descriptionLines.length; i++) {
      var parsedLine = descriptionLines[i].split(' | ');
      var student = parsedLine[0].trim();
      var section = parsedLine[1].trim();
      var enrollmentEndDate = parsedLine[2].trim().slice(-10);

      studentList.push({"student": student, "section": section, "enddate": item.end.date, "enrollmentenddate": enrollmentEndDate});
    }

    parsedItem.studentList = studentList;
    
    return parsedItem;
  }
  
  function _formatAsShortDate(date) {
    // hack due to time zone problems
    return date.toString().slice(0,10);
  }

  //--------------------------------------------------------------------------
  // test stuff
	//--------------------------------------------------------------------------  

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();