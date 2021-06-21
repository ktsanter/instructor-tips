//-----------------------------------------------------------------------
// Roster manager
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/roster-manager/help',
    logoutURL: '/usermanagement/logout/roster-manager',
    
    dirtyBit: {
      "navManage": false,
      "navConfigure": false,
      "navTest": false
    },
    
    google: {
      obj: null,
      appId: 'aardvarkstudios-rostermanager',
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        'https://sheets.googleapis.com/$discovery/rest?version=v4'
      ],  
      clientId:  '980213956279-rk5mjllkulhip472ooqmgnavog9c0s58.apps.googleusercontent.com',
      scopes: 'https://www.googleapis.com/auth/docs https://www.googleapis.com/auth/drive.file',
      isSignedIn: false
    },

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
    
    page.notice.setNotice('');
    
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    _renderContents();
    await _initializeGoogleStuff();

    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
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
    
  async function _initializeGoogleStuff() {    
    var result = await SQLDBInterface.doGetQuery('roster-manager/query', 'apikey', page.notice);
    if (!result.success) return;

    settings.google.obj = new GoogleManagement({
      "appId": settings.google.appId,
      "discoveryDocs": settings.google.discoveryDocs,
      "clientId": settings.google.clientId,
      "apiKey": result.data,
      "scopes": settings.google.scopes,
      "signInChange": _signInChangeForGoogle
    });
    
    settings.googleDrive = new GoogleDrive({
      "googleManagement": settings.google.obj
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
    _enableNavOption('navGoogle', false, false);
    
    _renderManage();
    _renderConfigure();
    _renderTest();
    _renderAdmin();
  }
  
  function _renderManage() {
    page.navManage = page.contents.getElementsByClassName('contents-navManage')[0];
    
    page.targetId = page.navManage.getElementsByClassName('googlefile-id')[0];
    page.targetContainer = page.navManage.getElementsByClassName('googlefile-container')[0];
    
    var pickButtons = page.navManage.getElementsByClassName('googlefile-pick');
    for (var i = 0; i < pickButtons.length; i++) {
      pickButtons[i].addEventListener('click', (e) => { _handleTargetFilePick(e); });
    }
  }
  
  function _renderConfigure() {}
  
  function _renderTest() {
    page.navTest = page.contents.getElementsByClassName('contents-navTest')[0];
    
    page.elemFileInfo = page.navTest.getElementsByClassName('file-info')[0];
    page.elemFileInfo.setAttribute('filedata', null);

    page.navTest.getElementsByClassName('btnTestPicker')[0].addEventListener('click', (e) => { _handleTestPicker(e); });
    page.navTest.getElementsByClassName('btnTestSSInfo')[0].addEventListener('click', (e) => { _handleTestGetSSInfo(e); });
    page.navTest.getElementsByClassName('btnTestFileRead')[0].addEventListener('click', (e) => { _handleTestFileRead(e); });
    page.navTest.getElementsByClassName('btnTestAddSheet')[0].addEventListener('click', (e) => { _handleTestAddSheet(e); });
    page.navTest.getElementsByClassName('btnTestFileWrite')[0].addEventListener('click', (e) => { _handleTestFileWrite(e); });
  }
    
  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];
    
    page.navAdmin.getElementsByClassName('btnSignout')[0].addEventListener('click', (e) => { _handleGoogleSignout(e); });
    page.navAdmin.getElementsByClassName('btnToggleAdmin')[0].addEventListener('click', (e) => { _handleToggleAdmin(e); });
    
    page.navAdmin.getElementsByClassName('btnTest')[0].addEventListener('click', (e) => { _handleTest(e); });
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
    
    if (contentsId == 'navManage') _showManage();
    if (contentsId == 'navConfigure') _showConfigure();
    if (contentsId == 'navTest') _showTest();
    if (contentsId == 'navAdmin') _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showManage() {}
  
  function _showConfigure() {}
  
  function _showTest() {}
  
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
        containers[i].classList.contains('contents-navManage') ||
        containers[i].classList.contains('contents-navConfigure') ||
        containers[i].classList.contains('contents-navTest') ||
        containers[i].classList.contains('contents-navAdmin')
      ) {
        UtilityKTS.setClass(containers[i], 'disable-container', !enable);
        containers[i].disabled = !enable;   
      }
    }
  }
      
  function _setMainNavbarEnable(enable) {
    var menuIds = ['navManage', 'navConfigure', 'navTest', 'navAdmin'];
    for (var i = 0; i < menuIds.length; i++) {
      var elem = document.getElementById(menuIds[i]);
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
  }
  
  async function _setTargetFileInfo() {
    var targetId = _getTargetFileId();

    var targetFilePicked = page.targetContainer.getElementsByClassName('file-chosen')[0];
    var targetFileNotPicked = page.targetContainer.getElementsByClassName('file-notchosen')[0];
    var targetLink = page.targetContainer.getElementsByClassName('googlefile-link')[0];
    
    UtilityKTS.setClass(targetFilePicked, settings.hideClass, true);
    UtilityKTS.setClass(targetFileNotPicked, settings.hideClass, true);
    
    if (targetId) {
      var result =  await settings.googleDrive.getSpreadsheetInfo({"id": targetId});
      if (!result.success) {
        page.notice.setNotice('Error: unable to get file info');
        
      } else {
        targetLink.href = result.url;
        targetLink.innerHTML = result.title;
        UtilityKTS.setClass(targetFilePicked, settings.hideClass, false);
      }
      
    } else {
      UtilityKTS.setClass(targetFileNotPicked, settings.hideClass, false);
    }
  }
  
  async function _doTargetFilePick(pickType) {
    if (pickType == 'replace') {
      var msg = 'All of the data in the current file will be copied to the new one.';
      msg += '\n\nChoose "Okay" to continue.';
      if (!confirm(msg)) return;
    }
    
    var params = {
      "callback": _callbackTargetFilePick,
      "includeFileInfo": false
    };
    
    settings.googleDrive.pickFile(params);
  }
  
  function _getTargetFileId() {
    var targetId = page.targetId.innerHTML;
    if (targetId == '[none]') targetId = null;
    return targetId;
  }
  
  async function _saveTargetFileId(targetId) {
    console.log('_saveTargetFileId');
    
    console.log('save to DB');
    
    page.targetId.innerHTML = targetId;
    
    return true;
  }
  
  async function _doTestPicker() {
    var params = {
      "callback": _testpickFileCallback,
      "includeFileInfo": true
    };
    
    settings.googleDrive.pickFile(params);
  }
  
  async function _doTestGetSSInfo() {
    var fileData = JSON.parse(page.elemFileInfo.getAttribute('filedata'));
    if (!fileData) {
      console.log('file data is null');
      return;
    }
    
    var result = await settings.googleDrive.getSpreadsheetInfo(fileData);
    if (result.success) {
      console.log('title: ' + result.title);
      console.log('id: ' + result.id);
      console.log('number of sheets: ' + result.sheetInfo.length);
      for (var i = 0; i < result.sheetInfo.length; i++) {
        console.log(' - ' + result.sheetInfo[i].title);
      }

    } else {
      console.log('*** Error - _doTestGetSSInfo failed: ' + result.message);
    }
  }
  
  async function _doTestFileRead() {
    var fileData = JSON.parse(page.elemFileInfo.getAttribute('filedata'));
    if (!fileData) {
      console.log('file data is null');
      return;
    }
    
    var result = await settings.googleDrive.testReadFile(fileData);
    if (result.success) {
      console.log('range: ' + result.range);
      var rows = result.values;
      for (var i = 0; i < result.values.length; i++) {
        var row = result.values[i];
        console.log(row);
      }
      
    } else {
      console.log('*** Error - _doTestFileRead failed: ' + result.message);
    }
  }

  async function _doTestAddSheet() {
    var fileData = JSON.parse(page.elemFileInfo.getAttribute('filedata'));
    if (!fileData) {
      console.log('file data is null');
      return;
    }
    
    var result = await settings.googleDrive.testAddSheet(fileData);
    if (result.success) {
      var reply = result.replies[0];
      console.log('title: ' + reply.addSheet.properties.title);

    } else {
      console.log('*** Error - _doTestAddSheet failed: ' + result.message);
    }
  }

  async function _doTestFileWrite() {
    var fileData = JSON.parse(page.elemFileInfo.getAttribute('filedata'));
    if (!fileData) {
      console.log('file data is null');
      return;
    }
    
    var result = await settings.googleDrive.testWriteFile(fileData);
    if (result.success) {
      console.log('updated range: ' + result.updatedRange);
      console.log('updated rows: ' + result.updatedRows);
      console.log('updated columns: ' + result.updatedColumns);
      console.log('updated cells: ' + result.updatedCells);

    } else {
      console.log('*** Error - _doTestFileWrite failed: ' + result.message);
    }
  }

  async function _doTest() {
    console.log('_doTest');
    console.log('**stub');
    alert('There is currently no action for this choice');  
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _navDispatch(e) {
    var dispatchTarget = e.target.id;

    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    _emphasizeMenuOption(settings.currentNavOption, false);
    _emphasizeMenuOption(dispatchTarget, true);
    
    var dispatchMap = {
      "navManage": function() { _showContents('navManage');},
      "navConfigure": function() { _showContents('navConfigure');},
      "navTest": function() { _showContents('navTest');},
      "navAdmin": function() { _showContents('navAdmin'); },
      "navGoogle": function() { _handleGoogleSignIn(); },
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
    var mainOptions = new Set(['navManage', 'navConfigure', 'navTest', 'navAdmin']);
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
  
  function _handleGoogleSignIn() {
    settings.google.obj.trySignIn();
  }
  
  function _handleGoogleSignout() {
    settings.google.obj.signout();
  }
  
  async function _handleTargetFilePick(e) {
    var param = 'replace';
    if (!e.target.classList.contains('pick-replace')) param = 'new';
    await _doTargetFilePick(param);
  }

  function _handleToggleAdmin() {
    settings.adminDisable = !settings.adminDisable;
    _setAdminMenu();
  }
    
  async function _handleTestPicker() {
    await _doTestPicker();
  }
  
  async function _handleTestGetSSInfo() {
    await _doTestGetSSInfo();
  }
            
  async function _handleTestFileRead() {
    await _doTestFileRead();
  }
            
  async function _handleTestAddSheet() {
    await _doTestAddSheet();
  }
            
  async function _handleTestFileWrite() {
    await _doTestFileWrite();
  }
            
  async function _handleTest() {
    await _doTest();
  }

  //----------------------------------------
  // callbacks
  //----------------------------------------
  async function _signInChangeForGoogle(isSignedIn) {
    settings.google.isSignedIn = isSignedIn;
    
    _setMainUIEnable(settings.google.isSignedIn);
    _setMainNavbarEnable(settings.google.isSignedIn);   

    if (isSignedIn) {    
      await _setTargetFileInfo();
    }
    
    _enableNavOption('navGoogle', !isSignedIn, !isSignedIn);    
  }
  
  async function _callbackTargetFilePick(result) {
    if (!result) return;
    
    var saveResult = await _saveTargetFileId(result.id);
    await _setTargetFileInfo();
  }
   
  function _testpickFileCallback(result) {
    if (result) {
      page.elemFileInfo.setAttribute('filedata', JSON.stringify(result));
      
      var elemLink = page.elemFileInfo.getElementsByClassName('file-url')[0];
      elemLink.href = result.url;
      elemLink.innerHTML = result.title;
      UtilityKTS.setClass(elemLink, settings.hideClass, false);

      page.elemFileInfo.getElementsByClassName('file-id')[0].innerHTML = 'id: ' + result.id;
      
      if (result.fileInfo) {
        var sheetInfo = result.fileInfo.sheetInfo;
        var elemNumSheets = page.elemFileInfo.getElementsByClassName('file-numsheets')[0];
        var elemSheets = page.elemFileInfo.getElementsByClassName('file-sheetnames')[0];
        
        elemNumSheets.innerHTML = 'number of sheets: ' + sheetInfo.length;
        
        UtilityKTS.removeChildren(elemSheets);
        for (var i = 0; i < sheetInfo.length; i++) {
          elemSheets.appendChild(CreateElement.createDiv(null, null, '&nbsp;&nbsp;- ' + sheetInfo[i].title));
        }
      }
    }
  }  
  
  //----------------------------------------
  // report posting
  //----------------------------------------
  /*
  async function _enrollmentReportPost(url, fileToPost) {
    const METHOD_TITLE = '_enrollmentReportPost';
    
    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE};
    var data = new FormData();
    data.append('file', fileToPost)

    try {
      const resp = await fetch(
        url, 
        {
          method: 'post', 
          //headers: {'Content-Type': 'multipart/form-data; charset=utf-8'}, //browser will fill in appropriately (?)
          body: data
        }
      );
      const json = await resp.json();
      //console.log(json);
      
      if (!json.success) {
        var errmsg = '*ERROR: in ' + METHOD_TITLE + ', ' + JSON.stringify(json.details);
        console.log(errmsg);
        //console.log('url: ' + url);
        //console.log('postData: ' + JSON.stringify(postData));
        result.details = errmsg;
      } else {
        result = json;
      }
      
    } catch (error) {
      var errmsg = '**ERROR: in ' + METHOD_TITLE + ', ' + error;
      console.log(errmsg);
      result.details = errmsg;
    }
    
    return result;
  }
  */
  
  //---------------------------------------
  // DB interface
  //----------------------------------------  
  async function _checkAdminAllowed() {
    dbResult = await SQLDBInterface.doGetQuery('roster-manager/query', 'admin-allowed', page.notice);
    if (!dbResult.success) return false;
    
    var adminAllowed = (dbResult.data.adminallowed && !settings.adminDisable);
    return adminAllowed;
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