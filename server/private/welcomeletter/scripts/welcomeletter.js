//-------------------------------------------------------------------
// welcome letter configuration
//-------------------------------------------------------------------
// TODO: implement preview
// TODO: implement share
// TODO: add editing for dropdown values (or create another app?)
// TODO: sanitize course name and limit length, check for uniqueness fail
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const appInfo = {
    appName: 'Welcome letter configuration'
  };
  
  const settings = {
    logoutURL: '/usermanagement/logout',
    helpURL: '/welcomeletter/help'
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init () {
    page.body = document.getElementsByTagName('body')[0];
    page.contents = page.body.getElementsByClassName('contents')[0];
    
    page.contentsConfiguration = page.body.getElementsByClassName('contents-configuration')[0];
    page.contentsPreview = page.body.getElementsByClassName('contents-preview')[0];
    page.contentsShare = page.body.getElementsByClassName('contents-share')[0];
    
    page.notice = new StandardNotice(page.body, page.body);
    
    page.notice.setNotice('loading...', true);
    if (!(await _getUserInfo())) return;
    page.notice.setNotice('');
    
    _renderPage();
    
    settings.currentCourseInfo = null;
    await _loadCourseList();
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
      
      if (item.innerHTML == settings.userInfo.userName) UtilityKTS.setClass(item, 'username', true);
    }
    
    // move standard notice
    navbarContainer.appendChild(page.notice._errorNotice);
    navbarContainer.appendChild(page.notice._normalNoticeContainer);
    UtilityKTS.setClass(page.notice._errorNotice, 'navbar-notice', true);
    UtilityKTS.setClass(page.notice._normalNoticeContainer, 'navbar-notice', true);
    
    page.notice.setNotice('');
    _attachHandlers();
    
    settings.navbar.selectOption('Confguration');
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Confguration', callback: () => {return _navDispatch('configuration');}, subitems: null, rightjustify: false},
        {label: 'Preview', callback: () => {return _navDispatch('preview');}, subitems: null, rightjustify: false},
        {label: 'Share', callback: () => {return _navDispatch('share');}, subitems: null, rightjustify: false},
        {label: 'Options', callback: () => {return _navDispatch('options');}, subitems: null, rightjustify: false},
        {label: settings.userInfo.userName, callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: true}        
      ],
      
      hamburgeritems: [           
        {label: 'add course', markselected: false, callback: () => {return _navDispatch('add');}},
        {label: 'delete course', markselected: false, callback: () => {return _navDispatch('delete');}},
        {label: 'help', markselected: false, callback: _showHelp},
        {label: 'sign out', markselected: false, callback: _doLogout}
      ]   
    };

    settings.navbar = new NavigationBar(navConfig);
        
    return settings.navbar.render();
  }
  
  function _attachHandlers() {    
    var handler = (e) => {_handleCourseSelect(e);};
    page.body.getElementsByClassName('course')[0].addEventListener('change', handler); 

    var eventMap = {
      'INPUT': 'input',
      'LABEL': 'click',
      'SELECT': 'change'
    };

    handler = (e) => {_handleParameterChange(e);};
    var configControls = page.contentsConfiguration.getElementsByClassName('config-param');
    for (var i = 0; i < configControls.length; i++) {
      var control = configControls[i];
      var eventName = eventMap[control.nodeName];
      control.addEventListener(eventName, handler);
    }
  }

  //---------------------------------------
	// update
	//----------------------------------------
  async function _loadCourseList() {
    page.notice.setNotice('');
    var queryResult = await queryCourseList();

    UtilityKTS.setClass(page.contents, 'hide-me', !queryResult.success);
    if (!queryResult.success) {
      page.notice.setNotice('failed to load course list');
      return false;
    }
    
    settings.courseInfo = queryResult.data;
    
    var elemCourseSelect = page.body.getElementsByClassName('course')[0];
    UtilityKTS.removeChildren(elemCourseSelect);
    
    var currentCourseId = null;
    if (settings.currentCourseInfo) currentCourseId = settings.currentCourseInfo.courseid;
    var selectedIndex = -1;
    
    if (queryResult.success) {
      var courseList = queryResult.data;
      for (var i = 0; i < courseList.length; i++) {
        var course = courseList[i];
        elem = document.createElement('option');
        elem.value = i;
        elem.text = course.coursename;
        elemCourseSelect.appendChild(elem);
        
        if (course.courseid == currentCourseId) {
          settings.currentCourseInfo = settings.courseInfo[i];
          selectedIndex = i;
        }
      }    
    }
    
    elemCourseSelect.value = selectedIndex;
    _loadCourseInfo(settings.currentCourseInfo);
    
    return true;
  }
  
  function _loadCourseInfo(courseInfo) {
    settings.currentCourseInfo = courseInfo;
    
    var courseVal = courseInfo ? page.body.getElementsByClassName('course')[0].value : -1;
    var apVal = courseInfo ? courseInfo.ap : false;
    var examVal = courseInfo ? courseInfo.examid : -1;
    var proctoringVal = courseInfo ? courseInfo.proctoringid : -1;
    var retakeVal = courseInfo ? courseInfo.retakeid : -1;
    var resubmissionVal = courseInfo ? courseInfo.resubmissionid : -1;
    
    _setSelectValue('course', courseVal);
    _setSwitch('apcourse', apVal);
    _setSelectValue('exams', examVal);
    _setSelectValue('proctoring', proctoringVal);
    _setSelectValue('retakes', retakeVal);
    _setSelectValue('resubmission', resubmissionVal); 
    
    var enable = courseVal > -1
    _enableElement('apcourse', enable);
    _enableElement('exams', enable);
    _enableElement('proctoring', enable);
    _enableElement('retakes', enable);
    _enableElement('resubmission', enable); 
    
    _setMenuItems();
  }
  
  async function _addCourse(e) {  
    var msg = 'Enter the name of the new course';
    var courseName = prompt(msg);
    if (!courseName) return;
    
    page.notice.setNotice('adding course...', true);
    var result = await queryInsertCourse({coursename: courseName});
    if (!result.success) {
      page.notice.setNotice(result.details);
      return;
    }

    settings.currentCourseInfo = {};
    settings.currentCourseInfo.courseid = result.data.courseid;
    
    page.notice.setNotice('');
    await _loadCourseList();
  }

  async function _deleteCourse() {
    var courseInfo = _getSelectedCourse();

    if (!courseInfo) return;

    var msg = 'This course will be deleted:';
    msg += '\n' + courseInfo.coursename;
    msg += '\n\nThis action cannot be undone.  Continue with deletion?';
    
    if (!confirm(msg)) return;

    page.notice.setNotice('deleting course...', true);
    var result = await queryDeleteCourse(courseInfo);
    if (!result.success) {
      page.notice.setNotice(result.details);
      return;
    }

    settings.currentCourseInfo = null;
    
    page.notice.setNotice('');
    await _loadCourseList();
  }
  
  async function _saveCourseInfo() {
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return;
    
    var configurationInfo = {
      courseid: courseInfo.courseid,
      ap: _getSwitch('apcourse'),
      examid: page.body.getElementsByClassName('exams')[0].value,
      proctoringid: page.body.getElementsByClassName('proctoring')[0].value,
      retakeid: page.body.getElementsByClassName('retakes')[0].value,
      resubmissionid: page.body.getElementsByClassName('resubmission')[0].value,
    };
    
    var result = await queryUpdateCourse(configurationInfo);
    if (!result.success) {
      page.notice.setNotice(result.details);
      return;
    }
    
    await _loadCourseList();
  }
  
  function _getSelectedCourse() {    
    var elem = page.body.getElementsByClassName('course')[0];
    if (elem.value < 0) return null;
    
    return settings.courseInfo[elem.value];
  }
  
  function _showContents(contentsClass) {
    var contents = page.body.getElementsByClassName('contents');
    
    for (var i = 0; i < contents.length; i++) {
      UtilityKTS.setClass(contents[i], 'hide-me', true);
    }
    
    UtilityKTS.setClass(page.body.getElementsByClassName(contentsClass)[0], 'hide-me', false);
    _setMenuItems();
  }  
  
  function _showPreview() {
    _showContents('contents-preview');
    _setMenuItems();
  }
  
  function _showShare() {
    _showContents('contents-share');
    _setMenuItems();
  }
    
  function _showOptions() {
    _showContents('contents-options');
    _setMenuItems();
  }
  
  function _setMenuItems() {
    if (!page.navitem) return;
    var courseIsSelected = (page.body.getElementsByClassName('course')[0].selectedIndex >= 0);
    var configurationDisplayed = !page.contentsConfiguration.classList.contains('hide-me');

    _setDisarm(page.navitem.preview, !courseIsSelected);
    _setDisarm(page.navitem.share, !courseIsSelected);

    _setDisarm(page.navitem.add_course, !configurationDisplayed);
    _setDisarm(page.navitem.delete_course, !(courseIsSelected && configurationDisplayed));
  }

  //---------------------------------------
	// handlers
	//----------------------------------------
  function _navDispatch(dispatchOption) {
    var dispatchMap = {
      'configuration': function() {_showContents('contents-configuration'); },
      'preview': _showPreview,
      'share': _showShare,
      'options': _showOptions,
      'profile': function() {},
      'add': _addCourse,
      'delete': _deleteCourse
    };
    
    var route = dispatchMap[dispatchOption];
    route();

  }
  
  async function _handleCourseSelect(e) {
    _loadCourseInfo(settings.courseInfo[e.target.value]);
  }
  
  async function _handleParameterChange(e) {
    if (e.target.classList.contains('switch-label')) return;
    await _saveCourseInfo();
  }

  async function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }

  function _showHelp() {
    window.open(settings.helpURL, '_blank');
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
  
  async function queryCourseList() {
    return await SQLDBInterface.doGetQuery('welcome/query', 'courselist2');
  }
  
  async function queryCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcome/query', 'course2', courseInfo);
  }
  
  async function queryInsertCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcome/insert', 'course2', courseInfo);
  }
  
  async function queryUpdateCourse(configurationInfo) {
    return await SQLDBInterface.doPostQuery('welcome/update', 'course2', configurationInfo);
  }

  async function queryDeleteCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcome/delete', 'course2', courseInfo);
  }
  
  async function queryMailMessage(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcome/query', 'mailmessage', courseInfo);
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	

  function _copyRenderedToClipboard(txt) {
    if (!page._renderedclipboard) page._renderedclipboard = new ClipboardCopy(page.body, 'rendered');

    page._renderedclipboard.copyRenderedToClipboard(txt);
	}	  

  //---------------------------------------
  // utility functions
  //----------------------------------------
  function _setSelectValue(className, selectValue) {
    var elem = page.body.getElementsByClassName(className)[0];
    elem.disabled = false;
    if (selectValue) {
      elem.value = selectValue;
    } else {
      elem.selectedIndex = -1;
    }      
  }
    
  function _enableElement(className, enable) {
    var elem = page.body.getElementsByClassName(className)[0];
    elem.disabled = !enable;
  }
  
  function _setSwitch(className, switchValue) {
    var elemSwitch = page.body.getElementsByClassName(className)[0];
    UtilityKTS.setClass(elemSwitch, 'disabled', false);
    elemSwitch.getElementsByClassName('switch-input')[0].checked = switchValue;
  }
  
  function _getSwitch(className) {
    var elemSwitch = page.body.getElementsByClassName(className)[0];
    return elemSwitch.getElementsByClassName('switch-input')[0].checked;
  }
  
  function _setDisarm(elem, disarm) {
    UtilityKTS.setClass(elem, 'disarm-me', disarm);
  }

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
