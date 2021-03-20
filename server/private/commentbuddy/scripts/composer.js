//-----------------------------------------------------------------------
// CommentBuddy composer
//-----------------------------------------------------------------------
// TODO: extend to add/edit/delete for all data in spreadsheet?
// TODO: add "open source" option to configure
// TODO: styling
// TODO: finish help
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',

    helpURL: '/commentbuddy/help',
    
    dirtyBit: {
      navComposer: false
    },    
    
    sourceId: '12AipxdTnkm9P00HUUVMGxN1dsJXeUbCpR4DtSv4bwl0'
  };
      
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {    
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('');
    
    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, 'hide-me', true);
    page.elemNavbarMessage = page.navbar.getElementsByClassName('navbar-message')[0];
    _setNavbarMessage('');
    _attachNavbarHandlers();
    
    settings.dbCommentBuddy = new CommentBuddyDB({});
    var validSettings = settings.dbCommentBuddy.settingsValid();
    
    if (validSettings) await _getCommentData(true);

    await _renderContents();
    UtilityKTS.setClass(page.navbar, 'hide-me', false);

    var startingOption = validSettings ? 0 : 1;
    page.navbar.getElementsByClassName(settings.navItemClass)[startingOption].click();
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
  
  function _setNavbarMessage(msg) {
    page.elemNavbarMessage.innerHTML = msg;
  }
  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  async function _renderContents() {
    page.contents = page.body.getElementsByClassName('contents')[0];        
    page.contentsComposer = page.contents.getElementsByClassName('contents-navComposer')[0];
    page.contentsConfigure = page.contents.getElementsByClassName('contents-navConfigure')[0];

    await _renderComposer();
    _renderConfigure();
  }
  
  async function _renderComposer() {
    settings.tiny = {};
    settings.tiny.navComposer = new MyTinyMCE({
      id: 'contenteditor-navComposer', 
      selector: '#contenteditor-navComposer', 
      changeCallback: _handleEditorChange
    });
    
    await settings.tiny.navComposer.init();
    
    page.elemTags = page.contentsComposer.getElementsByClassName('form-control input-tags')[0];
    page.elemHoverText = page.contentsComposer.getElementsByClassName('form-control input-hovertext')[0];
    
    page.elemTags.addEventListener('input', (e) => { _handleTextInput(e); });
    page.elemHoverText.addEventListener('input', (e) => { _handleTextInput(e); });
  }
  
  function _renderConfigure() {
    page.elemConfigureURL = page.contentsConfigure.getElementsByClassName('form-control input-link')[0];
    page.elemShowSource = page.contentsConfigure.getElementsByClassName('btn-opensource')[0];
    page.elemShowSource.addEventListener('click', (e) => { _handleOpenSource(e); });
    page.contentsConfigure.getElementsByClassName('btn-storelink')[0].addEventListener('click', (e) => { _handleConfigureURL(e); });
  }

  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  function _showContents(contentsId) {
    settings.currentNavOption = contentsId;
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    if (contentsId == 'navConfigure') {
      _showConfigure();
    }
      
    _setNavOptions();
  }
  
  function _showConfigure() {
    page.elemConfigureURL.value = settings.dbCommentBuddy.getSpreadsheetURL();
    
    page.elemShowSource.disabled = !settings.dbCommentBuddy.settingsValid();
  }
    
  function _setNavOptions() {
    var opt = settings.currentNavOption;

    _enableNavOption('navSave', false);
    _enableNavOption('navComposer', true, settings.dbCommentBuddy.settingsValid());

    if (opt == 'navComposer') {
      var enable = settings.dirtyBit.navComposer;
      _enableNavOption('navSave', true, enable); 
    }
  }
  
  async function _saveComment() {
    var success = await settings.dbCommentBuddy.saveNewComment({
      "tags": page.elemTags.value,
      "hovertext": page.elemHoverText.value,
      "comment": settings.tiny.navComposer.getContent()
    });
    
    console.log('_saveComment: ' + success);
  }
  
  async function _reconfigureDataSource(proposedURL) {
    _setNavbarMessage('testing data source...');

    if (await settings.dbCommentBuddy.storeConfiguration(proposedURL)) {
      _setNavbarMessage('loading data...')
      await _getCommentData(false);
      _setNavbarMessage('');
      
    } else {
      _setNavbarMessage('could not open data source');
    }
    
    page.elemShowSource.disabled = !settings.dbCommentBuddy.settingsValid();    

    _setNavOptions();
  }

  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _setDirtyBit(dirty) {
    settings.dirtyBit[settings.currentNavOption] = dirty;
    _setNavOptions();
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _navDispatch(e) {
    var dispatchTarget = e.target.id;
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    var dispatchMap = {
      "navComposer": function() { _showContents('navComposer'); },
      "navConfigure": function() { _showContents('navConfigure'); },
      "navHelp": _doHelp,
      "navSave": function() { _handleSave(e);}
    }
    
    _setNavbarMessage('');
    dispatchMap[dispatchTarget]();
  }
  
  async function _handleSave(e) {
    console.log('_handleSave');
    
    if (settings.currentNavOption == 'navComposer') {
      if ( !(await _saveComment()) ) return;
      _setDirtyBit(false);
      console.log('reload data set?');
    }
  }
  
  function _handleEditorChange(e) {
    _setDirtyBit(true);
  } 
  
  function _handleTextInput(e) {
    _setDirtyBit(true);
  }
  
  function _handleOpenSource() {
    settings.dbCommentBuddy.openSource();
  }
  
  async function _handleConfigureURL(e) {
    await _reconfigureDataSource(page.elemConfigureURL.value);
  }

  //---------------------------------------
	// DB interface
	//----------------------------------------  
  async function _getCommentData(showNotice) {
    if (showNotice) page.notice.setNotice('loading comments...', true);
    
    settings.commentData = null;
    var result = await settings.dbCommentBuddy.getCommentData();
    if (result.success) {
      settings.commentData = result.data;
      page.notice.setNotice('');
    } else {
      page.notice.setNotice(result.details);
    }
    
    return result.success;
  }
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------
  function _enableNavOption(navOption, visible, enable) {
    var elem = document.getElementById(navOption);
    UtilityKTS.setClass(elem, 'hide-me', !visible);
    if (elem.classList.contains('btn')) {
      elem.disabled = !enable;    
    } else {
      UtilityKTS.setClass(elem, 'disabled', !enable);
    }
  }
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();