//------------------------------------------------------------------------------
// image flipper generator app
//------------------------------------------------------------------------------
// TODO: 
//------------------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const appInfo = {
    appName: 'Image flipper generator'
  };
	
	const settings = {
    currentProject: null,
    dirtyBit: false,
    logoutURL: '/usermanagement/logout',
    previewURL: '/image-flipper/flipper?configkey=preview',
    baseShareURL: window.location.origin + '/image-flipper/flipper?configkey=',
    helpURL: '/image-flipper/help',
    maxCards: 36,
    thumbnailErrorImg: 'https://res.cloudinary.com/ktsanter/image/upload/v1612802166/image%20flipper%20resources/invalid_image.png'
	};
	
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    page.body = document.getElementsByTagName('body')[0];
    
    await _getUserInfo();
    await _getProjectInfo();
    
    _renderPage();
    _updateProjectInfoSelection();
    _setDirty(false);
  }
  	
	//--------------------------------------------------------------
	// page rendering
	//--------------------------------------------------------------
  function _renderPage() {
    page.contentsLayout = page.body.getElementsByClassName('contents-layout')[0];
    page.contentsPreview = page.body.getElementsByClassName('contents-preview')[0];
    page.previewFrame = page.contentsPreview.getElementsByClassName('preview-frame')[0];
    page.contentsShare = page.body.getElementsByClassName('contents-share')[0];
    
    page.projectSelection = page.body.getElementsByClassName('control-selection')[0];
    
    page.keyvalueControl = page.body.getElementsByClassName('control-keyvalue')[0];
    page.titleControl = page.body.getElementsByClassName('control-title')[0];
    page.subtitleControl = page.body.getElementsByClassName('control-subtitle')[0];
    page.colorControl = page.body.getElementsByClassName('control-color')[0];
    page.layoutControl = page.body.getElementsByClassName('control-layout')[0];
    page.colorOptions = page.body.getElementsByClassName('color-options')[0];
    
    page.layoutContainer = page.body.getElementsByClassName('layout')[0];
    
    page.body.getElementsByClassName('navbarcontainer')[0].appendChild(_renderNavbar());
    var navbarItems = page.body.getElementsByClassName('navbar-main-item');
    page.navitems = {};
    for (var i = 0; i < navbarItems.length; i++) {
      var item = navbarItems[i];
      if (item.innerHTML.includes('Preview')) {
        page.navitems.previewItem = item;
        
      } else if (item.innerHTML.includes('Share')) {
        page.navitems.shareItem = item;
      }
    }
    
    var dropdownItems = page.body.getElementsByClassName('dropdown-content hamburger')[0].children;
    for (var i = 0; i < dropdownItems.length; i++) {
      var item = dropdownItems[i];
      if (item.innerHTML.includes('reload project')) {
        page.navitems.reloadItem = item;

      } else if (item.innerHTML.includes('add project')) {
        page.navitems.addItem = item;

      } else if (item.innerHTML.includes('delete project')) {
        page.navitems.deleteItem = item;
      }
    }
    
    _attachHandlers();
    _renderLayout();
    _updateLayout();
    
    settings.navbar.selectOption('Layout');    
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Layout', callback: () => {return _navDispatch('layout');}, subitems: null, rightjustify: false},
        {label: 'Preview', callback: () => {return _navDispatch('preview');}, subitems: null, rightjustify: false},
        {label: 'Share', callback: () => {return _navDispatch('share');}, subitems: null, rightjustify: false},
        {label: settings.userInfo.userName, callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: true}        
      ],
      
      hamburgeritems: [           
        {label: 'reload project', markselected: false, callback: _handleReloadProject},
        {label: 'add project', markselected: false, callback: _handleAddProject},
        {label: 'delete project', markselected: false, callback: _handleDeleteProject},
        {label: 'help', markselected: false, callback: _showHelp},
        {label: 'sign out', markselected: false, callback: _doLogout}
      ]   
    };

    settings.navbar = new NavigationBar(navConfig);
        
    return settings.navbar.render();
  } 
  
  function _attachHandlers() {
    page.projectSelection.addEventListener('change', (e) => { _handleProjectSelection(e); });

    page.body.getElementsByClassName('save-project')[0].addEventListener('click', (e) => { _handleProjectSave(e); });
    
    page.keyvalueControl.addEventListener('input', (e) => { _restrictInput(e); });
    page.titleControl.addEventListener('input', (e) => { _setDirty(true); });
    page.subtitleControl.addEventListener('input', (e) => { _setDirty(true); });
   
    page.layoutControl.addEventListener('change', (e) => { _setDirty(true); _updateLayout();});
    page.colorControl.addEventListener('click', (e) => {_handleColorControl(e);});
    
    page.colorOptions.addEventListener('mouseleave', (e) => { UtilityKTS.setClass(page.colorOptions, 'hide-me', true); });
    var samples = page.colorOptions.getElementsByClassName('color-sample');
    for (var i = 0; i < samples.length; i++) {
      samples[i].addEventListener('click', (e) => { _handleColorSelection(e); });
    }
    
    page.contentsShare.getElementsByClassName('button-link')[0].addEventListener('click', (e) => { _handleLinkClick(e); });
    page.contentsShare.getElementsByClassName('button-embed')[0].addEventListener('click', (e) => { _handleEmbedClick(e); });
  }
  
  function _renderLayout() {
    var layoutTable = page.layoutContainer.getElementsByTagName('table')[0];
    
    var tableRow = CreateElement._createElement('tr', null, null);
    layoutTable.appendChild(tableRow);
    var tableCell = CreateElement._createElement('td', null, null);
    tableRow.appendChild(tableCell);
    
    for (var i = 0; i < settings.maxCards; i++) {
      var handler = (e) => { _handleCardButton(e);};
      var elem = CreateElement.createButton('btnCard' + i, 'cardbutton cardbutton' + i, i + 1, null, handler);
      elem.value = i;
      elem.disabled = true;
      elem.imageURL = '';
      elem.title = 'specify image URL for card #' + (i + 1);
      tableCell.appendChild(elem);
    }
    
    var elemURLInput = page.layoutContainer.getElementsByClassName('imageurl')[0];
    page.ImageInputRow = CreateElement._createElement('tr', null, null);
    page.ImageInputRow.appendChild(elemURLInput);
  }
	
	//--------------------------------------------------------------
	// updating
	//--------------------------------------------------------------
  function _navDispatch(dispatchOption) {
    var dispatchMap = {
      'layout': function() {_showContents('contents-layout'); },
      'preview': _showPreview,
      'share': _showShare,
      'profile': function() {}
    };
    
    var route = dispatchMap[dispatchOption];
    route();
  }
  
  function _showContents(contentsClass) {
    var contents = page.body.getElementsByClassName('contents');
    
    for (var i = 0; i < contents.length; i++) {
      if (contentsClass == 'contents-preview' || contentsClass == 'contents-share') {
        _setDisarm(page.navitems.reloadItem, true);
        _setDisarm(page.navitems.addItem, true);
        _setDisarm(page.navitems.deleteItem, true);
        
      } else {
        _setDisarm(page.navitems.reloadItem, !settings.dirtyBit);
        _setDisarm(page.navitems.addItem, false);
        _setDisarm(page.navitems.deleteItem, !settings.currentProject);
      }
      
      UtilityKTS.setClass(contents[i], 'hide-me', true);
    }
    UtilityKTS.setClass(page.body.getElementsByClassName(contentsClass)[0], 'hide-me', false);
  }
  
  function _updateProjectInfoSelection() {
    UtilityKTS.removeChildren(page.projectSelection);
    
    var indexToSelect = -1;
    
    for (var i = 0; i < settings.projectInfo.length; i++) {
      var project = settings.projectInfo[i];
      var elem = CreateElement.createOption(null, 'project', project.projectid, project.projectname + ': ' + project.projecttitle);
      elem.projectInfo = project;      
      if (settings.currentProject && project.projectid == settings.currentProject.projectid) indexToSelect = i;
      page.projectSelection.appendChild(elem);
    }
    
    page.projectSelection.selectedIndex = indexToSelect;
  }
  
  function _updateProjectInfo(projectInfo) {
    settings.currentProject = projectInfo;
    if (projectInfo) {
      page.keyvalueControl.value = projectInfo.projectname;
      page.titleControl.value = projectInfo.projecttitle;
      page.subtitleControl.value = projectInfo.projectsubtitle;
      
      elemColor = page.colorOptions.getElementsByClassName('color-sample ' + projectInfo.colorscheme)[0].click();
      
      page.layoutControl.value = projectInfo.layoutrows + 'x' + projectInfo.layoutcols;
      _updateLayout();
      
      for (var i = 0; i < settings.maxCards; i++) {
        var imageURL = '';
        if (i < projectInfo.layoutimages.length) imageURL = projectInfo.layoutimages[i];
        _setCardImage(page.layoutContainer.getElementsByClassName('cardbutton cardbutton' + i)[0], imageURL)
      }
      
      page.keyvalueControl.disabled = false;
      page.titleControl.disabled = false;
      page.subtitleControl.disabled = false;
      UtilityKTS.setClass(page.colorControl, 'hide-me', false);
      page.layoutControl.disabled = false;
      
      var cards = page.layoutContainer.getElementsByClassName('cardbutton');
      for (var i = 0; i < cards.length; i++) {
        cards[i].disabled = false;
      }
      
    } else {
      page.keyvalueControl.value = '';
      page.titleControl.value = '';
      page.subtitleControl.value = '';
      
      page.keyvalueControl.disabled = true;
      page.titleControl.disabled = true;
      page.subtitleControl.disabled = true;
      UtilityKTS.setClass(page.colorControl, 'hide-me', true);
      page.layoutControl.disabled = true;
      
      var cards = page.layoutContainer.getElementsByClassName('cardbutton');
      for (var i = 0; i < cards.length; i++) {
        cards[i].disabled = true;
      }
    }
    
    _setDirty(false);
  }
  
  function _updateLayout() {
    var layoutTable = page.layoutContainer.getElementsByTagName('table')[0];
    var swapArea = page.layoutContainer.getElementsByClassName('swaparea')[0];

    for (var i = 0; i < settings.maxCards; i++) {
      var elemCard = page.layoutContainer.getElementsByClassName('cardbutton' + i)[0];
      swapArea.appendChild(elemCard)
    }
    
    UtilityKTS.removeChildren(layoutTable);

    var layout = _getLayoutSetting();
    var cardnum = 0;
    for(var r = 0; r < layout.rows; r++) {
      var elemRow = CreateElement._createElement('tr', null, null);
      layoutTable.appendChild(elemRow);

      for (var c = 0; c < layout.cols; c++) {
        var elemCol = CreateElement._createElement('td', null, null);
        elemRow.appendChild(elemCol);
        
        var elemCard = swapArea.getElementsByClassName('cardbutton' + cardnum)[0];
        elemCol.appendChild(elemCard);
        
        cardnum++;
      }
    }
  }

  function _promptForImageURL(elem) {
    var cardNum = elem.value;
    var currentURL = elem.imageURL;
    
    return prompt('Please enter the URL for image #' + (cardNum + 1), currentURL);
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
  
  function _setDirty(dirty) {
    settings.dirtyBit = dirty;
    
    page.body.getElementsByClassName('save-project')[0].disabled = !dirty;
    
    _setDisarm(page.navitems.previewItem, !settings.currentProject);
    _setDisarm(page.navitems.shareItem, !settings.currentProject || settings.dirtyBit);
    _setDisarm(page.navitems.reloadItem, !dirty);
    _setDisarm(page.navitems.deleteItem, !settings.currentProject);
  }
  
  function _selectProject(projectId) {
    var projectOptions = page.projectSelection.children;
    for (var i = 0; i < projectOptions.length; i++) {
      var opt = projectOptions[i];
      if (opt.value == projectId) {
        opt.selected = true;
        _updateProjectInfo(opt.projectInfo);
        break;
      }
    }
  }

  async function _showPreview() { 
    var result = await _saveProjectToDB(true);
    if (!result.success) {
      console.log('failed to save preview');
      return;
    }
    
    page.previewFrame.src = settings.previewURL;
    _showContents('contents-preview'); 
  }

  function _showShare() { 
    var elemLink = page.contentsShare.getElementsByClassName('share-link')[0];
    var elemEmbed = page.contentsShare.getElementsByClassName('share-embed')[0];
    
    var url = settings.baseShareURL + settings.currentProject.projectid;
    elemLink.value = url;

    var elem = CreateElement.createIframe(null, null, url, 650, 500);
    elem.style.overflowY = 'hidden';
    elem.style.border = 'none';
    elem.scrolling = 'no';
    elemEmbed.value = elem.outerHTML;
    
    _showShareCopiedMessage(null);
    _showContents('contents-share'); 
  }

	//--------------------------------------------------------------
	// handlers
	//--------------------------------------------------------------    
  function _handleReloadProject() {
    if (!settings.currentProject) return;
    if (settings.dirtyBit && !confirm('Current changes will be lost.\nContinue with reloading project?')) return;

    _updateProjectInfo(settings.currentProject);
  }
  
  async function _handleAddProject() {
    if (settings.dirtyBit && !confirm('Current changes will be lost.\nContinue with adding project?')) return;
    
    var newProjectId = await _addNewProjectToDB();
    
    if (newProjectId) {
      await _getProjectInfo();
      _updateProjectInfoSelection();
      _selectProject(newProjectId);
      
    } else {
        console.log('failed to add new project');
    }        
  }
  
  async function _handleProjectSave(e) {
    var result = await _saveProjectToDB();

    if (result.success) {
      await _getProjectInfo();
      _updateProjectInfoSelection();
      _selectProject(settings.currentProject.projectid);

    } else {
      console.log('failed to save project');
    }
  }
  
  async function _handleDeleteProject() {
    if (!settings.currentProject) return;
    
    var projName = settings.currentProject.projectname;
    if (!confirm('This project will be permanently removed.\nContinue with deleting "' + projName + '"?')) return; 
    
    var deleteSucceeded = await _deleteProjectFromDB();
    if (deleteSucceeded) {
      settings.currentProject = null;
      await _getProjectInfo();
      _updateProjectInfoSelection();
      _updateProjectInfo(settings.currentProject);
      
    } else {
      console.log('failed to delete project');
    }
  }
  
  function _handleProjectSelection(e) {
    if (settings.dirtyBit && !confirm('Current changes will be lost.\nContinue with selecting different project?')) {
      e.target.value = settings.currentProject.projectid;
      
    } else {
      _updateProjectInfo(e.target[e.target.selectedIndex].projectInfo);
    }
  }
  
  function _handleColorControl(e) {
    UtilityKTS.setClass(page.colorOptions, 'hide-me', false);
  }
  
  function _handleColorSelection(e) {
    UtilityKTS.setClass(page.colorOptions, 'hide-me', true);

    var currentSchemeClass = _getColorScheme(page.colorControl);
    var newSchemeClass = _getColorScheme(e.target);
    
    if (currentSchemeClass.length > 0) {
      UtilityKTS.setClass(page.colorControl, currentSchemeClass, false);
    }
    
    UtilityKTS.setClass(page.colorControl, newSchemeClass, true);
   if (currentSchemeClass != newSchemeClass) _setDirty(true);
  }
  
  function _handleCardButton(e) {
    var cardNum = e.target.value;
    var currentURL = e.target.imageURL;
    
    var imageURL = _promptForImageURL(e.target);
    if (imageURL) {
      console.log('sanitize image URL');
      _setCardImage(e.target, imageURL);
      _setDirty(true);
    }
  }
	
  function _handleLinkClick(e) {
    var elemLink = page.contentsShare.getElementsByClassName('share-link')[0];
    var msg = elemLink.value;
    _copyToClipboard(msg);
    _showShareCopiedMessage('link');
  }
  
  function _handleEmbedClick(e) {
    var elemEmbed = page.contentsShare.getElementsByClassName('share-embed')[0];
    var msg = elemEmbed.value;
    _copyToClipboard(msg);
    _showShareCopiedMessage('embed');
  }
  
	//---------------------------------------
	// DB interface
	//---------------------------------------
  async function _getUserInfo() {
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'getuser');
    settings.userInfo = null;
    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
    }     
  }
  
  async function _getProjectInfo() {    
    var dbResult = await SQLDBInterface.doGetQuery('imageflipper/query', 'projectinfo');

    settings.projectInfo = null;
    if (dbResult.success) {
      for (var i = 0; i < dbResult.projects.length; i++) {
        dbResult.projects[i].layoutimages = JSON.parse(dbResult.projects[i].layoutimages);
      }

      settings.projectInfo = dbResult.projects;
    } 
  }  

  async function _saveProjectToDB(preview) {
    var layout = page.layoutControl.value.split('x');

    var postData = {
      projectid: settings.currentProject.projectid,
      projectname: page.keyvalueControl.value,
      projecttitle: page.titleControl.value,
      projectsubtitle: page.subtitleControl.value,
      colorscheme: _getColorScheme(page.colorControl),
      layoutrows: layout[0],
      layoutcols: layout[1],
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
	// utility functions
	//---------------------------------------
  function _restrictInput(e) {
    if (e.inputType.includes('delete')) _setDirty(true);
    if (!e.data) return;
    
    if (!e.data.match(/[0-9a-zA-Z\:_\- ]/)) {
      e.target.value = e.target.value.replace(/[^0-9a-zA-Z_\:\- ]/g, '');
    } else {
      _setDirty(true);
    }
  }
  
  function _getColorScheme(elem) {
    var currentSchemeClass = '';
    elem.classList.forEach(function(value, key) {
      if (value.includes('flipper-colorscheme-')) currentSchemeClass = value;
    });
    
    return currentSchemeClass
  }
  
  function _getLayoutSetting() {
    var layoutValues = page.layoutControl.value.split('x');
    
    return {
      rows: layoutValues[0],
      cols: layoutValues[1]
    };
  }
  
  function _getLayoutImageArray() {
    var imageURLArray = [];
    
    var elemCards = page.body.getElementsByClassName('cardbutton');
    for (var i = 0; i < settings.maxCards; i++) {
      var card = page.body.getElementsByClassName('cardbutton cardbutton' + i)[0];
      imageURLArray.push(card.imageURL);
    }

    return imageURLArray;
  }
  
  function _setDisarm(elem, disarm) {
    UtilityKTS.setClass(elem, 'disarm-me', disarm);
  }

  async function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }

  function _showHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _showShareCopiedMessage(category) {
    var elem = page.contentsShare.getElementsByClassName('copy-message')[0];
    
    if (category == 'link') {
      elem.innerHTML = 'copied link to clipboard';
    } else if (category == 'embed') {
      elem.innerHTML = 'copied embed code to clipboard';
    } else {
      elem.innerHTML = '';
    }
  }
	
	return {
		init: init
 	};
}();
