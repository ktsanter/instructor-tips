//-------------------------------------------------------------------
// TreeManager class
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class TreeManager {
  constructor(config) {
    this._config = config;
    
    this._config.treeClass = 'tm-tree';
    this._config.treeSelector = '#' + this._config.id;
    this._config.contextMenu = null;
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render(treeData) {
    var elemTree = document.createElement('div');
    elemTree.id = this._config.id;
    elemTree.classList.add('tm-tree');
    this._config.elemTree = elemTree;
    this._config.appendTo.appendChild(elemTree);
    
    $(this._config.treeSelector).on('tree.init', (e) => { this._treeEventDispatch(e, 'init'); } );
    $(this._config.treeSelector).on('tree.select', (e) => { this._treeEventDispatch(e, 'select'); } );
    $(this._config.treeSelector).on('tree.click', (e) => { this._treeEventDispatch(e, 'click'); } );
    $(this._config.treeSelector).on('tree.open', (e) => { this._treeEventDispatch(e, 'open'); } );
    $(this._config.treeSelector).on('tree.close', (e) => { this._treeEventDispatch(e, 'close'); } );
    $(this._config.treeSelector).on('tree.move', (e) => { this._treeEventDispatch(e, 'move'); } );   
    $(this._config.treeSelector).on('tree.refresh', (e) => { this._treeEventDispatch(e, 'refresh'); } );   
    
    if (this._config.useContextMenu) {
      this._renderContextMenu(this._config.appendTo);
      $(this._config.treeSelector).on('tree.contextmenu', (e) => { this._treeEventDispatch(e, 'contextmenu'); } );
    }

    $(this._config.treeSelector).tree({
      autoOpen: true,
      dragAndDrop: true,
      slide: false , // slide animation
      buttonLeft: true ,
      openedIcon: '&#9671;',
      closedIcon: '&#9670;'
    });
    this.update(treeData);    
  }
  
  _renderContextMenu(elemParent) {
    var menu = CreateElement.createDiv(this._config.id + 'Contextmenu', 'contextmenu');
    
    elemParent.appendChild(menu);
    this._config.contextMenu = menu;
    
    var menuList = CreateElement._createElement('ul', null, 'contextmenu-list');
    menu.appendChild(menuList);
    
    var menuOption = CreateElement._createElement('li', null, 'contextmenu-item option-add');
    menuOption.innerHTML = 'add item';
    menuOption.addEventListener('click', (e) => { this._handleContextMenuSelection(e); })
    menuList.appendChild(menuOption);

    var menuOption = CreateElement._createElement('li', null, 'contextmenu-item option-delete');
    menuOption.innerHTML = 'remove item';
    menuOption.addEventListener('click', (e) => { this._handleContextMenuSelection(e); })
    menuList.appendChild(menuOption);
  }
    
  //--------------------------------------------------------------
  // get
  //--------------------------------------------------------------
  getAsJSON() {
    var thisTree = $(this._config.treeSelector);
    return thisTree.tree('toJson');
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(treeData) {
    var thisTree = $(this._config.treeSelector);
    var selectedNode = thisTree.tree('getSelectedNode');
    
    thisTree.tree('loadData', treeData);
    var root = thisTree.tree('getTree');
    
    // if a node was selectd before then try to select it now
    if (selectedNode) {
      selectedNode = thisTree.tree('getNodeById', selectedNode.id);
      if (selectedNode) thisTree.tree('selectNode', selectedNode);

    } else if (root.children.length > 0) {  // otherwise select the first node
      thisTree.tree('selectNode', root.children[0]);
    }
  }
  
  updateNode(nodeInfo, useSelectCallback) {
    var thisTree = $(this._config.treeSelector);
    var selectedNode = thisTree.tree('getNodeById', nodeInfo.id);
    
    thisTree.tree('updateNode', selectedNode, {name: nodeInfo.name, tmContent: nodeInfo.tmContent});

    selectedNode = thisTree.tree('getNodeById', nodeInfo.id);
    if (useSelectCallback) this._config.selectCallback(selectedNode);
  }
  
  forceContextMenuClose() {
    this._config.contextMenu.style.display = 'none';
  }
  
  _showContextMenu(show, nodeInfo, x, y) {
    if (!this._config.useContextMenu) return;
        
    if (nodeInfo) {
      this._config.contextMenu.nodeInfo = nodeInfo;
      
      this._config.contextMenu.style.left = x.toString() + 'px';
      this._config.contextMenu.style.top = y.toString() + 'px';
    }
    
    this._config.contextMenu.style.display = show ? 'block' : 'none';
  }
  
  _addNodeAfter(nodeInfo) {
    var thisTree = $(this._config.treeSelector);    
    var newId = this._makeUniqueTreeId();
    var newName = nodeInfo ? 'new item' : 'default item';
    var newNodeInfo =         {
      name: newName, 
      id: newId,
      tmContent: {
        label: newName,
        markdown: ''
      }
    }

    thisTree.tree('selectNode', null);  // deselect any selected nodes
    if (nodeInfo) {
      thisTree.tree('addNodeAfter', newNodeInfo, nodeInfo);
      
    } else {
      thisTree.tree('appendNode', newNodeInfo);
    }
    
    // select new node
    var newNode = thisTree.tree('getNodeById', newId);
		thisTree.tree('selectNode', newNode);  

    this._config.changeCallback();
  }
  
  _removeNode(nodeInfo) {
    var thisTree = $(this._config.treeSelector);    

    var msg = 'The item named \n"' + nodeInfo.name + '"\n' +
      'will be permanently removed along with any children.' +
      '\n\nPress OK to delete the item.';
      
		if (confirm(msg)) {
			thisTree.tree('removeNode', nodeInfo);
      
      if (this._getNodeCount() == 0) {
        this._addNodeAfter();
        
      } else {
        this._config.selectCallback();
        this._config.changeCallback();
      }
		}
  }
  
  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {
    UtilityKTS.setClass(this._container, this._config.hideClass, !makeVisible);
  }
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _treeEventDispatch(e, eventType) {
    this._showContextMenu(false);
    
    var dispatchMap = {
      "init": this._handleTreeInit,
      'select': this._handleTreeSelect,
      "contextmenu": this._handleTreeContextMenu,
      "move": this._handleTreeMove,
      "refresh": this._handleTreeRefresh,
      "click": this._handleTreeClick
    };
    
    if (dispatchMap.hasOwnProperty(eventType)) {
      dispatchMap[eventType](e, this);
    }
  }
  
  _handleTreeInit(e, me) {
    // select first item if it exists
    var thisTree = $(me._config.treeSelector);
    var root = thisTree.tree('getTree');
    if (root.children.length > 0) {
      thisTree.tree('selectNode', root.children[0]);
    }
  }

  _handleTreeSelect(e, me) {
    if (!e.node) return;
    var thisTree = $(me._config.treeSelector);
    var selectedNode = thisTree.tree('getNodeById', e.node.id);
    
    me._config.selectCallback(selectedNode);
  }
  
  _handleTreeClick(e, me) {
    if (!me._config.allowMultiSelect) return;

    e.preventDefault();
    
    var selected_node = e.node;

    if (selected_node.id === undefined) {
        console.warn('The multiple selection functions require that nodes have an id');
    }

    var thisTree = $(me._config.treeSelector);
    if (thisTree.tree('isNodeSelected', selected_node)) {
        thisTree.tree('removeFromSelection', selected_node);
    } else {
        thisTree.tree('addToSelection', selected_node);
    }    
    
    me._config.selectCallback(me._getSelectedNodes(me, thisTree.tree('getTree'), true));
  }
  
  _handleTreeContextMenu(e, me) {
    var thisTree = $(me._config.treeSelector);
    var selectedNode = thisTree.tree('getNodeById', e.node.id);
    thisTree.tree('selectNode', selectedNode);
    me._showContextMenu(true, selectedNode, e.click_event.pageX, e.click_event.pageY);
  }
    
  _handleContextMenuSelection(e) {
    var nodeInfo = this._config.contextMenu.nodeInfo;
    
    if (e.target.classList.contains('option-add')) {
      this._addNodeAfter(nodeInfo);
    } else if (e.target.classList.contains('option-delete')) {
      this._removeNode(nodeInfo);
    }
    
    this._showContextMenu(false);
  }

  _handleTreeMove(e, me) {
    me._config.changeCallback();
    // for details about before/after move see http://mbraak.github.io/jqTree/#event-tree-move
  }
  
  _handleTreeRefresh(e, me) {
    /*
    console.log('_handleTreeRefresh');
    var thisTree = $(me._config.treeSelector);
    var json = JSON.parse(thisTree.tree('toJson'));
    console.log(JSON.stringify(json, null, 2));
    */
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------        
	_makeUniqueTreeId() {
    var thisTree = $(this._config.treeSelector).tree('getTree');

		var maxId = -1;
    thisTree.idMapping.forEach(function(key, value) {
      if (value >= maxId) maxId = value;
    });
    
		return maxId + 1;
	}
  
  _getNodeCount() {
    var thisTree = $(this._config.treeSelector).tree('getTree');

    return thisTree.idMapping.size;
  }
  
  _getSelectedNodes(me, basenode, leavesOnly) {
		var list = [];
    var thisTree = $(me._config.treeSelector);
		
    var baseIsLeaf = (basenode.children.length == 0);
    if ((baseIsLeaf || !leavesOnly) && thisTree.tree('isNodeSelected', basenode)) {
      list.push(basenode);
    }
		
		var children = basenode.children;
		for (var i = 0; i < children.length; i++) {
			 list = list.concat(me._getSelectedNodes(me, children[i], leavesOnly));
		}    
    return list;
  }
}
