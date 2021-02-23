//----------------------------------------
// FAQ composer
//----------------------------------------
const app = function () {
	const page = {};
  
  const settings = {
    editorTreeId: '#editorTree',
    hideClass: 'hide-me',
    navItemClass: 'use-handler',
    helpURL: '/faq-composer/help',
    logoutURL: '/usermanagement/logout'
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.navbar = page.body.getElementsByClassName('navbar')[0];    
    page.contents = page.body.getElementsByClassName('contents')[0];
    page.contentsEditor = page.contents.getElementsByClassName('contents-navEditor')[0];
    page.contentsMapper = page.contents.getElementsByClassName('contents-navMapper')[0];
    page.contentsProfile = page.contents.getElementsByClassName('contents-navProfile')[0];

    if ( !(await _getUserInfo()) ) return;

    _attachHandlers();
    _renderPage();
    
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
  }
  
  function _attachHandlers() {
    _attachNavbarHandlers();
  }
  
  function _attachNavbarHandlers() {
    var handler = (e) => { _navDispatch(e); }
    var navItems = page.navbar.getElementsByClassName(settings.navItemClass);
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', handler);
    }
  }
	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function _renderPage() {
    _renderProfile();
    _test();
  }
  
  function _renderProfile() {
    page.contentsProfile.getElementsByClassName('user-name')[0].innerHTML = settings.userInfo.userName;
  }
  
  function _test() {
    var data = [
      {
        name: 'node1', id: 1,
        children: [
          { name: 'child1', id: 2 },
          { name: 'child2', id: 3 }
        ]
      },
      
      {
        name: 'node2', id: 4,
        children: [
          { name: 'child3', id: 5 }
        ]
      }
    ];

    $(settings.editorTreeId).tree({
      data: data,
      autoOpen: true,
      dragAndDrop: true
    });

  }
  
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------

  function _showContents(contentsId) {
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
  }
  
  function _doHelp() {
    console.log(settings.helpURL);
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _navDispatch(e) {
    var dispatchMap = {
      "navEditor": function() { _showContents('navEditor'); },
      "navMapper": function() { _showContents('navMapper'); },
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();}
    }
    
    dispatchMap[e.target.id]();
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------
  async function _getUserInfo() {
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'getuser');
    settings.userInfo = null;
    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
    } else {
      console.log('failed to get user info');
    }
    
    return dbResult.success;
  }  
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();