//-------------------------------------------------------------------
// "about" info for Instructor Tips "Tips Manager" tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appInfo = {
    appVersion: '0.01',
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
    container.appendChild(_renderContents());
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'title-container');
    
    var titleLabel = CreateElement.createDiv(null, 'title', 'about ' + appInfo.appName);
    container.appendChild(titleLabel);
    
    return container;
  }
  
  function _renderContents() {
    var container = CreateElement.createDiv(null, 'contents-container');
    
    container.appendChild(_renderLogoSplash());
    container.appendChild(_renderVersion());
    container.appendChild(_renderAuthor());
    container.appendChild(_renderHelp());
    
    return container;    
  }
  
  function _renderLogoSplash() {
    var container = CreateElement.createDiv(null, 'contents-logosplash');
    
    container.appendChild(CreateElement.createIcon(null, 'contents-logo far fa-lightbulb'));
    container.appendChild(CreateElement.createSpan(null, 'contents-logotitle', appInfo.appName));
    
    return container;
  }
  
  function _renderVersion() {
    var container = CreateElement.createDiv(null, 'contents-version');
    
    container.appendChild(CreateElement.createSpan(null, 'contents-label', 'version '));
    container.appendChild(CreateElement.createSpan(null, 'contents-infoitem', appInfo.appVersion));
    
    return container;
  }
  
  function _renderAuthor() {
    var container = CreateElement.createDiv(null, 'contents-author');

    container.appendChild(CreateElement.createSpan(null, 'contents-infoitem', appInfo.appAuthor));
    
    var emailContainer = CreateElement.createSpan(null, 'contents-infoitem');
    container.appendChild(emailContainer);
    
    emailContainer.appendChild(CreateElement.createSpan(null, null, ' ('));
    emailContainer.appendChild(CreateElement.createLink(null, 'contents-infoitem', appInfo.appContact, null, appInfo.appEmail)); 
    emailContainer.appendChild(CreateElement.createSpan(null, null, ')'));

    return container;
  }
  
  function _renderHelp() {
    var container = CreateElement.createDiv(null, 'contents-help');
    
    var elemHelpLink = CreateElement.createLink(null, 'contents-infoitem', 'help for ' + appInfo.appName, null, appInfo.helpURL);
    elemHelpLink.target = '_blank';
    container.appendChild(elemHelpLink);
    
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
