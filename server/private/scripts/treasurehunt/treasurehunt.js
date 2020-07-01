//-------------------------------------------------------------------
// test platform 
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
    optionList: ['layout', 'clues', 'profile']
  };
   
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    document.title = appInfo.appName;

		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.body.appendChild(await _render());
    
    await settings.projectControl.update();
    settings.navbar.selectOption('Layout');    
	}
	
	//-----------------------------------------------------------------------------
	// rendering
	//-----------------------------------------------------------------------------  
  async function _render() {
    var container = CreateElement.createDiv(null, 'treasurehunt');
    
    container.appendChild(_renderNavbar());
    
    settings.projectControl = new TreasureHuntProjectControl({
      updateCallback: _controlUpdateCallback
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
        {label: 'Mr. User', callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: true}        
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
        var suggestedValue = {  // get these from DB
          imageName: 'suggested value for imageName',
          message: 'suggested value for message',
          positiveResponse: 'suggested value for positiveResponse',
          negativeResponse: 'suggested value for negativeResponse'
        };
        
        settings.layout = new TreasureHuntLayout({
          "projectControl": settings.projectControl,
          "suggestedValue": suggestedValue
        });
        
      } else if (opt == 'clues' ){
        settings.clues = new TreasureHuntClues({
          defaultClue: {
            prompt: 'default prompt',
            response: 'default response',
            action: {type: 'none'},
            confirmation: 'default confirmation'            
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
    await settings[arg].update(settings.projectControl.getProjectInfo());
    settings[arg].show(true);
  }
  
  function _showHelp() {
    console.log('show help');
  }
  
  function _doLogout() {
    console.log('do logout');
  }
  
  function _controlUpdateCallback(params) {
    settings.layout.update(params);
    settings.clues.update(params);
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
