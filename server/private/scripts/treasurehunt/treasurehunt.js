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
    optionList: ['choice1', 'choice2', 'choice3']
  };
   
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    document.title = appInfo.appName;

		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.body.appendChild(_render());    
	}
	
	//-----------------------------------------------------------------------------
	// rendering
	//-----------------------------------------------------------------------------  
  function _render() {
    var container = CreateElement.createDiv(null, 'treasurehunt');
    
    container.appendChild(_renderNavbar());
    container.appendChild(_renderContents());    

    settings.navbar.selectOption('Choice1');
    
    return container;
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Choice1', callback: () => {return _navDispatch('choice1');}, subitems: null, rightjustify: false},
        {label: 'Choice2', callback: () => {return _navDispatch('choice2');}, subitems: null, rightjustify: false},
        {label: 'Choice3', callback: () => {return _navDispatch('choice3');}, subitems: null, rightjustify: false}
      ],
      
      hamburgeritems: []
    };
    
    settings.navbar = new NavigationBar(navConfig);
        
    return settings.navbar.render();
  }  
  
  function _renderContents() {
    var container = CreateElement.createDiv(null, 'treasurehunt-contents');
    
    for (var i = 0; i < settings.optionList.length; i++) {
      var opt = settings.optionList[i];
      var classList = 'treasurehunt-subcontents treasurehunt-' + opt + ' treasurehunt-hideme';
      var elem = CreateElement.createDiv(null, classList, '[contents for ' + opt + ']');
      container.appendChild(elem);
      page[opt] = elem;
    }
    
    return container;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _navDispatch(arg) {
    for (var i = 0; i < settings.optionList.length; i++) {
      var opt = settings.optionList[i];
      UtilityKTS.setClass(page[opt], 'treasurehunt-hideme', true);
    }
    
    UtilityKTS.setClass(page[arg], 'treasurehunt-hideme', false);

  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
