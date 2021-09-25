//-----------------------------------------------------------------------
// ITips
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/itips/help',
    logoutURL: '/usermanagement/logout/itips',
    
    dirtyBit: {
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
    
    await _initializeDB();
    await _setAdminMenu();

    page.navbar = page.body.getElementsByClassName('navbar')[0];
    _setMainNavbarEnable(false);
    
    page.contents = page.body.getElementsByClassName('contents')[0];    
    
    await _initializeProfile(sodium);

    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    await _renderContents();
    
    _setMainUIEnable(true);
    _setMainNavbarEnable(true);
    
    page.notice.setNotice('');
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
  }
  
  async function _setAdminMenu() {
    _enableNavOption('navAdmin', false, false);
    
    var adminAllowed = await settings.db.isAdminAllowedForUser();
    adminAllowed = adminAllowed && !settings.adminDisable;
    
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
  
  function _initializeDB() {
    var noticeCallback = (msg) => { page.notice.setNotice(msg); };
    settings.db = new ITipsDB({
      "notice": page.notice
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
  async function _renderContents() {
    _renderShareCount();
    
    await _renderScheduling();
    await _renderTipsEditing();
    _renderSharing();
    _renderNotification();
    _renderAdmin();
  }
  
  function _renderShareCount() {
    var elemSharing = document.getElementById('navSharing');
    elemSharing.appendChild(CreateElement.createDiv(null, 'navbar-super use-parentid', ''));
    
    page.shareCount = elemSharing;
  }
    
  async function _renderScheduling() {
    page.navScheduling = page.contents.getElementsByClassName('contents-navScheduling')[0];
    
    settings.scheduling = new Scheduling({
      "container": page.navScheduling,
      "hideClass": settings.hideClass,
      "db": settings.db
    });
    
    await settings.scheduling.render();
  }

  async function _renderTipsEditing() {
    page.navTipsEditing = page.contents.getElementsByClassName('contents-navTipsEditing')[0];
    
    settings.tipsEditing = new TipsEditing({
      "container": page.navTipsEditing,
      "hideClass": settings.hideClass,
      "db": settings.db
    });
    
    await settings.tipsEditing.render();
  }

  async function _renderSharing() {
    page.navSharing = page.contents.getElementsByClassName('contents-navSharing')[0];
    
    settings.sharing = new Sharing({
      "container": page.navSharing,
      "hideClass": settings.hideClass,
      "db": settings.db,
      "elemShareCount": page.shareCount
    });
    
    await settings.sharing.render();
  }

  function _renderNotification() {
    page.navNotification = page.contents.getElementsByClassName('contents-navNotification')[0];
    
    settings.notification = new Notification({
      "container": page.navNotification,
      "hideClass": settings.hideClass,
      "db": settings.db
    });
    
    settings.notification.render();
  }

  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];
    
    settings.admin = new Admin({
      "container": page.navAdmin,
      "hideClass": settings.hideClass,
      "db": settings.db,
      "callbackAdminToggle": _toggleAdmin
    });
    
    settings.admin.render();       
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
    
    if (contentsId == 'navSchedule') _showScheduling();
    if (contentsId == 'navTipEditing') _showTipsEditing();
    if (contentsId == 'navSharing') _showSharing();
    if (contentsId == 'navNotification') _showNotification();
    if (contentsId == 'navAdmin') _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  async function _showScheduling() {    
    settings.scheduling.update();
    UtilityKTS.setClass(page.navScheduling, settings.hideClass, false);
  }
  
  function _showTipsEditing() {
    settings.tipsEditing.update();
    UtilityKTS.setClass(page.navTipsEditing, settings.hideClass, false);
  }
  
  function _showSharing() {
    settings.sharing.update();
    UtilityKTS.setClass(page.navSharing, settings.hideClass, false);
  }
  
  function _showNotification() {
    settings.notification.update();
    UtilityKTS.setClass(page.navNotification, settings.hideClass, false);
  }
  
  function _showAdmin() {
    settings.admin.update();
    UtilityKTS.setClass(page.navAdmin, settings.hideClass, false);
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
        containers[i].classList.contains('contents-navSchedule') ||
        containers[i].classList.contains('contents-navTipEditing') ||
        containers[i].classList.contains('contents-navSharing') ||
        containers[i].classList.contains('contents-navNotification') ||
        containers[i].classList.contains('contents-navAdmin')
      ) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }
      
  function _setMainNavbarEnable(enable) {
    var menuIds = ['navSchedule', 'navTipEditing', 'navSharing', 'navNotification'];
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
    if (settings.currentNavOption == 'navStudent') settings.rosterViewer.closeDialogs();
    
    _emphasizeMenuOption(settings.currentNavOption, false);
    _emphasizeMenuOption(dispatchTarget, true);
    
    var dispatchMap = {
      "navSchedule": function() { _showContents('navSchedule');},
      "navTipEditing": function() { _showContents('navTipEditing');},
      "navSharing": function() { _showContents('navSharing');},
      "navNotification": function() { _showContents('navNotification'); },      
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
    var mainOptions = new Set(['navSchedule', 'navTipEditing', 'navSharing', 'navNotification', 'navAdmin']);
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

  //----------------------------------------
  // callbacks
  //----------------------------------------
  function _toggleAdmin() {
    settings.adminDisable = !settings.adminDisable;
    _setAdminMenu();
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