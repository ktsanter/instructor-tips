//-----------------------------------------------------------------------
// Who Teaches What
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/roster-manager/help',
    logoutURL: '/usermanagement/logout/whoteacheswhat',
    
    dirtyBit: {},

    adminDisable: false
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);
    
    await _setAdminMenu();

    page.navbar = page.body.getElementsByClassName('navbar')[0];
    _setMainNavbarEnable(false);
    
    page.contents = page.body.getElementsByClassName('contents')[0];    
    
    await _initializeProfile(sodium);

    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    _renderContents();
    _initializeAssignmentViewer();

    _setUploadFileInfo();

    settings.currentInfo = null;
    await _getCurrentInfo();

    _setMainUIEnable(true);
    _setMainNavbarEnable(true);
    
    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();

    page.notice.setNotice('');
  }
  
  async function _setAdminMenu() {
    _enableNavOption('navAdmin', false, false);
    
    var adminAllowed = await _checkAdminAllowed();
    
    _enableNavOption('navAdmin', adminAllowed, adminAllowed);
  }
  
  async function _initializeProfile(sodium) {
    settings.profile = new ASProfile({
      id: "myProfile",
      "sodium": sodium,
      navbarElements: {
        "save": page.navbar.getElementsByClassName('navSave')[0],
        "reload": page.navbar.getElementsByClassName('navReload')[0],
        "icon": page.navbar.getElementsByClassName('icon-profile')[0],
        "pic": page.navbar.getElementsByClassName('pic-profile')[0]
      },
      hideClass: 'hide-me'
    });

    await settings.profile.init();
  }
  
  function _initializeReportManagement() {
    settings.reportPoster = new ReportPoster({
      // no params
    });
    
    settings.dataIntegrator = new DataIntegrator({
      "notice": page.notice
    });
  }

  function _initializeAssignmentViewer() {
    settings.assignmentViewer = new AssignmentViewer({
      "container": page.navLookup,
    });
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
  	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function _renderContents() {
    _renderLookup();
    _renderAdmin();
  }
  
  function _renderLookup() {
    page.navLookup = page.contents.getElementsByClassName('contents-navLookup')[0];
  }
    
  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];
    
    let elemUpload = page.navAdmin.getElementsByClassName('uploadfile')[0];
    elemUpload.addEventListener('change', (e) => { _handleFileUpload(e); });
    
    page.navAdmin.getElementsByClassName('btnToggleAdmin')[0].addEventListener('click', (e) => { _handleToggleAdmin(e); });    
  }
    
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  async function _showContents(contentsId) {
    settings.currentNavOption = contentsId;
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    if (contentsId == 'navLookup') _showLookup();
    if (contentsId == 'navAdmin') _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showLookup() {
    UtilityKTS.setClass(page.navLookup, 'disable-container', true);
    
    settings.assignmentViewer.update(settings.currentInfo);
    
    UtilityKTS.setClass(page.navLookup, 'disable-container', false);
  }
  
  function _showAdmin() {}
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    
    if (opt == 'navProfile') {
      var enable = settings.profile.isDirty();
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
    } else {
      _enableNavOption('navSave', false, false);
      _enableNavOption('navReload', false, false);
    }
  }
    
  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  function _setDirtyBit(dirty) {
    settings.dirtyBit[settings.currentNavOption] = dirty;
    _setNavOptions();
  }
    
  function _setMainUIEnable(enable) {
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      if (
        containers[i].classList.contains('contents-navStudent') ||
        containers[i].classList.contains('contents-navMentor') ||
        containers[i].classList.contains('contents-navConfigure') ||
        containers[i].classList.contains('contents-navAdmin')
      ) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }
      
  function _setMainNavbarEnable(enable) {
    var menuIds = ['navLookup', 'navAdmin'];
    for (var i = 0; i < menuIds.length; i++) {
      var elem = document.getElementById(menuIds[i]);
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
  }
  
  function _setAdminEnable(enable) {
    UtilityKTS.setClass(page.navAdmin, 'disable-container', !enable);
  }
  
  async function _getCurrentInfo() {
    settings.currentInfo = null;
    console.log('_getCurrentInfo, dummied');
    
    settings.currentInfo = {
      "Accounting 1A": [
        {"name": "J. Mullins", "terms": ["S1"]}, 
        {"name": "D. Lynch", "terms": ["S1", "T1"]}, 
        {"name": "D. Harrington", "terms": ["S1"]}, 
        {"name": "D. Plaxton", "terms": ["S1"]}
      ],
      "Hospitality and Tourism (FLVS)": [
        {"name": "B. Aldrink", "terms": ["S1"]}, 
        {"name": "K. Stalk", "terms": ["S1"]}
      ],
      "Study Skills": [
        {"name": "J. Spencer", "terms": ["S1"]}, 
        {"name": "B. Tarnas", "terms": ["S1", "T1"]}, 
        {"name": "B. Lange", "terms": ["S1"]}, 
        {"name": "A. Brilhart", "terms": ["S1", "T1"]}, 
        {"name": "A. MacKenzie", "terms": ["S1"]}
      ],
      "Career Planning": [
        {"name": "C. Siewert", "terms": ["S1"]}, 
        {"name": "L. Dailey", "terms": ["S1", "T1"]}, 
        {"name": "A. Fanning", "terms": ["S1"]}, 
        {"name": "K. Stalk", "terms": ["S1", "S2", "T2"]}, 
        {"name": "K. Cryderman", "terms": ["S1", "T3"]}
      ],
      "Health (MMC)": [
        {"name": "C. Begick", "terms": ["S1"]}, 
        {"name": "C. DeGroote", "terms": ["S1"]}, 
        {"name": "J. Malkasian", "terms": ["T1"]}, 
        {"name": "J. Swanson", "terms": ["S1"]}, 
        {"name": "D. Collette", "terms": ["S1"]}
      ]    
    }
    
    if (settings.currentNavOption == 'navLookup') _showLookup();
    
    return;
/*
    _setExportUIEnable({"student": false, "mentor": false});
    
    var result = await settings.dataIntegrator.readRosterInfo();
    if (!result.success) {
      console.log('failed to get roster info');
      return;
    }
    var rosterInfo = result.data;

    result = await _getStudentPropertiesFromDB();
    if (!result.success) {
      console.log('failed to get extra student info');
      return;
    }
    var extraStudentInfo = result.data;

    result = await _getMentorPropertiesFromDB();
    if (!result.success) {
      console.log('failed to get extra mentor info');
      return;
    }
    var extraMentorInfo = result.data.mentorextra;

    settings.currentInfo = _packageStudentInfo(rosterInfo, extraStudentInfo);

    settings.currentMentorInfo = _packageMentorInfo(rosterInfo, extraStudentInfo, extraMentorInfo);
    settings.currentRawInfo = {
      "rosterInfo": rosterInfo,
      "extraStudentInfo": extraStudentInfo,
      "extraMentorInfo": extraMentorInfo
    };
        
    _setExportUIEnable({
      "student": settings.currentInfo.studentList.length > 0, 
      "mentor": settings.currentMentorInfo.mentorList.length > 0
    });
    
    if (settings.currentNavOption == 'navStudent') _showStudent();
    if (settings.currentNavOption == 'navMentor') _showMentor();
    */
  }
   
  function _setUploadFileInfo() {
    var elemResultAssignment = page.navAdmin.getElementsByClassName('upload-result assignment')[0];
    var elemChanges = page.navAdmin.getElementsByClassName('changed-data')[0];
    
    elemResultAssignment.innerHTML = '';
    UtilityKTS.removeChildren(elemChanges);
  }
    
  async function _doFileUpload(uploadType, file) {
    console.log('_doFileUpload', uploadType);
    
    page.notice.setNotice('loading...', true);

    var elemResult = page.navAdmin.getElementsByClassName('upload-result ' + uploadType)[0];
    var elemChanges = page.navAdmin.getElementsByClassName('changed-data')[0];
    UtilityKTS.removeChildren(elemChanges);
    
    /*
    var url = '/usermanagement/routeToApp/roster-manager/upload/' + uploadType;    
    var result = await settings.reportPoster.post(url, file);
    */
    
    /* temp */ let result = {success: true, details: 'debugging...', data: '** changes list **'};
    
    if (!result.success) {
      elemResult.innerHTML = result.details;
      page.notice.setNotice('');
      return;
    }

/*
    var result = await settings.dataIntegrator.applyReportData(uploadType, result.data);
*/
    
    elemResult.innerHTML = result.details;
    if (result.success) {
      _displayChanges(result.data, elemChanges);
      await _getCurrentInfo();
    }

    page.notice.setNotice('');
  }
  
  function _displayChanges(changes, container) {
    console.log('_displayChanges, stubbed', changes);
    return;
    
    UtilityKTS.removeChildren(container);

    var numChanges = 0;
    for (key in changes) {
      numChanges += changes[key].differences.length;
    }

    if (numChanges == 0) {
      container.appendChild(CreateElement.createDiv(null, null, 'no changes'));
      
    } else {
      for (var changeKey in changes) {
        var differences = changes[changeKey].differences;
        var headers = ['reason'].concat(changes[changeKey].headers);
        
        if (differences.length > 0) {
          container.appendChild(CreateElement.createDiv(null, null, 'changes in ' + changeKey));

          var cellList = [];
          for (var i = 0; i < differences.length; i++) {
            var splitKey = differences[i].key.split('\t');
            var rowData = [differences[i].reason];

            for (var j = 0; j < splitKey.length; j++) {
              rowData.push(splitKey[j]);
            }
            cellList.push(rowData);
          }

          var table = CreateElement.createTable(null, 'table table-striped table-hover table-sm mb-4', headers, cellList);
          container.appendChild(table);
          table.getElementsByTagName('thead')[0].classList.add('table-primary');
        }
      }
    }
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _navDispatch(e) {
    var dispatchTarget = e.target.id;
    if (e.target.classList.contains('use-parentid')) dispatchTarget = e.target.parentNode.id;
    
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    if (settings.currentNavOption == 'navStudent') settings.rosterViewer.closeDialogs();
    
    _emphasizeMenuOption(settings.currentNavOption, false);
    _emphasizeMenuOption(dispatchTarget, true);
    
    var dispatchMap = {
      "navLookup": function() { _showContents('navLookup');},
      "navAdmin": function() { _showContents('navAdmin'); },
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e, false);}
    }
    dispatchMap[dispatchTarget]();
  }
  
  function _emphasizeMenuOption(menuOption, emphasize) {
    var mainOptions = new Set(['navLookup', 'navAdmin']);
    if (mainOptions.has(menuOption)) {
      var elem = document.getElementById(menuOption);
      UtilityKTS.setClass(elem, 'menu-emphasize', emphasize);
    }
  }
  
  async function _handleSave(e) {
    if (settings.currentNavOption == 'navProfile') {
      settings.profile.save();
    }
    
    _setDirtyBit(false);
  }  
    
  async function _handleReload(e, skipConfirm) {
    if (!skipConfirm) {
      var msg = 'Any changes will be lost.\nChoose "OK" to continue with reloading';
      if (!confirm(msg)) return;
    }
    
    if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
    }
    
    _setDirtyBit(false);
  }

  async function _handleFileUpload(e) {
    if (e.target.files.length == 0) return;
    
    _setAdminEnable(false);
    
    var classToParamMap = {
      'uploadfile-assignment': 'assignment'
    };

    var param = null;
    for (var key in classToParamMap) {
      if (e.target.classList.contains(key)) param = classToParamMap[key];
    }
    
    await _doFileUpload(param, e.target.files[0]);
    e.target.value = null;
    
    _setAdminEnable(true);
  }

  function _handleToggleAdmin() {
    settings.adminDisable = !settings.adminDisable;
    _setAdminMenu();
  }
  
  //----------------------------------------
  // callbacks
  //----------------------------------------

  //---------------------------------------
  // DB interface
  //----------------------------------------  
  async function _checkAdminAllowed() {
    dbResult = await SQLDBInterface.doGetQuery('whoteacheswhat/query', 'admin-allowed', page.notice);
    if (!dbResult.success) return false;
    
    var adminAllowed = (dbResult.data.adminallowed && !settings.adminDisable);
    return adminAllowed;
  }  
 
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	
    
  //--------------------------------------------------------------------------
  // admin
  //--------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  
  function _enableNavOption(navOption, visible, enable) {
    var elem = document.getElementById(navOption);
    UtilityKTS.setClass(elem, 'hide-me', !visible);
    elem.disabled = !enable;    
  }
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();