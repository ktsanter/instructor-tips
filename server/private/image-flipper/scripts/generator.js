//------------------------------------------------------------------------------
// image flipper generator app
//------------------------------------------------------------------------------
// TODO: styling
// TODO: finish help
//------------------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const appInfo = {
    appName: 'Image flipper generator'
  };
	
	const settings = {
    hideClass: 'hide-me',    
    navItemClass: 'use-handler',
    logoutURL: '/usermanagement/logout/image-flipper-generator',
    helpURL: '/image-flipper/help',
    dirtyBit: {
      navLayout: false,
      navPreview: false,
      navShare: false,
      navProfile: false
    },
    maxCards: 36,
    currentProject: null,    
    previewURL: '/image-flipper/flipper?configkey=preview',
    baseShareURL: window.location.origin + '/image-flipper/flipper?configkey=',
    thumbnailErrorImg: 'https://res.cloudinary.com/ktsanter/image/upload/v1612802166/image%20flipper%20resources/invalid_image.png'
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
    page.contentsPreview = page.contents.getElementsByClassName('contents-navPreview')[0];
    page.contentsShare = page.contents.getElementsByClassName('contents-navShare')[0];   
    
    page.notice.setNotice('loading...', true);
    
    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, settings.hideClass, true);
    
    _attachNavbarHandlers(); // do these before making the profile object
    _initProfile(sodium);
    
    page.notice.setNotice('');
    UtilityKTS.setClass(page.navbar, settings.hideClass, false); 

    await _renderContents();
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
  	
	//--------------------------------------------------------------
	// page rendering
	//--------------------------------------------------------------
  async function _renderContents() {
    page.elemProjectSelection = page.contentsLayout.getElementsByClassName('select-project')[0];
    page.elemProjectAdd = page.contentsLayout.getElementsByClassName('button-add')[0];
    page.elemProjectDelete = page.contentsLayout.getElementsByClassName('button-delete')[0];
    page.elemName = page.contentsLayout.getElementsByClassName('input-name')[0];
    page.elemTitle = page.contentsLayout.getElementsByClassName('input-title')[0];
    page.elemSubtitle = page.contentsLayout.getElementsByClassName('input-subtitle')[0];
    page.elemGridSize = page.contentsLayout.getElementsByClassName('select-gridsize')[0];
    page.elemColorScheme = page.contentsLayout.getElementsByClassName('input-colorscheme')[0];
    page.elemColorSchemeOptions = page.contentsLayout.getElementsByClassName('color-options')[0];
    page.elemLayoutGrid = page.contentsLayout.getElementsByClassName('layout-grid')[0];
    page.elemSwapArea = page.contentsLayout.getElementsByClassName('swap-area')[0];
    
    page.elemPreviewFrame = page.contentsPreview.getElementsByClassName('preview-frame')[0];
    
    _attachHandlers();
    
    _renderLayoutCards();
    
    await _updateProjectSelection();
  }
  
  function _attachHandlers() {
    page.elemProjectSelection.addEventListener('change', (e) => { _handleProjectSelection(e); });
    page.elemProjectAdd.addEventListener('click', (e) => { _handleProjectAdd(e); });
    page.elemProjectDelete.addEventListener('click', (e) => { _handleProjectDelete(e); });
    
    page.elemName.addEventListener('input', (e) => { _restrictInput(e); });
    page.elemTitle.addEventListener('input', (e) => { _restrictInput(e); });
    page.elemSubtitle.addEventListener('input', (e) => { _restrictInput(e); });
    
    page.elemGridSize.addEventListener('change', (e) => { _updateCardLayout(); _setDirtyBit(true); });
    
    page.elemColorScheme.addEventListener('keypress', (e) => { _denyInput(e); });
    page.elemColorScheme.addEventListener('click', (e) => { _handleColorSchemeToggle(e); });
    var elemColorOptions = page.contentsLayout.getElementsByClassName('color-sample');
    for (var i = 0; i < elemColorOptions.length; i++) {
      elemColorOptions[i].addEventListener('click', (e) => { _handleColorSchemeSelection(e); });
    }
    
    page.contentsShare.getElementsByClassName('btnCopyLink')[0].addEventListener('click', (e) => { _handleLinkClick(e); });
    page.contentsShare.getElementsByClassName('btnCopyEmbed')[0].addEventListener('click', (e) => { _handleEmbedClick(e); });
  }
  
  function _renderLayoutCards() {
    var handler = (e) => { _handleCardButton(e); };
    for (var i = 0; i < settings.maxCards; i++) {
      var card = CreateElement.createButton('btnCard' + i, 'cardbutton cardbutton' + i, i + 1, null, handler);
      card.value = i;
      card.imageURL = '';
      card.title = 'specify image URL for card #' + (i + 1);      
      page.elemSwapArea.appendChild(card);
    }
  }
  
	//--------------------------------------------------------------
	// updating
	//--------------------------------------------------------------
  async function _showContents(contentsId) {
    settings.currentNavOption = contentsId;
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    if (contentsId == 'navShare') _updateShare();
    if (contentsId == 'navProfile') await settings.profile.reload();
    if (contentsId == 'navPreview') await _updatePreview();
    
    _setNavOptions();
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    var validProject = (settings.currentProject != null);
    
    _enableNavOption('navPreview', true, validProject);
    _enableNavOption('navShare', true, validProject);

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);
      
    if (opt == 'navLayout') {
      var enable = settings.dirtyBit[settings.currentNavOption];
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
      
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
    settings.dirtyBit[settings.currentNavOption] = dirty;
    _setNavOptions();
  }
  
  async function _updateProjectSelection() {
    UtilityKTS.removeChildren(page.elemProjectSelection);
    
    if (!(await _getProjectInfo())) return;
    
    var indexToSelect = -1;
    
    for (var i = 0; i < settings.projectInfo.length; i++) {
      var project = settings.projectInfo[i];
      var elem = CreateElement.createOption(null, 'project', project.projectid, project.projectname + ': ' + project.projecttitle);
      elem.projectInfo = project;      
      if (settings.currentProject && project.projectid == settings.currentProject.projectid) indexToSelect = i;
      page.elemProjectSelection.appendChild(elem);
    }
    
    page.elemProjectSelection.selectedIndex = indexToSelect;
    var projectInfo = null;
    if (indexToSelect >= 0) projectInfo = page.elemProjectSelection[indexToSelect].projectInfo;
    _updateProjectInfo(projectInfo);
  }  
  
  function _updateProjectInfo(projectInfo) {
    settings.currentProject = projectInfo;
    
    UtilityKTS.setClass(page.elemProjectDelete, 'disabled', !projectInfo);
    page.elemName.disabled = !projectInfo;
    page.elemTitle.disabled = !projectInfo;
    page.elemSubtitle.disabled = !projectInfo;
    page.elemGridSize.disabled = !projectInfo;
    page.elemColorScheme.disabled = !projectInfo;
    UtilityKTS.setClass(page.elemLayoutGrid, settings.hideClass, !projectInfo);
    
    page.elemName.value = '';
    page.elemTitle.value = '';
    page.elemSubtitle.value = '';
    page.elemGridSize.selectedIndex = -1;
    page.elemColorScheme.selectedIndex = -1;
    
    if (projectInfo) {
      page.elemName.value = projectInfo.projectname;
      page.elemTitle.value = projectInfo.projecttitle;
      page.elemSubtitle.value = projectInfo.projectsubtitle;
      page.elemGridSize.value = projectInfo.layoutrows + 'x' + projectInfo.layoutcols;
      _setColorScheme(page.elemColorScheme.parentNode, projectInfo.colorscheme);
      page.elemColorScheme.value = 'sample text';
    }
    
    _updateCardLayout();
    _setDirtyBit(false);
  }
  
  function _setColorScheme(elem, colorClass) {
    var classNames = elem.classList;
    classNames.forEach(name => {
      if (name.match(/flipper-colorscheme-/)) {
        elem.classList.remove(name);
      }
    });
    elem.classList.add('use-colorscheme');
    elem.classList.add(colorClass);    
  }
  
  function _updateCardLayout(projectInfo) {
    var projectInfo = settings.currentProject;
    if (!projectInfo) return;
    
    for (var i = 0; i < settings.maxCards; i++) {
      var card = page.contentsLayout.getElementsByClassName('cardbutton cardbutton' + i)[0];
      _setCardImage(card, '');
      page.elemSwapArea.appendChild(card); 
    }

    UtilityKTS.removeChildren(page.elemLayoutGrid);
    var gridSize = _getLayoutSetting();
    
    var index = 0;
    for (var r = 0; r < gridSize.rows; r++) {
      var elemRow = CreateElement.createDiv(null, 'row mt-1')
      page.elemLayoutGrid.appendChild(elemRow);
      
      for (var c = 0; c < gridSize.cols; c++) {
        var card = page.contentsLayout.getElementsByClassName('cardbutton cardbutton' + index)[0];
        var elemCol = CreateElement.createDiv(null, 'col-sm-2');
        elemRow.appendChild(elemCol);
        
        elemCol.appendChild(card);
        _setCardImage(card, projectInfo.layoutimages[index]);
        index++;
      }
    }
  }
  
  function _setCardImage(elem, imageURL) {
    var origWidth = elem.offsetWidth;
    var origHeight = elem.offsetHeight;

    if (imageURL == null || imageURL == "") {
      elem.style.background = '';
      elem.imageURL = '';

    } else {
      elem.style.background = "url(" + imageURL + "), url('" + settings.thumbnailErrorImg + "') no-repeat right top";
      elem.style.backgroundSize = origWidth + 'px ' + origHeight + 'px';
      elem.imageURL = imageURL;
    }
  }
  
  async function _updatePreview() {
    page.notice.setNotice('loading...', true);
    UtilityKTS.setClass(page.elemPreviewFrame, this.hideClass, true);

    var result = await _saveProjectToDB(true);
    page.notice.setNotice('');
    if (!result.success) {
      console.log('failed to save preview');
      return;
    }
    
    page.elemPreviewFrame.src = settings.previewURL;
    UtilityKTS.setClass(page.elemPreviewFrame, this.hideClass, false);
  }
  
  
  function _updateShare() {
    var elemLink = page.contentsShare.getElementsByClassName('input-link')[0];
    var elemEmbed = page.contentsShare.getElementsByClassName('input-embed')[0];
    
    var url = settings.baseShareURL + settings.currentProject.projectid;
    elemLink.value = url;

    var elem = CreateElement.createIframe(null, null, url, 650, 500);
    elem.style.overflowY = 'hidden';
    elem.style.border = 'none';
    elem.scrolling = 'no';
    elemEmbed.value = elem.outerHTML;    
    
    _showShareMessage('');
  }
  
  
  function _showShareMessage(msg) {
    page.contentsShare.getElementsByClassName('copy-message')[0].innerHTML = msg;
  }  

  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  	
	//--------------------------------------------------------------
	// handlers
	//--------------------------------------------------------------
  async function _navDispatch(e) {
    var dispatchTarget = e.target.id;
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    var dispatchMap = {
      "navLayout":     async function() { await _showContents('navLayout'); },
      "navPreview":    async function() { await _showContents('navPreview'); },
      "navShare":      async function() { await _showContents('navShare'); },
      
      "navSave":       async function() { await _handleSave(e);},
      "navReload":     async function() { await _handleReload(e);},
      
      "navProfile":    async function() { await _showContents('navProfile'); },

      "navHelp":       function() { _doHelp(); },
      "navSignout":    function() { _doLogout(); }
    }
    
    dispatchMap[dispatchTarget]();
  }

  function _handleProjectSelection(e) {
    _updateProjectInfo(e.target[e.target.selectedIndex].projectInfo);
  }
  
  function _restrictInput(e) {
    if (e.inputType.includes('delete')) _setDirtyBit(true);
    if (!e.data) return;
    
    if (!e.data.match(/[0-9a-zA-Z\:_\-\. (),\!\?]/)) {
      e.target.value = e.target.value.replace(/[^0-9a-zA-Z_\:\-\. (),\!\?]/g, '');
    } else {
      _setDirtyBit(true);
    }
  }
  
  function _handleColorSchemeToggle(e) {
    UtilityKTS.toggleClass(page.elemColorSchemeOptions, settings.hideClass, false);
  }
  
  function _handleColorSchemeSelection(e) {
    UtilityKTS.setClass(page.elemColorSchemeOptions, 'hide-me', true);

    var currentSchemeClass = _getColorScheme(page.elemColorScheme.parentNode);
    var newSchemeClass = _getColorScheme(e.target);
    
    if (currentSchemeClass.length > 0) {
      UtilityKTS.setClass(page.elemColorScheme.parentNode, currentSchemeClass, false);
    }
    
    UtilityKTS.setClass(page.elemColorScheme.parentNode, newSchemeClass, true);    
    _setDirtyBit(true);
  }
  
  function _handleCardButton(e) {
    var card = e.target;
    var imageURL = _sanitizeURL(prompt('Please enter the URL for image #' + (card.value*1 + 1), card.imageURL));
    if (imageURL == null) return;
    
    _setCardImage(e.target, imageURL);
    _setDirtyBit(true);
  }
  
  async function _handleSave(e) {
    if (settings.currentNavOption == 'navProfile') {
      settings.profile.save();
      
    } else {
      var result = await _saveProjectToDB();

      if (result.success) {
        await _updateProjectSelection();

      } else {
        console.log('failed to save project');
      }      
    }
  }
  
  async function _handleReload(e) {
    if (!confirm('Current changes will be lost.\nContinue with reloading project?')) return;
    
    if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
      
    } else {
      await _updateProjectSelection();
    }
  }
  
  async function _handleProjectAdd(e) {
    if (settings.dirtyBit.navLayout && !confirm('Current changes will be lost.\nContinue with adding project?')) return;

    var newProjectId = await _addNewProjectToDB();

    if (newProjectId) {
      settings.currentProject = {projectid: newProjectId};
      await _updateProjectSelection();
      
    } else {
      console.log('failed to add new project');
    }
  }
  
  async function _handleProjectDelete(e) {
    if (!settings.currentProject) return;
    
    var projName = settings.currentProject.projectname;
    if (!confirm('This project will be permanently removed.\nContinue with deleting "' + projName + '"?')) return; 
    
    var deleteSucceeded = await _deleteProjectFromDB();
    if (deleteSucceeded) {
      settings.currentProject = null;
      await _updateProjectSelection();
      
    } else {
      console.log('failed to delete project');
    }
  }
  
  function _handleLinkClick(e) {
    var elemLink = page.contentsShare.getElementsByClassName('input-link')[0];
    var msg = elemLink.value;
    _copyToClipboard(msg);
    _showShareMessage('copied link to clipboard');
  }
  
  function _handleEmbedClick(e) {
    var elemEmbed = page.contentsShare.getElementsByClassName('input-embed')[0];
    var msg = elemEmbed.value;
    _copyToClipboard(msg);
    _showShareMessage('copied embed code to clipboard');
  }  
  
  function _denyInput(e) {
    e.stopPropagation();
    e.preventDefault();  
    e.returnValue = false;
    e.cancelBubble = true;
    return false;
  }

	//---------------------------------------
	// DB interface
	//---------------------------------------
  async function _getProjectInfo() {    
    var dbResult = await SQLDBInterface.doGetQuery('imageflipper/query', 'projectinfo');

    settings.projectInfo = null;
    if (dbResult.success) {
      for (var i = 0; i < dbResult.projects.length; i++) {
        dbResult.projects[i].layoutimages = JSON.parse(dbResult.projects[i].layoutimages);
      }

      settings.projectInfo = dbResult.projects;
    } 
    
    return dbResult.success;
  }  
  
  async function _saveProjectToDB(preview) {
    var layout = _getLayoutSetting();
    var colorScheme = _getColorScheme(page.elemColorScheme.parentNode);

    var postData = {
      projectid: settings.currentProject.projectid,
      projectname: page.elemName.value,
      projecttitle: page.elemTitle.value,
      projectsubtitle: page.elemSubtitle.value,
      colorscheme: colorScheme,
      layoutrows: layout.rows,
      layoutcols: layout.cols,
      layoutimages: _getLayoutImageArray()
    };

    
    var command = 'project'
    if (preview) command = 'preview';
    var dbResult = await SQLDBInterface.doPostQuery('imageflipper/update', command, postData);
    
    return dbResult;    
  }
  
  async function _addNewProjectToDB() {
    var dbResult = await SQLDBInterface.doPostQuery('imageflipper/insert', 'defaultproject');
      
    var newProjectId = null;
    if (dbResult.success) newProjectId = dbResult.data.projectid;
    
    return newProjectId;
  }
  
  async function _deleteProjectFromDB() {
    var dbResult = await SQLDBInterface.doPostQuery('imageflipper/delete', 'project', {projectid: settings.currentProject.projectid});

    return dbResult.success;
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
	// utility
	//---------------------------------------
  function _getColorScheme(elem) {
    var currentSchemeClass = '';
    elem.classList.forEach(function(value, key) {
      if (value.includes('flipper-colorscheme-')) currentSchemeClass = value;
    });
    
    return currentSchemeClass;
  }
  
  function _getLayoutSetting() {
    var layoutValues = page.elemGridSize.value.split('x');
    
    return {
      rows: layoutValues[0],
      cols: layoutValues[1]
    };
  }  
  
  function _getLayoutImageArray() {
    var imageURLArray = [];
    
    for (var i = 0; i < settings.maxCards; i++) {
      var card = page.body.getElementsByClassName('cardbutton cardbutton' + i)[0];
      imageURLArray.push(card.imageURL);
    }

    return imageURLArray;
  }
  
  
  function _sanitizeURL(url) {
    if (!url || url.length == 0) return url;
    url = url.replace(/[\"]/g, '%22');
    url = url.replace(/[\']/g, '%22');
    return url;
  }  
	
	return {
		init: init
 	};
}();
