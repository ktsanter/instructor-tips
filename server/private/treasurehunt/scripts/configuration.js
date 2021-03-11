//-------------------------------------------------------------------
// Treasure Hunt configuration
//-------------------------------------------------------------------
// TODO: add support for full background image?
// TODO: styling
// TODO: finish help
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const appInfo = {
    appName: 'Treasure Hunt configuration'
  };
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',
    
    currentCourse: null,
    
    logoutURL: '/usermanagement/logout/welcomeV2',
    helpURL: '/treasurehunt/help',
    previewURL_base: '/treasurehunt',
    
    invalidPic:  'https://res.cloudinary.com/ktsanter/image/upload/v1615493098/Treasure%20Hunt/invalid-image.png',
    
    dirtyBit: {
      navLayout: false,
      navClues: false,
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
    page.contentsLayout = page.contents.getElementsByClassName('contents-navLayout')[0];
    page.contentsClues = page.contents.getElementsByClassName('contents-navClues')[0];
    page.contentsPreview = page.contents.getElementsByClassName('contents-navPreview')[0];

    page.notice.setNotice('loading...', true);
    
    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, settings.hideClass, true);
    
    _attachNavbarHandlers(); // do these before making the profile object
    await _initProfile(sodium);
    
    await _initEditors();
    
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
  
  async function _initEditors() {
    var editorIdList = [
      'tinyGreeting', 
      'tinyResponsePositive', 
      'tinyResponseNegative'
    ];
    this.tiny = {};
    
    for (var i = 0; i < editorIdList.length; i++) {
      var editorId = editorIdList[i];
      
      this.tiny[editorId] = new MyTinyMCE({
        id: editorId,
        selector: '#' + editorId,
        changeCallback: _handleEditorChange,
        height: 200
      });
      
      await this.tiny[editorId].init();
    } 
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
    console.log('_renderContents');

    
    // layout
    page.elemProjectSelection = page.contentsLayout.getElementsByClassName('select-project')[0];
    page.elemProjectAdd = page.contentsLayout.getElementsByClassName('button-add')[0];
    page.elemProjectDelete = page.contentsLayout.getElementsByClassName('button-delete')[0];    
    
    page.elemBannerPic = page.contentsLayout.getElementsByClassName('thBanner-pic')[0];
    page.elemBannerIcon = page.contentsLayout.getElementsByClassName('thBanner-icon')[0];
    page.elemGreeting = this.tiny.tinyGreeting
    page.elemResponsePositive = this.tiny.tinyResponsePositive
    page.elemResponseNegative = this.tiny.tinyResponseNegative;

    // clues
    
    // preview
    
    _attachHandlers();
    
    await _updateProjectSelection();
  }
  
  function _attachHandlers() {    
    // layout
    page.elemProjectSelection.addEventListener('change', (e) => { _handleProjectSelection(e); });
    page.elemProjectAdd.addEventListener('click', () => { _addProject(); });
    page.elemProjectDelete.addEventListener('click', (e) => { _deleteProject(e); });
    
    // clues
    
    
    // preview
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
    
    if (contentsId == 'navClues') _updateClues();
    if (contentsId == 'navPreview') await _updatePreview();
    if (contentsId == 'navProfile') await settings.profile.reload();
    
    _setNavOptions();
  }
  
  function _setNavOptions() {
    console.log('_setNavOptions');
    
    var opt = settings.currentNavOption;
    

    var validProject = (settings.currentProject != null);
    
    _enableNavOption('navClues', true, validProject);
    _enableNavOption('navPreview', true, validProject);
    _enableNavOption('navShare', true, validProject);
    _enableNavOption('navRename', true, validProject);

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);
    
    if (opt == 'navLayout') {
      UtilityKTS.setClass(page.elemProjectDelete, 'disabled', !validProject);
      
    } else if (opt == 'navClues') {
      
    } else if (opt == 'navPreview') {

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
  
  async function _updateProjectSelection() {
    console.log('_updateProjectSelection');
    UtilityKTS.removeChildren(page.elemProjectSelection);
    
    if (!(await _queryProjectList())) return;
    console.log(settings.projectInfo);
    
    var indexToSelect = -1;
    var projectList = settings.projectInfo.projects;
    for (var i = 0; i < projectList.length; i++) {
      var project = projectList[i];
      var elem = CreateElement.createOption(null, 'project', project.projectid, project.projectname);
      elem.projectInfo = project;
      if (settings.currentProject && project.projectid == settings.currentProject.projectid) indexToSelect = i;
      page.elemProjectSelection.appendChild(elem);
    }
    
    page.elemProjectSelection.selectedIndex = indexToSelect;
    var projectInfo = null;
    if (indexToSelect >= 0) projectInfo = page.elemProjectSelection[indexToSelect].projectInfo;
    _loadProject(projectInfo);
  }
  
  function _loadProject(projectInfo) {
    console.log('_loadProject');
    console.log(projectInfo);
    
    settings.currentProject = projectInfo;
    
    var secondaryControls = page.contentsLayout.getElementsByClassName('secondary-control-container');
    for (var i = 0; i < secondaryControls.length; i++) {
       UtilityKTS.setClass(secondaryControls[i], settings.hideClass, !projectInfo);
    }
    
    if (projectInfo) {
      page.elemGreeting.setContent(projectInfo.message);
      page.elemResponsePositive.setContent(projectInfo.positiveresponse);
      page.elemResponseNegative.setContent(projectInfo.negativeresponse);
      _setBannerPic(projectInfo.imagename);
    }
    
    _setDirtyBit(false);
  }
  
  function _setBannerPic(picURL) {
    var hasPic = (picURL && picURL.length > 0);
    
    if (hasPic) {
      page.elemBannerPic.style.backgroundImage = "url(" + picURL + "), url('" + settings.invalidPic + "')";
      page.elemBannerPic.setAttribute('as-current-background', picURL);

    } else {
      page.elemBannerPic.style.backgroundImage = '';
      page.elemBannerPic.setAttribute('as-current-background', '');
    }
    
    UtilityKTS.setClass(page.elemBannerIcon, settings.hideClass, hasPic);
    UtilityKTS.setClass(page.elemBannerPic, settings.hideClass, !hasPic);
  }    
  
  function _updateClues() {
    console.log('_updateClues');
    
    var clueList = settings.projectInfo.clues[settings.currentProject.projectid];
  }
  
  async function _updatePreview() {
    console.log('_updatePreview');
    /*
    var previewURL = _landingPageURL();
    page.elemPreviewFrame.src = previewURL;
    */
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
    async function _renameProject() {
    console.log('_renameProject');
    return;
    
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
  
  async function _addProject(e) {
    console.log('_addProject');
    return;

    
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
  
  async function _deleteProject() {
    console.log('_deleteProject');
    return;
    
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
      "navLayout":    async function() { await _showContents(dispatchTarget); },
      "navClues":     async function() { await _showContents(dispatchTarget); },
      "navPreview":   async function() { await _showContents(dispatchTarget); },
      
      "navRename":     async function() { await _handleRename(e); },
      "navShare":     async function() { await _handleShare(e); },
      "navSave":      async function() { await _handleSave(e);},
      "navReload":    async function() { await _handleReload(e);},
      
      "navProfile":   async function() { await _showContents('navProfile'); },

      "navHelp":      function() { _doHelp(); },
      "navSignout":   function() { _doLogout(); }
    }
    
    dispatchMap[dispatchTarget]();
  }
  
  function _handleProjectSelection(e) {
    _loadProject(e.target[e.target.selectedIndex].projectInfo);
  }
  
  function _handleEditorChange(editor) {
    console.log('_handleEditorChange: ' + editor.id);
  }  

  function _handleRename(e) {
    console.log('_handleRename');
  }
  
  function _handleShare(e) {
    console.log('_handleShare');
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
  
  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------
  async function _queryProjectList() {
    var dbResult = await SQLDBInterface.doGetQuery('treasurehunt/query', 'projectlist');
    
    settings.projectInfoInfo = null;
    if (dbResult.success) {
      settings.projectInfo = {
        projects: dbResult.projects,
        clues: dbResult.clues
      }
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
