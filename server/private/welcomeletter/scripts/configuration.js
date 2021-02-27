//-------------------------------------------------------------------
// welcome letter configuration
//-------------------------------------------------------------------
// TODO: options editor
// TODO: final pass at content including Essentials
// TODO: add Profile nav option to allow email change/specification?
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const appInfo = {
    appName: 'Welcome letter configuration'
  };
  
  const settings = {
    optionsURL: '/welcomeletter/options',
    logoutURL: '/usermanagement/logout',
    helpURL: '/welcomeletter/help',
    previewURL_base: '/welcomeletterV2'
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
        {label: settings.userInfo.userName, callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: true}        
      ],
      
      hamburgeritems: [           
        {label: 'rename course', markselected: false, callback: () => {return _navDispatch('rename');}},
        {label: 'add course', markselected: false, callback: () => {return _navDispatch('add');}},
        {label: 'delete course', markselected: false, callback: () => {return _navDispatch('delete');}},
        {label: 'edit options', markselected: false, callback: () => {return _navDispatch('options');}},
        {label: 'help', markselected: false, callback: _showHelp},
        {label: 'sign out', markselected: false, callback: _doLogout}
      ]   
    };

    var allowOptions = page.body.getElementsByClassName('allowoptions')[0].innerHTML == 'true';
    if (!allowOptions) navConfig.hamburgeritems.splice(2, 1);

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
    
    handler = (e) => {_handleAudienceClick(e);};
    page.body.getElementsByClassName('audience')[0].addEventListener('click', handler);
    
    page.contentsShare.getElementsByClassName('button-link-student')[0].addEventListener('click', (e) => { _handleLinkClick(e); });
    page.contentsShare.getElementsByClassName('button-link-mentor')[0].addEventListener('click', (e) => { _handleLinkClick(e); });

    page.contentsShare.getElementsByClassName('button-message-student')[0].addEventListener('click', (e) => { _handleMessageClick(e); });
    page.contentsShare.getElementsByClassName('button-message-mentor')[0].addEventListener('click', (e) => { _handleMessageClick(e); });
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
    var haspasswordsVal = courseInfo ? courseInfo.haspasswords : false;
    var examVal = courseInfo ? courseInfo.examid : -1;
    var proctoringVal = courseInfo ? courseInfo.proctoringid : -1;
    var retakeVal = courseInfo ? courseInfo.retakeid : -1;
    var resubmissionVal = courseInfo ? courseInfo.resubmissionid : -1;
    
    _setSelectValue('course', courseVal);
    _setSwitch('apcourse', apVal);
    _setSwitch('haspasswords', haspasswordsVal);
    _setSelectValue('exams', examVal);
    _setSelectValue('proctoring', proctoringVal);
    _setSelectValue('retakes', retakeVal);
    _setSelectValue('resubmission', resubmissionVal); 
    
    var enable = courseVal > -1
    _enableElement('apcourse', enable);
    _enableElement('haspasswords', enable);
    _enableElement('exams', enable);
    _enableElement('proctoring', enable);
    _enableElement('retakes', enable);
    _enableElement('resubmission', enable); 
    
    _setMenuItems();
  }
  
  async function _renameCourse() {
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return;

    var msg = 'Please enter the new name for the course.';
    var newCourseName = prompt(msg, courseInfo.coursename);
    if (!newCourseName || newCourseName == courseInfo.coursename) return;

    if (!_validateCourseName(newCourseName)) {
      var msg = "The course name\n" + newCourseName + '\nis not valid.';
      msg += '\n\nIt must have length between 1 and 200';
      msg += ' and include only letters, digits, spaces, parentheses and commas.';
      alert(msg);
      return;
    }
    
    settings.currentCourseInfo.coursename = newCourseName;
    
    await _saveCourseInfo();
  }
  
  async function _addCourse(e) {  
    var msg = 'Enter the name of the new course';
    var courseName = prompt(msg);
    if (!courseName) return;
    
    if (!_validateCourseName(courseName)) {
      var msg = "The course name\n" + courseName + '\nis not valid.';
      msg += '\n\nIt must have length between 1 and 200';
      msg += ' and include only letters, digits, spaces, parentheses and commas.';
      alert(msg);
      return;
    }
    
    page.notice.setNotice('adding course...', true);
    var result = await queryInsertCourse({coursename: courseName});
    if (!result.success) {
      if (result.details.includes('duplicate')) {
        alert('failed to add course\n a configuration for "' + courseName + '" already exists');
        page.notice.setNotice('');
      } else {
        page.notice.setNotice(result.details);
      }
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
    var courseInfo = settings.currentCourseInfo;
    if (!courseInfo) return;
    
    var configurationInfo = {
      courseid: courseInfo.courseid,
      coursename: courseInfo.coursename,
      ap: _getSwitch('apcourse'),
      haspasswords: _getSwitch('haspasswords'),
      examid: page.body.getElementsByClassName('exams')[0].value,
      proctoringid: page.body.getElementsByClassName('proctoring')[0].value,
      retakeid: page.body.getElementsByClassName('retakes')[0].value,
      resubmissionid: page.body.getElementsByClassName('resubmission')[0].value,
    };
    
    var result = await queryUpdateCourse(configurationInfo);
    if (!result.success) {
      if (result.details.includes('duplicate')) {
        alert('failed to rename course\n a configuration for "' + courseInfo.coursename + '" already exists');
        page.notice.setNotice('');
      } else {
        page.notice.setNotice(result.details);
      }
    }
    
    await _loadCourseList();
  }
  
  function _getSelectedCourse() {    
    var elem = page.body.getElementsByClassName('course')[0];
    if (elem.value < 0) return null;
    
    return settings.courseInfo[elem.value];
  }
  
  function _showContents(contentsClass) {
    page.notice.setNotice('');
    var contents = page.body.getElementsByClassName('contents');
    
    for (var i = 0; i < contents.length; i++) {
      UtilityKTS.setClass(contents[i], 'hide-me', true);
    }
    
    UtilityKTS.setClass(page.body.getElementsByClassName(contentsClass)[0], 'hide-me', false);
    _setMenuItems();
  }  
  
  function _showPreview() {
    var audience = 'student';
    if (_getSwitch('audience')) audience = 'mentor';
    
    var previewURL = _landingPageURL(audience);
    page.contentsPreview.getElementsByClassName('preview-frame')[0].src = previewURL;
    
    _showContents('contents-preview');
    _setMenuItems();
  }
  
  function _showShare() {
    _showContents('contents-share');
    _setMenuItems();
  }
  
  function _setMenuItems() {
    if (!page.navitem) return;
    var courseIsSelected = (page.body.getElementsByClassName('course')[0].selectedIndex >= 0);
    var configurationDisplayed = !page.contentsConfiguration.classList.contains('hide-me');

    _setDisarm(page.navitem.preview, !courseIsSelected);
    _setDisarm(page.navitem.share, !courseIsSelected);

    _setDisarm(page.navitem.rename_course, !(courseIsSelected && configurationDisplayed));
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
      'options': _openOptions,
      'profile': function() { console.log('profile'); },
      'rename': _renameCourse,
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

  function _openOptions() {
    window.open(settings.optionsURL, '_self');
  }

  async function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }

  function _showHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _handleAudienceClick(e) {
    _showPreview();
  }
  
  function _handleLinkClick(e) {
    var audience = 'student'
    if (e.target.classList.contains('button-link-mentor')) audience = 'mentor';    

    var msg = _landingPageURL(audience);
    _copyToClipboard(msg);

    page.notice.setNotice(audience + ' link copied');
  }  
  
  async function _handleMessageClick(e) {
    var audience = 'student'
    if (e.target.classList.contains('button-message-mentor')) audience = 'mentor';
    
    var msg = await _mailMessage(audience);
    if (!msg) return;

    //--- is this necessary? --------------------
    // strip non-body material
    msg = msg.replace(/<!DOCTYPE html>/g, '');
    msg = msg.replace(/<html>/g, '');
    msg = msg.replace(/<html lang=\"en\">/g, '');
    msg = msg.replace(/<\/html>/g, '');
    msg = msg.replace(/<head>.*<\/head>/g, '');
    msg = msg.replace(/<body>/, '');
    msg = msg.replace(/<\/body>/, '');
    //-------------------------------------------
    
    _copyRenderedToClipboard(msg);

    page.notice.setNotice(audience + ' message copied');
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
    return await SQLDBInterface.doGetQuery('welcomeV2/query', 'courselist');
  }
  
  async function queryInsertCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcomeV2/insert', 'course', courseInfo);
  }
  
  async function queryUpdateCourse(configurationInfo) {
    return await SQLDBInterface.doPostQuery('welcomeV2/update', 'course', configurationInfo);
  }

  async function queryDeleteCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcomeV2/delete', 'course', courseInfo);
  }
  
  async function queryMailMessage(params) {
    return await SQLDBInterface.doPostQuery('welcomeV2/query', 'mailmessage', params);
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
  
  function _landingPageURL(audience) {
    var audienceIndex = '000';
    if (audience == 'mentor') audienceIndex = '100';
    
    var previewURL = window.location.origin + settings.previewURL_base;
    previewURL += '/' + settings.currentCourseInfo.courseid;
    previewURL += '/' + audienceIndex;
    
    return previewURL;
  }    
  
  async function _mailMessage(audience) {
    var result = null;
    var params = settings.currentCourseInfo;
    params.audience = audience;
    params.letterURL = _landingPageURL(audience);
    
    page.notice.setNotice('retrieving message data...', true);
    
    var queryResult = await queryMailMessage(params);
    if (queryResult.success) {
      result = queryResult.data;
      page.notice.setNotice('');
      
    } else {
      page.notice.setNotice('failed to retrieve ' + audience + ' message');
    }
    
    return result;
  }
   
  function _validateCourseName(courseName) {
    var valid = courseName.length < 200;
    valid = valid && courseName.length > 0;
    
    valid = valid && (courseName.match(/[A-Za-z0-9&:\(\), ]+/) == courseName);
    
    return valid;
  }

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();