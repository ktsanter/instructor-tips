//-----------------------------------------------------------------------
// CommentBuddy composer
//-----------------------------------------------------------------------
// TODO: manage presetText
// TODO: sorting comment list (alphabetically with plain text?)
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
    
    commentData: null,
    accessKey: null
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
    if ( !(await _getAccessKey()) ) return;
    if ( !(await _getCommentData(true)) ) return;
    
    settings.presetText = await _getPresetText();

    await _renderContents();
    UtilityKTS.setClass(page.navbar, 'hide-me', false);

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
  
  function _setNavbarMessage(msg) {
    page.elemNavbarMessage.innerHTML = msg;
  }
  
  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------
  async function _renderContents() {
    page.contents = page.body.getElementsByClassName('contents')[0];        
    page.contentsComposer = page.contents.getElementsByClassName('contents-navComposer')[0];
    page.contentsAccessKey = page.contents.getElementsByClassName('contents-navAccessKey')[0];
    page.contentsUpDownload = page.contents.getElementsByClassName('contents-navUpDownload')[0];

    await _renderComposer();
    _renderAccessKey();
    _renderUpDownload();
  }
  
  async function _renderComposer() {
    settings.currentItem = null;
    
    settings.tiny = {};
    settings.tiny.navComposer = new MyTinyMCE({
      id: 'contenteditor-navComposer', 
      selector: '#contenteditor-navComposer', 
      changeCallback: _handleEditorChange,
      initializationParams: {wiris: true},
      height: 450
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
    
    page.elemEditingContent = page.contentsComposer.getElementsByClassName('content')[0];
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
    
    if (settings.presetText) {
      await _addComment(settings.presetText);
      await _clearPresetText();
    }
  }
  
  function _renderAccessKey() {
    page.elemAccessKey = page.contentsAccessKey.getElementsByClassName('text-accesskey')[0];
    page.contentsAccessKey.getElementsByClassName('button-accesskey')[0].addEventListener('click', (e) => { _handleAccessKeyCopy(e); });

    page.elemAccessKey.value = settings.accessKey;
  }
  
  function _renderUpDownload() {}
    
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
    
    if (contentsId == 'navComposer') await _updateCommentInfo();
    if (contentsId == 'navProfile') await settings.profile.reload();
    
    _setNavOptions();
  }
  
  async function _updateCommentInfo(scrollTo) {
    if ( !(await _getCommentData(false)) ) return;
    
    _deselectCurrentItem();
    _loadCommentInfo(settings.commentData);
    _loadTagSelect(settings.commentData);
    _updateCommentItems();
    
    if (settings.currentItem != null) {
      _selectItem(settings.currentItem);
      if (scrollTo) {
        console.log('scrollTo');
        settings.currentItem.scrollIntoView();
      }
    }
  }
  
  function _loadCommentInfo(commentData) {
    var elemItems = page.elemSidebar.getElementsByClassName('sidebar-items')[0];
    var currentId = null;
    var selectedItem = null;
    
    if (settings.currentItem) currentId = settings.currentItem.itemData.commentid;
    
    UtilityKTS.removeChildren(elemItems);
    for (var i = 0; i < commentData.length; i++) {
      var item = commentData[i];
      var elemSingleItem = CreateElement.createDiv(null, 'sidebar-singleitem', _makePlaintext(item.comment, false));
      elemSingleItem.addEventListener('click', (e) => { _handleSidebarSelection(e); });
      elemSingleItem.itemData = item;

      if (currentId && currentId == item.commentid) selectedItem = elemSingleItem;
      
      elemItems.appendChild(elemSingleItem);      
    }
    
    if (selectedItem) {
      _deselectCurrentItem();
      _selectItem(selectedItem);
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
    var filteredCommentList = settings.commentData;
    
    var searchVal = page.elemSidebarSearch.value.toLowerCase();
    var tagVal = page.elemSidebarTag.value;
    var useSearchVal = searchVal != '';
    var useTagVal = tagVal != '[any]';
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
  
  function _selectItem(elemItem) {
    if (settings.currentItem && settings.currentItem == elemItem) return;
    _deselectCurrentItem();
    
    settings.currentItem = elemItem;
    UtilityKTS.setClass(settings.currentItem, 'selected-item', true);
    
    _loadCommentItem(settings.currentItem.itemData);
    _setNavOptions();
    
  }
  
  function _deselectCurrentItem() {
    if (settings.currentItem) UtilityKTS.setClass(settings.currentItem, 'selected-item', false);
    _clearCommentItem();
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);

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
    page.elemTags.value = itemData.tags;
    page.elemHoverText.value = itemData.hovertext;
    settings.tiny.navComposer.setContent(itemData.comment);
    UtilityKTS.setClass(page.elemEditingContent, 'hide-me', false);
  }
  
  function _clearCommentItem() {
    page.elemTags.value = '';
    page.elemHoverText.value = '';
    settings.tiny.navComposer.setContent('');
    UtilityKTS.setClass(page.elemEditingContent, 'hide-me', true);
  }
  
  async function _saveComment(itemData) {
    _setNavbarMessage('saving comment...');
    
    var success = await settings.dbCommentBuddy.saveComment(itemData);
    
    _setNavbarMessage(success ? '' : 'failed to save comment');
    if (success) {
      _setDirtyBit(false);
      _updateCommentInfo();
    }
  }
  
  async function _deleteComment(itemData) {
    _setNavbarMessage('deleting comment...');
    var success = await settings.dbCommentBuddy.deleteComment(itemData);
    
    _setNavbarMessage(success ? '' : 'failed to save comment');
    if (success) {
      settings.currentItem = null;
      _setDirtyBit(false);
      _updateCommentInfo();
    }
  }
  
  async function _addDefaultComment() {
    _setNavbarMessage('adding new comment...');
    
    var result = await settings.dbCommentBuddy.addDefaultComment();
    
    _setNavbarMessage(result.success ? '' : 'failed to add new comment');
    if (result.success) {
      var elemDummy = CreateElement.createDiv(null, null);
      elemDummy.itemData = result.data;
      settings.currentItem = elemDummy;
      _setDirtyBit(false);
      _updateCommentInfo();
    }
  }
  
  async function _addComment(commentText) {
    _setNavbarMessage('adding new comment...');
    
    var result = await settings.dbCommentBuddy.addComment(commentText);
    
    _setNavbarMessage(result.success ? '' : 'failed to add new comment');
    if (result.success) {
      var elemDummy = CreateElement.createDiv(null, null);
      elemDummy.itemData = result.data;
      settings.currentItem = elemDummy;
      _setDirtyBit(false);
      _updateCommentInfo(true);
    }
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
      "navUpDownload": function() { _showContents('navUpDownload'); },
      "navAccessKey": function() { _showContents('navAccessKey'); },
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
    if (settings.currentNavOption == 'navComposer') {
      if (settings.currentItem == null) return;
      var itemData = settings.currentItem.itemData;
      itemData.tags = page.elemTags.value;
      itemData.hovertext = page.elemHoverText.value;
      itemData.comment = settings.tiny.navComposer.getContent();
      if ( !(await _saveComment(itemData)) ) return;
      
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.save();
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
    if (settings.dirtyBit.navComposer && _confirmSaveChanges()) _handleSave();

    _setDirtyBit(false);
    _updateCommentItems();
  }
  
  async function _handleAddComment(e) {
    await _addDefaultComment();
  }
  
  async function _handleDeleteComment(e) {
    if (settings.currentItem == null) return;
    
    var msg = 'This comment will be permanently deleted.';
    msg += '\nContinue with deleting?';
    if (!confirm(msg)) return;
    
    await _deleteComment(settings.currentItem.itemData);
  }
  
  function _handleSidebarSelection(e) {
    if (settings.dirtyBit.navComposer && _confirmSaveChanges()) _handleSave();

    _setDirtyBit(false);
    _selectItem(e.target);
  }
  
  function _handleOpenSource() {
    settings.dbCommentBuddy.openSource();
  }
  
  function _handleAccessKeyCopy(e) {
    _copyToClipboard(page.elemAccessKey.value);
    _setNavbarMessage('access key copied');
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------  
  async function _getAccessKey() {
    page.notice.setNotice('loading access key...', true);
    
    settings.accessKey = null;
    var result = await settings.dbCommentBuddy.getAccessKey();
    if (result.success) {
      settings.accessKey = result.data.accesskey;
      page.notice.setNotice('');
      
    } else {
      page.notice.setNotice('failed to load access key');
    }
    
    return result.success;
  }

  async function _getCommentData(showNotice) {
    if (showNotice) page.notice.setNotice('loading comments...', true);
    
    settings.commentData = null;
    var result = await settings.dbCommentBuddy.getCommentData();
    if (result.success) {
      settings.commentData = result.data;
      settings.commentData = settings.commentData.sort(function(a,b) {
        var al = _makePlaintext(a.comment.toLowerCase(), true);
        var bl = _makePlaintext(b.comment.toLowerCase(), true);
        return al.localeCompare(bl);
      });
      
      if (showNotice) page.notice.setNotice('');
      
    } else {
      page.notice.setNotice('failed to load comments');
    }
    
    return result.success;
  }

  async function _getPresetText() {
    var presetText = null;
    var result = await settings.dbCommentBuddy.getPresetComment();
    if (result.success && result.data.length > 0) {
      presetText = result.data[0].comment;
    }
    
    return presetText;
  }
  
  async function _clearPresetText() {
    var result = await settings.dbCommentBuddy.clearPresetComment();
    return result.success;
  }

  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
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
  
  function _makePlaintext(richtext, extraChecks) {
    var plaintext = richtext;

    plaintext = plaintext.replace(/<p>(.*?)<\/p>/g, '$1\n');    // replace <p> elements with \n
    plaintext = plaintext.replace(/<li>(.*?)<\/li>/g, '• $1');  // replace <li> elements with bulleted items
    plaintext = plaintext.replace(/<a href="(.*?)"(.*?)>(.*?)<\/a>/g, '$3 (see $1)'); // replace link tag
    
    plaintext = plaintext.replace(/<br \/>/g, '\n');            // replace <br /> with \n
    plaintext = plaintext.replace(/<.*?\>(.*?)/g, '$1');        // strip all other angle bracket tags
    plaintext = plaintext.replace('&nbsp;', ' ');
    
    while (plaintext.includes('\n\n')) plaintext = plaintext.replace('\n\n', '\n'); 
    if (extraChecks) {
      while (plaintext.includes('\n')) plaintext = plaintext.replace('\n', ''); 
      plaintext = plaintext.replace('•', '');
      plaintext = plaintext.trim();
    }
    
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
  
  function _confirmSaveChanges() {
    var result = confirm('Save the current changes to this comment?');

    return result;
  }
    
  //-----------------------------------------------------------------------------------
  // init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();