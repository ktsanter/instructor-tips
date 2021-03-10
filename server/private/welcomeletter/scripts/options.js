//-------------------------------------------------------------------
// welcome letter options editor
//-------------------------------------------------------------------
// TODO: hide/show table editors upon nav selections
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const appInfo = {
    appName: 'Welcome letter options editor'
  };
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',    
    configurationEditorURL: '/welcomeletter/configuration',
    logoutURL: '/usermanagement/logout/welcomeV2',
    helpURL: '/welcomeletter/help',
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  
  async function init (sodium) {
    page.body = document.getElementsByTagName('body')[0];
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('');
    
    page.contents = page.body.getElementsByClassName('contents')[0];
    
    page.notice.setNotice('loading...', true);  

    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, settings.hideClass, true);
    
    _attachNavbarHandlers(); // do these before making the profile object
    await _initProfile(sodium);
    
    UtilityKTS.setClass(page.navbar, settings.hideClass, false);
    
    await _renderContents();
    page.notice.setNotice('');
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
  }
  
  async function _initProfile(sodium) {
    settings.profile = new ASProfile({
      id: "myProfile",
      "sodium": sodium,
      navbarElements: {
        "save": page.navbar.getElementsByClassName('navSave')[0],
        "reload": page.navbar.getElementsByClassName('navReload')[0],
        "icon": page.navbar.getElementsByClassName('icon-profile')[0],
        "pic": page.navbar.getElementsByClassName('pic-profile')[0]
      },
      hideClass: settings.hideClass
    });
    
    await settings.profile.init();
  }
  
  //-----------------------------------------------------------------------------
	// navbar
	//-----------------------------------------------------------------------------
  function _attachNavbarHandlers() {
    var handler = (e) => { _navDispatch(e); }
    var navItems = page.navbar.getElementsByClassName(settings.navItemClass);
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', handler);
    }
  }  
  
  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  async function _renderContents() {
    await _createTableEditors( ['exams', 'proctoring', 'retakes', 'resubmission', 'general'] );
  }

  async function _createTableEditors(editorList) {
    var params = {
      hideClass: 'hide-me',
      selectCallback: _handleSelectCallback,
      updateCallback: _handleUpdateCallback,
      deleteCallback: _handleDeleteCallback,
      addCallback: _handleAddCallback
    };
    
    page.editor = {};
    for (var i = 0; i < editorList.length; i++) {
      var key = editorList[i];
      page.editor[key] = new TableEditor({...params, "key": key, title: _capitalize(key)});
      await page.editor[key].init(key);
      page.editor[key].render();
    }
  }
  
  //---------------------------------------
	// update
	//----------------------------------------  
  async function _showContents(contentsId) {
    settings.currentNavOption = contentsId;
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    var tableMap = {
      "navExams": 'exams',
      "navProctoring": 'proctoring', 
      "navRetakes": 'retakes', 
      "navResubmission": 'resubmission',
      "navGeneral": 'general'
    }
    
    if (tableMap.hasOwnProperty(contentsId)) {
      await _displayEditor(tableMap[contentsId]);
      
    } else if (contentsId == 'navProfile') await settings.profile.reload();
    
    _setNavOptions();
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    var validCourse = (settings.currentCourse != null);

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);
    
    if (opt == 'navProfile') {
      var enable = settings.profile.isDirty();
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
    }    
  }
  
  
  function _enableNavOption(navOption, visible, enable) {
    var elem = document.getElementById(navOption);
    UtilityKTS.setClass(elem, settings.hideClass, !visible);
    if (elem.classList.contains('btn')) {
      elem.disabled = !enable;    
    } else {
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
  }  
  
  async function _displayEditor(title) {
    for (var key in page.editor) {
      await page.editor[key].update();
      page.editor[key].show(false);
    }
    page.editor[title].show(true);
  }

  //---------------------------------------
	// handlers
	//----------------------------------------
  async function _navDispatch(e) {
    var dispatchTarget = e.target.id;
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    var dispatchMap = {
      "navExams":         async function() { await _showContents(dispatchTarget); },
      "navProctoring":    async function() { await _showContents(dispatchTarget); },
      "navRetakes":       async function() { await _showContents(dispatchTarget); },
      "navResubmission":  async function() { await _showContents(dispatchTarget); },
      "navGeneral":       async function() { await _showContents(dispatchTarget); },
      
      
      "navEditConfiguration":   function() { _doConfigurations(); },
      
      "navSave":          async function() { await _handleSave(e);},
      "navReload":        async function() { await _handleReload(e);},
      
      "navProfile":       async function() { await _showContents('navProfile'); },

      "navHelp":          function() { _doHelp(); },
      "navSignout":       function() { _doLogout(); }
    }
    
    dispatchMap[dispatchTarget]();
  }
  
  
  function _openConfigurationEditor() {
    window.open(settings.configurationEditorURL, '_self');
  }

  function _handleReload(e) {
    if (!confirm('Current changes will be lost.\nContinue with reloading project?')) return;
    
    if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
    } 
  }
  
  function _doConfigurations() {
    window.open(settings.configurationEditorURL, '_self');
  }
  
  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
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

    var dbResult = await SQLDBInterface.doPostQuery('welcomeV2/query', 'optionvalues', {"editorKey": editorKey});
    
    if (dbResult.success) {
      result = dbResult.data;
    } else {
      result = null;
      page.notice.setNotice('failed to get ' + editorKey + ' data');
    }
    
    return result;
  }
  
  async function _handleUpdateCallback(params) {
    var result = false;
    
    var dbResult = await SQLDBInterface.doPostQuery('welcomeV2/update', 'optionvalues', params);
    
    if (dbResult.success) {
      result = true;
    } else {
      page.notice.setNotice('failed to save data');
    }
    
    return result;
  }
  
  async function _handleDeleteCallback(params) {
    var result = false;
    
    var dbResult = await SQLDBInterface.doPostQuery('welcomeV2/delete', 'optionvalues', params);
    
    if (dbResult.success) {
      result = true;
    } else {
      page.notice.setNotice('failed to delete row');
    }
    
    return result;
  }
    
  async function _handleAddCallback(params) {
    var result = false;
    
    var dbResult = await SQLDBInterface.doPostQuery('welcomeV2/insert', 'optionvalues', params);
    
    if (dbResult.success) {
      result = true;
    } else {
      if (dbResult.details.includes('duplicate')) {
        page.notice.setNotice('a row with these values already exists');
      } else {
        page.notice.setNotice('failed to add row');
      }
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
