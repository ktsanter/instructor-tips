//-------------------------------------------------------------------
// help page for InstructorTips "Tips Manager" tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appInfo = {
    appVersion: '0.56',
    appName: 'InstructorTips help',
    appAuthor: 'Kevin Santer',
    appContact: 'ksanter@michiganvirtual.org',
    appEmail: 'mailto:ksanter@michiganvirtual.org'
  };
  
	const page = {};
  
	const settings = {
    optionList: ['overview', 'scheduling', 'tipediting', 'sharing', 'notification', 'profile', 'other']
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.body.appendChild(_renderPage());

    settings.navbar.selectOption('Overview');
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    var container = CreateElement.createDiv(null, 'instructortips-help');

    container.appendChild(_renderNavbar());
    container.appendChild(_renderContents());
    
    return container;
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Overview', callback: () => {return _navDispatch('overview');}, subitems: null, rightjustify: false},
        {label: 'Scheduling', callback: () => {return _navDispatch('scheduling');}, subitems: null, rightjustify: false},
        {label: 'Tip editing', callback: () => {return _navDispatch('tipediting');}, subitems: null, rightjustify: false},
        {label: 'Sharing', callback: () => {return _navDispatch('sharing');}, subitems: null, rightjustify: false},
        {label: 'Notification', callback: () => {return _navDispatch('notification');}, subitems: null, rightjustify: false},
        {label: 'Profile', callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: false},
        {label: 'Other', callback: () => {return _navDispatch('other');}, subitems: null, rightjustify: false}
      ],
      
      hamburgeritems: []
    };
    
    settings.navbar = new NavigationBar(navConfig);
        
    return settings.navbar.render();
  }
  
  function _renderContents() {
    var container = CreateElement.createDiv(null, 'help-contents');
    
    for (var i = 0; i < settings.optionList.length; i++) {
      var opt = settings.optionList[i];
      var classList = 'help-subcontents help-' + opt;
      var url = 'subpages/help_' + opt + '.html';
      var elem = CreateElement.createIframe(null, classList, url, null, null, false);
      container.appendChild(elem);
      page[opt] = elem;
      elem.addEventListener('load', (e) => {_resizeIframe(e.target);});
    }
    
    return container;
  }
  
  function _resizeIframe(elemIframe) {
    elemIframe.style.height = elemIframe.contentWindow.document.documentElement.scrollHeight + 'px';
  }  
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _navDispatch(arg) {
    for (var i = 0; i < settings.optionList.length; i++) {
      var opt = settings.optionList[i];
      UtilityKTS.setClass(page[opt], 'help-hideme', true);
    }
    
    UtilityKTS.setClass(page[arg], 'help-hideme', false);
    _resizeIframe(page[arg]);
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
