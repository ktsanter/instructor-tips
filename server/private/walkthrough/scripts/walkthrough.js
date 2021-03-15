//-----------------------------------------------------------------------
// Walkthrough Buddy
//-----------------------------------------------------------------------
// TODO: finish help
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const settings = {
    hideClass: 'hide-me',
    navItemClass: 'use-handler',
    treeContainerClass: 'hierarchy-container',

    helpURL: '/walkthrough/help',
    logoutURL: '/usermanagement/logout/walkthrough',
    
    currentNodeInfo: null,
    labelTruncateLimit: 50,
    dirtyBit: {
      navPicker: false,
      navEditor: false,
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
    
    page.contentsPicker = page.contents.getElementsByClassName('contents-navPicker')[0];
    page.contentsEditor = page.contents.getElementsByClassName('contents-navEditor')[0];

    if ( !(await _getCommentSet()) ) return;
    
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
    _renderPicker();    
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
    
    settings.editorTree.render(settings.commentset);    
    
    page.contentsEditor.getElementsByClassName('navEditor-itemlabel')[0].addEventListener('input', (e) => {_handleEditorChange(e);});    
  }
  
  function _renderPicker() {
    var treeContainer = page.contentsPicker.getElementsByClassName(settings.treeContainerClass)[0];

    settings.pickerTree = new TreeManager({
      id: 'navPickerTreeControl',
      appendTo: treeContainer,
      selectCallback: _handleTreeSelect,
      changeCallback: _handleTreeChange,
      useContextMenu: false,
      allowMultiSelect: true,
      allowDragAndDrop: false,
      autoSelect: false
    });
    
    settings.pickerTree.render(settings.commentset);
    settings.pickedComments = [];    
    
    settings.pickerAccordion = new Accordion({
      hideClass: 'hide-me',
      baseId: 'pickerAccordion',
      allowReordering: true,
      callbackOnReordering: _handleAccordionReorder
    });
    page.elemPickerAccordion = page.contentsPicker.getElementsByClassName('accordion-container')[0];
    page.elemPickerAccordion.appendChild(settings.pickerAccordion.render([]));
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
    
    if (contentsId == 'navPicker') _showPicker();
    if (contentsId == 'navEditor') _showEditor();
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
    
  function _setNavOptions() {
    var opt = settings.currentNavOption;

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);

    if (opt == 'navEditor' || opt == 'navProfile') {
      var enable = settings.profile.isDirty();
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
    }
  }
  
  async function _showPicker() {
    if (!settings.pickerTree) return;
    settings.pickedComments =settings.pickerAccordion.getItemList();
    
    if ( !(await _getCommentSet()) ) return;
    
    settings.pickerTree.update(settings.commentset);
    _showPickedComments();
  }
  
  function _updatePickedComments() {
    console.log('_updatePickedComments');
    if (!settings.pickerTree) return;
    
    var currentOrder = settings.pickedComments;
    var selectedItems = settings.pickerTree.getTreeState().selectedList;
    
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
    settings.pickedComments = newOrder;
    _showPickedComments();    
  }
    
  function _showPickedComments() {
    console.log('_showPickedComments');
    if (!settings.pickerTree) return;
    if (!settings.pickerAccordion) return;
    console.log(settings.pickedComments);
    
    var commentData = [];
    for (var i = 0; i < settings.pickedComments.length; i++) {
      var id = settings.pickedComments[i];
      var node = settings.pickerTree.getNode(id);
      if (node && node.children.length == 0) {
        commentData.push({
          id: node.id,
          label: node.tmContent.label,
          content: node.tmContent.markdown
        });
      }
    }

    settings.pickerAccordion.update(commentData);
    settings.pickerTree.setTreeState({
      selectedList: settings.pickedComments,
      openedList: []
    });
  }    
    
  function dummy() {
    var commentData = [];
    var selectedItems = settings.pickerTree.getTreeState().selectedList;

    for (var i = 0; i < selectedItems.length; i++) {
      var id = selectedItems[i];
      var node = settings.pickerTree.getNode(id);
      if (node && node.children.length == 0) {
        commentData.push({
          id: node.id,
          label: node.tmContent.label,
          content: node.tmContent.markdown
        });
      }
    }
  }  
  
  function _showEditor() {}
    
  function _loadCommentIntoEditor(params) {
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
      "navPicker": function() { _showContents('navPicker'); },
      "navEditor": function() { _showContents('navEditor'); },
      "navHelp": _doHelp,
      "navProfile": function() { _showContents('navProfile'); },
      "navProfilePic": function() { _showContents('navProfile'); },
      "navSignout": function() { _doLogout();},
      "navSave": function() { _handleSave(e);},
      "navReload": function() { _handleReload(e, false);}
    }
    
    dispatchMap[dispatchTarget]();
  }
  
  async function _handleTreeSelect(nodeInfo) {
    if (settings.currentNavOption == 'navEditor') {
      if (nodeInfo) {
         _loadCommentIntoEditor({
           id: nodeInfo.id,
           isLeaf: nodeInfo.children.length == 0,
           tmContent: nodeInfo.tmContent
         });
      } else {
        _loadCommentIntoEditor();
      }
      
    } else if (settings.currentNavOption == 'navPicker') {
      _updatePickedComments();
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
  
  async function _handleSave(e) {
    if (settings.currentNavOption == 'navEditor') {
      if ( !(await _saveCommentSet()) ) return;
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
      if ( !(await _getCommentSet()) ) return;
      settings.editorTree.update(settings.commentset);
      
    } else if (settings.currentNavOption == 'navProfile') {
      settings.profile.reload();
    }
    
    _setDirtyBit(false);
  }
  
  async function _handleAccordionReorder(itemOrder) {
    console.log('_handleAccordionReorder');
    return;
        
    settings.projectData[settings.currentProjectId].orderedItems = itemOrder;
    var result = await _updateProjectInDB(settings.currentProjectId);
    if (!result.success) return;
    _loadProjectInfo(settings.currentProjectId);
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------  
  async function _getCommentSet() {
    settings.commentset = null
    
    dbResult = await SQLDBInterface.doGetQuery('walkthrough/query', 'commentset');

    if (dbResult.success) {
      var hierarchyData = dbResult.data.hierarchy;

      if (!hierarchyData) {
        hierarchyData = _defaultTreeData();

      } else {
        hierarchyData = JSON.parse(decodeURIComponent(hierarchyData));
        hierarchyData = _processTreeData(hierarchyData, settings.treeProcessingReplacement.unpack);
        if (hierarchyData.length == 0) hierarchyData = _defaultTreeData();
      }

      settings.commentset = hierarchyData;

    } else {
      page.notice.setNotice('failed to get comment set');
    }

    return dbResult.success;
  }  
  
  async function _saveCommentSet() {
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

    var dbResult = await SQLDBInterface.doPostQuery('walkthrough/update', 'commentset', postData);
    success = dbResult.success;
    if (!success) page.notice.setNotice('failed to save comments');
    
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
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();