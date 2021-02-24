//-----------------------------------------------------------------------
// FAQ composer
//-----------------------------------------------------------------------
// TODO: think through dirty bit
// TODO: add DB
// TODO: support multiple projects for an instructor?
// TODO: add root node?
// TODO: enable/disable save and reload based on context
// TODO: trim long node labels (add ellipses)
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',
    treeContainerClass: 'hierarchy-container',
    helpURL: '/faq-composer/help',
    logoutURL: '/usermanagement/logout',
    currentNodeInfo: null
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
    var containers = page.contents.getElementsByClassName('contents-container');
    for (var i = 0; i < containers.length; i++) {
      var hide = !containers[i].classList.contains('contents-' + contentsId);
      UtilityKTS.setClass(containers[i], settings.hideClass, hide);
    }
  }
  
  function _loadFAQItem(params) {
    var editorElements = _getEditorElements();
    
    var markdown = params.isLeaf ? params.markdown : '';
    var rendered = MarkdownToHTML.convert(_sanitizeText(markdown));
    
    editorElements.markdownLabel.value = params.label;
    editorElements.markdownContent.value = markdown;
    editorElements.renderedLabel.innerHTML = params.label;
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
     label: nodeInfo.name,
     isLeaf: nodeInfo.children.length == 0,
     markdown: nodeInfo.markdown
   });
  }
  
  function _handleMarkdownChange(e) {
    var target = e.target;
    var targetClassList = target.classList;
    
    var updatedNodeInfo = {id: settings.currentNodeInfo.id};
    if (targetClassList.contains('navEditor-itemlabel')) {
      updatedNodeInfo.name = target.value;
      
    } else if (targetClassList.contains('navEditor-itemcontent')) {
      updatedNodeInfo.markdown = target.value;
    }

    settings.editorTree.updateNode(updatedNodeInfo);  
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

    dbResult.faqInfo = dummyData;
    //------------------------------------------------------------------------------
    
    if (dbResult.success) {
      settings.faqInfo = dbResult.faqInfo;
    } else {
      console.log('failed to get FAQ info');
    }
    
    return dbResult.success;
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
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();