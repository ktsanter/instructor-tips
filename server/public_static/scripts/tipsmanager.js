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
    navOptions: ['courses', 'scheduling', 'editing', 'mapping']
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.maincontainer = CreateElement.createDiv('mainContainer', null);
    page.body.appendChild(page.maincontainer);

    _renderPage();
    _navDispatch('scheduling');
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  async function _renderPage() {
    page.maincontainer.appendChild(_renderAbout());
    page.maincontainer.appendChild(_renderLogin());
    page.maincontainer.appendChild(_renderSubContainers());
    page.body.insertBefore(_renderNavbar(), page.body.firstChild);
    page.maincontainer.classList.add('bump-down');
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appinfo.appname,
      
      items: [
        {label: 'Courses', callback: () => {return _navDispatch('courses');}, subitems: null, rightjustify: false},
        {label: 'Scheduling', callback: () => {return _navDispatch('scheduling');}, subitems: null, rightjustify: false},
        {label: 'Editing', callback: () => {return _navDispatch('editing');}, subitems: null, rightjustify: false},
        {label: 'Mapping', callback: () => {return _navDispatch('mapping');}, subitems: null, rightjustify: false}
      ],
      
      hamburgeritems: [
        {label: 'login', callback: _showLogin},
        {label: 'help', callback: _showHelp},
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
    settings.logincontainer = new LoginUI(() => {return _loginComplete();});
    return settings.logincontainer.render();
  }
  
  function _renderSubContainers() {
    var container = CreateElement.createDiv(null, null);
    
    settings.courses = new TipCourseSelection();
    container.appendChild(settings.courses.render());
    
    settings.scheduling = new TipScheduling();
    container.appendChild(settings.scheduling.render());
    
    settings.editing = new TipEditing();
    container.appendChild(settings.editing.render());
    
    settings.mapping = new TipMapping();
    container.appendChild(settings.mapping.render());

    return container;
  }

  //---------------------------------------
	// navbar callbacks
	//----------------------------------------
  async function _navDispatch(arg) {
    for (var i = 0; i < settings.navOptions.length; i++) {
      var opt = settings.navOptions[i];
      settings[opt].show(false);
    }
    settings[arg].show(true);
    await settings[arg].update();  
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
    await settings.scheduling.userchange();
    await settings.editing.userchange();
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
