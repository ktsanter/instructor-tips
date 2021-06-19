//-----------------------------------------------------------------------
// Roster Manager
//-----------------------------------------------------------------------
// TODO:
//-----------------------------------------------------------------------
const app = function () {
	const page = {};

  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    logoutURL: '/usermanagement/logout/roster-manager',
    
    dirtyBit: {},    
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
    page.contents = page.body.getElementsByClassName('contents')[0]; 

    page.navbar.disabled = true;    
    UtilityKTS.setClass(page.navbar, 'hide-me', true);
    
    await _initializeProfile(sodium);
    
    page.notice.setNotice('');
    
    page.navbar.disabled = false;
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    _renderContents();

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
    _renderTest();
  }
  
  function _renderTest() {
    page.navTest = page.contents.getElementsByClassName('contents-navTest')[0];

    page.navTest.getElementsByClassName('btnTest')[0].addEventListener('click', (e) => { _handleTest(e); });
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
    
    if (contentsId == 'navTest') await _showTest();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showSites() {
  }
      
  async function _showTest() {
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
      
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  function _setDirtyBit(dirty) {
    settings.dirtyBit[settings.currentNavOption] = dirty;
    _setNavOptions();
  }
  
  function _updateGmailAuthorizationUI(authorized) {
    page.labelGmailAuthorization.innerHTML = 'Gmail is ' + (authorized ? 'AUTHORIZED' : 'NOT AUTHORIZED');
    UtilityKTS.setClass(page.labelGmailAuthorization, 'not-authorized', !authorized);
    UtilityKTS.setClass(page.btnBeginGMailAuthorization, 'hide-me', authorized);
    page.btnBeginGMailAuthorization.disabled = false;
    
    UtilityKTS.setClass(page.btnSendTestMessage, 'hide-me', !authorized);
    UtilityKTS.setClass(page.containerGmailAuthConfirm, 'hide-me', true);
  }
    
  //--------------------------------------------------------------------------
  // admin
	//--------------------------------------------------------------------------
  async function _testGmailAuthorization() {
    var gmailAuthorized = false;
    var result = await SQLDBInterface.doGetQuery('as-admin/admin', 'check-gmail-auth');
    if (result.success) gmailAuthorized = result.data.authorized;
    _updateGmailAuthorizationUI(gmailAuthorized);
  }
  
  async function _beginGmailAuthorization() {
    var result = await SQLDBInterface.doGetQuery('as-admin/admin', 'begin-gmail-auth', page.notice);
    
    UtilityKTS.setClass(page.containerGmailAuthConfirm, 'hide-me', !result.success);
    if (!result.success) return;
    
    page.btnBeginGMailAuthorization.disabled = true;
    page.linkGmailAuthorization.href = result.data.authorizationurl;
    page.inputGmailAuthorizationConfirm.value = '';
  }
  
  async function _finishGmailAuthorization() {
    var confirmCode = page.inputGmailAuthorizationConfirm.value;
    var result = await SQLDBInterface.doPostQuery('as-admin/admin', 'finish-gmail-auth', {confirmcode: confirmCode}, page.notice);

    await _testGmailAuthorization();
  }
    
  async function _doTest() {
    console.log('_doTest');
    //console.log('**stub');
    //alert('There is currently no action for this choice');

    var result = await SQLDBInterface.doGetQuery('roster-manager/query', 'test', page.notice);
    console.log(result);

    var msg = '_doTest result';
    if (result.success) {
      msg += '\nsuccess';
      msg += '\ndata: ' + JSON.stringify(result.data);
    } else {
      msg += '\nfail';
      msg += '\ndetails: ' + result.details;
    }
    alert(msg);
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _navDispatch(e) {
    var dispatchTarget = e.target.id;

    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    _emphasizeMenuOption(settings.currentNavOption, false);
    _emphasizeMenuOption(dispatchTarget, true);
    
    var dispatchMap = {
      "navTest": function() { _showContents('navTest'); },
      "navProfile": function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e, false);}
    }
    dispatchMap[dispatchTarget]();
  }
  
  function _emphasizeMenuOption(menuOption, emphasize) {
    var mainOptions = new Set(['navSites', 'navMailer', 'navCron', 'navDatabase', 'navTest']);
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
  
  async function _handleTest() {
    await _doTest(); 
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