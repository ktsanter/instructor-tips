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
    enddateManagerURL: '/enddate-manager/manager',
    
    dirtyBit: {
      "navStudent": false,
      "navConfigure": false
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
    
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    _renderContents();
    await _initializeGoogleStuff();
    _initializeReportManagement();
    _initializeRosterViewer();
    _initializeMentorViewer();

    settings.currentInfo = null;
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
  
  function _initializeReportManagement() {
    settings.reportPoster = new ReportPoster({
      // no params
    });
    
    settings.dataIntegrator = new DataIntegrator({
      "googleDrive": settings.googleDrive
    });
  }
  
  function _initializeRosterViewer() {
    settings.rosterViewer = new RosterViewer({
      "container": page.navStudent,
      "containerNoteEditor": page.contents.getElementsByClassName('edit-container')[0],
      "callbackPropertyChange": _callbackRosterViewerPropertyChange,
      "callbackNoteChange": _callbackRosterViewerNoteChange
    });
  }
  
  function _initializeMentorViewer() {
    settings.mentorViewer = new MentorViewer({
      "container": page.navMentor
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
    
    _renderStudent();
    _renderMentor();
    _renderConfigure();
    _renderAdmin();
  }
  
  function _renderStudent() {
    page.navStudent = page.contents.getElementsByClassName('contents-navStudent')[0];
  }
  
  function _renderMentor() {
    page.navMentor = page.contents.getElementsByClassName('contents-navMentor')[0];
  }
  
  function _renderConfigure() {
    page.navConfigure = page.contents.getElementsByClassName('contents-navConfigure')[0];
    
    page.targetId = page.navConfigure.getElementsByClassName('googlefile-id')[0];
    page.targetContainer = page.navConfigure.getElementsByClassName('googlefile-container')[0];
    
    var pickButtons = page.navConfigure.getElementsByClassName('googlefile-pick');
    for (var i = 0; i < pickButtons.length; i++) {
      pickButtons[i].addEventListener('click', (e) => { _handleTargetFilePick(e); });
    }
    
    var fileUploads = page.navConfigure.getElementsByClassName('uploadfile');
    for (var i = 0; i < fileUploads.length; i++) {
      fileUploads[i].addEventListener('change', (e) => { _handleFileUpload(e); });
    }
  }
  
  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];
    
    page.navAdmin.getElementsByClassName('btnSignout')[0].addEventListener('click', (e) => { _handleGoogleSignout(e); });
    page.navAdmin.getElementsByClassName('btnToggleAdmin')[0].addEventListener('click', (e) => { _handleToggleAdmin(e); });
    
    page.labelEditEnable = page.navAdmin.getElementsByClassName('check-editenable-label')[0];
    page.checkEditEnable = page.navAdmin.getElementsByClassName('check-editenable')[0];
    
    page.checkEditEnable.addEventListener('click', (e) => { _handleEditEnableToggle(e); });

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
    
    if (contentsId == 'navStudent') _showStudent();
    if (contentsId == 'navMentor') _showMentor();
    if (contentsId == 'navConfigure') _showConfigure();
    if (contentsId == 'navAdmin') _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showStudent() {
    UtilityKTS.setClass(page.navStudent, 'disable-container', true);
    
    if (settings.google.isSignedIn) settings.rosterViewer.update(settings.currentInfo, _getRosterViewerRenderType(), _getRosterViewerEditEnable());
    
    UtilityKTS.setClass(page.navStudent, 'disable-container', false);
  }
  
  function _showMentor() {
    UtilityKTS.setClass(page.navMentor, 'disable-container', true);
    
    if (settings.google.isSignedIn) {
      settings.mentorViewer.update(settings.currentMentorInfo);
    }
    
    UtilityKTS.setClass(page.navMentor, 'disable-container', false);
  }
  
  function _showConfigure() {}
  
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
    
  function _doEndDateManager() {
    window.open(settings.enddateManagerURL, '_blank');
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
    var menuIds = ['navStudent', 'navMentor', 'navConfigure', 'navAdmin'];
    for (var i = 0; i < menuIds.length; i++) {
      var elem = document.getElementById(menuIds[i]);
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
  }
  
  function _setConfigureEnable(enable) {
    UtilityKTS.setClass(page.navConfigure, 'disable-container', !enable);
  }
  
  async function _getCurrentInfo() {
    settings.currentInfo = null;
    var spreadsheetId = _getTargetFileId();
    if (!spreadsheetId) {
      if (settings.currentNavOption == 'navStudent') _showStudent();
      if (settings.currentNavOption == 'navMentor') _showMentor();
      return;
    }
    
    var result = await _getStudentPropertiesFromDB();
    if (!result.success) {
      console.log('failed to get student properties from DB');
      return;
    }
    var currentDBInfo = result.data;
    
    var result = await settings.dataIntegrator.readCurrentSheetInfo(spreadsheetId);
    if (result.success) {
      settings.currentInfo = _packageStudentInfo(result.data, currentDBInfo);
      settings.currentMentorInfo = _packageMentorInfo(result.data, currentDBInfo);
      
      if (settings.currentNavOption == 'navStudent') _showStudent();
      if (settings.currentNavOption == 'navMentor') _showMentor();
    }
  }
  
  function _packageStudentInfo(rawData, infoFromDB) {
    var students = {};
    
    for (var i = 0; i < rawData.raw_enrollment_data.length; i++) {
      var item = rawData.raw_enrollment_data[i];
      var student = item.student;
      if (!students.hasOwnProperty(student)) students[student] = {
        "enrollments": [], 
        "mentors": [], 
        "guardians": [],
        "iep": false,
        "504": false,
        "homeschooled": false,
        "preferredname": '',
        "notes": []
      };
      students[student].enrollments.push(item);
    }
    
    for (var i = 0; i < rawData.raw_mentor_data.length; i++) {
      var item = rawData.raw_mentor_data[i];
      var student = item.student;
      students[student].mentors.push(item);
    }

    for (var i = 0; i < rawData.raw_guardian_data.length; i++) {
      var item = rawData.raw_guardian_data[i];
      var student = item.student;
      students[student].guardians.push(item);
    }

    for (var i = 0; i < rawData.raw_iep_data.length; i++) {
      var item = rawData.raw_iep_data[i];
      var student = item.student;
      students[student].iep = true;
    }

    for (var i = 0; i < rawData.raw_504_data.length; i++) {
      var item = rawData.raw_504_data[i];
      var student = item.student;
      students[student]["504"] = true;
    }

    for (var i = 0; i < rawData.raw_homeschooled_data.length; i++) {
      var item = rawData.raw_homeschooled_data[i];
      var student = item.student;
      students[student].homeschooled = true;
    }

    for (var i = 0; i < infoFromDB.preferredname.length; i++) {
      var item = infoFromDB.preferredname[i];
      var student = item.studentname;
      if (students.hasOwnProperty(student)) students[student].preferredname = item.preferredname;
    }
      
    for (var i = 0; i < infoFromDB.notes.length; i++) {
      var item = infoFromDB.notes[i];
      var student = item.studentname;
      if (students.hasOwnProperty(student)) students[student].notes.push({
        "datestamp": item.datestamp, 
        "notetext": item.notetext,
        "noteid": item.noteid
      });
    }

    var studentList = [];
    for (var key in students) studentList.push(key);
    
    return {
      "students": students,
      "studentList": studentList.sort()
    };
  }
  
  function _packageMentorInfo(rawData, infoFromDB) {
    var mentors = {};
    var mentorsByTermAndSection = {};

    for (var i = 0; i < rawData.raw_mentor_data.length; i++) {
      var item = rawData.raw_mentor_data[i];
      var name = item.name;
      var term = item.term;
      var section = item.section;
      
      if (!mentors.hasOwnProperty(name)) mentors[name] = {
        "name": name,
        "email": item.email,
        "phone": item.phone,
        "affiliation": item.affiliation,
        "affiliationphone": item.affiliationphone,
      }
      
      if (!mentorsByTermAndSection.hasOwnProperty(term)) mentorsByTermAndSection[term] = {};
      if (!mentorsByTermAndSection[term].hasOwnProperty(section)) mentorsByTermAndSection[term][section] = {};
      if (!mentorsByTermAndSection[term][section].hasOwnProperty(name)) mentorsByTermAndSection[term][section][name] = {
        "name": name,
        "email": item.email,
        "phone": item.phone,
        "affiliation": item.affiliation,
        "affiliationphone": item.affiliationphone,
      };
    }
    
    var mentorList = [];
    for (var key in mentors) mentorList.push(key);
    
    return {
      "mentors": mentors,
      "mentorsByTermAndSection": mentorsByTermAndSection,
      "mentorList": mentorList.sort()
    };
  }
  
  async function _setTargetFileInfo() {
    var targetId = _getTargetFileId();

    var targetFilePicked = page.targetContainer.getElementsByClassName('file-chosen')[0];
    var targetFileNotPicked = page.targetContainer.getElementsByClassName('file-notchosen')[0];
    var targetLink = page.targetContainer.getElementsByClassName('googlefile-link')[0];
    var msgNoSelection = page.targetContainer.getElementsByClassName('googlefile-notselected')[0];
    
    var uploadOptionalContainer = page.navConfigure.getElementsByClassName('configure-fieldset optional')[0];
    var uploadEnrollment = page.navConfigure.getElementsByClassName('uploadfile-label-enrollment')[0];
    var uploadMentor = page.navConfigure.getElementsByClassName('uploadfile-label-mentor')[0];
    var uploadIEP = page.navConfigure.getElementsByClassName('uploadfile-label-iep')[0];
    var upload504 = page.navConfigure.getElementsByClassName('uploadfile-label-504')[0];
    var uploadHomeSchooled = page.navConfigure.getElementsByClassName('uploadfile-label-homeschooled')[0];
    
    UtilityKTS.setClass(targetFilePicked, settings.hideClass, true);
    UtilityKTS.setClass(targetFileNotPicked, settings.hideClass, true);

    UtilityKTS.setClass(uploadOptionalContainer, settings.hideClass, true);
    UtilityKTS.setClass(uploadEnrollment, settings.hideClass, true);
    UtilityKTS.setClass(uploadMentor, settings.hideClass, true);
    UtilityKTS.setClass(uploadIEP, settings.hideClass, true);
    UtilityKTS.setClass(upload504, settings.hideClass, true);
    UtilityKTS.setClass(uploadHomeSchooled, settings.hideClass, true);
    
    if (targetId) {
      var result =  await settings.googleDrive.getSpreadsheetInfo({"id": targetId});
      if (!result.success) {
        msgNoSelection.innerHTML = '**error: unable to get file info';
        UtilityKTS.setClass(targetFileNotPicked, settings.hideClass, false);
        
      } else {
        targetLink.href = result.url;
        targetLink.innerHTML = result.title;
        UtilityKTS.setClass(targetFilePicked, settings.hideClass, false);
        UtilityKTS.setClass(uploadOptionalContainer, settings.hideClass, false);
        UtilityKTS.setClass(uploadEnrollment, settings.hideClass, false);
        UtilityKTS.setClass(uploadMentor, settings.hideClass, false);
        UtilityKTS.setClass(uploadIEP, settings.hideClass, false);
        UtilityKTS.setClass(upload504, settings.hideClass, false);
        UtilityKTS.setClass(uploadHomeSchooled, settings.hideClass, false);
      }
      
    } else {
      msgNoSelection = '[no file selected]';
      UtilityKTS.setClass(targetFileNotPicked, settings.hideClass, false);
    }
    
    var elemResultEnrollment = page.navConfigure.getElementsByClassName('upload-result enrollment')[0];
    var elemResultMentor = page.navConfigure.getElementsByClassName('upload-result mentor')[0];
    var elemResultIEP = page.navConfigure.getElementsByClassName('upload-result iep')[0];
    var elemResult504 = page.navConfigure.getElementsByClassName('upload-result 504')[0];
    var elemResultHomeSchooled = page.navConfigure.getElementsByClassName('upload-result homeschooled')[0];
    var elemChanges = page.navConfigure.getElementsByClassName('changed-data')[0];
    
    elemResultEnrollment.innerHTML = '';
    elemResultMentor.innerHTML = '';
    elemResultIEP.innerHTML = '';
    elemResult504.innerHTML = '';
    elemResultHomeSchooled.innerHTML = '';
    UtilityKTS.removeChildren(elemChanges);
  }
  
  async function _doTargetFilePick(pickType) {
    if (pickType == 'replace') {
      var msg = 'Please confirm that you want to use a new target file.';
      msg += '\n\nChoose "OK" to confirm.';
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
    var success = await _saveGoogleFileId(targetId);
    if (success) {
      page.targetId.innerHTML = targetId;
    }
    
    return success;
  }
  
  async function _doFileUpload(uploadType, file) {
    page.notice.setNotice('loading...', true);

    var elemResult = page.navConfigure.getElementsByClassName('upload-result ' + uploadType)[0];
    var elemChanges = page.navConfigure.getElementsByClassName('changed-data')[0];
    UtilityKTS.removeChildren(elemChanges);
    
    var url = '/usermanagement/routeToApp/roster-manager/upload/' + uploadType;    
    var result = await settings.reportPoster.post(url, file);
    
    var resultElems = page.navConfigure.getElementsByClassName('upload-result');
    for (var i = 0; i < resultElems.length; i++) {
      resultElems[i].innerHTML = '';
    }
    
    if (!result.success) {
      elemResult.innerHTML = result.details;
      page.notice.setNotice('');
      return;
    }

    var result = await settings.dataIntegrator.applyReportData(uploadType, result.data, _getTargetFileId());
    elemResult.innerHTML = result.details;
    if (result.success) {
      _displayChanges(result.data, elemChanges);
      await _getCurrentInfo();
    }

    page.notice.setNotice('');
  }
  
  function _displayChanges(changes, container) {
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
  
  function _getRosterViewerRenderType() {
    var value = null;
    
    var elems = page.navAdmin.getElementsByClassName('check-rendertype');
    for (var i = 0; i < elems.length && !value; i++) {
      if (elems[i].checked) value = elems[i].value;
    }
    
    return value;
  }
  
  function _getRosterViewerEditEnable() {
    return page.checkEditEnable.checked;
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
      "navStudent": function() { _showContents('navStudent');},
      "navMentor": function() { _showContents('navMentor');},
      "navConfigure": function() { _showContents('navConfigure');},
      "navAdmin": function() { _showContents('navAdmin'); },
      "navEndDateManager": function() { _doEndDateManager(); },
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
    var mainOptions = new Set(['navStudent', 'navMentor', 'navConfigure', 'navAdmin']);
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
  
  async function _handleFileUpload(e) {
    if (e.target.files.length == 0) return;
    
    _setConfigureEnable(false);
    
    var classToParamMap = {
      'uploadfile-enrollment': 'enrollment',
      'uploadfile-mentor': 'mentor',
      'uploadfile-iep': 'iep',
      'uploadfile-504': '504',     
      'uploadfile-homeschooled': 'homeschooled'      
    };

    var param = null;
    for (var key in classToParamMap) {
      if (e.target.classList.contains(key)) param = classToParamMap[key];
    }
    
    await _doFileUpload(param, e.target.files[0]);
    e.target.value = null;
    
    _setConfigureEnable(true);
  }

  function _handleToggleAdmin() {
    settings.adminDisable = !settings.adminDisable;
    _setAdminMenu();
  }
  
  function _handleEditEnableToggle(e) {
    page.labelEditEnable.innerHTML = e.target.checked ? 'field editing is ENABLED' : 'field editing is DISABLED';
  }
  
  async function _handleTest() {
    await _doTest();
  }

  //----------------------------------------
  // callbacks
  //----------------------------------------
  async function _signInChangeForGoogle(isSignedIn) {
    settings.google.isSignedIn = isSignedIn;
    
    if (isSignedIn) {
      page.notice.setNotice('');      
      await _setTargetFileInfo();
      await _getCurrentInfo();
      //xxxx
    }
    
    _setMainUIEnable(settings.google.isSignedIn);
    _setMainNavbarEnable(settings.google.isSignedIn);   

    _enableNavOption('navGoogle', !isSignedIn, !isSignedIn);    
  }
  
  async function _callbackTargetFilePick(result) {
    if (!result) return;
    
    var saveResult = await _saveTargetFileId(result.id);
    await _setTargetFileInfo();
    await _getCurrentInfo();
  } 
  
  async function _callbackRosterViewerPropertyChange(params) {
    var result = await _saveStudentPropertyToDB(params);
    if (!result.success) return result;
    
    var property = params.property;
    var value = params.value;
    var student = params.student;
    
    settings.currentInfo.students[student][property] = value;
    settings.rosterViewer.update(settings.currentInfo, _getRosterViewerRenderType(), _getRosterViewerEditEnable());
    
    return result;
  }

  async function _callbackRosterViewerNoteChange(params) {
    var result = {success: false, details: 'unrecognized action', data: null};
    
    if (params.action == 'add') {
      result = await _addNoteToDB(params);
      
    } else if (params.action == 'update') {
      result = await _updateNoteInDB(params);
      
    } else if (params.action == 'delete') {
      result = await _deleteNoteFromDB(params);
    }
    
    if (result.success) await _getCurrentInfo();
    
    return result;
  }
  
  //---------------------------------------
  // DB interface
  //----------------------------------------  
  async function _checkAdminAllowed() {
    dbResult = await SQLDBInterface.doGetQuery('roster-manager/query', 'admin-allowed', page.notice);
    if (!dbResult.success) return false;
    
    var adminAllowed = (dbResult.data.adminallowed && !settings.adminDisable);
    return adminAllowed;
  }
  
  async function _saveGoogleFileId(googleFileId) {
    dbResult = await SQLDBInterface.doPostQuery('roster-manager/insert', 'googlefileid', {"googlefileid": googleFileId}, page.notice);
    return dbResult.success;
  }

  async function _getStudentPropertiesFromDB() {
    dbResult = await SQLDBInterface.doGetQuery('roster-manager/query', 'student-properties', page.notice);
    if (!dbResult.success) return false;

    return dbResult;
  }
  
  async function _saveStudentPropertyToDB(params) {
    dbResult = await SQLDBInterface.doPostQuery('roster-manager/insert', 'student-property', params, page.notice);
    
    return dbResult
  }
  
  async function _addNoteToDB(params) {
    dbResult = await SQLDBInterface.doPostQuery('roster-manager/insert', 'student-note', params, page.notice);
    
    return dbResult
  }

  async function _updateNoteInDB(params) {
    dbResult = await SQLDBInterface.doPostQuery('roster-manager/update', 'student-note', params, page.notice);
    
    return dbResult
  }

  async function _deleteNoteFromDB(params) {
    dbResult = await SQLDBInterface.doPostQuery('roster-manager/delete', 'student-note', params, page.notice);
    
    return dbResult
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