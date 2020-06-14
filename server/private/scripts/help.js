//-------------------------------------------------------------------
// help page for Instructor Tips "Tips Manager" tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appInfo = {
    appVersion: '0.56',
    appName: 'InstructorTips',
    appAuthor: 'Kevin Santer',
    appContact: 'ksanter@michiganvirtual.org',
    appEmail: 'mailto:ksanter@michiganvirtual.org',
    helpURL: 'help.html'
  };
  
	const page = {};
  
	const settings = {};
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.body.appendChild(_renderPage());
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    var container = CreateElement.createDiv(null, null);
    
    container.appendChild(_renderTitle());
    container.appendChild(_renderAbout());
    container.appendChild(_renderContents());
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'title-container');
    
    var titleLabel = CreateElement.createDiv(null, 'title', appInfo.appName + ' help');
    container.appendChild(titleLabel);
    
    return container;
  }
  
  function _renderAbout() {
    var container = CreateElement.createDiv(null, 'about-container');
    
    container.appendChild(_renderLogoSplash());
    container.appendChild(_renderVersion());
    container.appendChild(_renderAuthor());
    
    return container;    
  }
  
  function _renderContents() {
    var container = CreateElement.createDiv(null, 'contents-container');
    
    container.appendChild(_renderHelp());
    
    return container;    
  }

  function _renderLogoSplash() {
    var container = CreateElement.createDiv(null, 'about-logosplash');
    
    container.appendChild(CreateElement.createIcon(null, 'about-logo far fa-lightbulb'));
    container.appendChild(CreateElement.createSpan(null, 'about-logotitle', appInfo.appName));
    
    return container;
  }
  
  function _renderVersion() {
    var container = CreateElement.createDiv(null, 'about-version');
    
    container.appendChild(CreateElement.createSpan(null, 'about-label', 'version '));
    container.appendChild(CreateElement.createSpan(null, 'about-infoitem', appInfo.appVersion));
    
    return container;
  }
  
  function _renderAuthor() {
    var container = CreateElement.createDiv(null, 'about-author');

    container.appendChild(CreateElement.createSpan(null, 'about-infoitem', appInfo.appAuthor));
    
    var emailContainer = CreateElement.createSpan(null, 'about-infoitem');
    container.appendChild(emailContainer);
    
    emailContainer.appendChild(CreateElement.createSpan(null, null, ' ('));
    emailContainer.appendChild(CreateElement.createLink(null, 'about-infoitem', appInfo.appContact, null, appInfo.appEmail)); 
    emailContainer.appendChild(CreateElement.createSpan(null, null, ')'));

    return container;
  }
  
  function _renderHelp() {
    var container = CreateElement.createDiv(null, 'contents-container');

    container.appendChild(CreateElement.createDiv(null, null, 'content TBD'));
    
    return container;
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
