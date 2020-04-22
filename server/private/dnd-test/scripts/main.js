const app = function () {
	const PAGE_TITLE = 'Drag and drop test'
	
	const page = {};
	const settings = {};

  const itemList = [
    'item #0',
    'item #1',
    'item #2',
    'item #3',
    'item #4'
  ];
	
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
    page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('dnd-colorscheme');
    
    page.body.appendChild(_createHeader());
    page.body.appendChild(_createContent());
	}
	
	//------------------------------------------------------------------------------
	// page creation
	//------------------------------------------------------------------------------
	function _createHeader() {
    var container = document.createElement('div');
    
    container.classList.add('dnd-header');
    container.innerHTML = PAGE_TITLE;
    
    return container;
  }
  
  function _createContent() {
    var container = document.createElement('div');
    container.classList.add('dnd-content');
    
    container.appendChild(_createSource());
    container.appendChild(_createDest());
    
    return container;
  }
  
  function _createSource() {
    var container = document.createElement('div');
    container.classList.add('dnd-source');    
    container.appendChild(_createContentLabel('source'));
    
    for (var i = 0; i < itemList.length; i++) {
      container.appendChild(_createContentItem('item' + i, itemList[i]));
    }
    
    container.draggable = false;
    
    return container;
  }

  function _createDest() {
    var container = document.createElement('div');
    container.classList.add('dnd-dest');
    container.appendChild(_createContentLabel('destination'));
    
    container.addEventListener('dragover', _allowDrop);
    container.addEventListener('drop', _finishDrop);
    
    return container;
  }  
				
  function _createContentLabel(txt) {
    var container = document.createElement('div');
    container.classList.add('dnd-contentlabel');
    
    container.innerHTML = txt;
    
    return container;
  }
  
  function _createContentItem(id, txt) {
    var container = document.createElement('div');
    container.classList.add('dnd-contentItem');
    
    container.innerHTML = txt;
    container.id = id;
    container.draggable = true;
    container.addEventListener('dragstart', _startDrag);
    
    return container;
  }
  
	//---------------------------------------
	// handlers
	//----------------------------------------
  function _allowDrop(e) {    
    e.preventDefault();
  }

  function _startDrag(e) {
    e.dataTransfer.setData('text', e.target.id);
  }
  
  function _finishDrop(e) {
    e.preventDefault();
    var data = e.dataTransfer.getData("text");
    //e.target.appendChild(document.getElementById(data));
    
    var item = document.getElementById(data);
    var newItem = _createContentItem('dropped_' + item.id, item.innerHTML);
    newItem.draggable = false;
    e.target.parentNode.appendChild(newItem); 
  }
  
	//---------------------------------------
	// utility functions
	//----------------------------------------

	//---------------------------------------
	// initialize (onLoad)
	//----------------------------------------
	
	return {
		init: init
 	};
}();