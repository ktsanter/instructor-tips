//-----------------------------------------------------------------------
// End date manager
//-----------------------------------------------------------------------
// TODO: finish help
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
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
    }
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

    page.notice.setNotice('');
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    
    _renderContents();
    
    settings.google.obj = new GoogleManagement({
      "clientId": settings.google.clientId,
      "apiKey": settings.google.apiKey,
      "scopes": settings.google.scopes,
      "signInChange": _signInChangeForGoogle
    });
    settings.google.objCalendar = new GoogleCalendar({});

    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
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
  }
  
  function _renderManage() {
    console.log('_renderManage');
    page.navManage = page.contents.getElementsByClassName('contents-navManage')[0];
    page.navManage.getElementsByClassName('calendar-selection')[0].addEventListener('change', (e) => {_handleCalendarSelect(e);});
    
    page.navManage.getElementsByClassName('btnTest')[0].addEventListener('click', (e) => { _test(e); });
  }
  
  function _renderOptions() {
    console.log('_renderOptions');
    page.navOptions = page.contents.getElementsByClassName('contents-navOptions')[0];
  }
  
  function _test(e) {
    var elemCalendar = page.navManage.getElementsByClassName('calendar-selection')[0];
    var calendarItem = JSON.parse(elemCalendar[elemCalendar.selectedIndex].value);
    console.log(calendarItem.id);

    settings.google.objCalendar.addAllDayEvent({
        calendarId: calendarItem.id,
        date: "2021-05-28",
        summary: "test event",
        description: "test event description",
        location: "End date manager"
      });
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
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showManage() {
    console.log('_showManage');
  }
  
  function _showOptions() {
    console.log('_showOptions');
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

    } else if (opt == 'navProfile') {
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
  
  function _calendarInfoCallback(success, results) {
    console.log('_calendarInfoCallback');
    var elemSelect = page.navManage.getElementsByClassName('calendar-selection')[0];
    UtilityKTS.removeChildren(elemSelect);
    
    if (success) {
      if (true /* there isn't a current selection from DB */) {
        var elemOption = CreateElement.createOption(null, null, JSON.stringify({id: null}), 'choose...');
        elemSelect.appendChild(elemOption);
        elemOption.selected = true;        
      }

      for (var i = 0; i < results.items.length; i++) {
        var item = results.items[i];
        if (item.accessRole == 'owner') {
          var elemOption = CreateElement.createOption(null, null, JSON.stringify(item), item.summary);
          elemSelect.appendChild(elemOption);
          /* test if this is the one saved as selected in DB */
          console.log('  ' + item.summary);
        }
      }
      _enableMainUI(true);
      
    } else {
      copnsole.log('error: ' + JSON.stringify(results));
      _enableMainUI(false);
    }
  }
  
  function _eventInfoCallback(success, results) {
    console.log('_eventInfoCallback');
    
    if (success) {
      console.log(results.items);
      _enableMainUI(true);  /* temp - this should come after everything is loaded */
      
    } else {
      console.log('error: ' + JSON.stringify(results));
      _enableMainUI(false);
    }
    
  }
  
  function _enableMainUI(enable) {
    UtilityKTS.setClass(page.navManage, 'disable-container', !enable);
    page.navManage.disabled = !enable;    

    UtilityKTS.setClass(page.navOptions, 'disable-container', !enable);
    page.navOptions.disabled = !enable;    
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
      
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
    }
    
    _setDirtyBit(false);
  }
  
  function _handleGoogleSignIn() {
    console.log('_handleGoogleSignIn');
    settings.google.obj.trySignIn();
  }
  
  function _signInChangeForGoogle(isSignedIn) {
    settings.google.isSignedIn = isSignedIn;

    var enable = !isSignedIn;
    _enableNavOption('navGoogle', enable, enable);
    
    UtilityKTS.setClass(page.navManage, 'disable-container', true);
    page.navManage.disabled = true;    

    UtilityKTS.setClass(page.navOptions, 'disable-container', true);
    page.navOptions.disabled = true;    

    if (isSignedIn) settings.google.objCalendar.getCalendarInfo(_calendarInfoCallback);
  }
  
  function _handleCalendarSelect(e) {
    console.log('_handleCalendarSelect');
    var calendarItem = JSON.parse(e.target[e.target.selectedIndex].value);
    console.log(calendarItem);
    
    if (calendarItem.id == null) {
      console.log('null selected');  /* remove null once a selection is made? */
    } 
    
    settings.google.objCalendar.getEventInfo({
        calendarId: calendarItem.id
      }, 
      _eventInfoCallback
    );
  }
      
  //---------------------------------------
	// DB interface
	//----------------------------------------  
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  
  function _enableNavOption(navOption, visible, enable) {
    var elem = document.getElementById(navOption);
    UtilityKTS.setClass(elem, 'hide-me', !visible);
    elem.disabled = !enable;    
  }
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();