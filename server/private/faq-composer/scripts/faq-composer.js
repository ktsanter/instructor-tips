//-----------------------------------------------------------------------
// FAQ composer
//-----------------------------------------------------------------------
// TODO: dummy DB interface for mapper
// TODO: load tree function for mapper
// TODO: dirty bit for mapper
// TODO: think about how to use same code for presenter and mapper 
//       when rendering selected items
// TODO: add DB for mapper and profile
// TODO: finish mapper
// TODO: finish profile
// TODO: finish help
// TODO: save and reload enabling should be different for mapper and editor
// TODO: reload trees in showContents? or both when
// TODO: add share option for embed code to mapper
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
    if ( !(await _getProjectData()) ) return;
    
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
    settings.contentEditorId = {};
    MyTinyMCE.initialize(_finishRendering, _handleEditorChange);
  }
  
  function _finishRendering() {
    _renderEditor();
    _renderMapper();
    _renderProfile();
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
    
    if (settings.editorTree) settings.editorTree.forceContextMenuClose();
    
    if (contentsId == 'navMapper') _showMapper();
      
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
      _enableNavOption('navSave', false);
      _enableNavOption('navReload', false);
      _enableNavOption('navProjectAdd', true, true);
      _enableNavOption('navProjectRemove', true, true);
      
    } else if (opt == 'navProfile') {
      _enableNavOption('navSave', true, true);
      _enableNavOption('navReload', true, true);
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
      MyTinyMCE.setContent(settings.contentEditorId.navEditor, markdown);
      
      UtilityKTS.setClass(labelAndEditorContainer, 'hide-me', false);
      UtilityKTS.setClass(editorContainer, 'hide-me', !params.isLeaf);
      
    } else {
      UtilityKTS.setClass(labelAndEditorContainer, 'hide-me', true);
      UtilityKTS.setClass(editorContainer, 'hide-me', true);
    }

    settings.currentNodeInfo = params;
  }
  
  function _loadProjectList(projectList) {
    console.log('_loadProjectList');
    var elemProjectSelect = page.contentsMapper.getElementsByClassName('project-selection')[0];
    UtilityKTS.removeChildren(elemProjectSelect);
    
    var elemOption = CreateElement.createOption(null, null, null, 'choose...');
    elemProjectSelect.appendChild(elemOption);
    if (!settings.currentProjectId) elemOption.selected = true;
    
    for (var i = 0; i < projectList.length; i++) {
      var project = projectList[i];
      elemOption = CreateElement.createOption(null, null, project.projectid, project.projectname);
      elemProjectSelect.appendChild(elemOption);
      if (settings.currentProjectId && settings.currentProjectid == project.projectid) elemOption.selected = true;
    }
  }
  
  function _loadProjectInfo(projectId) {
    settings.currentProjectId = projectId;
   
    if (projectId) {
      console.log(projectId);
      console.log(settings.projectData);
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
  }
  
  function _updateFAQSelections() {
    if (!settings.currentProject) return;
    
    var currentOrder = settings.currentProject.orderedItems;
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
    
    settings.currentProject.orderedItems = newOrder;
    _loadProjectInfo(settings.currentProject);
  }
  
  function _loadProjectFAQs(faqList) {
    var container = page.contentsMapper.getElementsByClassName('selected-items')[0];
    
    UtilityKTS.removeChildren(container);
    
    for (var i = 0; i < faqList.length; i++) {
      var faq = faqList[i];
      var node = settings.mapperTree.getNode(faq);
      if (node && node.children.length == 0) {
        container.appendChild(_renderMapperFAQ(node.tmContent));
      }
    }
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
    var dispatchMap = {
      "navEditor": function() { _showContents('navEditor'); },
      "navMapper": function() { _showContents('navMapper'); },
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e);},
      "navProjectAdd": function() { _handleProjectAdd(e);},
      "navProjectRemove": function() { _handleProjectRemove(e);}
    }
    
    dispatchMap[e.target.id]();
  }
  
  function _handleTreeSelect(nodeInfo) {
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
      _updateFAQSelections();
      _setDirtyBit(true);
    }
  }
  
  function _handleTreeChange() {
    _setDirtyBit(true);
  }
  
  function _handleEditorChange(e) {
    var editLabel = page.contentsEditor.getElementsByClassName('navEditor-itemlabel')[0].value;
    var editorContent = tinymce.get(settings.contentEditorId.navEditor).getContent();

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
  
  async function _handleSave(e) {
    if (settings.currentNavOption == 'navEditor') {
      if ( !(await _saveFAQInfo()) ) return;
    
    } 
    
    await _handleReload(e, true);
    
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

    }
    
    _setDirtyBit(false);
  }
  
  function _handleProjectSelect(e) {
    var projectId = e.target[e.target.selectedIndex].value;
    
    //var projectInfo = null;
    //if (projectId) projectInfo = settings.projectData[projectId];
    _loadProjectInfo(projectId);
  }
  
  function _handleProjectAdd(e) {
    console.log('_handleProjectAdd');
  }
  
  function _handleProjectRemove(e) {
    console.log('_handleProjectRemove');
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
    
    //------- debug ------------------------------
    dbResult = {
      success: true, 
      data: {
        projectlist: [
          { projectid: 3, projectname: "Basic Web Design (2020-21)" },
          { projectid: 1,  projectname: "AP Computer Science Principles, Sem 2 (2020-21)" },
          { projectid: 2, projectname: "Essentials Geometry B (2020-21)" }
        ],
        
        3: { 
          projectid: 3,
          projectname: "Basic Web Design (2020-21)",
          orderedItems: [6, 2, 3, 4],
          openedItems: []
        },
        
        1: {
          projectid: 1,
          projectname: "AP Computer Science Principles, Sem 2 (2020-21)",
          orderedItems: [4, 6],
          openedItems: []
        },
        
        2: {
          projectid: 2,
          projectname: "Essentials Geometry B (2020-21)",
          orderedItems: [6, 2, 100, 7],
          openedItems: []
        }
      }
    };
    
    //-------------------------------------------
    //dbResult = await SQLDBInterface.doGetQuery('faqcomposer/query', 'projectlist');
    //-------------------------------------------
    
    if (dbResult.success) {
      settings.projectData = dbResult.data;

    } else {
      page.notice.setNotice('failed to get project list');
    }
    
    return dbResult.success;
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

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();