//-----------------------------------------------------------------------
// FAQ composer
//-----------------------------------------------------------------------
// TODO: think through dirty bit
// TODO: add DB
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
    labelTruncateLimit: 60
  };
  
  const dummyData = [
      {
        name: 'General FAQs', id: 1,
        children: [
          { name: 'What I expect from you in this course', id: 2, markdown: 'some text' },
          { name: 'What you can expect from me in this course', id: 3, markdown: 'some more text' }
        ]
      },
      
      {
        name: 'AP Computer Science Principles (Sem 1)', id: 4,
        children: [
          { name: 'What are Michigan Virtual\'s policies for Advanced Placement courses?', id: 5, markdown: '**hello**' },
          { name: 'What are the start and end dates for the term?', id: 6, markdown: '*goodbye*' }
        ]
      },
      
      {
        name: 'Basic Web Design: HTML & CSS', id: 7,
        children: [
          { name: 'Can I redo assignments?', id: 8, markdown: '[google](https://www.google.com)' },
          { name: 'What\'s the best way to learn programming?', id: 9, markdown: 'some random text' }
        ]
      }
    ];
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.navbar = page.body.getElementsByClassName('navbar')[0];
    
    page.contents = page.body.getElementsByClassName('contents')[0];    
    page.contentsEditor = page.contents.getElementsByClassName('contents-navEditor')[0];
    page.contentsMapper = page.contents.getElementsByClassName('contents-navMapper')[0];
    page.contentsProfile = page.contents.getElementsByClassName('contents-navProfile')[0];

    if ( !(await _getUserInfo()) ) return;
    if ( !(await _getFAQInfo()) ) return;

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
    _hideNavOption('navSave', true);
    _hideNavOption('navReload', true);
    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);
    
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
    
    if (contentsId == 'navEditor' || contentsId == 'navMapper') {
      _hideNavOption('navSave', false);
      _hideNavOption('navReload', false);
    }
  }
  
  function _loadFAQItem(params) {
    var editorElements = _getEditorElements();
    
    var label = params.tmContent.label;
    var markdown = params.isLeaf ? params.tmContent.markdown : '';
    var rendered = MarkdownToHTML.convert(_sanitizeText(markdown));
    
    editorElements.markdownLabel.value = label;
    editorElements.markdownContent.value = markdown;
    editorElements.renderedLabel.innerHTML = label;
    editorElements.renderedContent.innerHTML = rendered;
    
    _setVisible(editorElements.markdownContent, params.isLeaf);
    _setVisible(editorElements.renderedLabel, params.isLeaf);
    _setVisible(editorElements.renderedContent, params.isLeaf);
    
    settings.currentNodeInfo = params;
  }
  
  function _doHelp() {
    window.open(settings.helpURL, '_blank');
  }
  
  function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
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
   _loadFAQItem({
     id: nodeInfo.id,
     isLeaf: nodeInfo.children.length == 0,
     tmContent: nodeInfo.tmContent
   });
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
    _enableNavOption('navSave', true);
    _enableNavOption('navReload', true);
    
  }
  
  function _handleSave(e) {
    console.log('_handleSave');
  }
  
  async function _handleReload(e) {
    if ( !(await _getFAQInfo()) ) return;

    settings.editorTree.update(settings.faqInfo);
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
      console.log('failed to get user info');
    }
    
    return dbResult.success;
  }  
  
  async function _getFAQInfo() {
    settings.faqInfo = null
    
    //---- temporary, retrieve from DB -------------------------------------------
    var dbResult = {success: true};

    dbResult.faqInfo = _debugProcessData(dummyData);
    //------------------------------------------------------------------------------
    
    if (dbResult.success) {
      settings.faqInfo = dbResult.faqInfo;
    } else {
      console.log('failed to get FAQ info');
    }
    
    return dbResult.success;
  }  
  
  function _debugProcessData(data) {
    var newData = [];
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var newItem = {
        id: item.id,
        name: _truncateNodeName(item.name),
        tmContent: {
          label: item.name,
          markdown: item.markdown
        }
      }

      if (item.hasOwnProperty('children') && item.children.length > 0) {
        newItem.children = _debugProcessData(item.children);
      }
      
      newData.push(newItem);
    }
    
    return newData;
  }
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------
  function _setVisible(elem, makeVisible) {
    elem.style.visibility = makeVisible ? 'visible' : 'hidden';
  }
  
  function _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
    //cleaned = cleaned.replace(/&(.*?);/g, '$1');  // replace ampersand characters
    
    return cleaned;
  }  

  function _getEditorElements() {
    var markdownContainer = page.contentsEditor.getElementsByClassName('navEditor-item-edit')[0];
    var renderedContainer = page.contentsEditor.getElementsByClassName('navEditor-item-rendered')[0];
    
    return {
      "markdownContainer": markdownContainer,
      "renderedContainer": renderedContainer,
      
      "markdownLabel": markdownContainer.getElementsByClassName('navEditor-itemlabel')[0],
      "markdownContent":  markdownContainer.getElementsByClassName('navEditor-markdown-content')[0],
      "renderedLabel": renderedContainer.getElementsByClassName('navEditor-itemlabel')[0],
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
  
  function _hideNavOption(navOption, hide) {
    document.getElementById(navOption).style.visibility = hide ? 'hidden': 'visible';    
  }

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();