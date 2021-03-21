//-----------------------------------------------------------------------
// CommentBuddy composer
//-----------------------------------------------------------------------
// TODO: extend to add/edit/delete for all data in spreadsheet?
// TODO: is the CB extension stripping some HTML, e.g. <span> and <code>
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
    settings.currentItemData = null;
    
    settings.tiny = {};
    settings.tiny.navComposer = new MyTinyMCE({
      id: 'contenteditor-navComposer', 
      selector: '#contenteditor-navComposer', 
      changeCallback: _handleEditorChange
    });
    
    await settings.tiny.navComposer.init();
    
    page.elemSidebar = page.contentsComposer.getElementsByClassName('sidebar-container')[0];
    page.elemSidebarButtonLeft = page.contentsComposer.getElementsByClassName('btn-sidebartoggleleft')[0];
    page.elemSidebarButtonRight = page.contentsComposer.getElementsByClassName('btn-sidebartoggleright')[0];
    page.elemSidebarButtonLeft.addEventListener('click', (e) => { _handleSidebarToggle('left'); });
    page.elemSidebarButtonRight.addEventListener('click', (e) => { _handleSidebarToggle('right'); });
    
    page.elemSidebarAdd = page.elemSidebar.getElementsByClassName('btn-newcomment')[0];
    page.elemSidebarDelete = page.elemSidebar.getElementsByClassName('btn-deletecomment')[0];
    page.elemSidebarSearch = page.elemSidebar.getElementsByClassName('input-search')[0];
    page.elemSidebarTag = page.elemSidebar.getElementsByClassName('select-tag')[0];
    
    page.elemTags = page.contentsComposer.getElementsByClassName('form-control input-tags')[0];
    page.elemHoverText = page.contentsComposer.getElementsByClassName('form-control input-hovertext')[0];
    
    page.elemSidebarAdd.addEventListener('click', (e) => { _handleAddComment(e); });
    page.elemSidebarDelete.addEventListener('click', (e) => { _handleDeleteComment(e); });
    page.elemSidebarSearch.addEventListener('input', (e) => { _handleCommentSearchChange(e); });
    page.elemSidebarTag.addEventListener('change', (e) => { _handleCommentSearchChange(e); });
    
    page.elemTags.addEventListener('input', (e) => { _handleTextInput(e); });
    page.elemHoverText.addEventListener('input', (e) => { _handleTextInput(e); });
    
    _loadCommentInfo(settings.commentData);
    _loadTagSelect(settings.commentData);
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
    
    if (contentsId == 'navComposer') {
      _showComposer();
    } else if (contentsId == 'navConfigure') {
      _showConfigure();
    }
      
    _setNavOptions();
  }
  
  function _showComposer() {}
  
  function _loadCommentInfo(commentData) {
    console.log('_loadCommentInfo');    
    var elemItems = page.elemSidebar.getElementsByClassName('sidebar-items')[0];
    
    UtilityKTS.removeChildren(elemItems);
    for (var i = 0; i < commentData.length; i++) {
      var item = commentData[i];
      var elemSingleItem = CreateElement.createDiv(null, 'sidebar-singleitem', _makePlaintext(item.comment));
      elemSingleItem.addEventListener('click', (e) => { _handleSidebarSelection(e); });
      elemSingleItem.itemData = {...item, index: i};
      elemItems.appendChild(elemSingleItem);      
    }
  }
  
  function _loadTagSelect(commentData) {
    var elemItems = page.elemSidebar.getElementsByClassName('sidebar-items')[0];
    
    var tagSet = new Set();
    for (var i = 0; i < commentData.length; i++) {
      var item = commentData[i];
      var tagList = _parseTags(item.tags);
      for (var j = 0; j < tagList.length; j++) {
        tagSet.add(tagList[j].trim());
      }
    }

    var tagList = Array.from(tagSet);
    tagList = tagList.sort();

    UtilityKTS.removeChildren(page.elemSidebarTag);
    page.elemSidebarTag.appendChild(CreateElement.createOption(null, null, '[any]', '[any]'));
    for (var i = 0; i < tagList.length; i++) {
      page.elemSidebarTag.appendChild(CreateElement.createOption(null, null, tagList[i], tagList[i]));
    }    
  }
  
  function _updateCommentItems() {
    console.log('_updateCommentItems');
    var filteredCommentList = settings.commentData;
    
    var searchVal = page.elemSidebarSearch.value.toLowerCase();
    var tagVal = page.elemSidebarTag.value;
    var useSearchVal = searchVal != '';
    var useTagVal = tagVal != '[any]';
    console.log('|' + searchVal + '| |' + tagVal + '|');
    console.log(useSearchVal + ' ' + useTagVal);
;
    if (useSearchVal || useTagVal) {
      filteredCommentList = [];

      for (var i = 0; i < settings.commentData.length; i++) {
        var item = settings.commentData[i];
        var searchMatches = true;
        var tagMatches = true;
        
        if (useSearchVal) {
          searchMatches = item.comment.toLowerCase().includes(searchVal);
        }
        
        if (useTagVal) {
          var tagList = _parseTags(item.tags);
          var tagMatches = false;
          for (var j = 0; j < tagList.length && !tagMatches; j++) {
            tagMatches = (tagVal == tagList[j]);
          }
        }
        
        if (searchMatches && tagMatches) filteredCommentList.push(item);
      }
    }

    _loadCommentInfo(filteredCommentList);
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
  
  function _loadCommentItem(itemData) {
    console.log('_loadCommentItem');
    console.log('check for dirty bit first');
    page.elemTags.value = itemData.tags;
    page.elemHoverText.value = itemData.hovertext;
    settings.tiny.navComposer.setContent(itemData.comment);
    settings.currentItemData = itemData;
  }
  
  async function _saveComment() {
    _setNavbarMessage('saving comment...');
    var success = await settings.dbCommentBuddy.saveNewComment({
      "tags": page.elemTags.value,
      "hovertext": page.elemHoverText.value,
      "comment": settings.tiny.navComposer.getContent()
    });
    
    _setNavbarMessage(success ? '' : 'failed to save comment');
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
    console.log('disabled');
    return;
    
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
  
  function _handleSidebarToggle(side) {
    UtilityKTS.toggleClass(page.elemSidebar, 'active');
    
    var isActive = page.elemSidebar.classList.contains('active');
    UtilityKTS.setClass(page.elemSidebarButtonLeft, 'hide-me', !isActive);
    UtilityKTS.setClass(page.elemSidebarButtonRight, 'hide-me', isActive);
  }
  
  function _handleCommentSearchChange(e) {
    console.log('_handleCommentSearchChange');
    _updateCommentItems();
  }
  
  function _handleAddComment(e) {
    console.log('_handleAddComment');
  }
  
  function _handleDeleteComment(e) {
    console.log('_handleDeleteComment');
  }
  
  function _handleSidebarSelection(e) {
    if (settings.currentItem) UtilityKTS.setClass(settings.currentItem, 'selected-item', false);
    settings.currentItem = e.target;
    UtilityKTS.setClass(settings.currentItem, 'selected-item', true);
    
    _loadCommentItem(settings.currentItem.itemData);
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
  
  function _makePlaintext(richtext) {
    var plaintext = richtext;

    plaintext = plaintext.replace(/<p>(.*?)<\/p>/g, '$1\n');    // replace <p> elements with \n
    plaintext = plaintext.replace(/<li>(.*?)<\/li>/g, '• $1');  // replace <li> elements with bulleted items
    plaintext = plaintext.replace(/<a href="(.*?)"(.*?)>(.*?)<\/a>/g, '$3 (see $1)'); // replace link tag
    
    plaintext = plaintext.replace(/<br \/>/g, '\n');            // replace <br /> with \n
    plaintext = plaintext.replace(/<.*?\>(.*?)/g, '$1');        // strip all other angle bracket tags
    plaintext = plaintext.replace('&nbsp;', ' ');
    
    while (plaintext.includes('\n\n')) plaintext = plaintext.replace('\n\n', '\n'); 
    
    return plaintext;
  }
  
  function _parseTags(tagString) {
    var tagSet = new Set();
    var tagList = tagString.split(',');
    for (var j = 0; j < tagList.length; j++) {
      tagSet.add(tagList[j].trim());
    }

    return Array.from(tagSet);
  }
    
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();