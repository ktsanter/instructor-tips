//-----------------------------------------------------------------------
// FAQ composer
//-----------------------------------------------------------------------
// TODO: finish help
// TODO: add Rename option to mapper ?
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',
    treeContainerClass: 'hierarchy-container',

    baseShareURL: '/faq-composer/faq',
    helpURL: '/faq-composer/help',
    logoutURL: '/usermanagement/logout/faq-composer',
    
    currentNodeInfo: null,
    labelTruncateLimit: 50,
    dirtyBit: {
      navEditor: false,
      navMapper: false,
      navProfile: false
    },
    
    treeProcessingReplacement: {  // is this needed now?
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
	async function init (sodium) {    
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

    if ( !(await _getFAQInfo()) ) return;
    
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
    
    page.notice.setNotice('');
    UtilityKTS.setClass(page.navbar, 'hide-me', false);
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
  async function _renderContents() {
    settings.contentEditorId = {};
    
    page.tiny = new MyTinyMCE({id: 'contenteditor-navEditor', selector: '#contenteditor-navEditor', changeCallback: _handleEditorChange});
    await page.tiny.init();
    
    _renderEditor();
    _renderMapper();    
  }
    
  function _renderEditor() {
    var treeContainer = page.contentsEditor.getElementsByClassName(settings.treeContainerClass)[0];

    settings.contentEditorId.navEditor = 'contenteditor-navEditor';

    settings.editorTree = new TreeManager({
      id: 'navEditorTreeControl',
      appendTo: treeContainer,
      selectCallback: _handleTreeSelect,
      changeCallback: _handleTreeChange,
      useContextMenu: true,
      allowMultiSelect: false,
      allowDragAndDrop: true,
      autoSelect: true
    });
    
    settings.editorTree.render(settings.faqInfo);    
    
    page.contentsEditor.getElementsByClassName('navEditor-itemlabel')[0].addEventListener('input', (e) => {_handleEditorChange(e);});    
    page.contentsEditor.getElementsByClassName('editor-plusicon')[0].addEventListener('click', (e) => { _handleAddItemClick(e); });
  }
  
  function _renderMapper() {
    var treeContainer = page.contentsMapper.getElementsByClassName(settings.treeContainerClass)[0];

    settings.mapperTree = new TreeManager({
      id: 'navMapperTreeControl',
      appendTo: treeContainer,
      selectCallback: _handleTreeSelect,
      changeCallback: _handleTreeChange,
      useContextMenu: false,
      allowMultiSelect: true,
      allowDragAndDrop: false,
      autoSelect: false
    });
    
    settings.mapperTree.render(settings.faqInfo);       

    page.contentsMapper.getElementsByClassName('project-selection')[0].addEventListener('change', (e) => {_handleProjectSelect(e);});
    
    page.buttonLink = page.contentsMapper.getElementsByClassName('button-link')[0]
    page.buttonEmbed = page.contentsMapper.getElementsByClassName('button-embed')[0]
    page.buttonLink.addEventListener('click', (e) => {_handleProjectShareLink(e);});
    page.buttonEmbed.addEventListener('click', (e) => {_handleProjectShareEmbed(e);});
    
    settings.mapperAccordion = new FAQAccordion({
      hideClass: 'hide-me',
      baseId: 'mapperAccordion',
      allowReordering: true,
      callbackOnReordering: _handleAccordionReorder
    });
    var container = page.contentsMapper.getElementsByClassName('accordion-container')[0];
    container.appendChild(settings.mapperAccordion.render([]));
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
    
    if (settings.editorTree) settings.editorTree.forceContextMenuClose();
    
    if (contentsId == 'navMapper') _showMapper();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
  
  async function _showMapper() {
    if ( !(await _getProjectData()) ) return;
    
    if (settings.mapperTree) settings.mapperTree.update(settings.faqInfo); 
    _loadProjectList(settings.projectData.projectlist);
  }
  
  function _setNavOptions() {
    var opt = settings.currentNavOption;
    
    if (opt == 'navEditor') {
      var enable = settings.dirtyBit[settings.currentNavOption];
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
      _enableNavOption('navProjectAdd', false);
      _enableNavOption('navProjectRemove', false);
      
    } else if (opt == 'navMapper') {
      enable = settings.currentProjectId;
      _enableNavOption('navSave', false);
      _enableNavOption('navReload', false);
      _enableNavOption('navProjectAdd', true, true);
      _enableNavOption('navProjectRemove', true, enable);
      page.buttonLink.disabled = !enable;
      page.buttonEmbed.disabled = !enable;
      
    } else if (opt == 'navProfile') {
      var enable = settings.profile.isDirty();
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
      _enableNavOption('navProjectAdd', false);
      _enableNavOption('navProjectRemove', false);
    }
  }
  
  function _loadFAQItem(params) {
    var labelAndEditorContainer = page.contentsEditor.getElementsByClassName('navEditor-item-edit')[0];
    var elemLabel = labelAndEditorContainer.getElementsByClassName('navEditor-itemlabel')[0];
    var editorContainer = labelAndEditorContainer.getElementsByClassName('contenteditor-container-navEditor')[0];

    if (params) {
      var label = params.tmContent.label;
      var markdown = params.isLeaf ? params.tmContent.markdown : '';

      elemLabel.value = label;
      page.tiny.setContent(markdown);
      
      UtilityKTS.setClass(labelAndEditorContainer, 'hide-me', false);
      UtilityKTS.setClass(editorContainer, 'hide-me', !params.isLeaf);
      
    } else {
      UtilityKTS.setClass(labelAndEditorContainer, 'hide-me', true);
      UtilityKTS.setClass(editorContainer, 'hide-me', true);
    }

    settings.currentNodeInfo = params;
  }
  
  function _loadProjectList(projectList) {
    var elemProjectSelect = page.contentsMapper.getElementsByClassName('project-selection')[0];
    UtilityKTS.removeChildren(elemProjectSelect);

    elemProjectSelect.disabled = false;
          
    if (projectList.length == 0) {
      elemProjectSelect.disabled = true;
    } else if (!settings.currentProjectId) {
      var elemOption = CreateElement.createOption(null, null, 'default', 'choose...');
      elemProjectSelect.appendChild(elemOption);
      elemOption.selected = true;
    }
    
    for (var i = 0; i < projectList.length; i++) {
      var project = projectList[i];
      elemOption = CreateElement.createOption(null, null, project.projectid, project.projectname);
      elemProjectSelect.appendChild(elemOption);
      if (settings.currentProjectId && settings.currentProjectId == project.projectid) elemOption.selected = true;
    }
    
    _loadProjectInfo(settings.currentProjectId);
  }
  
  function _loadProjectInfo(projectId) {
    settings.currentProjectId = projectId;
   
    if (projectId) {
      var projectInfo = settings.projectData[projectId];
      settings.mapperTree.setTreeState({
        selectedList: projectInfo.orderedItems,
        openedList: projectInfo.openedItems
      });
      _loadProjectFAQs(projectInfo.orderedItems);
      
    } else {
      settings.mapperTree.setTreeState({
        selectedList: [],
        openedList: null
      });
      _loadProjectFAQs([]);
    }
    
    _setNavOptions();
  }
  
  function _updateProjectFAQSelections() {
    if (!settings.currentProjectId) return;
    
    var currentOrder = settings.projectData[settings.currentProjectId].orderedItems;
    var selectedItems = settings.mapperTree.getTreeState().selectedList;

    var currentSet = new Set(currentOrder);
    var selectedSet = new Set(selectedItems);
    
    var removedItems = Array.from(UtilityKTS.setDifference(currentSet, selectedSet));
    var addedItems = Array.from(UtilityKTS.setDifference(selectedSet, currentSet));
    
    var newOrder = currentOrder;
    for (var i = 0; i < removedItems.length; i++) {
      var index = newOrder.indexOf(removedItems[i]);
      if (index > -1) newOrder.splice(index, 1);
    }
    
    newOrder = newOrder.concat(addedItems);
    settings.projectData[settings.currentProjectId].orderedItems = newOrder;
  }
  
  function _loadProjectFAQs(faqList) {
    var faqData = [];
    
    for (var i = 0; i < faqList.length; i++) {
      var faq = faqList[i];
      var node = settings.mapperTree.getNode(faq);
      if (node && node.children.length == 0) {
        faqData.push({id: node.id, label: node.tmContent.label, content: node.tmContent.markdown});
      }
    }
    
    settings.mapperAccordion.update(faqData);
  }
  
  function _renderMapperFAQ(content) {
    return CreateElement.createDiv(null, null, content.label);
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
    var dispatchTarget = e.target.id;
    if (dispatchTarget == 'navProfilePic') dispatchTarget = 'navProfile';    
    if (dispatchTarget == settings.currentNavOption) return;
    
    var dispatchMap = {
      "navEditor": function() { _showContents('navEditor'); },
      "navMapper": function() { _showContents('navMapper'); },
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e, false);},
      "navProjectAdd": function() { _handleProjectAdd(e);},
      "navProjectRemove": function() { _handleProjectRemove(e);}
    }
    
    dispatchMap[dispatchTarget]();
  }
  
  async function _handleTreeSelect(nodeInfo) {
    if (settings.currentNavOption == 'navEditor') {
      if (nodeInfo) {
         _loadFAQItem({
           id: nodeInfo.id,
           isLeaf: nodeInfo.children.length == 0,
           tmContent: nodeInfo.tmContent
         });
      } else {
        _loadFAQItem();
      }
      
    } else if (settings.currentNavOption == 'navMapper') {
      if (!settings.currentProjectId) return;
      
      _updateProjectFAQSelections();
      var result = await _updateProjectInDB(settings.currentProjectId);
      if (!result.success) return;
      _loadProjectInfo(settings.currentProjectId);
    }
  }
  
  function _handleTreeChange() {
    _setDirtyBit(true);
  }
  
  function _handleEditorChange(e) {
    var editLabel = page.contentsEditor.getElementsByClassName('navEditor-itemlabel')[0].value;
    var editorContent = page.tiny.getContent();

    var updatedNodeInfo = {
      id: settings.currentNodeInfo.id,
      name: _truncateNodeName(editLabel),
      tmContent: {
        label: editLabel,
        markdown: editorContent
      }
    };

    settings.editorTree.updateNode(updatedNodeInfo, false);
    _handleTreeChange();
  }  
  
  async function _handleAddItemClick(e) {
    settings.editorTree.appendDefaultNode();
  }
  
  async function _handleSave(e) {
    if (settings.currentNavOption == 'navEditor') {
      if ( !(await _saveFAQInfo()) ) return;
      await _handleReload(e, true);
      
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.save();
    }
    
    _setDirtyBit(false);
  }
  
  async function _handleReload(e, skipConfirm) {
    if (!skipConfirm) {
      var msg = 'Any changes will be lost.\nChoose "OK" to continue with reloading';
      if (!confirm(msg)) return;
    }
    
    if (settings.currentNavOption == 'navEditor') {
      if ( !(await _getFAQInfo()) ) return;
      settings.editorTree.update(settings.faqInfo);
      
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
    }
    
    _setDirtyBit(false);
  }
  
  function _handleProjectSelect(e) {
    var projectId = e.target[e.target.selectedIndex].value;
    
    _removeDefaultOption(e.target);    
    _loadProjectInfo(projectId); 
  }
  
  async function _handleProjectAdd(e) {
    var msg = 'Enter the name of the new project';
    var projectName = prompt(msg);
    if (!projectName) return;
    
    if (!_validateProjectName(projectName)) {
      var msg = "The project name\n" + projectName + '\nis not valid.';
      msg += '\n\nIt must have length between 1 and 200';
      msg += ' and include only letters, digits, spaces, parentheses and commas.';
      alert(msg);
      return;
    }
    
    var result = await _addProjectToDB(projectName);
    if (!result.success) return;
    
    settings.currentProjectId = result.data.faqsetid;
    await _showMapper();
  }
  
  async function _handleProjectRemove(e) {
    var projectId = settings.currentProjectId;
    if (!projectId) return;

    var msg = 'This project will be deleted:';
    msg += '\n' + settings.projectData[projectId].projectname;
    msg += '\n\nThis action cannot be undone.  Continue with deletion?';
    
    if (!confirm(msg)) return;

    var result = await _deleteProjectFromDB(projectId);
    if (!result.success) return;
    
    settings.currentProjectId = null;
    await _showMapper();
  }
  
  function _handleProjectShareLink(e) {
    var urlShare = _makeShareURL();
    _copyToClipboard(urlShare);
    alert('link copied to clipboard');
  }
  
  function _handleProjectShareEmbed(e) {
    // add a script which adds the Bootstrap CSS <link> - workaround for link not in <head>
    var elemCSSScript = document.createElement('script');
    elemCSSScript.text = 
      "fileref = document.createElement('link');" +
      "fileref.setAttribute('href', 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/css/bootstrap.min.css');" +
      "fileref.setAttribute('rel', 'stylesheet');" +
      "fileref.setAttribute('integrity', 'sha384-BmbxuPwQa2lc/FVzBcNJ7UAyJxM6wuqIj61tLrc4wSX0szH/Ev+nYRRuWlolflfl');" +
      "fileref.setAttribute('crossorigin', 'anonymous');" +
      "document.getElementsByTagName('head')[0].appendChild(fileref);";
    
    // add the Bootstrap JS
    var elemScript = document.createElement('script');
    elemScript.setAttribute('src', 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta2/dist/js/bootstrap.bundle.min.js');
    elemScript.setAttribute('integrity', 'sha384-b5kHyXgcpbZJO/tY9Ul7kGkf1S0CWuKcCD38l8YkeH8z8QjE0GmW1gYU5S9FOnJ0');
    elemScript.setAttribute('crossorigin', 'anonymous');
    
    // wrap the iframe in a responsive Bootstrap div
    var elemIframeContainer = CreateElement.createDiv(null, 'ratio ratio-16x9');
    var elemIframe = document.createElement('iframe');
    elemIframe.setAttribute('src', _makeShareURL());
    elemIframeContainer.appendChild(elemIframe);
    
    // get the HTML for all this stuff
    var html = elemCSSScript.outerHTML + elemScript.outerHTML + elemIframeContainer.outerHTML
    
    _copyToClipboard(html);
    alert('embed code copied to clipboard');
  }
  
  function _makeShareURL() {
    var url;
    
    if (settings.currentProjectId) {
      url = window.location.origin + settings.baseShareURL + '/' + settings.currentProjectId;
    }
    return url;
  }
  
  async function _handleAccordionReorder(itemOrder) {
    settings.projectData[settings.currentProjectId].orderedItems = itemOrder;
    var result = await _updateProjectInDB(settings.currentProjectId);
    if (!result.success) return;
    _loadProjectInfo(settings.currentProjectId);
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------  
  async function _getFAQInfo() {
    settings.faqInfo = null
    
    dbResult = await SQLDBInterface.doGetQuery('faqcomposer/query', 'hierarchy');

    if (dbResult.success) {
      var hierarchyData = dbResult.data.hierarchy;

      if (!hierarchyData) {
        hierarchyData = _defaultTreeData();

      } else {
        hierarchyData = JSON.parse(decodeURIComponent(hierarchyData));
        hierarchyData = _processTreeData(hierarchyData, settings.treeProcessingReplacement.unpack);
        if (hierarchyData.length == 0) hierarchyData = _defaultTreeData();
      }

      settings.faqInfo = hierarchyData;

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
      hierarchy: encodeURIComponent(JSON.stringify(hierarchyData))
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
      if (typeof value == 'string') {
        value = _replaceGroup(value, replacementGroup);
        
      } else if (Array.isArray(value)) {
        value = _processTreeArray(value, replacementGroup);
        
      } else if (typeof value == 'object') {
        value = _processTreeObject(value, replacementGroup);
      }
      
      processed[key] = value;
    }
    
    return processed;
  }
  
  function _processTreeArray(origArray, replacementGroup) {
    var processed = [];
        
    for (var i = 0; i < origArray.length; i++) {
      var item = origArray[i];
      if (typeof item == 'string') {
        item = _replaceGroup(item, replacementGroup);
        
      } else if (Array.isArray(item)) {
        item = _processTreeArray(item, replacementGroup);
        
      } else if (typeof item == 'object') {
        item = _processTreeObject(item, replacementGroup);
      } 
        
      processed.push(item);
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
  
  async function _getProjectData() {
    settings.projectData = null
    
    var dbResult = await SQLDBInterface.doGetQuery('faqcomposer/query', 'faqsetlist');
    
    if (dbResult.success) {
      settings.projectData = _processProjectDataList(dbResult.data);

    } else {
      page.notice.setNotice('failed to get project list');
    }
    
    return dbResult.success;
  }  
  
  function _processProjectDataList(projectData) {
    var processed = {
      projectlist: []
    };
    
    for (var i = 0; i < projectData.length; i++) {
      var project = projectData[i];
      processed.projectlist.push({
        projectid: project.faqsetid, 
        projectname: project.faqsetname
      });
      
      var orderedItems = [];
      var openedItems = [];
      if (project.faqsetdata) {
        var data = JSON.parse(project.faqsetdata);
        orderedItems = data.orderedItems;
        openedItems = data.openedItems;
      }
      
      processed[project.faqsetid] = {
        projectid: project.faqsetid,
        projectname: project.faqsetname,
        orderedItems: orderedItems,
        openedItems: openedItems
      }
    }

    return processed;
  }
  
  async function _addProjectToDB(projectName) {    
    var params = {
      "faqsetname": projectName
    };
    
    var dbResult = await SQLDBInterface.doPostQuery('faqcomposer/insert', 'faqset', params);

    if (!dbResult.success) {
      if (dbResult.details.includes('duplicate')) {
        alert('failed to add project\n another with the name (' + projectName + ') already exists');
        page.notice.setNotice('');
      } else {
        page.notice.setNotice('failed to create project');
      }
    }
    
    return dbResult;
  }  
  
  async function _deleteProjectFromDB(projectId) {    
    var params = {
      "faqsetid": projectId
    };
    
    var dbResult = await SQLDBInterface.doPostQuery('faqcomposer/delete', 'faqset', params);

    if (!dbResult.success) {
      page.notice.setNotice('failed to delete project');
    }
    
    return dbResult;
  }  
  
  async function _updateProjectInDB(projectId) {
    if (!projectId) return;
    
    var projectData = settings.projectData[projectId];
    var params = {
      "faqsetid": projectId,
      "faqsetdata": JSON.stringify({
        "orderedItems": projectData.orderedItems,
        "openedItems": projectData.openedItems
      })
    };
    
    var dbResult = await SQLDBInterface.doPostQuery('faqcomposer/update', 'faqset', params);

    if (!dbResult.success) {
      page.notice.setNotice('failed to update project info');
    }
    
    return dbResult;
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	

  function _copyRenderedToClipboard(txt) {
    if (!page._renderedclipboard) page._renderedclipboard = new ClipboardCopy(page.body, 'rendered');

    page._renderedclipboard.copyRenderedToClipboard(txt);
	}	    
    
  
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------
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

  function _truncateNodeName(origName) {
    var name = origName;

    if (name.length > settings.labelTruncateLimit) name = name.slice(0, settings.labelTruncateLimit) + '...';
    return name;
  }
  
  function _enableNavOption(navOption, visible, enable) {
    var elem = document.getElementById(navOption);
    UtilityKTS.setClass(elem, 'hide-me', !visible);
    elem.disabled = !enable;    
  }
  
  function _removeDefaultOption(elemSelect) {
    for (var i = 0; i < elemSelect.childNodes.length; i++) {
      var elemOption = elemSelect.childNodes[i];
      if (elemOption.value == 'default') {
        elemSelect.removeChild(elemOption);
      }
    }
  }
  
  function _validateProjectName(projectName) {
    var valid = projectName.length < 200;
    valid = valid && projectName.length > 0;
    
    valid = valid && (projectName.match(/[A-Za-z0-9&:\-\(\), ]+/) == projectName);
    
    return valid;
  }  

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();