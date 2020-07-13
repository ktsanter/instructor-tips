//-------------------------------------------------------------------
// TreasureHunt configuration tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appInfo = {
    appVersion: '0.01',
    appName: 'Treasure Hunt configuration',
    appAuthor: 'Kevin Santer',
    appContact: 'ksanter@michiganvirtual.org',
    appEmail: 'mailto:ksanter@michiganvirtual.org'    
  };
  
	const page = {};
  
  const settings = {
    helpURL: '/treasurehunt-help',
    logoutURL: '/usermanagement/logout',
    
    optionList: ['layout', 'clues', 'profile']
  };
   
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    document.title = appInfo.appName;
    
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
   
    await _getUserInfo();
    
    page.body.appendChild(await _render());
    
    await settings.projectControl.update();
    settings.navbar.selectOption('Layout');    
	}
  
  async function _getUserInfo() {
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'getuser');
    settings.userInfo = null;
    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
    }     
  }  
	
	//-----------------------------------------------------------------------------
	// rendering
	//-----------------------------------------------------------------------------  
  async function _render() {
    var container = CreateElement.createDiv(null, 'treasurehunt');
    
    container.appendChild(_renderNavbar());
    
    settings.projectControl = new TreasureHuntProjectControl({
      callbackSelectionChanged: _callbackSelectionChanged
    });
    container.appendChild(await settings.projectControl.render());

    container.appendChild(await _renderContents());    

    return container;
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Layout', callback: () => {return _navDispatch('layout');}, subitems: null, rightjustify: false},
        {label: 'Clues', callback: () => {return _navDispatch('clues');}, subitems: null, rightjustify: false},
        {label: settings.userInfo.userName, callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: true}        
      ],
      
      hamburgeritems: [           
        {label: 'help', markselected: false, callback: _showHelp},
        {label: 'sign out', markselected: false, callback: _doLogout}
      ]   
    };

    settings.navbar = new NavigationBar(navConfig);
        
    return settings.navbar.render();
  }  
  
  async function _renderContents() {
    var container = CreateElement.createDiv(null, 'treasurehunt-contents');
    
    for (var i = 0; i < settings.optionList.length; i++) {
      var opt = settings.optionList[i];
      
      var elem;
      if (opt == 'layout') {
        var suggestedValue = {  
          imageName: 'https://drive.google.com/uc?id=17nVXc-kbjAPIe8ALpG-AXSH-DbLh0rK0',
          message: 'Welcome to the **[Course Name] Treasure Hunt!**',
          positiveResponse: 'Congratulations! You\'ve found answer #[[cluenumber]] of [[numberofclues]].    \n\nLet InstructorName know by sending a message or text with this phrase',
          negativeResponse: '*Sorry, that\'s not a valid answer. Feel free to try again*'
        };
        
        settings.layout = new TreasureHuntLayout({
          "projectControl": settings.projectControl,
          "suggestedValue": suggestedValue
        });
        
      } else if (opt == 'clues' ){
        settings.clues = new TreasureHuntClues({
          projectControl: settings.projectControl,
          defaultClue: {
            prompt: '',
            response: '',
            action: {type: 'none'},
            confirmation: ''            
          }
        });
        
      } else if (opt == 'profile') {
        settings.profile = new TreasureHuntProfile();
      }
      
      var elem = await settings[opt].render();
      container.appendChild(elem);
      page[opt] = elem;
    }
    
    return container;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  async function _navDispatch(arg) {
    for (var i = 0; i < settings.optionList.length; i++) {
      var opt = settings.optionList[i];
      settings[opt].show(false);
    }
    
    settings.projectControl.show(arg != 'profile');
    settings.projectControl.setPairedChild(settings[arg]);
    
    settings[arg].show(settings.projectControl.isProjectSelected() || arg == 'profile');
  }
  
  function _showHelp() { 
    window.open(settings.helpURL, '_blank');
  }
    
  async function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
    
  function _callbackSelectionChanged() {
    settings.layout.projectSelectionChanged();
    settings.clues.projectSelectionChanged();
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
