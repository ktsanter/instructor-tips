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

    page.navbar.getElementsByClassName(settings.navItemClass)[1].click();
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
  }
  
  function _renderOptions() {
    page.navOptions = page.contents.getElementsByClassName('contents-navOptions')[0];
  }
  
  function _renderDebug() {
    page.navDebug = page.contents.getElementsByClassName('contents-navDebug')[0];
    
    page.navDebug.getElementsByClassName('btnAddEvent')[0].addEventListener('click', (e) => { _testAddEvent(e); });
    page.navDebug.getElementsByClassName('btnDeleteEvent')[0].addEventListener('click', (e) => { _testDeleteEvent(e); });
    page.navDebug.getElementsByClassName('btnUpload')[0].addEventListener('click', (e) => { _testUpload(e); });
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
  
  function _displayEventList(eventList) {
    var container = page.navDebug.getElementsByClassName('eventlist-container')[0];
    UtilityKTS.removeChildren(container);
    
    for (var i = 0; i < eventList.length; i++) {
      var item = eventList[i];
      var lines = item.description.split('\n');
      for (var j = 1; j < lines.length; j++) {
        var name = lines[j].split('(')[0].trim();
        var section = lines[j].split('(')[1].slice(0, -1).trim();
        container.appendChild(CreateElement.createDiv(null, null, item.start.date + ': ' + name + ' | ' + section));
      }
    }
  }
  
  function _displayEnrollmentList(enrollmentList) {
    var container = page.navDebug.getElementsByClassName('enrollmentlist-container')[0];
    UtilityKTS.removeChildren(container);
    
    for (var i = 0; i < enrollmentList.length; i++) {
      var item = enrollmentList[i];
      container.appendChild(CreateElement.createDiv(null, null, item.student + ' ' + item.section + ' ' + item.enddate));
    }
  }
  
  function _updateUI() {
    console.log('_updateUI');
    _setMainUIEnable(settings.google.isSignedIn);
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
  
  //--------------------------------------------------------------------------
  // callbacks
	//--------------------------------------------------------------------------
  function _calendarInfoCallback(success, results) {
    console.log('_calendarInfoCallback');
    
    var elemSelect = page.navOptions.getElementsByClassName('calendar-selection')[0];
    UtilityKTS.removeChildren(elemSelect);

    if (!success) {
      console.log('error: ' + JSON.stringify(results));
      return;
    }      
    
    var fullCalendarList = results.items.sort(function(a,b) {
      return a.summary.localeCompare(b.summary);
    });
    
    for (var i = 0; i < fullCalendarList.length; i++) {
      var item = fullCalendarList[i];
      if (item.accessRole == 'owner') {
        var elemOption = CreateElement.createOption(null, null, JSON.stringify(item), item.summary);
        var elemOptionDebug = CreateElement.createOption(null, null, JSON.stringify(item), item.summary);
                          
        if (settings.configuration.calendarId != null && settings.configuration.calendarId == item.id) {
          elemOption.selected = true;

        } else if (settings.configuration.calendarId == null && item.hasOwnProperty('primary') && item.primary) {
          settings.configuration.calendarId = item.id;
          elemOption.selected = true;
        }

        elemSelect.appendChild(elemOption);
      }
    }

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
    
    var eventList = [];
    
    for (var i = 0; i < results.items.length; i++) {
      var item = results.items[i];
      if (item.location == settings.eventLocation) eventList.push(item);
    }
    //_displayEventList(eventList);
    console.log(eventList);
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

    var enable = !isSignedIn;
    _enableNavOption('navGoogle', enable, enable);    
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
      calendarId: "c_h702bj3dk5fjqjgqi8psg8q1mg@group.calendar.google.com" //null
      //calendarId: null
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
      
  async function _testUpload(e) {
    console.log('_testUpload');
    var fileList = page.navDebug.getElementsByClassName('uploadfile')[0].files;
    if (fileList.length == 0) {
      console.log('no file chosen');
      return;
    }

    var result = await _formPost('/usermanagement/routeToApp/enddate-manager/upload', fileList[0]);
    if (result.success) {
      _displayEnrollmentList(result.data);
    } else {
      _displayEnrollmentList([]);
    }
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