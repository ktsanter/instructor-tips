//-------------------------------------------------------------------
// Instructor Tips "Tips Manager" tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appInfo = {
    appName: 'InstructorTips'
  };
  
	const page = {};
  
	const settings = {
    helpURL: 'help.html',
    logoutURL: '/usermanagement/logout',
    
    navOptions: [
      'scheduling', 'share', 'notification',
      'privileges', 'users', 'userprivileges', 'tips', 'categories', 'tipcategories', 'admin_schedules', 'scheduletips', 'controlstates',
      'settings'
    ],
    adminTypes: ['privileges', 'users', 'userprivileges', 'categories', 'tips', 'tipcategories', 'admin_schedules', 'scheduletips', 'controlstates']
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    document.title = appInfo.appName;
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.maincontainer = CreateElement.createDiv('mainContainer', null);
    page.body.appendChild(page.maincontainer);

    await _renderPage();
    await settings.share.update();
    _navDispatch('scheduling');
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async function _renderPage() {    
    var dbResult = await _doGetQuery('usermanagement', 'getuser');
    settings.userInfo = null;
    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
    }    
    
    page.maincontainer.appendChild(await _renderSubContainers());
    page.body.insertBefore(await _renderNavbar(), page.body.firstChild);
    attachShareCountElement();
    page.maincontainer.classList.add('bump-down');
  }
  
  async function _renderNavbar() {
    var queryResults = await _doGetQuery('admin/query', 'navbar');

    if (!queryResults.success) {
      return CreateElement.createDiv(null, null, queryResults.details);
    }

    var allowAdmin = queryResults.data.navbar.allowadmin;

    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Scheduling', callback: () => {return _navDispatch('scheduling');}, subitems: null, rightjustify: false},
        {label: 'Notification', callback: () => {return _navDispatch('notification');}, subitems: null, rightjustify: false},
        {label: 'Sharing', callback: () => {return _navDispatch('share');}, subitems: null, rightjustify: false},
        {label: settings.userInfo.userName, callback: null, subitems: null, rightjustify: true}
      ],
      
      hamburgeritems: [     
        {label: 'settings', callback: () => {return _navDispatch('settings');}},      
        {label: 'help', callback: _showHelp},
        {label: 'logout', callback: _doLogout}
      ]      
    };
    
    if (allowAdmin) {
      navConfig.items.push(
        {label: 'Admin', callback: null, 
          subitems: [
            {label: 'User', callback: () => {return _navDispatch('users');}},
            {label: 'Privilege', callback: () => {return _navDispatch('privileges');}},
            {label: 'UserPrivilege', callback: () => {return _navDispatch('userprivileges');}},
            {label: 'Category', callback: () => {return _navDispatch('categories');}},
            {label: 'Tip', callback: () => {return _navDispatch('tips');}},
            {label: 'TipCategory', callback: () => {return _navDispatch('tipcategories');}},
            {label: 'Schedule', callback: () => {return _navDispatch('admin_schedules');}},
            {label: 'ScheduleTip', callback: () => {return _navDispatch('scheduletips');}},
            {label: 'ControlState', callback: () => {return _navDispatch('controlstates');}}
          ]
        }
      );
    }
    
    return new NavigationBar(navConfig);
  }
  
  async function _renderSubContainers() {
    var container = CreateElement.createDiv(null, 'primary-subcontainer');
        
    settings.scheduling = new TipScheduling();
    container.appendChild(await settings.scheduling.render());
    
    settings.notification = new TipNotification();
    container.appendChild(await settings.notification.render());

    settings.share = new TipShare({
      changeCallback: (params) => {_handleShareChange(params);}
    });
    container.appendChild(await settings.share.render());

    settings.settings = new Settings();
    container.appendChild(await settings.settings.render());

    for (var i = 0; i < settings.adminTypes.length; i++) {
      var type = settings.adminTypes[i];
      settings[type] = new DBAdminContainer(type);
      container.appendChild(settings[type].render());
    }
    
    return container;
  }
 
  function attachShareCountElement() {
    var navbarMainItems = page.body.getElementsByClassName('navbar-main-item');
    var elemSharing = null;
    for (var i = 0; i < navbarMainItems.length && !elemSharing; i++) {
      var item = navbarMainItems[i];
      if (item.innerHTML == 'Sharing') elemSharing = item;
    }
    
    item.classList.add('tipmanager-sharedlabel');
    settings.elemShareCount = CreateElement.createDiv(null, 'tipmanager-super');
    item.appendChild(settings.elemShareCount);
  }
  
  //---------------------------------------
	// navbar callbacks and other handlers
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
    
  async function _showLogin() {
    settings.logincontainer.show(true);
  }

  function _showHelp() { 
    window.open(settings.helpURL, '_blank');
  }
    
  async function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  function _handleShareChange(params) {
    var elem = settings.elemShareCount;
    var count = params.numSharedSchedules;
    
    elem.innerHTML = count;
    var msg = count + ' schedules have been shared with you';
    if (count == 1) msg = '1 schedule has been shared with you';
    if (count == 0) msg = '';
    elem.parentNode.title = msg;
    if (elem.classList.contains('hide-me')) elem.classList.remove('hide-me');
    if (count == 0) elem.classList.add('hide-me');
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
      console.log('queryType = ' + queryType + ' queryName=' + queryName);
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
