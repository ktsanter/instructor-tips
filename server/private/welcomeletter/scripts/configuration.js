//-------------------------------------------------------------------
// welcome letter configuration
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const appInfo = {
    appName: 'Welcome letter configuration'
  };
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',
    logoutURL: '/usermanagement/logout/welcomeV2',
    optionsURL: '/welcomeletter/options',
    helpURL: '/welcomeletter/help',
    
    previewURL_base: '/welcomeletterV2'
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init (sodium) {
    page.body = document.getElementsByTagName('body')[0];
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    
    page.contents = page.body.getElementsByClassName('contents')[0];
    page.contentsConfiguration = page.contents.getElementsByClassName('contents-navConfiguration')[0];
    page.contentsPreview = page.contents.getElementsByClassName('contents-navPreview')[0];
    page.contentsShare = page.contents.getElementsByClassName('contents-navShare')[0];   
    
    page.notice.setNotice('loading...', true);
    
    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, settings.hideClass, true);
    
    _attachNavbarHandlers(); // do these before making the profile object
    await _initProfile(sodium);
    
    page.notice.setNotice('');
    UtilityKTS.setClass(page.navbar, settings.hideClass, false); 
    
    await  _renderContents();
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
  }
  
  async function _initProfile(sodium) {
    settings.profile = new ASProfile({
      id: "myProfile",
      "sodium": sodium,
      navbarElements: {
        "save": page.navbar.getElementsByClassName('navSave')[0],
        "reload": page.navbar.getElementsByClassName('navReload')[0],
        "icon": page.navbar.getElementsByClassName('icon-profile')[0],
        "pic": page.navbar.getElementsByClassName('pic-profile')[0]
      },
      hideClass: settings.hideClass
    });
    
    await settings.profile.init();
  }

  //-----------------------------------------------------------------------------
	// navbar
	//-----------------------------------------------------------------------------
  function _attachNavbarHandlers() {
    var handler = (e) => { _navDispatch(e); }
    var navItems = page.navbar.getElementsByClassName(settings.navItemClass);
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', handler);
    }
    
    // hide disallowed nav features
    var allowOptions = page.body.getElementsByClassName('allowoptions')[0].innerHTML == 'true';
    if (!allowOptions) {
      var elemNav = document.getElementById('navEditOptions');
      var elemDivider = document.getElementById('dividerNav1');
      UtilityKTS.setClass(elemNav, settings.hideClass, true);
      UtilityKTS.setClass(elemDivider, settings.hideClass, true);
    }
  }  
  
  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  async function _renderContents() {
  }
  
  //---------------------------------------
	// updating
	//----------------------------------------
  async function _showContents(contentsId) {
    console.log('_showContents: ' + contentsId);
    settings.currentNavOption = contentsId;
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    if (contentsId == 'navProfile') await settings.profile.reload();
    
  }
  //---------------------------------------
	// handlers
	//----------------------------------------
  async function _navDispatch(e) {
    var dispatchTarget = e.target.id;
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    var dispatchMap = {
      "navConfiguration": async function() { await _showContents('navConfiguration'); },
      "navPreview":       async function() { await _showContents('navPreview'); },
      "navShare":         async function() { await _showContents('navShare'); },
      
      "navEditOptions":   function() { _doOptions(); },
      
      "navSave":          async function() { await _handleSave(e);},
      "navReload":        async function() { await _handleReload(e);},
      
      "navProfile":       async function() { await _showContents('navProfile'); },

      "navHelp":          function() { _doHelp(); },
      "navSignout":       function() { _doLogout(); }
    }
    
    dispatchMap[dispatchTarget]();
  }
  
  function _doOptions() {
    window.open(settings.optionsURL, '_self');
  }  
  
  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	

  function _copyRenderedToClipboard(txt) {
    if (!page._renderedclipboard) page._renderedclipboard = new ClipboardCopy(page.body, 'rendered');

    page._renderedclipboard.copyRenderedToClipboard(txt);
	}	  

  //---------------------------------------
  // utility functions
  //----------------------------------------

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
