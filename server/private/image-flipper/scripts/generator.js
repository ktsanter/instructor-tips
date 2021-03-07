//------------------------------------------------------------------------------
// image flipper generator app
//------------------------------------------------------------------------------
// TODO: styling
// TODO: handle dirty bit
// TODO: handlers for name, title, subtitle
// TODO: project reload and save
// TODO: project add and delete
// TODO: finish preview
// TODO: finish share
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
    
    dirtyBit: false,
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
    
    page.contents = page.body.getElementsByClassName('contents')[0];    
    
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
    
    page.notice.setNotice('');
    UtilityKTS.setClass(page.navbar, settings.hideClass, false); 

    _attachNavbarHandlers();
    await _renderContents();

    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
  }

  //-----------------------------------------------------------------------------
	// navbar
	//-----------------------------------------------------------------------------
  function _attachNavbarHandlers() {
    var handler = (e, me) => { _navDispatch(e); }
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
    page.elemName = page.contentsLayout.getElementsByClassName('input-name')[0];
    page.elemTitle = page.contentsLayout.getElementsByClassName('input-title')[0];
    page.elemSubtitle = page.contentsLayout.getElementsByClassName('input-subtitle')[0];
    page.elemGridSize = page.contentsLayout.getElementsByClassName('select-gridsize')[0];
    page.elemColorScheme = page.contentsLayout.getElementsByClassName('input-colorscheme')[0];
    page.elemColorSchemeOptions = page.contentsLayout.getElementsByClassName('color-options')[0];
    page.elemLayoutGrid = page.contentsLayout.getElementsByClassName('layout-grid')[0];
    page.elemSwapArea = page.contentsLayout.getElementsByClassName('swap-area')[0];
    
    _attachHandlers();
    
    _renderLayoutCards();
    
    await _updateProjectSelection();
    _updateProjectInfo();
  }
  
  function _attachHandlers() {
    page.elemProjectSelection.addEventListener('change', (e) => { _handleProjectSelection(e); });
    page.elemGridSize.addEventListener('change', (e) => { _updateCardLayout(); });
    
    page.elemColorScheme.addEventListener('keypress', (e) => { _denyInput(e); });
    page.elemColorScheme.addEventListener('click', (e) => { _handleColorSchemeToggle(e); });
    var elemColorOptions = page.contentsLayout.getElementsByClassName('color-sample');
    for (var i = 0; i < elemColorOptions.length; i++) {
      elemColorOptions[i].addEventListener('click', (e) => { _handleColorSchemeSelection(e); });
    }
    
    console.log('attach the rest of the handlers (name, title, subtitle)');
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
    console.log('_showContents: ' + contentsId);
    settings.currentNavOption = contentsId;
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    if (contentsId == 'navProfile') await settings.profile.reload();    
    
    _setNavOptions();
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);
    _enableNavOption('navProjectAdd', false);
    _enableNavOption('navProjectRemove', false);
      
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
    elem.disabled = !enable;    
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
  }  
  
  function _updateProjectInfo(projectInfo) {
    settings.currentProject = projectInfo;
    
    page.elemName.disabled = !projectInfo;
    page.elemTitle.disabled = !projectInfo;
    page.elemSubtitle.disabled = !projectInfo;
    page.elemGridSize.disabled = !projectInfo;
    page.elemColorScheme.disabled = !projectInfo;
    
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

  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  	
	//--------------------------------------------------------------
	// handlers
	//--------------------------------------------------------------
  function _navDispatch(e) {    
    console.log('_navDispatch: ' + e.target.id);
    var dispatchMap = {
      "navLayout":     function() { _showContents('navLayout'); },
      "navPreview":    function() { _showContents('navPreview'); },
      "navShare":      function() { _showContents('navShare'); },
      
      "navSave":       function() { _handleSave(e);},
      "navReload":     function() { _handleReload(e);},
      
      "navProfile":    function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },

      "navHelp":       function() { _doHelp(); },
      "navSignout":    function() { _doLogout(); }
    }
    
    dispatchMap[e.target.id]();
  }

  function _handleProjectSelection(e) {
    _updateProjectInfo(e.target[e.target.selectedIndex].projectInfo);
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
  }
  
  function _handleCardButton(e) {
    var card = e.target;
    var imageURL = _sanitizeURL(prompt('Please enter the URL for image #' + (card.value*1 + 1), card.imageURL));
    if (imageURL == null) return;
    
    _setCardImage(e.target, imageURL);
  }
  
  function _handleSave(e) {
    if (settings.currentNavOption == 'navProfile') return;
    console.log('_handleSave');
  }
  
  function _handleReload(e) {
    if (settings.currentNavOption == 'navProfile') return;
    console.log('_handleReload');
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

	//---------------------------------------
	// utility
	//---------------------------------------
  function _getColorScheme(elem) {
    var currentSchemeClass = '';
    elem.classList.forEach(function(value, key) {
      if (value.includes('flipper-colorscheme-')) currentSchemeClass = value;
    });
    
    return currentSchemeClass
  }
  
  function _getLayoutSetting() {
    var layoutValues = page.elemGridSize.value.split('x');
    
    return {
      rows: layoutValues[0],
      cols: layoutValues[1]
    };
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
