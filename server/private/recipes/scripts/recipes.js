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

    helpURL: '/recipes/help',
    logoutURL: '/usermanagement/logout/recipes',
    
    dirtyBit: {
    }
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {
    console.log('TODO: add filtering on recipe list by rating');
    console.log('TODO: add made flag to recipe and UI on edit recipe');
    console.log('TODO: add filtering by made/not made on recipe list');
    console.log('TODO: add image to recipe');
    console.log('TODO: add export/print options (on recipe edit view?)');
    
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);
    page.message = CreateElement.createSpan(null, 'app-message');
    page.body.getElementsByClassName('navbar')[0].appendChild(page.message);
    
    await _initializeDB();

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
    settings.db = new RecipesDB({
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
    await _renderRecipes();
    await _renderMenu();
    await _renderShopping();
    await _renderOCR();
  }
  
  async function _renderRecipes() {
    page.navRecipes = page.contents.getElementsByClassName('contents-navRecipes')[0];
    
    settings.recipes = new Recipes({
      "container": page.navRecipes,
      "hideClass": settings.hideClass,
      "db": settings.db,
      "callbackChangeMenu": (recipe, changeMode) => { return _changeMenu(recipe, changeMode); }
    });
    settings.recipes.render();
  }

  async function _renderMenu() {
    page.navMenu = page.contents.getElementsByClassName('contents-navMenu')[0];
    
    settings.menu = new Menu({
      "container": page.navMenu,
      "hideClass": settings.hideClass,
      "db": settings.db
    });
    settings.menu.render();
  }

  async function _renderShopping() {
    page.navShopping = page.contents.getElementsByClassName('contents-navShopping')[0];
    
    settings.shopping = new Shopping({
      "container": page.navShopping,
      "hideClass": settings.hideClass,
      "db": settings.db,
      "setAppMessage": (msg) => { _setAppMessage(msg); }
    });
    settings.shopping.render();
  }

  function _renderOCR() {
    page.navOCR = page.contents.getElementsByClassName('contents-navOCR')[0];
    
    settings.ocr = new OCR({
      "container": page.navOCR,
      "hideClass": settings.hideClass,
      "db": settings.db
    });
    
    settings.ocr.render();       
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
    
    if (contentsId == 'navRecipes') _showRecipes();
    if (contentsId == 'navMenu') _showMenu();
    if (contentsId == 'navShopping') _showShopping();
    if (contentsId == 'navOCR') _showOCR();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  async function _showRecipes() {    
    await settings.recipes.update();
    UtilityKTS.setClass(page.navRecipes, settings.hideClass, false);
  }
  
  async function _showMenu() {    
    await settings.menu.update();
    UtilityKTS.setClass(page.navMenu, settings.hideClass, false);
  }
  
  async function _showShopping() {    
    await settings.shopping.update();
    UtilityKTS.setClass(page.navShopping, settings.hideClass, false);
  }
  
  function _showOCR() {
    settings.ocr.update();
    UtilityKTS.setClass(page.navOCR, settings.hideClass, false);
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
        containers[i].classList.contains('contents-navRecipes') ||
        containers[i].classList.contains('contents-navMenu') ||
        containers[i].classList.contains('contents-navShopping') ||
        containers[i].classList.contains('contents-navOCR')
      ) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }
      
  function _setMainNavbarEnable(enable) {
    var menuIds = ['navRecipes', 'navMenu', 'navShopping'];
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
    
    _setAppMessage();
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    if (settings.currentNavOption == 'navStudent') settings.rosterViewer.closeDialogs();
    
    _emphasizeMenuOption(settings.currentNavOption, false);
    _emphasizeMenuOption(dispatchTarget, true);
    
    var dispatchMap = {
      "navRecipes": function() { _showContents('navRecipes');},
      "navMenu": function() { _showContents('navMenu');},
      "navShopping": function() { _showContents('navShopping');},     
      "navOCR": function() { _showContents('navOCR'); },
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
    var mainOptions = new Set(['navRecipes', 'navMenu', 'navShopping', 'navOCR']);
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
  async function _changeMenu(recipe, changeMode) {
    var success = false;

    if (changeMode == 'add') {
      success = await settings.menu.addToMenu(recipe);
    } else if (changeMode = 'remove') {
      success = await settings.menu.removeFromMenu(recipe);
    }

    return success;
  }
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  
  function _enableNavOption(navOption, visible, enable) {
    var elem = document.getElementById(navOption);
    UtilityKTS.setClass(elem, 'hide-me', !visible);
    elem.disabled = !enable;    
  }
  
  function _setAppMessage(msg) {
    var actualMessage = msg;
    if (msg == null || msg.trim().length == 0) actualMessage = '';
    page.message.innerHTML = actualMessage;
  }  
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();