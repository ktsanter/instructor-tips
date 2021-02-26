//-----------------------------------------------------------------------
// FAQ composer
//-----------------------------------------------------------------------
// TODO: styling for editor
// TODO: add DB for mapper and profile
// TODO: finish mapper
// TODO: finish profile
// TODO: finish help
// TODO: save and reload enabling should be different for mapper and editor
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',
    treeContainerClass: 'hierarchy-container',
    helpURL: '/faq-composer/help',
    logoutURL: '/usermanagement/logout',
    currentNodeInfo: null,
    labelTruncateLimit: 50,
    dirtyBit: {
      navEditor: false,
      navMapper: false,
      navProfile: false
    },
    treeProcessingReplacement: {
      pack: [
        {seek: /"/g, replacement: '&quot;'},
        {seek: /'/g, replacement: '&apos;'},
        {seek: '\n', replacement: '&newline;'}
      ],
      unpack: [
        {seek: /&quot;/g, replacement: '"'},
        {seek: /&apos;/g, replacement: '\''},
        {seek: /&newline;/g, replacement: '\n'}
      ] 
    }
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);

    page.navbar = page.body.getElementsByClassName('navbar')[0];
    UtilityKTS.setClass(page.navbar, 'hide-me', true);
    
    page.contents = page.body.getElementsByClassName('contents')[0];    
    page.contentsEditor = page.contents.getElementsByClassName('contents-navEditor')[0];
    page.contentsMapper = page.contents.getElementsByClassName('contents-navMapper')[0];
    page.contentsProfile = page.contents.getElementsByClassName('contents-navProfile')[0];

    if ( !(await _getUserInfo()) ) return;
    if ( !(await _getFAQInfo()) ) return;
    
    page.notice.setNotice('');
    UtilityKTS.setClass(page.navbar, 'hide-me', false);

    _attachNavbarHandlers();
    _renderContents();
    
    var profileIcon = page.navbar.getElementsByClassName('icon-profile');
    if (profileIcon.length > 0) profileIcon[0].title = settings.userInfo.userName;
    
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
	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function _renderContents() {
    _renderEditor();
    _renderMapper();
    _renderProfile();
  }
  
  function _renderEditor() {
    var treeContainer = page.contentsEditor.getElementsByClassName(settings.treeContainerClass)[0];

    settings.editorTree = new TreeManager({
      appendTo: treeContainer,
      selectCallback: _handleTreeSelect,
      changeCallback: _handleTreeChange,
      useContextMenu: true
    });
    settings.editorTree.render(settings.faqInfo);
    
    var editorElements = _getEditorElements();
    editorElements.markdownLabel.addEventListener('input', (e) => {_handleMarkdownChange(e);});
    editorElements.markdownContent.addEventListener('input', (e) => {_handleMarkdownChange(e);});
  }
  
  function _renderMapper() {
  }
  
  function _renderProfile() {
    page.contentsProfile.getElementsByClassName('user-name')[0].innerHTML = settings.userInfo.userName;
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
        
    _setNavOptions();
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    var enable = settings.dirtyBit[settings.currentNavOption]
        
    _enableNavOption('navSave', enable);
    _enableNavOption('navReload', enable);
  }
  
  function _loadFAQItem(params) {
    var editorElements = _getEditorElements();
    
    if (params) {
      var label = params.tmContent.label;
      var markdown = params.isLeaf ? params.tmContent.markdown : '';
      if (!markdown) markdown = '';
      var rendered = MarkdownToHTML.convert(_sanitizeText(markdown));
      console.log(label);
      console.log(rendered);
      
      editorElements.markdownLabel.value = label;
      editorElements.markdownContent.value = markdown;
      editorElements.renderedContent.value = rendered;
      
      _setVisible(editorElements.markdownLabel, true);
      _setVisible(editorElements.markdownContent, params.isLeaf);
      _setVisible(editorElements.renderedContent, params.isLeaf);
    
    } else {
      _setVisible(editorElements.markdownLabel, false);
      _setVisible(editorElements.markdownContent, false);
      _setVisible(editorElements.renderedContent, false);      
    }
    settings.currentNodeInfo = params;
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
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _navDispatch(e) {    
    var dispatchMap = {
      "navEditor": function() { _showContents('navEditor'); },
      "navMapper": function() { _showContents('navMapper'); },
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e);}
    }
    
    dispatchMap[e.target.id]();
  }
  
  function _handleTreeSelect(nodeInfo) {
    if (nodeInfo) {
       _loadFAQItem({
         id: nodeInfo.id,
         isLeaf: nodeInfo.children.length == 0,
         tmContent: nodeInfo.tmContent
       });
    } else {
      _loadFAQItem();
    }
  }
  
  function _handleTreeChange() {
    _setDirtyBit(true);
  }
  
  function _handleMarkdownChange(e) {
    var target = e.target;
    var targetClassList = target.classList;

    var editLabel = page.contentsEditor.getElementsByClassName('navEditor-itemlabel')[0].value;
    var editMarkdown = page.contentsEditor.getElementsByClassName('navEditor-itemcontent')[0].value;
    
    var updatedNodeInfo = {
      id: settings.currentNodeInfo.id,
      name: _truncateNodeName(editLabel),
      tmContent: {
        label: editLabel,
        markdown: editMarkdown
      }
    };

    settings.editorTree.updateNode(updatedNodeInfo);
    _handleTreeChange();
  }
  
  async function _handleSave(e) {
    if ( !(await _saveFAQInfo()) ) return;    
    await _handleReload();
    
    _setDirtyBit(false);
  }
  
  async function _handleReload(e) {
    if ( !(await _getFAQInfo()) ) return;

    page.notice.setNotice('');
    settings.editorTree.update(settings.faqInfo);
    _setDirtyBit(false);
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------
  async function _getUserInfo() {
    settings.userInfo = null;
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'getuser');
    
    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
    } else {
      page.notice.setNotice('failed to get user info');
    }
    
    return dbResult.success;
  }  
  
  async function _getFAQInfo() {
    settings.faqInfo = null
    
    dbResult = await SQLDBInterface.doGetQuery('faqcomposer/query', 'hierarchy');
    
    if (dbResult.success) {
      var hierarchy = dbResult.data.hierarchy;

      if (!hierarchy) {
        hierarchy = _defaultTreeData();

      } else {
        hierarchy = JSON.parse(hierarchy);
        hierarchy = _processTreeData(hierarchy, settings.treeProcessingReplacement.unpack);
        if (hierarchy.length == 0) hierarchy = _defaultTreeData();
      }

      settings.faqInfo = hierarchy;

    } else {
      page.notice.setNotice('failed to get FAQ info');
    }
    
    return dbResult.success;
  }  
  
  async function _saveFAQInfo() {
    var success = false;
    
    var treeData = null;
    if (settings.currentNavOption == 'navEditor') {
      treeData = settings.editorTree.getAsJSON();
    }
    
    if (!treeData) {
      page.notice.setNotice('failed to retrieve hierarchy data');
      return success;
    }
    
    var hierarchyData = _processTreeData(JSON.parse(treeData), settings.treeProcessingReplacement.pack);
    
    var postData = {
      hierarchy: JSON.stringify(hierarchyData)
    };
    var dbResult = await SQLDBInterface.doPostQuery('faqcomposer/update', 'hierarchy', postData);
    success = dbResult.success;
    if (!success) page.notice.setNotice('failed to save data');
    
    return success;
  }
  
  function _processTreeData(origTree, replacementGroup) {
    var processed = [];

    for (var i = 0; i < origTree.length; i++) {
      processed.push(_processTreeObject(origTree[i], replacementGroup));
    }

    return processed;
  }
  
  function _processTreeObject(origObj, replacementGroup) {
    var processed = {};
    
    for (var key in origObj) {
      var value = origObj[key];
      if (typeof value == 'object') {
        value = _processTreeObject(value, replacementGroup);
        
      } else if (typeof value == 'string') {
        value = _replaceGroup(value, replacementGroup);
      }
      
      processed[key] = value;
    }
    
    return processed;
  }
  
  function _defaultTreeData() {
    return [{
      id: 1,
      name: 'default item',
      tmContent: {
        label: 'default item',
        markdown: ''
      }
    }];
  }
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------
  function _setVisible(elem, makeVisible) {
    elem.style.visibility = makeVisible ? 'visible' : 'hidden';
  }
  
  function _sanitizeText(str) {
    if (!str) return '';
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
    
    return cleaned;
  }
  
  function _replaceGroup(strOrig, replacementGroup) {
    var str = strOrig;
    
    for (var i = 0; i < replacementGroup.length; i++) {
      var replaceDef = replacementGroup[i];
      if (typeof replaceDef.seek == 'object') {
        str = str.replace(replaceDef.seek, replaceDef.replacement);
      } else {
        str = str.replaceAll(replaceDef.seek, replaceDef.replacement);
      }
    }
    
    return str;
  }

  function _getEditorElements() {
    var markdownContainer = page.contentsEditor.getElementsByClassName('navEditor-item-edit')[0];
    var renderedContainer = page.contentsEditor.getElementsByClassName('navEditor-item-rendered')[0];
    
    console.log(markdownContainer);
    
    return {
      "markdownContainer": markdownContainer,
      "renderedContainer": renderedContainer,
      
      "markdownLabel": markdownContainer.getElementsByClassName('navEditor-itemlabel')[0],
      "markdownContent":  markdownContainer.getElementsByClassName('navEditor-markdown-content')[0],
      "renderedContent": renderedContainer.getElementsByClassName('navEditor-rendered-content')[0]
    }
  }
  
  function _truncateNodeName(origName) {
    var name = origName;

    if (name.length > settings.labelTruncateLimit) name = name.slice(0, settings.labelTruncateLimit) + '...';
    return name;
  }
  
  function _enableNavOption(navOption, enable) {
    document.getElementById(navOption).disabled = !enable;    
  }

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();