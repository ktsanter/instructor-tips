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
    logoutURL: '/usermanagement/logout/commentbuddy',
    
    dirtyBit: {
      navComposer: false,
      navProfile: false
    },    
    
    sourceId: '12AipxdTnkm9P00HUUVMGxN1dsJXeUbCpR4DtSv4bwl0'
  };
      
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {    
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('');
    
    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, 'hide-me', true);
    page.elemNavbarMessage = page.navbar.getElementsByClassName('navbar-message')[0];
    _setNavbarMessage('');
    _attachNavbarHandlers();
    
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
    
    settings.dbCommentBuddy = new CommentBuddyDB({});
    if ( !(await _getCommentData(true)) ) return;

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

    await _renderComposer();
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
    
    if (contentsId == 'navProfile') await settings.profile.reload();
    
    _setNavOptions();
  }
  
  async function _updateCommentInfo() {
    console.log('_updateCommentInfo');
    if ( !(await _getCommentData(false)) ) return;
    
    _loadCommentInfo(settings.commentData);
    _loadTagSelect(settings.commentData);
    _updateCommentItems();
    
    if (settings.currentItem != null) {
      _selectItem(settings.currentItem);
    }
  }
  
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
  
  function _selectItem() {
    console.log('_selectItem');
    if (settings.currentItem == null) return;
    console.log(settings.currentItem.itemInfo);
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);
    _enableNavOption('navComposer', true, settings.dbCommentBuddy.settingsValid());

    if (opt == 'navComposer') {
      _enableNavOption('navSave', true, settings.dirtyBit.navComposer); 
      page.elemSidebarDelete.disabled = (settings.currentItem == null);
      
    } else if (opt == 'navProfile') {
      var enable = settings.profile.isDirty();
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);      
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
  
  async function _saveComment(itemData) {
    _setNavbarMessage('saving comment...');
    console.log('_saveComment');
    console.log(itemData);
    var success = true;
    
    // use dbCommentBuddy method
    await _updateCommentInfo();
    
    _setNavbarMessage(success ? '' : 'failed to save comment');
  }
  
  async function _deleteComment(itemData) {
    _setNavbarMessage('deleting comment...');
    console.log('_deleteComment (disabled)')
    console.log(itemData);
    var success = true;
    
    // use dbCommentBuddy method
    settings.currentItem = null;
    await _updateCommentInfo();
    
    _setNavbarMessage(success ? '' : 'failed to delete comment');
  }
  
  async function _addDefaultComment() {
    _setNavbarMessage('adding new comment...');
    console.log('_addDefaultComment (disabled)')
    var success = true;
    var itemData = {
      "tags": '',
      "hovertext": '',
      "comment": 'default comment'
    };
    console.log(itemData);
    
    // use dbCommentBuddy method
    // use return value to set settings.currentItem
    await _updateCommentInfo();
    
    _setNavbarMessage(success ? '' : 'failed to add new comment');
  }

  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
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
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e, false);}
    }
    
    _setNavbarMessage('');
    dispatchMap[dispatchTarget]();
  }
  
  async function _handleSave(e) {
    console.log('_handleSave');
    
    if (settings.currentNavOption == 'navComposer') {
      if (settings.currentItem == null) return;
      var itemData = settings.currentItem.itemData;
      itemData.tags = page.elemTags.value;
      itemData.hovertext = page.elemHoverText.value;
      itemData.comment = settings.tiny.navComposer.getContent();

      if ( !(await _saveComment(itemData)) ) return;
      _setDirtyBit(false);
      console.log('reload data set?');
    }
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
  
  async function _handleAddComment(e) {
    console.log('_handleAddComment');
    console.log('check dirty bit?');
    await _addDefaultComment();
  }
  
  async function _handleDeleteComment(e) {
    console.log('_handleDeleteComment');
    if (settings.currentItem == null) return;
    
    var msg = 'This comment will be permanently deleted.';
    msg += '\nContinue with deleting?';
    if (!confirm(msg)) return;
    
    await _deleteComment(settings.currentItem.itemData);
  }
  
  function _handleSidebarSelection(e) {
    if (settings.currentItem) UtilityKTS.setClass(settings.currentItem, 'selected-item', false);
    settings.currentItem = e.target;
    UtilityKTS.setClass(settings.currentItem, 'selected-item', true);
    
    _loadCommentItem(settings.currentItem.itemData);
    _setNavOptions();
  }
  
  function _handleOpenSource() {
    settings.dbCommentBuddy.openSource();
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------  
  async function _getCommentData(showNotice) {
    if (showNotice) page.notice.setNotice('loading comments...', true);
    
    settings.commentData = null;
    var result = await settings.dbCommentBuddy.getCommentData();
    console.log(result);
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
    console.log('navOption: ' + navOption);
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