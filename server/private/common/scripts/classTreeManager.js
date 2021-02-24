//-------------------------------------------------------------------
// TreeManager class
//-------------------------------------------------------------------
// TODO: think through dirty bit
// TODO: consider using loadDataFromURL and other Ajax options
//-------------------------------------------------------------------
class TreeManager {
  constructor(config) {
    this._config = config;
    
    this._config.treeClass = 'tm-tree';
    this._config.treeSelector = '.' + this._config.treeClass;
    this._config.dirtyBit = false;
    this._config.contextMenu = null;
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render(treeData) {
    var elemTree = document.createElement('div');
    elemTree.classList.add('tm-tree');
    this._config.elemTree = elemTree;
    this._config.appendTo.appendChild(elemTree);
    
    $(this._config.treeSelector).on('tree.init', (e) => { this._treeEventDispatch(e, 'init'); } );
    $(this._config.treeSelector).on('tree.select', (e) => { this._treeEventDispatch(e, 'select'); } );
    $(this._config.treeSelector).on('tree.contextmenu', (e) => { this._treeEventDispatch(e, 'contextmenu'); } );
    $(this._config.treeSelector).on('tree.click', (e) => { this._treeEventDispatch(e, 'click'); } );
    $(this._config.treeSelector).on('tree.open', (e) => { this._treeEventDispatch(e, 'open'); } );
    $(this._config.treeSelector).on('tree.close', (e) => { this._treeEventDispatch(e, 'close'); } );
    $(this._config.treeSelector).on('tree.move', (e) => { this._treeEventDispatch(e, 'move'); } );   
    
    if (this._config.useContextMenu) this._renderContextMenu(this._config.appendTo);

    $(this._config.treeSelector).tree({
      autoOpen: true,
      dragAndDrop: true,
      slide: false  // slide animation
    });
    this.update(treeData);    
  }
  
  _renderContextMenu(elemParent) {
    var menu = CreateElement.createDiv(null, 'contextmenu');
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
  // updating
  //--------------------------------------------------------------
  update(treeData) {
    var thisTree = $(this._config.treeSelector);
    thisTree.tree('loadData', treeData);
    var root = thisTree.tree('getTree');
    if (root.children.length > 0) {
      thisTree.tree('selectNode', root.children[0]);
    }
    
    this._config.dirtyBit = false;
  }
  
  updateNode(nodeInfo) {
    var thisTree = $(this._config.treeSelector);
    var selectedNode = thisTree.tree('getNodeById', nodeInfo.id);
    
    thisTree.tree('updateNode', selectedNode, {name: nodeInfo.name, tmContent: nodeInfo.tmContent});

    selectedNode = thisTree.tree('getNodeById', nodeInfo.id);
    this._config.selectCallback(selectedNode);
  }
  
  _showContextMenu(show, nodeInfo, x, y) {
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

    // deselect any selected nodes
		thisTree.tree('selectNode', null);  
    
    // append new node
		thisTree.tree(   
		    'addNodeAfter', {
				name: 'new item', 
				id: newId,
				tmContent: {
          label: 'new item',
          markdown: ''
        }
			}, 
		  nodeInfo
    );  
		
    // select new node
    var newNode = thisTree.tree('getNodeById', newId);
		thisTree.tree('selectNode', newNode);  
  }
  
  _removeNode(nodeInfo) {
    var msg = 'The item named \n"' + nodeInfo.name + '"\n' +
      'will be permanently removed along with any children.' +
      '\n\nPress OK to delete the item.';
      
		if (confirm(msg)) {
			$(this._config.treeSelector).tree('removeNode', nodeInfo);
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
      "move": this._handleTreeMove
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
    console.log('do move stuff');
    // for details about before/after move see http://mbraak.github.io/jqTree/#event-tree-move
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

}
