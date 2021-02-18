//-------------------------------------------------------------------
// welcome letter options editor
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const appInfo = {
    appName: 'Welcome letter options editor'
  };
  
  const settings = {
    logoutURL: '/usermanagement/logout'
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init () {
    page.body = document.getElementsByTagName('body')[0];
    page.contents = page.body.getElementsByClassName('contents')[0];
    
    page.notice = new StandardNotice(page.body, page.body);
    
    page.notice.setNotice('loading...', true);
    if (!(await _getUserInfo())) return;
    page.notice.setNotice('');
    
    _renderPage();
  }

  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  function _renderPage() {
    var navbarContainer = page.body.getElementsByClassName('navbarcontainer')[0]
    page.navbar = _renderNavbar();
    navbarContainer.appendChild(page.navbar); 
    
    var navbarMainItems = Array.prototype.slice.call(page.body.getElementsByClassName('navbar-main-item'), 0);
    var hamburgerItems = Array.prototype.slice.call(page.body.getElementsByClassName('dropdown-content hamburger')[0].children, 0);
    var navbarItems = navbarMainItems.concat(hamburgerItems);
    
    page.navitem = {};
    for (var i = 0; i < navbarItems.length; i++) {
      var item = navbarItems[i];
      var itemKey = item.innerHTML.split(' ').join('_').toLowerCase();
      page.navitem[itemKey] = item;
    }
    
    // move standard notice
    navbarContainer.appendChild(page.notice._errorNotice);
    navbarContainer.appendChild(page.notice._normalNoticeContainer);
    UtilityKTS.setClass(page.notice._errorNotice, 'navbar-notice', true);
    UtilityKTS.setClass(page.notice._normalNoticeContainer, 'navbar-notice', true);
    
    _createTableEditors( ['exams', 'proctoring', 'retakes', 'resubmission', 'general'] );
    
    _attachHandlers();
    
    settings.navbar.selectOption('Exams');
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Exams', callback: () => {return _navDispatch('exams');}, subitems: null, rightjustify: false},
        {label: 'Proctoring', callback: () => {return _navDispatch('proctoring');}, subitems: null, rightjustify: false},
        {label: 'Retakes', callback: () => {return _navDispatch('retakes');}, subitems: null, rightjustify: false},
        {label: 'Resubmission', callback: () => {return _navDispatch('resubmission');}, subitems: null, rightjustify: false},
        {label: 'General', callback: () => {return _navDispatch('general');}, subitems: null, rightjustify: false},
        {label: settings.userInfo.userName, callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: true}        
      ],
      
      hamburgeritems: [           
        {label: 'sign out', markselected: false, callback: _doLogout}
      ]   
    };

    settings.navbar = new NavigationBar(navConfig);
        
    return settings.navbar.render();
  }

  async function _createTableEditors(editorList) {
    var params = {
      hideClass: 'hide-me',
      selectCallback: _handleSelectCallback
    };
    
    page.editor = {};
    for (var i = 0; i < editorList.length; i++) {
      var key = editorList[i];
      page.editor[key] = new TableEditor({...params, title: _capitalize(key)});
      page.contents.appendChild(await page.editor[key].render());
    }
  }
  
  function _attachHandlers() {
    console.log('_attachHandlers()');
  }

  //---------------------------------------
	// update
	//----------------------------------------          
  function _setMenuItems() {
    // use _setDisarm(elem, true/false) based on current display choices
  }
  
  function _displayEditor(title) {
    for (var key in page.editor) page.editor[key].show(false);
    page.editor[title].show(true);
  }

  //---------------------------------------
	// handlers
	//----------------------------------------
  function _navDispatch(dispatchOption) {
    var dispatchMap = {
      'exams': function() { _displayEditor('exams'); },
      'proctoring': function() { _displayEditor('proctoring'); },
      'retakes': function() { _displayEditor('retakes'); },
      'resubmission': function() { _displayEditor('resubmission'); },
      'general': function() { _displayEditor('general'); },
      'profile': function() {_dummy('profile'); }
    };
    
    var route = dispatchMap[dispatchOption];
    route();

  }
  
  function _dummy(param) {
    console.log('dummy: ' + param);
  }
  
  async function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------
  async function _getUserInfo() {
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'getuser');
    settings.userInfo = null;
    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
    } else {
      page.notice.setNotice('failed to get user info');
    }
    
    return dbResult.success;
  }

  async function _handleSelectCallback(title) {
    var result = null;
    var editorKey = title.toLowerCase();

    page.notice.setNotice('retrieving data for ' + title + '...');
    var dbResult = await SQLDBInterface.doPostQuery('welcomeV2/query', 'optionvalues', {"editorKey": editorKey});
    
    if (dbResult.success) {
      result = dbResult.data;
      page.notice.setNotice();
    } else {
      result = null;
      page.notice.setNotice('failed to get ' + editorKey + ' data');
    }
    
    return result;
  }
  
  
  async function queryCourseList() {
    return await SQLDBInterface.doGetQuery('welcomeV2/query', 'courselist');
  }
  
  //---------------------------------------
  // utility functions
  //----------------------------------------
  function _setDisarm(elem, disarm) {
    UtilityKTS.setClass(elem, 'disarm-me', disarm);
  }
  
  function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
