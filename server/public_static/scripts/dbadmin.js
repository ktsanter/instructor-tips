//-------------------------------------------------------------------
// instructor communication flow DB admin tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appinfo = {
    appversion: '0.01',
    appname: 'InstructorTips DB admin',
    appauthor: 'Kevin Santer',
    appcontact: 'ksanter@michiganvirtual.org'
  };
  
	const page = {};
  
	const settings = {
    adminTypes: ['privileges', 'users', 'userprivileges', 'termgroups', 'terms', 'courses', 'courseterms', 'tipstatuses']
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.maincontainer = CreateElement.createDiv('mainContainer', null);
    page.body.appendChild(page.maincontainer);

    _renderPage();
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async function _renderPage() {
    page.maincontainer.appendChild(_renderAbout());
    page.maincontainer.appendChild(_renderLogin());
    page.maincontainer.appendChild(_renderAdminContainers());
    page.body.insertBefore(_renderNavbar(), page.body.firstChild);
    page.maincontainer.classList.add('bump-down');
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: 'InstructorTips DB admin',
      
      items: [
        {label: 'Privileges', callback: _makeNavCallback('privileges')  , subitems: null, rightjustify: false},
        {label: 'Users', callback: _makeNavCallback('users')  , subitems: null, rightjustify: false},
        {label: 'UserPrivileges', callback: _makeNavCallback('userprivileges')  , subitems: null, rightjustify: false},
        {label: 'TermGroups', callback: _makeNavCallback('termgroups')  , subitems: null, rightjustify: false},
        {label: 'Terms', callback: _makeNavCallback('terms')  , subitems: null, rightjustify: false},
        {label: 'Courses', callback: _makeNavCallback('courses')  , subitems: null, rightjustify: false},
        {label: 'CourseTerms', callback: _makeNavCallback('courseterms')  , subitems: null, rightjustify: false},
        {label: 'TipStatus', callback: _makeNavCallback('tipstatuses')  , subitems: null, rightjustify: false}
      ],
      
      hamburgeritems: [
        {label: 'login', callback: _showLogin},
        {label: 'about', callback: _showAbout}
      ]      
    };
    
    return new NavigationBar(navConfig);
  }
  
  function _renderAbout() {
    settings.aboutbox = new AboutBox(appinfo);
    return settings.aboutbox.render();
  }
  
  function _renderLogin() {
    settings.logincontainer = new LoginUI(appinfo);
    return settings.logincontainer.render();
  }
  
  function _renderAdminContainers() {
    var container = CreateElement.createDiv(null, 'dbadmin-maincontainer');
    
    for (var i = 0; i < settings.adminTypes.length; i++) {
      var type = settings.adminTypes[i];
      settings[type] = new DBAdminContainer(type);
      container.appendChild(settings[type].render());
    }

    return container;
  }

  //---------------------------------------
	// navbar callbacks
	//----------------------------------------
  function _makeNavCallback(arg) {
    return function() {
      _doAdmin(arg);
    }
  }

  async function _doAdmin(arg) {
    for (var i = 0; i < settings.adminTypes.length; i++) {
      settings[settings.adminTypes[i]].show(false);
    }
    settings[arg].show(true);
    await settings[arg].update();
  }
    
  function _showAbout() {
    settings.aboutbox.show(true);
  }
  
  function _showLogin() {
    settings.logincontainer.show(true);
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
