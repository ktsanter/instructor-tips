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
    helpURL: '/instructortips-help',
    logoutURL: '/usermanagement/logout/instructortips',
    
    navOptions: [
      'scheduling', 'share', 'notification', 'editing',
      'profile'
    ]
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {
    document.title = appInfo.appName;
    
    settings.sodium = sodium;
    
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.maincontainer = CreateElement.createDiv('mainContainer', null);
    page.body.appendChild(page.maincontainer);

    await _renderPage();
    await settings.share.update();
    
    settings.objNavbar.selectOption('Scheduling');
    // start with profile: document.getElementsByClassName('navbar-item-right')[1].click();
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async function _renderPage() {        
    await _getUserInfo();
    
    page.maincontainer.appendChild(await _renderSubContainers());
    settings.navbar = await _renderNavbar();
    page.body.insertBefore(settings.navbar, page.body.firstChild);
    attachShareCountElement();
    page.maincontainer.classList.add('bump-down');
  }
  
  async function _getUserInfo() {
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'getuser');
    settings.userInfo = null;

    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
    }     
  }
  
  async function _refreshUserInfo() {
    var oldName = settings.userInfo.userName;    
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'refreshuser');
    settings.userInfo = null;
    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
      settings.objNavbar.changeOptionLabel(oldName, settings.userInfo.userName);
    }     
  }
  
  async function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Scheduling', callback: () => {return _navDispatch('scheduling');}, subitems: null, rightjustify: false},
        {label: 'Tip editing', callback: () => {return _navDispatch('editing');}, subitems: null, rightjustify: false},
        {label: 'Sharing', callback: () => {return _navDispatch('share');}, subitems: null, rightjustify: false},
        {label: 'Notification', callback: () => {return _navDispatch('notification');}, subitems: null, rightjustify: false},
        {label: settings.userInfo.userName, callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: true}
      ],
      
      hamburgeritems: [           
        {label: 'help', markselected: false, callback: _showHelp},
        {label: 'sign out', markselected: false, callback: _doLogout}
      ]      
    };
    
    settings.objNavbar = new NavigationBar(navConfig);
    
    return settings.objNavbar.render();
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

    settings.editing = new TipEditing();
    container.appendChild(await settings.editing.render());
    
    settings.profile = new TipProfile({
      displayNameCallback: (params) => {_handleDisplayNameChange(params);},
      sodium: settings.sodium
    });
    container.appendChild(await settings.profile.render());
    
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
  
  async function _handleDisplayNameChange(params) {
    await _refreshUserInfo();
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
