//-----------------------------------------------------------------------
// Walkthrough helper
//-----------------------------------------------------------------------
// TODO: preserve open/close when refreshing picker tree
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
    labelTruncateLimit: 40,
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

    page.elemNavbarMessage = page.navbar.getElementsByClassName('navbar-message')[0];
    _setNavbarMessage('');
    _attachNavbarHandlers();
    UtilityKTS.setClass(page.navbar, 'hide-me', false);

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
  
  function _setNavbarMessage(msg) {
    page.elemNavbarMessage.innerHTML = msg;
  }
  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  async function _renderContents() {
    settings.tiny = {};
    settings.tiny.navEditor = new MyTinyMCE({
      id: 'contenteditor-navEditor', 
      selector: '#contenteditor-navEditor', 
      changeCallback: _handleEditorChange
    });
    await settings.tiny.navEditor.init();
    
    settings.tiny.navPickerStrength = new MyTinyMCE({
      id: 'picker-tiny-strength', 
      selector: '#picker-tiny-strength', 
      height: 400,
      changeCallback: _handleEditorChange,
      initializationParams: {
        readonly: true,
        plugins: '',
        menubar: '',
        toolbar: ''
      }
    });
    await settings.tiny.navPickerStrength.init();

    settings.tiny.navPickerGrowth = new MyTinyMCE({
      id: 'picker-tiny-growth', 
      selector: '#picker-tiny-growth', 
      height: 400,
      changeCallback: _handleEditorChange,
      initializationParams: {
        readonly: true,
        plugins: '',
        menubar: '',
        toolbar: ''
      }
    });
    await settings.tiny.navPickerGrowth.init();

    settings.tiny.navPickerAdditional = new MyTinyMCE({
      id: 'picker-tiny-additional', 
      selector: '#picker-tiny-additional', 
      height: 400,
      changeCallback: _handleEditorChange,
      initializationParams: {
        readonly: true,
        plugins: '',
        menubar: '',
        toolbar: ''
      }
    });
    await settings.tiny.navPickerAdditional.init();

    _renderEditor();
    _renderPicker();    
  }
    
  function _renderEditor() {
    var treeContainer = page.contentsEditor.getElementsByClassName(settings.treeContainerClass)[0];
    var editorContainer = page.contentsEditor.getElementsByClassName('navEditor-item-edit')[0];
    
    settings.editorTree = new TreeManager({
      id: 'navEditorTreeControl',
      appendTo: treeContainer,
      selectCallback: _handleTreeSelect,
      changeCallback: _handleTreeChange,
      useContextMenu: true,
      allowMultiSelect: false,
      allowDragAndDrop: true,
      autoSelect: true,
      useCategories: true,
      categoryClasses: {
        'growth': 'tmcategory-growth',
        'strength': 'tmcategory-strength',
        'additional': 'tmcategory-additional'
      }
    });
    
    settings.editorTree.render(settings.commentset);
    settings.editorTree.setTreeState({selectedList: []});
    settings.editorTree.render(settings.commentset);
    
    UtilityKTS.setClass(editorContainer, settings.hideClass, true);
    
    page.contentsEditor.getElementsByClassName('navEditor-itemlabel')[0].addEventListener('input', (e) => {_handleEditorChange(e);});
    page.contentsEditor.getElementsByClassName('select-category')[0].addEventListener('change', (e) => {_handleEditorChange(e);});
  }
  
  function _pickerHoverText(tmContent) {
    var titleText = tmContent.markdown;
    if (!titleText || titleText.length == 0) {
      titleText = '*empty*';
    } else {
      titleText = _makePlaintext(titleText);
    }
    
    return titleText;
  }
  
  function _renderPicker() {
    var treeContainer = page.contentsPicker.getElementsByClassName(settings.treeContainerClass)[0];

    settings.pickerTree = new TreeManager({
      id: 'navPickerTreeControl',
      appendTo: treeContainer,
      selectCallback: _handleTreeSelect,
      changeCallback: _handleTreeChange,
      nodehovertitleCallback: _pickerHoverText,
      useContextMenu: false,
      allowMultiSelect: true,
      allowDragAndDrop: false,
      autoSelect: false,
      useCategories: true,
      categoryClasses: {
        'growth': 'tmcategory-growth',
        'strength': 'tmcategory-strength',
        'additional': 'tmcategory-additional'
      }      
    });
    
    settings.pickerTree.render(settings.commentset);
    settings.pickedComments = [];    
    
    settings.pickerAccordion = new Accordion({
      hideClass: 'hide-me',
      baseId: 'pickerAccordion',
      allowReordering: true,
      callbackOnReordering: _handleAccordionReorder
    });
    page.elemPickerAccordionContainer = page.contentsPicker.getElementsByClassName('accordion-container')[0];
    page.elemPickerAccordion = settings.pickerAccordion.render([]);
    page.elemPickerAccordionContainer.appendChild(page.elemPickerAccordion);
    
    page.elemPickerTinyStrength = page.contentsPicker.getElementsByClassName('rendering-container strength')[0];
    page.elemPickerTinyGrowth = page.contentsPicker.getElementsByClassName('rendering-container growth')[0];
    
    page.elemRendering = page.contentsPicker.getElementsByClassName('check-rendering')[0];
    page.elemRendering.leftLabel = page.elemRendering.parentNode.parentNode.getElementsByClassName('checkbox-label-left')[0];
    page.elemRendering.rightLabel = page.elemRendering.parentNode.getElementsByClassName('checkbox-label-right')[0];    
    page.elemRendering.addEventListener('click', (e) => { _handleRenderingChange(e); });
    page.elemRendering.leftLabel.addEventListener('click', () => { _handleDoubleSwitch(page.elemRendering, 'left'); });
    page.elemRendering.rightLabel.addEventListener('click', () => { _handleDoubleSwitch(page.elemRendering, 'right'); });
    
    var copyRichElements = page.contentsPicker.getElementsByClassName('btn-copyrich');
    for (var i = 0; i < copyRichElements.length; i++) {
      copyRichElements[i].addEventListener('click', (e) => { _handleCopy(e, 'rich'); });
    }
    var copyPlainElements = page.contentsPicker.getElementsByClassName('btn-copyplain');
    for (var i = 0; i < copyPlainElements.length; i++) {
      copyPlainElements[i].addEventListener('click', (e) => { _handleCopy(e, 'plain'); });
    }
    
    _setPickerRendering('rendering-container')
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
    if (contentsId == 'navProfile') await settings.profile.reload();
      
    _setNavOptions();
  }
    
  function _setNavOptions() {
    var opt = settings.currentNavOption;

    _enableNavOption('navSave', false);
    _enableNavOption('navReload', false);

    if (opt == 'navEditor') {
      var enable = settings.dirtyBit.navEditor;
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
      
    } else if (opt == 'navProfile') {
      var enable = settings.profile.isDirty();
      _enableNavOption('navSave', true, enable);
      _enableNavOption('navReload', true, enable);
    }
  }
  
  async function _showPicker() {
    if (!settings.pickerTree) return;
    
    settings.pickedComments = settings.pickerAccordion.getItemList();
    var selected = [];
    for (var i = 0; i < settings.pickedComments.length; i++) {
      selected.push(settings.pickedComments[i].id);
    }
    if ( !(await _getCommentSet()) ) return;
    
    settings.pickerTree.setTreeState({selectedList: selected});
    settings.pickerTree.update(settings.commentset);
    
    _showPickedComments();
  }
  
  function _updatePickedComments() {
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
    settings.pickedComments = [];
    for (var i = 0; i < newOrder.length; i++) {
      var node = settings.pickerTree.getNode(newOrder[i]);
      var nodeCategory = settings.pickerTree.getNodeCategory(node.id);
      
      settings.pickedComments.push({
        id: node.id,
        label: node.tmContent.label,
        content: node.tmContent.markdown,
        category: nodeCategory
      });
    }
    
    _showPickedComments();    
  }
    
  function _showPickedComments() {
    if (!settings.pickerTree) return;
    if (!settings.pickerAccordion) return;
    
    var accordionData = [];
    //var richtextData = '';
    var richtextStrength = '';
    var richtextGrowth = '';
    var richtextAdditional = '';
    
    var selected = [];
    
    for (var i = 0; i < settings.pickedComments.length; i++) {
      var node = settings.pickerTree.getNode(settings.pickedComments[i].id);
      var category = settings.pickedComments[i].category;
      
      if (node) selected.push(node.id);
      
      if (node && node.children.length == 0) {
        accordionData.push({
          id: node.id,
          label: node.tmContent.label,
          content: node.tmContent.markdown
        });
        
        var content = node.tmContent.markdown;
        //richtextData += content;
        if (category == 'strength') richtextStrength += content;
        if (category == 'growth') richtextGrowth += content;
        if (category == 'additional') richtextAdditional += content;
      }
    }

    settings.pickerAccordion.update(accordionData);
    settings.tiny.navPickerStrength.setContent(richtextStrength);
    settings.tiny.navPickerGrowth.setContent(richtextGrowth);
    settings.tiny.navPickerAdditional.setContent(richtextAdditional);
  }    

  function _setPickerRendering(displayFor) {
    var classToChange = settings.hideClass
    
    UtilityKTS.setClass(page.elemPickerTinyStrength, classToChange, true);
    UtilityKTS.setClass(page.elemPickerTinyGrowth, classToChange, true);
    UtilityKTS.setClass(page.elemPickerAccordionContainer, classToChange, true);
    
    var elemsToShow = page.contentsPicker.getElementsByClassName(displayFor);
    for (var i = 0; i < elemsToShow.length; i++) {
      UtilityKTS.setClass(elemsToShow[i], classToChange, false);
    }
  }    
    
  function _loadCommentIntoEditor(params) {
    var labelAndEditorContainer = page.contentsEditor.getElementsByClassName('navEditor-item-edit')[0];
    var elemLabel = labelAndEditorContainer.getElementsByClassName('navEditor-itemlabel')[0];
    var categoryContainer = labelAndEditorContainer.getElementsByClassName('contenteditor-container-category')[0];
    var elemCategory = categoryContainer.getElementsByClassName('select-category')[0];
    var editorContainer = labelAndEditorContainer.getElementsByClassName('contenteditor-container-navEditor')[0];

    if (params) {
      var label = params.tmContent.label;
      var category = params.tmContent.category ? params.tmContent.category : 'inherit';
      var markdown = params.isLeaf ? params.tmContent.markdown : '';

      elemLabel.value = label;
      elemCategory.value = category;
      settings.tiny.navEditor.setContent(markdown);
      
      UtilityKTS.setClass(labelAndEditorContainer, 'hide-me', false);
      UtilityKTS.setClass(categoryContainer, 'hide-me', params.isLeaf);
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
    
    _setNavbarMessage('');
    dispatchMap[dispatchTarget]();
  }
  
  async function _handleTreeSelect(nodeInfo) {
    _setNavbarMessage('');
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
    if (settings.currentNavOption == 'navEditor') {
      var isLeaf = settings.editorTree.getNode(settings.currentNodeInfo.id).children.length == 0;
      
      var editLabel = page.contentsEditor.getElementsByClassName('navEditor-itemlabel')[0].value;
      
      var editorContent = '';
      if (isLeaf) editorContent = settings.tiny.navEditor.getContent();

      var editCategory = '';
      if (!isLeaf) editCategory = page.contentsEditor.getElementsByClassName('select-category')[0].value;

      var updatedNodeInfo = {
        id: settings.currentNodeInfo.id,
        name: _truncateNodeName(editLabel),
        tmContent: {
          label: editLabel,
          markdown: editorContent,
          category: editCategory
        }
      };

      settings.editorTree.updateNode(updatedNodeInfo, false);
      _handleTreeChange();
    } 
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
  
  function _handleAccordionReorder(itemOrder) {
    var updatedPickedComments = [];
    for (var i = 0; i < itemOrder.length; i++) {
      var indexInPicked = findPickedComment(itemOrder[i]);
      updatedPickedComments.push(settings.pickedComments[indexInPicked]);
    }
    
    settings.pickedComments = updatedPickedComments;
    _showPickedComments();    
  }
  
  function findPickedComment(id) {
    var index = null;
    for (var i = 0; i < settings.pickedComments.length && !index; i++) {
      if (id == settings.pickedComments[i].id) index = i;
    }
    return index;
  }
  
  function _handleRenderingChange(e) {    
    UtilityKTS.setClass(e.target.leftLabel, 'diminished', e.target.checked);
    UtilityKTS.setClass(e.target.rightLabel, 'diminished', !e.target.checked);

    var displayFor = e.target.checked ? 'accordion-container' : 'rendering-container';    
    _setPickerRendering(displayFor);
  }
  
  function _handleDoubleSwitch(elem, clickedLabel) {    
    if (clickedLabel == 'left' && elem.checked) {
      elem.click();
    } else if (clickedLabel == 'right' && !elem.checked) {
      elem.click();
    }
  }
  
  function _handleCopy(e, copyType) {
    var richText;
    var category;
    console.log(e.target.classList);
    
    if (e.target.classList.contains('copy-strength')) {
      richText = settings.tiny.navPickerStrength.getContent();
      category = 'strength';
    } else if (e.target.classList.contains('copy-growth')) {
      richText = settings.tiny.navPickerGrowth.getContent();
      category = 'growth';
    } else if (e.target.classList.contains('copy-additional')) {
      richText = settings.tiny.navPickerAdditional.getContent();
      category = 'additional';
    }
    console.log(richText);
    console.log(category);
    if (!category) return;
    
    if (copyType == 'rich') {
      _copyRenderedToClipboard(richText);
      _setNavbarMessage('"' + category + '" message copied');
      
    } else if (copyType == 'plain') {
      var plainText = _makePlaintext(richText);
      _copyToClipboard(plainText);
      _setNavbarMessage('"' + category + '" message copied');
    }
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
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();