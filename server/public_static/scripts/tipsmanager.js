//-------------------------------------------------------------------
// Instructor Tips "Tips Manager" tool
//-------------------------------------------------------------------
// TODO: drive navbar options from user privileges
//-------------------------------------------------------------------

const app = function () {
  const appinfo = {
    appversion: '0.01',
    appname: 'InstructorTips',
    appauthor: 'Kevin Santer',
    appcontact: 'ksanter@michiganvirtual.org'
  };
  
	const page = {};
  
	const settings = {
    helpURL: 'help.html',
    navOptions: [
      'courseselection', 'scheduling', 'editing',
      'privileges', 'users', 'userprivileges', 'termgroups', 'terms', 'courses', 'usercourses'
    ],
    adminTypes: ['privileges', 'users', 'userprivileges', 'termgroups', 'terms', 'courses', 'usercourses']
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.maincontainer = CreateElement.createDiv('mainContainer', null);
    page.body.appendChild(page.maincontainer);

    await _renderPage();
    _navDispatch('scheduling');
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async function _renderPage() {
    page.maincontainer.appendChild(_renderAbout());
    page.maincontainer.appendChild(_renderLogin());
    page.maincontainer.appendChild(await _renderSubContainers());
    page.body.insertBefore(await _renderNavbar(), page.body.firstChild);
    page.maincontainer.classList.add('bump-down');
  }
  
  async function _renderNavbar() {
    var queryResults = await _doGetQuery('admin/query', 'navbar');

    if (!queryResults.success) {
      return CreateElement.createDiv(null, null, queryResults.details);
    }
    
    var userInfo = await settings.logincontainer._getUserInfo();
    var allowAdmin = queryResults.data.navbar.allowadmin;
    
    var navConfig = {
      title: appinfo.appname,
      
      items: [
        {label: 'Courses', callback: () => {return _navDispatch('courseselection');}, subitems: null, rightjustify: false},
        {label: 'Scheduling', callback: () => {return _navDispatch('scheduling');}, subitems: null, rightjustify: false},
        {label: 'Editing', callback: () => {return _navDispatch('editing');}, subitems: null, rightjustify: false},
        {label: userInfo.username, callback: null, subitems: null, rightjustify: true}
      ],
      
      hamburgeritems: [
        {label: 'login', callback: _showLogin},
        {label: 'calendar', callback: _showCalendar},
        {label: 'help', callback: _showHelp},
        {label: 'about', callback: _showAbout}
      ]      
    };
    
    if (allowAdmin) {
      navConfig.items.push(
        {label: 'Admin', callback: null, 
          subitems: [
            {label: 'Privileges', callback: () => {return _navDispatch('privileges');}},
            {label: 'Users', callback: () => {return _navDispatch('users');}},
            {label: 'UserPrivileges', callback: () => {return _navDispatch('userprivileges');}},
            {label: 'TermGroups', callback: () => {return _navDispatch('termgroups');}},
            {label: 'Terms', callback: () => {return _navDispatch('terms');}},
            {label: 'Courses', callback: () => {return _navDispatch('courses');}},
            {label: 'UserCourses', callback: () => {return _navDispatch('usercourses');}}
          ]
        }
      );
    }
    
    return new NavigationBar(navConfig);
  }
  
  function _renderAbout() {
    settings.aboutbox = new AboutBox(appinfo);
    return settings.aboutbox.render();
  }
  
  function _renderLogin() {
    settings.logincontainer = new LoginUI(() => {return _loginComplete();});
    return settings.logincontainer.render();
  }
  
  async function _renderSubContainers() {
    var container = CreateElement.createDiv(null, null);
    
    settings.courseselection = new TipCourseSelection();
    container.appendChild(settings.courseselection.render());
    
    settings.scheduling = new TipScheduling();
    container.appendChild(await settings.scheduling.render());
    
    settings.editing = new TipEditing();
    container.appendChild(await settings.editing.render());

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
  async function _navDispatch(arg) {
    for (var i = 0; i < settings.navOptions.length; i++) {
      var opt = settings.navOptions[i];
      if (settings[opt]) {
        settings[opt].show(false);
      } else {
        console.log(opt + ' not valid');
      }
    }
    settings[arg].show(true);
    await settings[arg].update(true);  
  }
    
  function _showCalendar() {
    console.log('show calendar');
  }
  
  function _showAbout() {
    settings.aboutbox.show(true);
  }
  
  async function _showLogin() {
    settings.logincontainer.show(true);
  }
  
  function _showHelp() { 
    window.open(settings.helpURL, '_blank');
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  async function _loginComplete() {
    location.reload();
  }
  
  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async function _doGetQuery(queryType, queryName) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      resultData.details = 'DB error: ' + JSON.stringify(requestResult.details);
      console.log('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  } 
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
