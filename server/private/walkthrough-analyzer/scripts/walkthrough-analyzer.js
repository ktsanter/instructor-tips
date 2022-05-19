//-----------------------------------------------------------------------
// Walkthrough analyzer
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/walkthrough-analyzer/help',
    logoutURL: '/usermanagement/logout/walkthrough-analyzer',
    
    dirtyBit: {
      "navConfigure": false
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
    
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    _renderContents();
    
    _initializeReportManagement();

    _setUploadFileInfo();
    
    settings.currentInfo = null;
    var gotInfo = await _getCurrentInfo();
    if (!gotInfo) return;
    
    _setMainUIEnable(true);
    _setMainNavbarEnable(true);
    
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();

    page.notice.setNotice('');
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
  
  function _initializeReportManagement() {
    settings.reportPoster = new ReportPoster({
      // no params
    });  
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
    _renderConfigure();
    _renderAdmin();
  }
  
  function _renderConfigure() {
    page.navConfigure = page.contents.getElementsByClassName('contents-navConfigure')[0];
    
    var fileUploads = page.navConfigure.getElementsByClassName('uploadfile');
    for (var i = 0; i < fileUploads.length; i++) {
      fileUploads[i].addEventListener('change', (e) => { _handleFileUpload(e); });
    }
  }
  
  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];
    page.adminTermSelect = page.navAdmin.getElementsByClassName('select-term')[0];
    
    page.navAdmin.getElementsByClassName('btnToggleAdmin')[0].addEventListener('click', (e) => { _handleToggleAdmin(e); });    
    page.navAdmin.getElementsByClassName('btnAdminTest')[0].addEventListener('click', (e) => { _handleAdminTest(e); });    
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
    
    if (contentsId == 'navConfigure') _showConfigure();
    if (contentsId == 'navAdmin') _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showConfigure() {}
  
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
  
  function _exportToExcel() {
    console.log('_exportToExcel (stubbed)');
    return;
    
    var mentorExportData = _packageMentorExportData();
    
    var exportData = {
      "studentExportData": settings.currentInfo.students,
      "mentorExportData": mentorExportData
    };
    
    var exportForm = page.body.getElementsByClassName('export-form')[0];
    exportForm.getElementsByClassName('export-data')[0].value = JSON.stringify(exportData);
    exportForm.submit();
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
        containers[i].classList.contains('contents-navConfigure') ||
        containers[i].classList.contains('contents-navAdmin')
      ) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }
      
  function _setMainNavbarEnable(enable) {
    var menuIds = ['navConfigure', 'navAdmin'];
    for (var i = 0; i < menuIds.length; i++) {
      var elem = document.getElementById(menuIds[i]);
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
  }

  function _setExportUIEnable(enable) {
    var elem = document.getElementById('navExport');
    UtilityKTS.setClass(elem, 'disabled', !enable);
  }
  
  function _setConfigureEnable(enable) {
    UtilityKTS.setClass(page.navConfigure, 'disable-container', !enable);
  }
  
  async function _getCurrentInfo() {
    settings.currentInfo = null;
    
    _setExportUIEnable(false);
    
    var result = await _getWalkthroughData();
    if (!result.success) {
      console.log('failed to get walkthrough data');
      return false;
    }
    
    settings.currentInfo = result.data;
    
    _setExportUIEnable(settings.currentInfo != null);

    return true;
  }
  
  function _setUploadFileInfo() {
    var elemResultWalkthrough = page.navConfigure.getElementsByClassName('upload-result walkthrough')[0];
    var elemStatus = page.navConfigure.getElementsByClassName('configure-status')[0];
    
    elemResultWalkthrough.innerHTML = '';

    UtilityKTS.removeChildren(elemStatus);
  }
    
  async function _doFileUpload(uploadType, file) {
    page.notice.setNotice('loading...', true);

    var elemResult = page.navConfigure.getElementsByClassName('upload-result ' + uploadType)[0];
    var elemStatus = page.navConfigure.getElementsByClassName('configure-status')[0];
    UtilityKTS.removeChildren(elemStatus);
    
    var url = '/usermanagement/routeToApp/walkthrough-analyzer/upload/' + uploadType;    
    var result = await settings.reportPoster.post(url, file);
    
    var resultElem = page.navConfigure.getElementsByClassName('upload-result')[0];
    resultElem.innerHTML = '';
    
    if (!result.success) {
      elemResult.innerHTML = result.details;
      page.notice.setNotice('');
      return;
    }

    elemResult.innerHTML = result.details;
    
    console.log('stubbed to here');
    return;

//    var result = await settings.dataIntegrator.applyReportData(uploadType, result.data);
    
    if (result.success) {
      _displayConfigureStatus(result.data, elemChanges);
      await _getCurrentInfo();
    }

    page.notice.setNotice('');
  }
  
  function _displayConfigureStatus(changes, container) {
    console.log('_displayConfigureStatus (stubbed)');
    UtilityKTS.removeChildren(container);
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _navDispatch(e) {
    var dispatchTarget = e.target.id;
    if (e.target.classList.contains('use-parentid')) dispatchTarget = e.target.parentNode.id;
    
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    if (settings.currentNavOption == 'navStudent') settings.rosterViewer.closeDialogs();
    
    _emphasizeMenuOption(settings.currentNavOption, false);
    _emphasizeMenuOption(dispatchTarget, true);
    
    var dispatchMap = {
      "navConfigure": function() { _showContents('navConfigure');},   
      "navAdmin": function() { _showContents('navAdmin'); },
      "navExport": function() { _exportToExcel(); },
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
    var mainOptions = new Set(['navConfigure', 'navAdmin']);
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
    
  async function _handleFileUpload(e) {
    if (e.target.files.length == 0) return;
    
    _setConfigureEnable(false);
    
    var classToParamMap = {
      'uploadfile-enrollment': 'enrollment',
      'uploadfile-mentor': 'mentor',
      'uploadfile-flags': 'studentflags',
      'uploadfile-iep': 'iep',
      'uploadfile-504': '504',     
      'uploadfile-homeschooled': 'homeschooled'      
    };

    await _doFileUpload('walkthrough', e.target.files[0]);
    e.target.value = null;
    
    _setConfigureEnable(true);
  }

  //----------------------------------------
  // callbacks
  //----------------------------------------

  //---------------------------------------
  // DB interface
  //----------------------------------------  
  async function _checkAdminAllowed() {
    dbResult = await SQLDBInterface.doGetQuery('walkthrough-analyzer/query', 'admin-allowed', page.notice);
    if (!dbResult.success) return false;
    
    var adminAllowed = (dbResult.data.adminallowed && !settings.adminDisable);
    return adminAllowed;
  }

  async function _getWalkthroughData() {
    dbResult = await SQLDBInterface.doGetQuery('walkthrough-analyzer/query', 'walkthrough-data', page.notice);

    return dbResult;
  }

  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	
    
  //--------------------------------------------------------------------------
  // admin
  //--------------------------------------------------------------------------
  function _handleToggleAdmin() {
    settings.adminDisable = !settings.adminDisable;
    _setAdminMenu();
  }

  async function _handleAdminTest(e) {
    console.log('_handleAdminTest');
  }
  

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