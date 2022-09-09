//-----------------------------------------------------------------------
// Course Policies
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/coursepolicies/help',
    logoutURL: '/usermanagement/logout/coursepolicies',
    
    dirtyBit: {},
    
    generalInfo: null,
    courseInfo: null,

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
    
    await _initializeGeneralPolicies();
    await _initializeCoursePolicies();
    await _initializeAdmin();
    
    let success = await _getCurrentInfo();
    if (!success) return;

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
  
  async function _initializeGeneralPolicies() {
    let adminAllowed = await _checkAdminAllowed();
    
    settings.generalPolicies = new GeneralPolicies({
      "container": page.navGeneral,
      "adminAllowed": adminAllowed
    });
  }

  async function _initializeCoursePolicies() {
    let adminAllowed = await _checkAdminAllowed();
    
    settings.coursePolicies = new CoursePolicies({
      "container": page.navCourse,
      "adminAllowed": adminAllowed
    });
  }
  
  async function _initializeAdmin() {
    let adminAllowed = await _checkAdminAllowed();
    if (!adminAllowed) return;

    settings.admin = new Admin({
      "notice": page.notice,
      "container": page.navAdmin,
      "toggleCallback": _toggleAdmin,
      "callbackRefreshData": _refreshData
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
    _renderGeneral();
    _renderCourse();
    _renderAdmin();
  }
  
  function _renderGeneral() {
    page.navGeneral = page.contents.getElementsByClassName('contents-navGeneral')[0];
  }
    
  function _renderCourse() {
    page.navCourse = page.contents.getElementsByClassName('contents-navCourse')[0];
  }
    
  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];
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
    
    if (contentsId == 'navGeneral') _showGeneral();
    if (contentsId == 'navCourse') _showCourse();
    if (contentsId == 'navAdmin') _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showGeneral() {
    UtilityKTS.setClass(page.navGeneral, 'disable-container', true);

    settings.generalPolicies.update(settings.generalInfo);    
    
    UtilityKTS.setClass(page.navGeneral, 'disable-container', false);
  }
  
  function _showCourse() {
    UtilityKTS.setClass(page.navCourse, 'disable-container', true);
    
    settings.coursePolicies.update(settings.courseInfo);    
    
    UtilityKTS.setClass(page.navCourse, 'disable-container', false);
  }

  function _showAdmin() {
    UtilityKTS.setClass(page.navAdmin, 'disable-container', true);
    
    settings.admin.update(settings.generalInfo, settings.courseInfo);    
    
    UtilityKTS.setClass(page.navAdmin, 'disable-container', false);
    
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
        containers[i].classList.contains('contents-navStudent') ||
        containers[i].classList.contains('contents-navConfigure') ||
        containers[i].classList.contains('contents-navAdmin')
      ) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }
      
  function _setMainNavbarEnable(enable) {
    var menuIds = ['navGeneral', 'navCourse', 'navAdmin'];
    for (var i = 0; i < menuIds.length; i++) {
      var elem = document.getElementById(menuIds[i]);
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
  }
  
  function _setAdminEnable(enable) {
    UtilityKTS.setClass(page.navAdmin, 'disable-container', !enable);
  }
  
  async function _getCurrentInfo() {
    settings.generalInfo = null;
    settings.courseInfo = null;
    
    let result = await _getGeneralInfoFromDB();
    if (!result) return false;
    settings.generalInfo = result;
    
    result = await _getCourseInfoFromDB();
    if (!result) return false;
    settings.courseInfo = result;
    
    if (settings.currentNavOption == 'navGeneral') _showGeneral();
    if (settings.currentNavOption == 'navCourse') _showCourse();
    if (settings.currentNavOption == 'navAdmin') _showAdmin();
    
    return true;
  }
   
  async function _doFileUpload(uploadType, file, semester) {
    page.notice.setNotice('loading...', true);
    _clearAdminResults();
    
    var url = '/usermanagement/routeToApp/whoteacheswhat/upload/' + uploadType;
    if (semester) url += '/' + semester;    
    var result = await settings.reportPoster.post(url, file);
    
    _renderAdminResults('upload-result' + semester, result.details);
    
    page.notice.setNotice('');
    if (!result.success) {
      return;
    }

    await _getCurrentInfo();
  }
  
  function _clearAdminResults() {
    _renderAdminResults('upload-resultS1', '');
    _renderAdminResults('upload-resultS2', '');
    _renderAdminResults('delete-result', '');
  }
    
  function _renderAdminResults(resultClass, txt) {
    let elemResult = page.navAdmin.getElementsByClassName(resultClass)[0];
    elemResult.innerHTML = txt;
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
      "navGeneral": function() { _showContents('navGeneral');},
      "navCourse": function() { _showContents('navCourse');},
      "navAdmin": function() { _showContents('navAdmin'); },
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
    var mainOptions = new Set(['navGeneral', 'navCourse', 'navAdmin']);
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
    
    let term = null;
    if (e.target.id.indexOf('S1') > 0) term = 'S1';
    if (e.target.id.indexOf('S2') > 0) term = 'S2';
    if (!term) return;
    
    _setAdminEnable(false);
    
    var classToParamMap = {
      'uploadfile-assignment': 'assignment'
    };

    var param = null;
    for (var key in classToParamMap) {
      if (e.target.classList.contains(key)) param = classToParamMap[key];
    }
    
    await _doFileUpload(param, e.target.files[0], term);
    e.target.value = null;
    
    _setAdminEnable(true);
  }
  
  async function _handleDeleteAssignments(e) {
    _clearAdminResults();
    
    let msg = 'All assignment data will be removed from the database.  Are you sure?';
    msg += '\n\nPress OK to continue with deletion.';
    if (!confirm(msg)) return;
    
    let success = await _deleteAssignmentData();
    if (success) {
      _renderAdminResults('delete-result', 'assignment info deleted');
    } else {
      _renderAdminResults('delete-result', 'failed to delete assignment info');
    }
  }

  //----------------------------------------
  // callbacks
  //----------------------------------------
  function _toggleAdmin() {
    settings.adminDisable = !settings.adminDisable;
    _setAdminMenu();
  }
  
  async function _refreshData() {
    await _getCurrentInfo();
  }  

  //---------------------------------------
  // DB interface
  //----------------------------------------  
  async function _checkAdminAllowed() {
    dbResult = await SQLDBInterface.doGetQuery('coursepolicies/query', 'admin-allowed', page.notice);
    if (!dbResult.success) return false;
    
    var adminAllowed = (dbResult.data.adminallowed && !settings.adminDisable);
    return adminAllowed;
  }  
 
  async function _getGeneralInfoFromDB() {    
    let generalInfo = null;
    
    let dbResult = await SQLDBInterface.doGetQuery('coursepolicies/query', 'general-info', page.notice);
    if (dbResult.success) {
      generalInfo = dbResult.data;
    }
    
    return generalInfo;
  }  
 
  async function _getCourseInfoFromDB() {
    let courseInfo = null;
    
    let dbResult = await SQLDBInterface.doGetQuery('coursepolicies/query', 'course-info', page.notice);
    if (dbResult.success) {
      courseInfo = dbResult.data;
    }
    
    return courseInfo;
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