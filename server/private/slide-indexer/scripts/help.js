//-------------------------------------------------------------------
// help page for Slide Indexer config tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appInfo = {
    appVersion: '1.00.01',
    appName: 'Slide Indexer config help'
  };
  
	const page = {};
  
	const settings = {
    optionList: ['overview', 'controls', 'slideconfig', 'embed']
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    window.addEventListener('message', (e) => {_handleMessage(e);}, false);
    
    page.body.appendChild(_renderPage());

    settings.navbar.selectOption('overview');
    
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    var container = CreateElement.createDiv(null, 'slide-indexer-help');

    container.appendChild(_renderNavbar());
    container.appendChild(_renderContents());
    
    return container;
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'overview', callback: () => {return _navDispatch('overview');}, subitems: null, rightjustify: false},
        {label: 'controls', callback: () => {return _navDispatch('controls');}, subitems: null, rightjustify: false},
        {label: 'slide configuration', callback: () => {return _navDispatch('slideconfig');}, subitems: null, rightjustify: false},
        {label: 'embedding', callback: () => {return _navDispatch('embed');}, subitems: null, rightjustify: false}
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
      var url = '/subpage/slide-indexer/' + opt;
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
	// calls from help content
	//----------------------------------------
  function _handleMessage(e) {
    var message = e.data.split('|');
    if (!message || message.length != 2) return;
    
    settings.navbar.selectOption(message[0]);
    var currentSubpage = _getCurrentSubpage();
    if (currentSubpage) {
      currentSubpage.contentWindow.postMessage(message[1], '*');
    }
  }
  
  function _getCurrentSubpage() {
    var current = null;
    
    for (var i = 0; i < settings.optionList.length && !current; i++) {
      var iframe = page[settings.optionList[i]];
      if (!iframe.classList.contains('help-hideme')) current = iframe;
    }
    
    return current;
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
