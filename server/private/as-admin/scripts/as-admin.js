//-----------------------------------------------------------------------
// Aardvark Studios admin
//-----------------------------------------------------------------------
// TODO:
//-----------------------------------------------------------------------
const app = function () {
  const TOOLINDEX_SPREADSHEETID = '1-M4mw9TFt7J7ytZdn_-mDP95HjSAH84oupOVBG-XNZM';
  
  const apiInfo = {
    apibase: 'https://script.google.com/macros/s/AKfycbxAHeZ1fkN8Ei82SWPytXwLqDa2FqwJCgDyIVSbbRNmimujxYcu/exec',
    apikey: 'KTS_toolindex'
  };
  
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    logoutURL: '/usermanagement/logout/as-admin',
    
    dirtyBit: {},    
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {    
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);
    
    page.navbar = page.body.getElementsByClassName('navbar')[0];    
    page.contents = page.body.getElementsByClassName('contents')[0];    
    
    await _initializeProfile(sodium);
    
    settings.indexdata = await _loadToolSiteData();
    if (!settings.indexdata) return;
    
    page.notice.setNotice('');
    
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
    _attachNavbarHandlers();
    _renderContents();

    page.navbar.getElementsByClassName(settings.navItemClass)[0].click();
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
    _renderSites();
    _renderAdmin();
  }
  
  function _renderSites() {
    page.navSites = page.contents.getElementsByClassName('contents-navSites')[0];
    
    page.navSites.appendChild(_renderSiteItems());
  }
    
  function _renderAdmin() {
    page.navAdmin = page.contents.getElementsByClassName('contents-navAdmin')[0];

    page.labelGmailAuthorization = page.navAdmin.getElementsByClassName('gmail-authorization-label')[0];
    page.btnBeginGMailAuthorization = page.navAdmin.getElementsByClassName('btnBeginGmailAuth')[0];
    page.containerGmailAuthConfirm = page.navAdmin.getElementsByClassName('gmail-authorization-confirm')[0];
    page.linkGmailAuthorization = page.navAdmin.getElementsByClassName('authorization-link')[0];
    page.inputGmailAuthorizationConfirm = page.navAdmin.getElementsByClassName('gmail-authorization-confirmcode')[0];
    page.btnSendTestMessage = page.navAdmin.getElementsByClassName('btnSendTestMessage')[0];

    page.labelMailerDebug = page.navAdmin.getElementsByClassName('check-mailer-debug-label')[0];
    page.checkMailerDebug = page.navAdmin.getElementsByClassName('check-mailer-debug')[0];

    page.navAdmin.getElementsByClassName('btnTestGmailAuth')[0].addEventListener('click', (e) => { _handleTestGmailAuth(e); });
    page.navAdmin.getElementsByClassName('btnBeginGmailAuth')[0].addEventListener('click', (e) => { _handleBeginGmailAuth(e); });
    page.navAdmin.getElementsByClassName('btnFinishGmailAuth')[0].addEventListener('click', (e) => { _handleFinishGmailAuth(e); });
    page.navAdmin.getElementsByClassName('btnSendTestMessage')[0].addEventListener('click', (e) => { _handleSendTestMessage(); });

    page.navAdmin.getElementsByClassName('check-mailer-debug')[0].addEventListener('click', (e) => { _handleMailerDebugToggle(e); });
    page.navAdmin.getElementsByClassName('check-reset-request-cron')[0].addEventListener('click', (e) => { _handleResetRequestCronToggle(e); });

    page.navAdmin.getElementsByClassName('btnTest')[0].addEventListener('click', (e) => { _handleTest(e); });
  }
  
  function _renderSiteItems() {
    var container = CreateElement.createDiv(null, 'sites');

    var currentCategory;
    var categoryContainer;
    var categoryCount = 0;

    for (var i = 0; i < settings.indexdata.length; i++) {
      var item = settings.indexdata[i];

      if (i == 0 || (item.category != currentCategory && item.category != '')) {
        currentCategory = item.category;
        categoryCount++;
        categoryContainer = _renderCategory(currentCategory, categoryCount == 1);
        container.appendChild(categoryContainer);
      }
      
      if (item.url && item.url != '') categoryContainer.appendChild(_renderIndexItem(item));
    }
    
    return container;
  }
  
  function _renderCategory(categoryName, firstCategory) {
    var classes = 'category';
    if (!firstCategory) classes += ' mt-3';
    
    var container = CreateElement.createDiv(null, classes);
    container.appendChild(CreateElement.createDiv(null, 'category-label', categoryName));
    
    return container;
  }
  
  function _renderIndexItem(item) {
    var container = CreateElement.createDiv(null, 'item');
    
    var toolLink = CreateElement.createLink(null, 'item-contents ms-2', item.label, null, item.url);
    container.appendChild(toolLink);
    toolLink.target = '_blank';
    
    return container;
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
    
    if (contentsId == 'navSites') _showSites();
    if (contentsId == 'navAdmin') await _showAdmin();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  function _showSites() {
  }
    
  async function _showAdmin() {
    page.notice.setNotice('loading...', true);
    
    var gmailAuthorized = false;
    var result = await SQLDBInterface.doGetQuery('as-admin/admin', 'check-gmail-auth');
    if (result.success) gmailAuthorized = result.data.authorized;
    _updateGmailAuthorizationUI(gmailAuthorized);

    var debugState = 'UNKNOWN';
    page.checkMailerDebug.disabled = true;
    var result = await SQLDBInterface.doGetQuery('as-admin/admin', 'get-mailer-debug');       
    if (result.success) {
      page.notice.setNotice('');
      debugState = result.data.debugstate ? 'ON' : 'OFF';
      page.checkMailerDebug.disabled = false;
      page.checkMailerDebug.checked = result.data.debugstate;
    }
    _updateMailerDebugUI(debugState);
  }
  
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
      
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }
  
  function _setDirtyBit(dirty) {
    settings.dirtyBit[settings.currentNavOption] = dirty;
    _setNavOptions();
  }
  
  function _updateGmailAuthorizationUI(authorized) {
    page.labelGmailAuthorization.innerHTML = 'Gmail is ' + (authorized ? 'AUTHORIZED' : 'NOT AUTHORIZED');
    UtilityKTS.setClass(page.labelGmailAuthorization, 'not-authorized', !authorized);
    UtilityKTS.setClass(page.btnBeginGMailAuthorization, 'hide-me', authorized);
    page.btnBeginGMailAuthorization.disabled = false;
    
    UtilityKTS.setClass(page.btnSendTestMessage, 'hide-me', !authorized);
    UtilityKTS.setClass(page.containerGmailAuthConfirm, 'hide-me', true);
  }
  
  function _updateMailerDebugUI(debugState) {
    page.labelMailerDebug.innerHTML = 'mailer debug is ' + debugState;
  }
              
  //--------------------------------------------------------------------------
  // admin
	//--------------------------------------------------------------------------
  async function _testGmailAuthorization() {
    var gmailAuthorized = false;
    var result = await SQLDBInterface.doGetQuery('as-admin/admin', 'check-gmail-auth');
    if (result.success) gmailAuthorized = result.data.authorized;
    _updateGmailAuthorizationUI(gmailAuthorized);
  }
  
  async function _beginGmailAuthorization() {
    var result = await SQLDBInterface.doGetQuery('as-admin/admin', 'begin-gmail-auth', page.notice);
    
    UtilityKTS.setClass(page.containerGmailAuthConfirm, 'hide-me', !result.success);
    if (!result.success) return;
    
    page.btnBeginGMailAuthorization.disabled = true;
    page.linkGmailAuthorization.href = result.data.authorizationurl;
    page.inputGmailAuthorizationConfirm.value = '';
  }
  
  async function _finishGmailAuthorization() {
    var confirmCode = page.inputGmailAuthorizationConfirm.value;
    var result = await SQLDBInterface.doPostQuery('as-admin/admin', 'finish-gmail-auth', {confirmcode: confirmCode}, page.notice);

    await _testGmailAuthorization();
  }
  
  async function _sendTestMessage() {
    console.log('_sendTestMessage');
    var params = {
      sender: 'ksanter@mivu.org',
      recipient: 'ktsanter@gmail.com',
      subject: 'Aardvark Studios admin ' + (new Date()).toLocaleString(),
      message: 'this is a test message from <em><strong>Aardvark Studios admin</strong></em>. Enjoy!'
    };
    
    var result = await SQLDBInterface.doPostQuery('as-admin/admin', 'send-test-mail', params, page.notice);
    console.log(result);
  }
  
  async function _doSetMailerDebug(setDebugOn) {
    var debugState = 'UNKNOWN';
    var result = await SQLDBInterface.doPostQuery('as-admin/admin', 'set-mailer-debug', {debugon: setDebugOn});
    if (result.success) debugState = result.data.debugstate ? 'ON' : 'OFF';
    _updateMailerDebugUI(debugState);      
  }
  
  async function _doSetResetRequestCron(enableCronJob) {
    console.log('_doSetResetRequestCron ' + enableCronJob);
    console.log('**stub');
  }
  
  async function _doTest() {
    console.log('_doTest');
    console.log('**stub');
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
      "navSites": function() { _showContents('navSites');},
      "navAdmin": function() { _showContents('navAdmin'); },
      "navProfile": function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e, false);}
    }
    dispatchMap[dispatchTarget]();
  }
  
  function _emphasizeMenuOption(menuOption, emphasize) {
    var mainOptions = new Set(['navManage', 'navOptions', 'navAdmin']);
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
  
  async function _handleMailerDebugToggle(e) {
    await _doSetMailerDebug(e.target.checked);
  }
    
  async function _handleResetRequestCronToggle(e) {
    await _doSetResetRequestCron(e.target.checked);
  }

  async function _handleTestGmailAuth() {
    await _testGmailAuthorization(); 
  }
    
  async function _handleBeginGmailAuth() {
    await _beginGmailAuthorization();
  }
  
  async function _handleFinishGmailAuth() {
    await _finishGmailAuthorization();
  }
  
  async function _handleSendTestMessage() {
    await _sendTestMessage();
  }
    
  async function _handleTest() {
    await _doTest(); 
  }
        
  //---------------------------------------
  // DB interface
  //----------------------------------------  
  async function _loadToolSiteData() {
    var result = null;
    
    page.notice.setNotice('loading...', true);
    var requestParams = {sourcefileid: TOOLINDEX_SPREADSHEETID};
    var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'indexinfo', requestParams, page.notice);

    if (requestResult.success) {
      page.notice.setNotice('');
      var result = requestResult.data;
      
    } else {
      page.notice.setNotice('load failed');
    }

    return result;
  }
  
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