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
    aboutURL: 'about.html',
    helpURL: 'help.html',
    navOptions: [
      'courseselection', 'scheduling', 'editing', 'calendarui',
      'privileges', 'users', 'userprivileges', 'termgroups', 'terms', 'courses', 'usercourses', 'calendars',
      'manageshared', 'notification'
    ],
    adminTypes: ['privileges', 'users', 'userprivileges', 'termgroups', 'terms', 'courses', 'usercourses', 'calendars']
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.maincontainer = CreateElement.createDiv('mainContainer', null);
    page.body.appendChild(page.maincontainer);

    await _renderPage();
    _navDispatch('scheduling');
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async function _renderPage() {
    page.maincontainer.appendChild(await _renderSubContainers());
    page.body.insertBefore(await _renderNavbar(), page.body.firstChild);
    page.maincontainer.classList.add('bump-down');
  }
  
  async function _renderNavbar() {
    var queryResults = await _doGetQuery('admin/query', 'navbar');

    if (!queryResults.success) {
      return CreateElement.createDiv(null, null, queryResults.details);
    }
    
    var dbResult = await _doGetQuery('usermanagement', 'getuser');
    var userInfo = null;
    if (dbResult.success) {
      userInfo = dbResult.data;
    }    
    var allowAdmin = queryResults.data.navbar.allowadmin;
    
    var sharedScheduleCount = await _getNumberOfSharedSchedules();
    var elemCount = CreateElement.createDiv(null, 'tipmanager-schedulecount', '')
    elemCount.style.display = 'none';
    var elemCount2 = CreateElement.createSpan(null, 'tipmanager-schedulecount2', '')
    elemCount2.innerHTML = '';
    
    if (sharedScheduleCount > 0) {
      elemCount.style.display = 'inline-block';
      elemCount.innerHTML = sharedScheduleCount;
      elemCount.title = 'you have ' + sharedScheduleCount + ' shared schedules';
      elemCount2.innerHTML = ' (' + sharedScheduleCount + ')';
    }
    
    var htmlForLogin = userInfo.username + elemCount.outerHTML;
    var htmlForShared = 'shared schedules' + elemCount2.outerHTML;

    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Scheduling', callback: () => {return _navDispatch('scheduling');}, subitems: null, rightjustify: false},
        {label: 'Courses', callback: () => {return _navDispatch('courseselection');}, subitems: null, rightjustify: false},
        {label: htmlForLogin, callback: _showLogin, subitems: null, rightjustify: true}
      ],
      
      hamburgeritems: [
        {label: htmlForShared, callback: () => {return _navDispatch('manageshared');}},      
        {label: 'notification options', callback: () => {return _navDispatch('notification');}},      
        {label: 'help', callback: _showHelp}
      ]      
    };
    
    if (allowAdmin) {
      navConfig.items.splice(2, 0, {label: 'Tip Editing', callback: () => {return _navDispatch('editing');}, subitems: null, rightjustify: false});
      navConfig.items.splice(3, 0, {label: 'Calendar', callback: () => {return _navDispatch('calendarui');}, subitems: null, rightjustify: false});

      navConfig.items.push(
        {label: 'Admin', callback: null, 
          subitems: [
            {label: 'User', callback: () => {return _navDispatch('users');}},
            {label: 'Privilege', callback: () => {return _navDispatch('privileges');}},
            {label: 'UserPrivilege', callback: () => {return _navDispatch('userprivileges');}},
            {label: 'TermGroup', callback: () => {return _navDispatch('termgroups');}},
            {label: 'Term', callback: () => {return _navDispatch('terms');}},
            {label: 'Course', callback: () => {return _navDispatch('courses');}},
            {label: 'UserCourse', callback: () => {return _navDispatch('usercourses');}},
            {label: 'Calendar', callback: () => {return _navDispatch('calendars');}}
          ]
        }
      );
    }
    
    return new NavigationBar(navConfig);
  }
  
  /*
  async function _renderLogin() {
    settings.logincontainer = new LoginUI(() => {return _loginComplete();});
    return await settings.logincontainer.render();
  }
  */
  
  async function _renderSubContainers() {
    var container = CreateElement.createDiv(null, null);
    
    settings.courseselection = new TipCourseSelection();
    container.appendChild(settings.courseselection.render());
    
    settings.scheduling = new TipScheduling({
      callback: () => {return _sharedScheduleChange();}
    });
    container.appendChild(await settings.scheduling.render());
    
    settings.editing = new TipEditing();
    container.appendChild(await settings.editing.render());

    settings.calendarui = new TipCalendar();
    container.appendChild(await settings.calendarui.render());

    settings.manageshared = new TipSchedulingShareManagement({
      callback: () => {return _sharedScheduleChange();}
    });
    container.appendChild(await settings.manageshared.render());

    settings.notification = new NotificationOptions();
    container.appendChild(await settings.notification.render());

    for (var i = 0; i < settings.adminTypes.length; i++) {
      var type = settings.adminTypes[i];
      settings[type] = new DBAdminContainer(type);
      container.appendChild(settings[type].render());
    }
    
    return container;
  }

  async function _getNumberOfSharedSchedules() {
    var count = 0;
    
    var queryResults = await _doGetQuery('tipmanager/query', 'sharedwithuser');
    if (queryResults.success) {
      count = queryResults.data.length;
    }
    
    return count;
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
    
  async function _showLogin() {
    settings.logincontainer.show(true);
  }
  
  async function _sharedScheduleChange() {
    var elemCount = page.body.getElementsByClassName('tipmanager-schedulecount')[0];
    var elemCount2 = page.body.getElementsByClassName('tipmanager-schedulecount2')[0];

    var count = await _getNumberOfSharedSchedules();
    
    if (count > 0) {
      elemCount.style.display = 'inline-block';
      elemCount.innerHTML = count;
      elemCount.title = 'you have ' + count + ' shared schedules';      
      elemCount2.innerHTML = ' (' + count + ')';

    } else {
      elemCount.style.display = 'none';
      elemCount2.innerHTML = '';
    }
  }  

  function _showHelp() { 
    window.open(settings.helpURL, '_blank');
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  //async function _loginComplete() {
  //  location.reload();
 // }
  
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
