//-------------------------------------------------------------------
// welcome letter configuration
//-------------------------------------------------------------------
// TODO: finish help
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const appInfo = {
    appName: 'Welcome letter configuration'
  };
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',
    
    currentCourse: null,
    
    logoutURL: '/usermanagement/logout/welcomeV2',
    optionsURL: '/welcomeletter/options',
    helpURL: '/welcomeletter/help',
    previewURL_base: '/welcomeletterV2',
    
    dirtyBit: {
      navConfiguration: false,
      navPreview: false,
      navShare: false,
      navProfile: false
    }
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init (sodium) {
    page.body = document.getElementsByTagName('body')[0];
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    
    page.contents = page.body.getElementsByClassName('contents')[0];
    page.contentsConfiguration = page.contents.getElementsByClassName('contents-navConfiguration')[0];
    page.contentsPreview = page.contents.getElementsByClassName('contents-navPreview')[0];
    page.contentsShare = page.contents.getElementsByClassName('contents-navShare')[0];   
    
    page.notice.setNotice('loading...', true);
    
    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, settings.hideClass, true);
    
    _attachNavbarHandlers(); // do these before making the profile object
    await _initProfile(sodium);
    
    page.notice.setNotice('');
    UtilityKTS.setClass(page.navbar, settings.hideClass, false); 
    
    await  _renderContents();
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
    
    // hide disallowed nav features
    var allowOptions = page.body.getElementsByClassName('allowoptions')[0].innerHTML == 'true';
    if (!allowOptions) {
      var elemNav = document.getElementById('navEditOptions');
      var elemDivider = document.getElementById('dividerNav2');
      UtilityKTS.setClass(elemNav, settings.hideClass, true);
      UtilityKTS.setClass(elemDivider, settings.hideClass, true);
    }
  }  
  
  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  async function _renderContents() {
    page.elemCourseSelection = page.contentsConfiguration.getElementsByClassName('select-course')[0];
    page.elemProjectAdd = page.contentsConfiguration.getElementsByClassName('button-add')[0];
    page.elemProjectDelete = page.contentsConfiguration.getElementsByClassName('button-delete')[0];    
    
    // configuration
    page.elemAPCourse = page.contentsConfiguration.getElementsByClassName('check-apcourse')[0];
    page.elemHasPasswords = page.contentsConfiguration.getElementsByClassName('check-haspasswords')[0];
    page.elemExamsSelection = page.contentsConfiguration.getElementsByClassName('select-exams')[0];
    page.elemProctoringSelection = page.contentsConfiguration.getElementsByClassName('select-proctoring')[0];
    page.elemRetakesSelection = page.contentsConfiguration.getElementsByClassName('select-retakes')[0];
    page.elemResubmissionSelect = page.contentsConfiguration.getElementsByClassName('select-resubmission')[0];
    
    // preview
    page.elemAudience = page.contentsPreview.getElementsByClassName('check-audience')[0];
    page.elemAudience.leftLabel = page.elemAudience.parentNode.parentNode.getElementsByClassName('checkbox-label-left')[0];
    page.elemAudience.rightLabel = page.elemAudience.parentNode.getElementsByClassName('checkbox-label-right')[0];
    page.elemPreviewFrame = page.contentsPreview.getElementsByClassName('preview-frame')[0];
    
    // share
    page.elemLinkStudent = page.contentsShare.getElementsByClassName('btnLinkStudent')[0];
    page.elemMessageStudent = page.contentsShare.getElementsByClassName('btnMessageStudent')[0];
    page.elemLinkMentor = page.contentsShare.getElementsByClassName('btnLinkMentor')[0];
    page.elemMessageMentor = page.contentsShare.getElementsByClassName('btnMessageMentor')[0];
    _attachHandlers();
    
    await _updateCourseSelection();
  }
  
  function _attachHandlers() {
    // configuration
    page.elemCourseSelection.addEventListener('change', (e) => { _handleCourseSelection(e); });
    page.elemProjectAdd.addEventListener('click', () => { _addCourse(); });
    page.elemProjectDelete.addEventListener('click', (e) => { _deleteCourse(e); });

    page.elemAPCourse.addEventListener('click', (e) => { _handleConfigChange(e); });
    page.elemHasPasswords.addEventListener('click', (e) => { _handleConfigChange(e); });
    page.elemExamsSelection.addEventListener('change', (e) => { _handleConfigChange(e); });
    page.elemProctoringSelection.addEventListener('change', (e) => { _handleConfigChange(e); });
    page.elemRetakesSelection.addEventListener('change', (e) => { _handleConfigChange(e); });
    page.elemResubmissionSelect.addEventListener('change', (e) => { _handleConfigChange(e); });
    
    // preview
    page.elemAudience.addEventListener('click', (e) => { _handleAudienceChange(e); });
    page.elemAudience.leftLabel.addEventListener('click', () => { _handleDoubleSwitch(page.elemAudience, 'left'); });
    page.elemAudience.rightLabel.addEventListener('click', () => { _handleDoubleSwitch(page.elemAudience, 'right'); });
    
    // share
    page.elemLinkStudent.addEventListener('click', () => { _handleLink('student'); });
    page.elemMessageStudent.addEventListener('click', () => { _handleMessage('student'); });
    page.elemLinkMentor.addEventListener('click', () => { _handleLink('mentor'); });
    page.elemMessageMentor.addEventListener('click', () => { _handleMessage('mentor'); });
  }
  
  //---------------------------------------
	// updating
	//----------------------------------------
  async function _showContents(contentsId) {
    settings.currentNavOption = contentsId;
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    if (contentsId == 'navPreview') await _updatePreview();
    if (contentsId == 'navShare') _updateShare();
    if (contentsId == 'navProfile') await settings.profile.reload();
    
    _setNavOptions();
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    var validCourse = (settings.currentCourse != null);
    
    _enableNavOption('navPreview', true, validCourse);
    _enableNavOption('navShare', true, validCourse);
    _enableNavOption('navRename', true, false);
    _enableNavOption('dividerNav1', true, false);

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);
    
    if (opt == 'navConfiguration') {
    _enableNavOption('navRename', true, validCourse);
    _enableNavOption('dividerNav1', true, validCourse);
    UtilityKTS.setClass(page.elemProjectDelete, 'disabled', !validCourse);
      
    } else if (opt == 'navPreview') {
      
    } else if (opt == 'navShare') {

    } else if (opt == 'navProfile') {
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
    
  function _setDirtyBit(dirty) {
    var opt = settings.currentNavOption;
    if (settings.dirtyBit.hasOwnProperty(opt)) {
      settings.dirtyBit[settings.currentNavOption] = dirty;
    }
    _setNavOptions();
  }  
  
  async function _updateCourseSelection() {
    UtilityKTS.removeChildren(page.elemCourseSelection);
    
    if (!(await _queryCourseList())) return;

    var indexToSelect = -1;
    for (var i = 0; i < settings.courseInfo.length; i++) {
      var course = settings.courseInfo[i];
      var elem = CreateElement.createOption(null, 'course', course.courseid, course.coursename);
      elem.courseInfo = course;
      if (settings.currentCourse && course.courseid == settings.currentCourse.courseid) indexToSelect = i;
      page.elemCourseSelection.appendChild(elem);
    }
    
    page.elemCourseSelection.selectedIndex = indexToSelect;
    var courseInfo = null;
    if (indexToSelect >= 0) courseInfo = page.elemCourseSelection[indexToSelect].courseInfo;
    _loadCourse(courseInfo);
  }
  
  function _loadCourse(courseInfo) {
    settings.currentCourse = courseInfo;
    var elemList = Array.prototype.slice.call(page.contentsConfiguration.getElementsByTagName('select'));
    elemList = elemList.concat(Array.prototype.slice.call(page.contentsConfiguration.getElementsByTagName('input')));
    elemList = elemList.concat(Array.prototype.slice.call(page.contentsConfiguration.getElementsByTagName('button')));
    elemList = elemList.concat(Array.prototype.slice.call(page.contentsConfiguration.getElementsByTagName('label')));
    
    for (var i = 0; i < elemList.length; i++) {
      var elem = elemList[i];
      if (elem.id != 'selectCourse'  && elem.htmlFor != 'selectCourse') {
        elem.disabled = !courseInfo;
        UtilityKTS.setClass(elem, settings.hideClass, !courseInfo);
      }
    }

    page.elemAPCourse.checked = courseInfo && courseInfo.ap;
    page.elemHasPasswords.checked = courseInfo && courseInfo.haspasswords;
    page.elemExamsSelection.value = courseInfo ? courseInfo.examid: -1;
    page.elemProctoringSelection.value = courseInfo ? courseInfo.proctoringid: -1;
    page.elemRetakesSelection.value = courseInfo ? courseInfo.retakeid: -1;
    page.elemResubmissionSelect.value = courseInfo ? courseInfo.resubmissionid: -1;
    
    _setDirtyBit(false);
  }
  
  async function _updatePreview() {
    var audience = 'student';
    if (page.elemAudience.checked) audience = 'mentor';
    
    var previewURL = _landingPageURL(audience);
    page.elemPreviewFrame.src = previewURL;
  }
  
  function _updateShare() {
    _showShareCopyMessage('');
  }
  
  async function _saveCourseInfo() {
    if (!settings.currentCourse) return;

    var course = settings.currentCourse;
    
    var configurationInfo = {
      courseid: course.courseid,
      coursename: course.coursename,
      ap: page.elemAPCourse.checked,
      haspasswords: page.elemHasPasswords.checked,
      examid: page.elemExamsSelection.value,
      proctoringid: page.elemProctoringSelection.value,
      retakeid: page.elemRetakesSelection.value,
      resubmissionid: page.elemResubmissionSelect.value,
    };
    
    var result = await _queryUpdateCourse(configurationInfo);
    if (!result.success) {
      if (result.details.includes('duplicate')) {
        alert('failed to rename course\n a configuration for "' + course.coursename + '" already exists');
        page.notice.setNotice('');
      } else {
        page.notice.setNotice(result.details);
      }
    }    
    
    await _updateCourseSelection();
  }
  
  async function _renameCourse() {
    if (!settings.currentCourse) return;

    var courseNameOrig = settings.currentCourse.coursename;

    var msg = 'Please enter the new name for the course.';
    var newCourseName = prompt(msg, courseNameOrig);
    if (!newCourseName || newCourseName == courseNameOrig) return;

    if (!_validateCourseName(newCourseName)) {
      var msg = "The course name\n" + newCourseName + '\nis not valid.';
      msg += '\n\nIt must have length between 1 and 200';
      msg += ' and include only letters, digits, spaces, parentheses and commas.';
      alert(msg);
      return;
    }
    
    settings.currentCourse.coursename = newCourseName;
    
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
    
    var result = await _queryInsertCourse({coursename: courseName});
    if (result.success) {
      settings.currentCourse = {courseid: result.data.courseid};
      await _updateCourseSelection();
      
    } else {
      if (result.details.includes('duplicate')) {
        alert('failed to add course\n A configuration for "' + courseName + '" already exists');
      } else {
        page.notice.setNotice(result.details);
      }
    }
  }  
  
  async function _deleteCourse() {
    if (!settings.currentCourse) return;

    var msg = 'This course will be deleted:';
    msg += '\n' + settings.currentCourse.coursename;
    msg += '\n\nThis action cannot be undone.  Continue with deletion?';
    
    if (!confirm(msg)) return;

    var result = await _queryDeleteCourse(settings.currentCourse);
    if (!result.success) {
      page.notice.setNotice(result.details);
      return;
    }

    settings.currentCourse = null;
    
    await _updateCourseSelection();
  }

  function _showShareCopyMessage(msg) {
    page.contentsShare.getElementsByClassName('copy-message')[0].innerHTML = msg;
  }    
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  async function _navDispatch(e) {
    var dispatchTarget = e.target.id;
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    var dispatchMap = {
      "navConfiguration": async function() { await _showContents('navConfiguration'); },
      "navPreview":       async function() { await _showContents('navPreview'); },
      "navShare":         async function() { await _showContents('navShare'); },
      "navRename":        async function() { await _renameCourse(); },
      
      "navEditOptions":   function() { _doOptions(); },
      
      "navSave":          async function() { await _handleSave(e);},
      "navReload":        async function() { await _handleReload(e);},
      
      "navProfile":       async function() { await _showContents('navProfile'); },

      "navHelp":          function() { _doHelp(); },
      "navSignout":       function() { _doLogout(); }
    }
    
    dispatchMap[dispatchTarget]();
  }
  
  function _handleCourseSelection(e) {
    _loadCourse(e.target[e.target.selectedIndex].courseInfo);
  }
  
  async function _handleConfigChange(e) {    
    await _saveCourseInfo();
  }
  
  function _handleAudienceChange(e) {
    UtilityKTS.setClass(e.target.leftLabel, 'diminished', e.target.checked);
    UtilityKTS.setClass(e.target.rightLabel, 'diminished', !e.target.checked);  
    _updatePreview();
  }
  
  function _handleDoubleSwitch(elem, clickedLabel) {
    if (clickedLabel == 'left' && elem.checked) {
      elem.click();
    } else if (clickedLabel == 'right' && !elem.checked) {
      elem.click();
    }
  }

  function _handleLink(audience) {
    var msg = _landingPageURL(audience);
    _copyToClipboard(msg);
    
    _showShareCopyMessage(audience + ' link copied');
  }
  
  async function _handleMessage(audience) {
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

    _showShareCopyMessage(audience + ' link copied');
  }
  
  async function _handleSave(e) {
    if (settings.currentNavOption == 'navProfile') {
      settings.profile.save();
    }
  }
  
  function _handleReload(e) {
    if (!confirm('Current changes will be lost.\nContinue with reloading project?')) return;
    
    if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
    }
  }
  
  function _doOptions() {
    window.open(settings.optionsURL, '_self');
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
  async function _queryCourseList() {
    var dbResult = await SQLDBInterface.doGetQuery('welcomeV2/query', 'courselist');
    
    settings.courseInfo = null;
    if (dbResult.success) {
      settings.courseInfo = dbResult.data;
    }
    
    return dbResult.success;
  }
  
  async function _queryInsertCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcomeV2/insert', 'course', courseInfo);
  }
  
  async function _queryUpdateCourse(configurationInfo) {
    return await SQLDBInterface.doPostQuery('welcomeV2/update', 'course', configurationInfo);
  }

  async function _queryDeleteCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcomeV2/delete', 'course', courseInfo);
  }
  
  async function _queryMailMessage(params) {
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
  function _validateCourseName(courseName) {
    var valid = courseName.length < 200;
    valid = valid && courseName.length > 0;
    
    valid = valid && (courseName.match(/[A-Za-z0-9&:\(\), ]+/) == courseName);
    
    return valid;
  }  
  
  function _landingPageURL(audience) {
    var audienceIndex = '000';
    if (audience == 'mentor') audienceIndex = '100';
    
    var previewURL = window.location.origin + settings.previewURL_base;
    previewURL += '/' + settings.currentCourse.courseid;
    previewURL += '/' + audienceIndex;
    
    return previewURL;
  }
  
  async function _mailMessage(audience) {
    var result = null;
    var params = settings.currentCourse;
    params.audience = audience;
    params.letterURL = _landingPageURL(audience);
    
    var queryResult = await _queryMailMessage(params);
    if (queryResult.success) {
      result = queryResult.data;
      
    } else {
      page.notice.setNotice('failed to retrieve ' + audience + ' message');
    }
    
    return result;
  }  
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
