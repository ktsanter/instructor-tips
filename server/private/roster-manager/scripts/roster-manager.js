//-----------------------------------------------------------------------
// Roster manager
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/roster-manager/help',
    logoutURL: '/usermanagement/logout/roster-manager',
    
    dirtyBit: {
      "navManage": false,
      "navConfigure": false
    },
    
    google: {
      obj: null,
      appId: 'aardvarkstudios-rostermanager',
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        'https://sheets.googleapis.com/$discovery/rest?version=v4'
      ],  
      clientId:  '980213956279-rk5mjllkulhip472ooqmgnavog9c0s58.apps.googleusercontent.com',
      scopes: 'https://www.googleapis.com/auth/docs https://www.googleapis.com/auth/drive.file',
      isSignedIn: false
    },

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
    
    page.notice.setNotice('');
    
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    _renderContents();
    _initializeReportPoster();
    await _initializeGoogleStuff();

    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
  }
  
  async function _setAdminMenu() {
    _enableNavOption('navAdmin', false, false);
    
    var adminAllowed = await _checkAdminAllowed();
    
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
    var result = await SQLDBInterface.doGetQuery('roster-manager/query', 'apikey', page.notice);
    if (!result.success) return;

    settings.google.obj = new GoogleManagement({
      "appId": settings.google.appId,
      "discoveryDocs": settings.google.discoveryDocs,
      "clientId": settings.google.clientId,
      "apiKey": result.data,
      "scopes": settings.google.scopes,
      "signInChange": _signInChangeForGoogle
    });
    
    settings.googleDrive = new GoogleDrive({
      "googleManagement": settings.google.obj
    });
  }
  
  function _initializeReportPoster() {
    settings.reportPoster = new ReportPoster({});
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
    _renderConfigure();
    _renderAdmin();
  }
  
  function _renderManage() {
    page.navManage = page.contents.getElementsByClassName('contents-navManage')[0];
    
    page.targetId = page.navManage.getElementsByClassName('googlefile-id')[0];
    page.targetContainer = page.navManage.getElementsByClassName('googlefile-container')[0];
    
    var pickButtons = page.navManage.getElementsByClassName('googlefile-pick');
    for (var i = 0; i < pickButtons.length; i++) {
      pickButtons[i].addEventListener('click', (e) => { _handleTargetFilePick(e); });
    }
    
    var fileUploads = page.navManage.getElementsByClassName('uploadfile');
    for (var i = 0; i < fileUploads.length; i++) {
      fileUploads[i].addEventListener('change', (e) => { _handleFileUpload(e); });
    }
  }
  
  function _renderConfigure() {}
  
  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];
    
    page.navAdmin.getElementsByClassName('btnSignout')[0].addEventListener('click', (e) => { _handleGoogleSignout(e); });
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
    if (contentsId == 'navConfigure') _showConfigure();
    if (contentsId == 'navAdmin') _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showManage() {}
  
  function _showConfigure() {}
  
  function _showAdmin() {}
  
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
      if (
        containers[i].classList.contains('contents-navManage') ||
        containers[i].classList.contains('contents-navConfigure') ||
        containers[i].classList.contains('contents-navAdmin')
      ) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }
      
  function _setMainNavbarEnable(enable) {
    var menuIds = ['navManage', 'navConfigure', 'navAdmin'];
    for (var i = 0; i < menuIds.length; i++) {
      var elem = document.getElementById(menuIds[i]);
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
  }
  
  async function _setTargetFileInfo() {
    var targetId = _getTargetFileId();

    var targetFilePicked = page.targetContainer.getElementsByClassName('file-chosen')[0];
    var targetFileNotPicked = page.targetContainer.getElementsByClassName('file-notchosen')[0];
    var targetLink = page.targetContainer.getElementsByClassName('googlefile-link')[0];
    var msgNoSelection = page.targetContainer.getElementsByClassName('googlefile-notselected')[0];
    
    var uploadEnrollment = page.navManage.getElementsByClassName('uploadfile-label-enrollment')[0];
    var uploadMentor = page.navManage.getElementsByClassName('uploadfile-label-mentor')[0];
    
    UtilityKTS.setClass(targetFilePicked, settings.hideClass, true);
    UtilityKTS.setClass(targetFileNotPicked, settings.hideClass, true);
    UtilityKTS.setClass(uploadEnrollment, settings.hideClass, true);
    UtilityKTS.setClass(uploadMentor, settings.hideClass, true);
    
    if (targetId) {
      var result =  await settings.googleDrive.getSpreadsheetInfo({"id": targetId});
      if (!result.success) {
        msgNoSelection.innerHTML = '**error: unable to get file info';
        UtilityKTS.setClass(targetFileNotPicked, settings.hideClass, false);
        
      } else {
        targetLink.href = result.url;
        targetLink.innerHTML = result.title;
        UtilityKTS.setClass(targetFilePicked, settings.hideClass, false);
        UtilityKTS.setClass(uploadEnrollment, settings.hideClass, false);
        UtilityKTS.setClass(uploadMentor, settings.hideClass, false);
      }
      
    } else {
      msgNoSelection = '[no file selected]';
      UtilityKTS.setClass(targetFileNotPicked, settings.hideClass, false);
    }
  }
  
  async function _doTargetFilePick(pickType) {
    if (pickType == 'replace') {
      var msg = 'All of the data in the current file will be copied to the new one.';
      msg += '\n\nChoose "Okay" to continue.';
      if (!confirm(msg)) return;
    }
    
    var params = {
      "callback": _callbackTargetFilePick,
      "includeFileInfo": false
    };
    
    settings.googleDrive.pickFile(params);
  }
  
  function _getTargetFileId() {
    var targetId = page.targetId.innerHTML;
    if (targetId == '[none]') targetId = null;
    return targetId;
  }
  
  async function _saveTargetFileId(targetId) {
    var success = await _saveGoogleFileId(targetId);
    if (success) {
      page.targetId.innerHTML = targetId;
    }
    
    return success;
  }
  
  async function _doFileUpload(uploadType, file) {
    var url = '/usermanagement/routeToApp/roster-manager/upload/' + uploadType;    
    var result = await settings.reportPoster.post(url, file);
    console.log(result);
  }
  
  async function _doTest() {
    console.log('_doTest');
    console.log('**stub');
    alert('There is currently no action for this choice');  
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
      "navManage": function() { _showContents('navManage');},
      "navConfigure": function() { _showContents('navConfigure');},
      "navAdmin": function() { _showContents('navAdmin'); },
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
  
  function _emphasizeMenuOption(menuOption, emphasize) {
    var mainOptions = new Set(['navManage', 'navConfigure', 'navAdmin']);
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
  
  function _handleGoogleSignout() {
    settings.google.obj.signout();
  }
  
  async function _handleTargetFilePick(e) {
    var param = 'replace';
    if (!e.target.classList.contains('pick-replace')) param = 'new';
    await _doTargetFilePick(param);
  }
  
  async function _handleFileUpload(e) {
    if (e.target.files.length == 0) return;
    
    var param = 'enrollment';
    if (!e.target.classList.contains('uploadfile-enrollment')) param = 'mentor';
    
    await _doFileUpload(param, e.target.files[0]);
    e.target.value = null;
  }

  function _handleToggleAdmin() {
    settings.adminDisable = !settings.adminDisable;
    _setAdminMenu();
  }
         
  async function _handleTest() {
    await _doTest();
  }

  //----------------------------------------
  // callbacks
  //----------------------------------------
  async function _signInChangeForGoogle(isSignedIn) {
    settings.google.isSignedIn = isSignedIn;
    
    _setMainUIEnable(settings.google.isSignedIn);
    _setMainNavbarEnable(settings.google.isSignedIn);   

    if (isSignedIn) {    
      await _setTargetFileInfo();
    }
    
    _enableNavOption('navGoogle', !isSignedIn, !isSignedIn);    
  }
  
  async function _callbackTargetFilePick(result) {
    if (!result) return;
    
    var saveResult = await _saveTargetFileId(result.id);
    await _setTargetFileInfo();
  } 

  //---------------------------------------
  // DB interface
  //----------------------------------------  
  async function _checkAdminAllowed() {
    dbResult = await SQLDBInterface.doGetQuery('roster-manager/query', 'admin-allowed', page.notice);
    if (!dbResult.success) return false;
    
    var adminAllowed = (dbResult.data.adminallowed && !settings.adminDisable);
    return adminAllowed;
  }
  
  async function _saveGoogleFileId(googleFileId) {
    dbResult = await SQLDBInterface.doPostQuery('roster-manager/insert', 'googlefileid', {"googlefileid": googleFileId}, page.notice);
    return dbResult.success;
  }

  //--------------------------------------------------------------------------
  // admin
  //--------------------------------------------------------------------------

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