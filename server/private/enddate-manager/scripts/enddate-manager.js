//-----------------------------------------------------------------------
// End date manager
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/enddate-manager/help',
    logoutURL: '/usermanagement/logout/enddate-manager',
    owaURL: 'https://outlook.office365.com/mail/inbox',
    googleCalendarURL: 'https://calendar.google.com/calendar',
    rosterManagerURL: '/roster-manager',
    
    dirtyBit: {
      "navManage": false,
      "navOptions": false
    },
    
    google: {
      obj: null,
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
      ],
      clientId:  '780404244540-nug55q7bnd7daf3dpj5k5g8qob9uqv41.apps.googleusercontent.com',
      scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      //https://www.googleapis.com/auth/calendar
      isSignedIn: false,
      objCalendar: null
    },
    
    configuration: {
      calendarId: null,
      calendarList: [],
      calendarEvents: []
    },
    
    eventLocation: 'End date manager',
    adminDisable: false
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {    
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);
    
    await _setAdminMenu();

    page.navbar = page.body.getElementsByClassName('navbar')[0];
    _setMainNavbarEnable(false);
    
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
    await _initializeGoogleStuff();

    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
  }
  
  async function _setAdminMenu() {
    _enableNavOption('navAdmin', false, false);
    
    dbResult = await SQLDBInterface.doGetQuery('enddate-manager/query', 'admin-allowed');
    if (!dbResult.success) return;
    
    var adminAllowed = (dbResult.data.adminallowed && !settings.adminDisable);
    _enableNavOption('navAdmin', adminAllowed, adminAllowed);
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
    
  async function _initializeGoogleStuff() {
    var result = await SQLDBInterface.doGetQuery('enddate-manager/query', 'apikey', page.notice);
    if (!result.success) return;
    
    settings.google.obj = new GoogleManagement({
      "discoveryDocs": settings.google.discoveryDocs,
      "clientId": settings.google.clientId,
      "apiKey": result.data,
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
    _enableNavOption('navClearFilters', false, false);
    
    _renderManage();
    _renderOptions();
    _renderAdmin();
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
      callbackModeChange: _callbackEditorModeChange,
      callbackClearFiltersVisibility: (makeVisible) => { _enableNavOption('navClearFilters', makeVisible, makeVisible); }
    });
    settings.eventEditor.render();
    
    var btnClearFilters = page.navManage.getElementsByClassName('btn-clearfilter')[0];
    var navoptionClearFilters = document.getElementById('navClearFilters');
    navoptionClearFilters.parentNode.replaceChild(btnClearFilters, navoptionClearFilters);
    btnClearFilters.addEventListener('click', (e) => { settings.eventEditor.clearFilters(); });
    _enableNavOption('navClearFilters', false, false);
  }
  
  function _renderOptions() {
    page.navOptions = page.contents.getElementsByClassName('contents-navOptions')[0];
    
    page.navOptions.getElementsByClassName('uploadfile')[0].addEventListener('change', (e) => { _uploadEnrollments(e); });
    page.navOptions.getElementsByClassName('calendar-selection')[0].addEventListener('change', (e) => { _handleCalendarSelectChange(e); });
    
    var elems = page.navOptions.getElementsByClassName('notification-check');
    for (var i = 0; i < elems.length; i++) {
      elems[i].addEventListener('change', (e) => { _handleNotificationChange(e); });
    }

    elems = page.navOptions.getElementsByClassName('notification-number');
    for (var i = 0; i < elems.length; i++) {
      elems[i].addEventListener('change', (e) => { _handleNotificationChange(e); });
    }
    
    page.navOptions.getElementsByClassName('button-notification-save')[0].addEventListener('click', (e) => { _handleSaveNotifications(e); });
  }
  
  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];
    
    page.navAdmin.getElementsByClassName('btnSignout')[0].addEventListener('click', (e) => { _handleGoogleSignout(e); });
    page.navAdmin.getElementsByClassName('btnRemoveEvents')[0].addEventListener('click', (e) => { _handleRemoveEvents(e); });
    page.navAdmin.getElementsByClassName('btnToggleAdmin')[0].addEventListener('click', (e) => { _handleToggleAdmin(e); });
    
    page.navAdmin.getElementsByClassName('btnTest')[0].addEventListener('click', (e) => { _handleTest(e); });
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
    if (contentsId == 'navAdmin') _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showManage() {}
  
  function _showOptions() {
    var elemFileUpload = page.navOptions.getElementsByClassName('uploadfile')[0];
    var elemFileUploadLabel = page.navOptions.getElementsByClassName('uploadfile-label')[0];

    elemFileUpload.value = null;
    elemFileUploadLabel.innerHTML = 'upload';

    var elemEmailCheck = page.navOptions.getElementsByClassName('email-check')[0];
    var elemEmailNumber = page.navOptions.getElementsByClassName('email-number')[0];
    var elemPopupCheck = page.navOptions.getElementsByClassName('popup-check')[0];
    var elemPopupNumber = page.navOptions.getElementsByClassName('popup-number')[0];
    var elemSave = page.navOptions.getElementsByClassName('button-notification-save')[0];
    
    var useEmail = settings.configuration.emailNotification;
    elemEmailCheck.checked = useEmail;
    elemEmailNumber.disabled = !useEmail;
    elemEmailNumber.value = settings.configuration.emailNotificationMinutes / 60
    
    var usePopup = settings.configuration.popupNotification;
    elemPopupCheck.checked = usePopup;
    elemPopupNumber.disabled = !usePopup;
    elemPopupNumber.value = settings.configuration.popupNotificationMinutes / 60
    
    elemSave.disabled = true;    
  }
  
  function _showAdmin() {
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    
    if (opt == 'navProfile') {
      var enable = settings.profile.isDirty();
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
    } else {
      _enableNavOption('navSave', false, false);
      _enableNavOption('navReload', false, false);
    }
  }
    
  function _handleCalendarOpen() {
    window.open(settings.googleCalendarURL, '_blank');
  }
  
  function _handleOWAOpen() {
    window.open(settings.owaURL, '_blank');
  }
   
  function _doRosterManager() {
    window.open(settings.rosterManagerURL, '_blank');
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
          containers[i].classList.contains('contents-navAdmin')) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }

  function _updateUI() {
    _updateEventUI(_standardizeCalendarEvents(), _standardizeOverrides());
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
    page.notice.setNotice('');
    
    _setMainUIEnable(settings.google.isSignedIn);
    _setMainNavbarEnable(settings.google.isSignedIn);   
  }
  
  async function _updateEventUI(eventList, overrideList) {
    var reconciled = eventList;

    var reconciled = [];
    for (var i = 0; i < eventList.length; i++) {
      var item = JSON.parse(JSON.stringify(eventList[i]));
      
      var overrideItem = _findMatchInList(item, overrideList);
      if (overrideItem) {
        item.override = true;
        item.overrideid = overrideItem.overrideid;
        item.notes = overrideItem.notes;
        item.enddate = overrideItem.enddate;
        item.enrolmmentenddate = overrideItem.enrollmentenddate;
      }

      reconciled.push(item);
    }
    
    await _removeOrphanedOverrides(eventList, overrideList);
    
    settings.eventEditor.update(reconciled);
  }
  
  async function _removeOrphanedOverrides(eventList, overrideList) {
    var orphanedList = [];
    
    for (var i = 0; i < overrideList.length; i++) {
      var override = overrideList[i];
      if (!_findMatchInList(override, eventList)) orphanedList.push(override);
    }
    
    if (orphanedList.length > 0) {
      console.log('orphaned override items', orphanedList);
      var dbResult = await SQLDBInterface.doPostQuery('enddate-manager/update', 'orphaned-overrides', {"orphans": orphanedList});  
      if (!dbResult.success) {
        page.notice.setNotice('failed to remove orphaned overrides');
        console.log(dbResult.details);
      }
    }
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
          "term": subItem.term,
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
          "enrollmentenddate": item.enrollmentenddate,
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
      description += '\n' + item.student + ' | ' + item.section + ' | ' + item.term + ' | enrollment: ' + item.originalEndDate;
    }
    
    var reminders = [];
    if (settings.configuration.emailNotification) {
      reminders.push({"method": "email", "minutes": settings.configuration.emailNotificationMinutes});
    }
    if (settings.configuration.popupNotification) {
      reminders.push({"method": "popup", "minutes": settings.configuration.popupNotificationMinutes});
    }

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

    var batchParams = [];

    var eventsToRemove = new Set([eventParams.eventid]);
    for (var i = 0; i < itemsWithSameTargetDate.length; i++) {
      var item = itemsWithSameTargetDate[i];
      if (item.eventid != eventParams.eventid) eventsToRemove.add(item.eventid);
    }
    var eventsToRemoveList = Array.from(eventsToRemove);
    for (var i = 0; i < eventsToRemoveList.length; i++) {
      batchParams.push({
        "action": 'remove',
        "params": {"calendarId": settings.configuration.calendarId, "eventId": eventsToRemoveList[i]}
      });
    }
    
    var objEventsToAdd = [];
    objEventsToAdd[eventParams.enddate] = {
      enrollments: [{
        student: eventParams.student,
        section: eventParams.section,
        term: eventParams.term,
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
          term: item.term,
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
          term: item.term,
          originalEndDate: item.enrollmentenddate
        });
      }
    }
    
    for (var enddate in objEventsToAdd) {
      batchParams.push({
        "action": 'add',
        "params": _makeEndDateEventParams({"date": enddate, "enrollments": objEventsToAdd[enddate].enrollments})
      });
    }
    
    var result = await settings.google.objCalendar.executeBatch(batchParams);
    
    return result.success;
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
  
  async function _changeNotifications(params) {
    var msg = 'The new notification settings will be applied to all calendar events.';
    msg += '\n\nChoose "Okay" to proceed';
    if (!confirm(msg)) return false;
    
    _setMainNavbarEnable(false);
    _setMainUIEnable(false);
    var dbResult = await SQLDBInterface.doPostQuery('enddate-manager/update', 'notification', params);    
    if (!dbResult.success) {
      page.notice.setNotice('failed to save notification info');
      console.log(dbResult.details);
      return false;
    }

    settings.configuration.emailNotification = params.emailnotification;
    settings.configuration.emailNotificationMinutes = params.emailnotificationminutes;
    settings.configuration.popupNotification = params.popupnotification;
    settings.configuration.popupNotificationMinutes = params.popupnotificationminutes;

    var success = await _rewriteAllCalendarEvents(settings.configuration.calendarId, settings.configuration.calendarId);
    
    if (success) {
      _reloadConfigurationAndEvents();
    }
    
    return success;
  }
  
  async function _changeCalendar(params) {
    var msg = 'All calendar events will be moved from the current calendar to the new one.';
    msg += '\nfrom: "' + params.sourcecalendarname + '"';
    msg += '\nto: "' + params.destcalendarname + '"';
    msg += '\n\nChoose "Okay" to continue with the move.';
    if (!confirm(msg)) return false;
    
    _setMainNavbarEnable(false);
    _setMainUIEnable(false);
    var dbResult = await SQLDBInterface.doPostQuery('enddate-manager/update', 'calendar', {calendarid: params.destcalendarid});
    if (!dbResult.success) {
      page.notice.setNotice('failed to save calendar info');
      console.log(dbResult.details);
      return false;
    }

    var success = await _rewriteAllCalendarEvents(params.sourcecalendarid, params.destcalendarid);

    if (success) {
      _reloadConfigurationAndEvents();
    }
    
    return success;
  }
  
  async function _rewriteAllCalendarEvents(sourceCalendarId, destCalendarId) {
    var eventList = settings.eventEditor.getEventList();
    var batchParams = [];
    
    var eventsToRemove = new Set([]);
    for (var i = 0; i < eventList.length; i++) {
      eventsToRemove.add(eventList[i].eventid);
    }

    var arrEventsToRemove = Array.from(eventsToRemove);
    for (var i = 0; i < arrEventsToRemove.length; i++) {;
      batchParams.push({action: 'remove', params: {"calendarId": sourceCalendarId, "eventId": arrEventsToRemove[i]}});
    }

    var success = await settings.google.objCalendar.executeBatch(batchParams);
    if (!success) return false;
    
    var collated = _collateEnrollments(eventList);
    
    var batchParams = [];
    for (var enddate in collated) {
      var item = collated[enddate];
      var formattedItem = _makeEndDateEventParams(item);
      formattedItem.calendarId = destCalendarId;
      batchParams.push({action: 'add', params: formattedItem});
    }
    
    return await settings.google.objCalendar.executeBatch(batchParams);
  } 
  
  function _exportToExcel() {
    var exportData = settings.eventEditor.getEventList();
    var elemForm = page.navManage.getElementsByClassName('export-form')[0];
    elemForm.getElementsByClassName('export-data')[0].value = JSON.stringify(exportData);
    elemForm.submit();    
  }
  
  //--------------------------------------------------------------------------
  // callbacks
	//--------------------------------------------------------------------------
  function _calendarInfoCallback(success, results) {
    console.log('_calendarInfoCallback', success, results);
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
      console.log('item #' + i, item.summary, item.accessRole, item.primary);
      if (item.accessRole == 'owner') {
        console.log('  - adding "' + item.summary + '" to filteredCalendarList');
        filteredCalendarList.push(item);

        if (settings.configuration.calendarId == null && item.hasOwnProperty('primary') && item.primary) {
          console.log('  - setting "' + item.summary + '" as configured');
          settings.configuration.calendarId = item.id;
        }
      }
    }

    if (filteredCalendarList.length == 0) {
      console.log('no qualified calendars found');
    }
    
    if (filteredCalendarList.length > 0 && !settings.configuration.calendarId) {
      console.log('no calendar selected or identified as "owner" and "primary"');
      var item = filteredCalendarList[0];
      console.log('  - defaulting to: "' + item.summary);
      settings.configuration.calendarId = item.id;
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
      var msg = 'The override information for this item will be removed and the enrollment end date restored\n';
      msg += '\n' + params.data.student;
      msg += '\n' + params.data.section;
      msg += '\nend date: ' + params.data.enddate;
      msg += '\nenrollment end date: ' + params.data.enrollmentenddate;
      msg += '\n\nChoose "Okay" to continue with the removal';
      if (!confirm(msg)) return;
      
      queryType = 'delete';
    }
    
    if (!queryType) return;
    
    _setMainUIEnable(false);
    _setMainNavbarEnable(false);
    page.notice.setNotice('updating...', true);
    
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
      term: params.data.term,
      enddate:( queryType == 'delete') ? params.data.enrollmentenddate : params.data.enddate,
      currentenddate: params.data.currentenddate,
      enrollmentenddate: params.data.enrollmentenddate
    });
    if (!calendarSuccess) return;
    
    await _reloadConfigurationAndEvents();
    _setMainNavbarEnable(true);
  }
  
  function _callbackEditorModeChange(mode) {
    var enable = (mode != 'editing');
    _setMainNavbarEnable(enable);
  }
  
  function _callbackGoogleReauth(result) {
    console.log('_callbackGoogleReauth', result);
    if (result.success) location.reload();
  }
  
  function _setMainNavbarEnable(enable) {
    var menuIds = ['navManage', 'navOptions', 'navAdmin'];
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
    if (e.target.classList.contains('use-parentid')) dispatchTarget = e.target.parentNode.id;

    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    _emphasizeMenuOption(settings.currentNavOption, false);
    _emphasizeMenuOption(dispatchTarget, true);

    var dispatchMap = {
      "navManage": function() { _showContents('navManage');},
      "navOptions": function() { _showContents('navOptions'); },
      "navAdmin": function() { _showContents('navAdmin'); },
      "navGoogle": function() { _handleGoogleSignIn(); },
      "navGoogleReAuth": function() { _handleGoogleReauthorization(); },
      "navCalendar": function() { _handleCalendarOpen(); },
      "navExport": function() { _exportToExcel(); },
      "navOWA": function() { _handleOWAOpen(); },
      "navRosterManager": function() { _doRosterManager(); },      
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e, false);}
    }
    dispatchMap[dispatchTarget]();
  }
  
  function _emphasizeMenuOption(menuOption, emphasize) {
    var mainOptions = new Set(['navManage', 'navOptions', 'navAdmin']);
    if (mainOptions.has(menuOption)) {
      var elem = document.getElementById(menuOption);
      UtilityKTS.setClass(elem, 'menu-emphasize', emphasize);
    }
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
  
  function _handleGoogleReauthorization() {
    console.log('_handleGoogleReauthorization');
    settings.google.obj.trySignIn(_callbackGoogleReauth);
  }
  
  function _handleGoogleSignout() {
    settings.google.obj.signout();
  }
  
  async function _signInChangeForGoogle(isSignedIn) {
    settings.google.isSignedIn = isSignedIn;
    console.log('_signInChangeForGoogle', isSignedIn);

    _setMainUIEnable(false);
    
    if (isSignedIn) {    
      settings.google.objCalendar.getCalendarInfo(_calendarInfoCallback);
    }

    _enableNavOption('navGoogle', !isSignedIn, !isSignedIn);    
  }
  
  async function _handleToggleAdmin() {
    settings.adminDisable = !settings.adminDisable;
    _setAdminMenu();
  }
  
  async function _handleTest() {
    console.log('_handleTest');
    console.log('stub');   
  }
  
  function _handleRemoveEvents() {
    _adminClearAllEvents();
  }
      
  async function _uploadEnrollments(e) {
    var elem = page.navOptions.getElementsByClassName('uploadfile')[0];
    var fileList = elem.files;
    if (fileList.length == 0) {
      console.log('no file chosen');
      return;
    }
    
    var numCurrentEvents = settings.eventEditor.getEventList().length;
    if (numCurrentEvents > 0) {
      var msg = 'The current calendar entries will be removed and replaced by the data in the uploaded file, however all overrides will be preserved.';
      msg += '\n\nChoose "Okay" to continue with the upload';
      if (!confirm(msg)) return;
    }

    page.navOptions.getElementsByClassName('uploadfile-label')[0].innerHTML = fileList[0].name;

    page.notice.setNotice('loading...', true);
    _setMainUIEnable(false);
    var result = await _enrollmentReportPost('/usermanagement/routeToApp/enddate-manager/upload', fileList[0]);
    if (!result.success) {
      page.notice.setNotice(result.details);
      alert(result.details);
      _setMainUIEnable(true);
      return;
    }
    
    var removeResult = await _removeCalendarEvents();
    
    var addResult = await _addEnrollmentListToCalendar(result.data);
    
    page.notice.setNotice('');
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click()
    _reloadConfigurationAndEvents();
  }
  
  async function _removeCalendarEvents() {
    var batchParams = [];
    for (var i = 0; i < settings.configuration.calendarEvents.length; i++) {
      var item = settings.configuration.calendarEvents[i];
      batchParams.push({
        "action": 'remove',
        "params": {"calendarId": settings.configuration.calendarId, "eventId": item.eventid}
      });
    }
    
    var result = await settings.google.objCalendar.executeBatch(batchParams);

    return result.success;
  }
  
  async function _addEnrollmentListToCalendar(enrollmentList) {
    var collated = _collateEnrollments(enrollmentList, _standardizeOverrides());
    var batchParams = [];
    for (var enddate in collated) {
      var item = collated[enddate];
      batchParams.push({
        "action": 'add',
        "params": _makeEndDateEventParams(item)
      });
    }
   
    var result = await settings.google.objCalendar.executeBatch(batchParams);

    return result.success;
  }
  
  function _collateEnrollments(enrollmentList, overrideList) {
    var standardized = [];

    for (var i = 0; i < enrollmentList.length; i++) {
      var item = enrollmentList[i];
      
      var standardizedItem = {
        "enddate": _formatAsShortDate(item.enddate),
        "enrollmentenddate": _formatAsShortDate(item.enddate),
        "student": item.student,
        "section": item.section,
        "term": item.term,
        "notes": '',
        "override": false,
        "overrideid": null
      }
      
      if (overrideList) {
        var overrideItem = _findMatchInList(standardizedItem, overrideList);
        if (overrideItem) {
          standardizedItem.enddate = overrideItem.enddate;
          standardizedItem.enrollmentenddate = overrideItem.enrollmentenddate;
          standardizedItem.override = true;
          standardizedItem.overrideid = overrideItem.overrideid;
          standardizedItem.notes = overrideItem.notes;
        }
      }

      standardized.push(standardizedItem);
    }
    
    var collated = [];
    var reminders = [];
    if (settings.configuration.emailNotification) {
      reminders.push({"method": "email", "minutes": settings.configuration.emailNotificationMinutes});
    }
    if (settings.configuration.popupNotification) {
      reminders.push({"method": "popup", "minutes": settings.configuration.popupNotificationMinutes});
    }
    
    for (var i = 0; i < standardized.length; i++) {
      var item = standardized[i];
      var enddate = item.enddate;
      if (!collated.hasOwnProperty(enddate)) {
        collated[enddate] = {
          "date": enddate,
          "calendarId": settings.configuration.calendarId,
          "reminders": reminders,
          enrollments: []
        };
      }
      
      collated[enddate].enrollments.push({
        "originalEndDate": item.enrollmentenddate,
        "section": item.section,
        "student": item.student,
        "term": item.term
      });
    }
    
    return collated;
  }

  async function _handleCalendarSelectChange(e) {
    var sourceCalendarId = settings.configuration.calendarId;
    var sourceCalendarName = null;
    var opts = e.target.getElementsByTagName('option');
    for (var i = 0; i < opts.length && !sourceCalendarName; i++) {
      if (opts[i].value == sourceCalendarId) sourceCalendarName = opts[i].text;
    }
    
    var destCalendarId = e.target[e.target.selectedIndex].value;
    var destCalendarName = e.target[e.target.selectedIndex].text;
    
    var success = await _changeCalendar({
      "sourcecalendarid": sourceCalendarId,
      "sourcecalendarname": sourceCalendarName,
      "destcalendarid": destCalendarId,
      "destcalendarname": destCalendarName
    });
  }
  
  function _handleNotificationChange(e) {    
    var elemEmailCheck = page.navOptions.getElementsByClassName('email-check')[0];
    var elemEmailNumber = page.navOptions.getElementsByClassName('email-number')[0];
    var elemPopupCheck = page.navOptions.getElementsByClassName('popup-check')[0];
    var elemPopupNumber = page.navOptions.getElementsByClassName('popup-number')[0];
    var elemSave = page.navOptions.getElementsByClassName('button-notification-save')[0];
    
    elemEmailNumber.disabled = !elemEmailCheck.checked;
    elemPopupNumber.disabled = !elemPopupCheck.checked;
    elemSave.disabled = false;
  }
  
  async function _handleSaveNotifications(e) {
    var elemEmailCheck = page.navOptions.getElementsByClassName('email-check')[0];
    var elemEmailNumber = page.navOptions.getElementsByClassName('email-number')[0];
    var elemPopupCheck = page.navOptions.getElementsByClassName('popup-check')[0];
    var elemPopupNumber = page.navOptions.getElementsByClassName('popup-number')[0];
    var elemSave = page.navOptions.getElementsByClassName('button-notification-save')[0];

    var params = {
      "emailnotification": elemEmailCheck.checked,
      "emailnotificationminutes": elemEmailNumber.value * 60,
      "popupnotification": elemPopupCheck.checked,
      "popupnotificationminutes": elemPopupNumber.value * 60
    }
    
    var success = await _changeNotifications(params);
    if (success) elemSave.disabled = true;
  }
    
  //----------------------------------------
  // enrollment report post
  //----------------------------------------
  async function _enrollmentReportPost(url, fileToPost) {
    const METHOD_TITLE = '_enrollmentReportPost';
    
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
      config.emailNotification = (configData.emailnotification == 1);
      config.emailNotificationMinutes = configData.emailnotificationminutes;
      config.popupNotification = (configData.popupnotification == 1);
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
          enrollmentenddate: item.enrollmentenddate,
          notes: item.notes,
          overrideid: item.eventoverrideid
        });
      }
      
      settings.configuration = config;    
    }
    
    return dbResult.success;
  }

  //--------------------------------------------------------------------------
  // admin
  //--------------------------------------------------------------------------
  function _adminClearAllEvents() {
    var msg = 'All end date manager events will be removed from calendar.';
    if (!confirm(msg)) return;
    
    _setMainUIEnable(false);
    
    settings.google.objCalendar.getEventInfo({
      "calendarId": settings.configuration.calendarId
    },  _adminClearAllEventsCallback);
  }
  
  async function _adminClearAllEventsCallback(success, results) {
    if (!success) {
      console.log('error: ' + JSON.stringify(results));
      return;
    }
    
    var toRemoveSet = new Set([]);
    for (var i = 0; i < results.items.length; i++) {
      var item = results.items[i];
      if (item.location == settings.eventLocation) toRemoveSet.add(item.id);
    }
    
    var toRemoveList = Array.from(toRemoveSet);
    var batchParams = [];
    for (var i = 0; i < toRemoveList.length; i++) {
      batchParams.push({
        action: 'remove',
        params: {calendarId: settings.configuration.calendarId, "eventId": toRemoveList[i]}
      });
    }
 
    var result = await settings.google.objCalendar.executeBatch(batchParams);
    
    if (result.success) location.reload();
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

      var term, enrollmentEndDate;      
      if (parsedLine.length < 4) {
        term = '[unknown';
        enrollmentEndDate = parsedLine[2].trim().slice(-10);
      } else {
        term = parsedLine[2].trim();
        enrollmentEndDate = parsedLine[3].trim().slice(-10);
      }

      studentList.push({
        "student": student, 
        "section": section, 
        "term": term,
        "enddate": item.end.date, 
        "enrollmentenddate": enrollmentEndDate
      });
    }

    parsedItem.studentList = studentList;
    
    return parsedItem;
  }
  
  function _formatAsShortDate(date) {
    // hack due to time zone problems
    return date.toString().slice(0,10);
  }

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();