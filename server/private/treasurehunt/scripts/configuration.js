//-------------------------------------------------------------------
// Treasure Hunt configuration
//-------------------------------------------------------------------
// TODO: expand template variables?
// TODO: layout: add support for full background image?
// TODO: layout: add background color selection (or full color scheme?)
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
    
    logoutURL: '/usermanagement/logout/treasurehunt',
    helpURL: '/treasurehunt/help',
    previewURL_base: '/treasurehunt',
    
    invalidPic:  'https://res.cloudinary.com/ktsanter/image/upload/v1615493098/Treasure%20Hunt/invalid-image.png',
    
    dirtyBit: {
      navLayout: false,
      navClues: false,
      navPreview: false,
      navShare: false,
      navProfile: false
    },
    
    baseShareURL: window.location.origin + '/treasurehunt/landing',    
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
        height: 200,
        escapeQuotes: true
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
    settings.clueEditor = new ClueEditor({
      hideClass: settings.hideClass,
      callbackShowSaveReload: _handleShowSaveReload,
      callbackClueChange: _handleClueChange
    });
    settings.clueEditor.render();
    
    // preview
    page.elemPreviewFrame = page.contentsPreview.getElementsByClassName('preview-frame')[0];
    
    _attachHandlers();
    
    await _updateProjectSelection();
  }
  
  function _attachHandlers() {    
    // layout
    page.elemProjectSelection.addEventListener('change', (e) => { _handleProjectSelection(e); });
    page.elemProjectAdd.addEventListener('click', () => { _addProject(); });
    page.elemProjectDelete.addEventListener('click', (e) => { _deleteProject(e); });
    page.elemBannerPic.addEventListener('click', (e) => { _handleBannerPic(e); });
    page.elemBannerIcon.addEventListener('click', (e) => { _handleBannerPic(e); });
    
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
    var opt = settings.currentNavOption;

    var validProject = (settings.currentProject != null);
    
    _enableNavOption('navClues', true, validProject);
    _enableNavOption('navPreview', true, validProject);
    _enableNavOption('navShare', true, validProject);
    _enableNavOption('navRename', true, false);

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);
    
    if (opt == 'navLayout') {
      _enableNavOption('navSave', true, validProject && settings.dirtyBit.navLayout);
      _enableNavOption('navReload', true, validProject && settings.dirtyBit.navLayout);
      _enableNavOption('navRename', true, validProject);
      UtilityKTS.setClass(page.elemProjectDelete, 'disabled', !validProject);
      
    } else if (opt == 'navClues') {
      _enableNavOption('navSave', true, validProject && settings.dirtyBit.navLayout);
      _enableNavOption('navReload', true, validProject && settings.dirtyBit.navLayout);
      
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
    UtilityKTS.removeChildren(page.elemProjectSelection);
    
    if (!(await _queryProjectList())) return;
    
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
      
      _updateClues();
    }
    
    _setDirtyBit(false);
  }
  
  function _setBannerPic(picURL) {
    var hasPic = (picURL && (picURL.length > 0) && (picURL != '**no pic**'));
    
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
    var clueList = settings.projectInfo.clues[settings.currentProject.projectid];
    settings.clueEditor.update(clueList);
  }
  
  async function _updatePreview() {
    UtilityKTS.setClass(page.elemPreviewFrame, this.hideClass, true);

    await _saveProjectInfo(true);
    
    page.elemPreviewFrame.src = _previewURL();
    UtilityKTS.setClass(page.elemPreviewFrame, this.hideClass, false);  
  }
  
  async function _saveProjectInfo(preview) {
    if (!settings.currentProject) return;
    
    var project = settings.currentProject;
    
    var bannerPicURL = page.elemBannerPic.getAttribute('as-current-background');
    var bannerPicURL = bannerPicURL.length > 0 ? bannerPicURL : '**no pic**'
    
    var revisedProject = {
      projectid: project.projectid,
      projectname: project.projectname,
      imagename: bannerPicURL,
      imagefullpage: project.imagefullpage,
      message: page.elemGreeting.getContent(),
      positiveresponse: page.elemResponsePositive.getContent(),
      negativeresponse: page.elemResponseNegative.getContent()
    }
    
    var revisedClueList = settings.clueEditor.getClueList();
    
    var params = {
      project: revisedProject,
      clues: revisedClueList
    };
    
    var result = await _queryUpdateProject(params, preview);
    if (!result.success) {
      if (result.details.includes('duplicate')) {
        alert('failed to rename project\n a project named "' + project.projectname + '" already exists');
        page.notice.setNotice('');
      } else {
        page.notice.setNotice(result.details);
      }
    }    
    
    if (!preview) await _updateProjectSelection();
  }
  
  async function _renameProject() {
    if (!settings.currentProject) return;

    var projectNameOrig = settings.currentProject.projectname;

    var msg = 'Please enter the new name for the project.';
    var newProjectName = prompt(msg, projectNameOrig);
    if (!newProjectName || newProjectName == projectNameOrig) return;

    if (!_validateProjectName(newProjectName)) {
      var msg = "The project name\n" + newProjectName + '\nis not valid.';
      msg += '\n\nIt must have length between 1 and 200';
      msg += ' and include only letters, digits, spaces, parentheses and commas.';
      alert(msg);
      return;
    }
    
    settings.currentProject.projectname = newProjectName;
    
    await _saveProjectInfo(false);
  }  
  
  async function _addProject(e) {
    var msg = 'Enter the name of the new project';
    var projectName = prompt(msg);
    if (!projectName) return;
    
    if (!_validateProjectName(projectName)) {
      var msg = "The project name\n" + projectName + '\nis not valid.';
      msg += '\n\nIt must have length between 1 and 200';
      msg += ' and include only letters, digits, spaces, parentheses and commas.';
      alert(msg);
      return;
    }
    
    var result = await _queryInsertProject({projectname: projectName});
    if (result.success) {
      settings.currentProject = {projectid: result.data.projectid};
      await _updateProjectSelection();
      
    } else {
      if (result.details.includes('duplicate')) {
        alert('failed to add project\n A project named "' + projectName + '" already exists');
      } else {
        page.notice.setNotice(result.details);
      }
    }
  }  
  
  async function _deleteProject() {
    if (!settings.currentProject) return;

    var msg = 'This project will be deleted:';
    msg += '\n' + settings.currentProject.projectname;
    msg += '\n\nThis action cannot be undone.  Continue with deletion?';
    
    if (!confirm(msg)) return;

    var result = await _queryDeleteProject(settings.currentProject);
    if (!result.success) {
      page.notice.setNotice(result.details);
      return;
    }

    settings.currentProject = null;
    
    await _updateProjectSelection();
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
    _setDirtyBit(true);
  }  

  function _handleRename(e) {
    _renameProject();
  }
  
  function _handleShare(e) {
    _copyToClipboard(_landingPageURL());
    alert('link copied to clipboard');
  }
  
  async function _handleSave(e) {
    if (settings.currentNavOption == 'navLayout') {
      await _saveProjectInfo(false);
      await _updateProjectSelection();
      
    } if (settings.currentNavOption == 'navClues') {
      await _saveProjectInfo(false);
      await _updateProjectSelection();
      
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.save();
    }
  }
  
  function _handleReload(e) {
    if (!confirm('Current changes will be lost.\nContinue with reloading project?')) return;
    
    if (settings.currentNavOption == 'navLayout') {
      _loadProject(settings.currentProject);
            
    } else if (settings.currentNavOption == 'navClues') {
      _loadProject(settings.currentProject);
            
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
    }
  }
  
  function _handleBannerPic(e) {
    var currentImageURL = page.elemBannerPic.getAttribute('as-current-background');
    
    var imageURL = prompt('Please enter the URL for the profile picture', currentImageURL);
    if (imageURL == null) return;
  
    var imageURL = _sanitizeURL(imageURL);    
    if (imageURL != currentImageURL) {
      _setBannerPic(imageURL);
      _setDirtyBit(true);
    }
  }
  
  function _handleShowSaveReload(show) {
    _enableNavOption('navSave', show, settings.dirtyBit.navClues);
    _enableNavOption('navReload', show, settings.dirtyBit.navClues);
  }   
  
  function _handleClueChange(clue) {
    settings.dirtyBit.navClues = true;
    _setNavOptions();
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
  
  async function _queryInsertProject(courseInfo) {
    return await SQLDBInterface.doPostQuery('treasurehunt/insert', 'project', courseInfo);
  }
  
  async function _queryUpdateProject(projectInfo, preview) {
    var command = 'project';
    if (preview) command = 'preview';
    return await SQLDBInterface.doPostQuery('treasurehunt/update', command, projectInfo);
  }

  async function _queryDeleteProject(courseInfo) {
    return await SQLDBInterface.doPostQuery('treasurehunt/delete', 'project', courseInfo);
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
  function _validateProjectName(projectName) {
    var valid = projectName.length < 200;
    valid = valid && projectName.length > 0;
    
    valid = valid && (projectName.match(/[A-Za-z0-9\&\:\(\),\- ]+/) == projectName);
    
    return valid;
  }  
  
  function _landingPageURL() {
    return settings.baseShareURL + '/' + settings.currentProject.projectid;
  }
  
  function _previewURL() {
    return settings.baseShareURL + '/preview';
  }

  function _sanitizeURL(url) {
    url = url.replace(/[\"]/g, '%22');
    url = url.replace(/[\']/g, '%22');
    return url;
  }  
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
