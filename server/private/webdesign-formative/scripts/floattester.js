//
//
const app = function () {		
	const page = {
		body: null,
    contents: null
	};

  const settings = {
    mainimage: {id: "imgMain", classlist: ["main-image"], src: "/images/webdesign-formative/penguin.jpg"},
    paragraphcount: 2,
    paragraphclasslist: ["paragraph"]
  };
  
  const loremipsum = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vulputate erat a massa " +
    "vestibulum, quis accumsan velit ornare. Suspendisse vel nisl leo. In quam dui, facilisis sed  " +
    "faucibus pharetra. In bibendum euismod elit, blandit ultrices lorem consectetur vel. Sed  ",
    
    "auctor tellus sit amet lorem pharetra, non egestas ex vehicula. Proin molestie risus et tellus  " +
    "finibus, eu tempor dolor vehicula. Interdum et malesuada fames ac ante ipsum primis in  " +
    "venenatis. Curabitur iaculis augue odio, quis consequat lectus efficitur ut. Suspendisse  ",
    
    "mollis nibh mattis urna efficitur efficitur. Etiam magna quam, elementum at felis at,  " +
    "scelerisque elementum lorem. In vitae odio tristique, mattis nibh et, feugiat lacus.  " +
    "mollis justo congue sit amet. Morbi egestas, risus in maximus suscipit, diam ipsum finibus  ",
    
    "dolor, eu blandit enim sem vitae lectus. Donec mollis, tellus eu condimentum semper, sem ipsum  " +
    "laoreet felis, eu porttitor enim odio eget libero. Etiam condimentum ullamcorper augue id  " +
    "maximus urna malesuada vel. Ut quis ullamcorper ex, id ornare augue. Curabitur scelerisque  "
  ];

  //---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.contents = document.getElementById('contents');
        
		if (_initializeSettings()) {
      _renderPage();
		}
	}
	
	//-------------------------------------------------------------------------------------
	// query params:
	//-------------------------------------------------------------------------------------
	function _initializeSettings() {
		return true;
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
	function _renderPage() {
    page.contents.appendChild(_makeDisplayElements());
    page.contents.appendChild(_makeControlElements());
  }
  
  function _makeDisplayElements() {
    var elemDiv = _makeDiv('divDisplay', ['display-elements']);
    
    elemDiv.appendChild(
      _makeImg(
        settings.mainimage.id,
        settings.mainimage.classlist,
        settings.mainimage.src
      )
    );
    
    for (var i = 0; i < settings.paragraphcount; i++) {
      elemDiv.appendChild(
        _makeParagraph(
          _makeParagraphId(i),
          settings.paragraphclasslist,
          '<strong>text contents for paragraph #' + (i+1) + '</strong> ' + loremipsum[i]
        )
      );
    }
    
    return elemDiv;
  }	
  
  function _makeControlElements() {
    var controlList = ['float:none', 'float:left', 'float:right', 'clear:none', 'clear:left', 'clear:right'];

    var elemDiv = _makeDiv('divControls', ['control-elements']);
    var elemTable = document.createElement('table');
    elemTable.id = 'controlTable';
    _addClassListToElement(elemTable, ['control-table']);
    
    var elemRow = document.createElement('tr');
    elemRow.appendChild(document.createElement('th'));
    
    for (var i = 0; i < controlList.length; i++) {
      var elemHeaderCell = document.createElement('th');
      elemHeaderCell.innerHTML = controlList[i];
      _addClassListToElement(elemHeaderCell, ['control-table-header']);
      elemRow.appendChild(elemHeaderCell);
    }
    elemTable.appendChild(elemRow);
    
    elemTable.appendChild(_makeControlElementRow('image', 'imgMain', controlList));
    for (var i = 0; i < settings.paragraphcount; i++) {
      elemTable.appendChild(_makeControlElementRow('paragraph #' + (i+1), 'paragraph' + ('00' + i).slice(-2), controlList));
    }
    
    elemDiv.appendChild(elemTable);
    
    return elemDiv;
  }
  
  function _makeControlElementRow(label, idbase, controlList) {
    var elemRow = document.createElement('tr');

    var elemHeaderCell = document.createElement('th');
    elemHeaderCell.innerHTML = label;
    elemHeaderCell.style.textAlign = 'left';
    elemRow.appendChild(elemHeaderCell);
    
    for (var i = 0; i < controlList.length; i++) {
      var elemCell = document.createElement('td');
      var id = 'radio_' + idbase + '_' + ('00' + i).slice(-2);
      elemCell.appendChild(_makeRadio(id, [], 'control-list-' + idbase, controlList[i], i == 0, function (e) {_handleRadio(e)}));
      elemCell.style.textAlign = 'center';
      elemRow.appendChild(elemCell);
    }
    
    return elemRow;
  }
  
  function _doFloatSettings(id, value) {
    var classes = ['float-none', 'float-left', 'float-right', 'clear-none', 'clear-left', 'clear-right'];
    var elemTarget = document.getElementById(id);

    for (var i = 0; i < classes.length; i++) {
      _removeClassFromElement(elemTarget, classes[i]);
    }
    
    elemTarget.classList.add(value.replace(':', '-'));
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
  function _handleRadio(e) {
    _doFloatSettings(e.target.id.split('_')[1], e.target.value);
  }
  
	//------------------------------------------------------------------
	// utility functions
	//------------------------------------------------------------------    
  function _makeDiv(id, classList) {
    var elemDiv = document.createElement('div');
    if (id && id != '') elemDiv.id = id;
    _addClassListToElement(elemDiv, classList);
    
    return elemDiv;
  }

  function _makeParagraph(id, classList, paragraphText) {
    var elemP = document.createElement('p');
    if (id && id != '') elemP.id = id;
    _addClassListToElement(elemP, classList);
    elemP.innerHTML = paragraphText;
    
    return elemP;
  }
  
  function _makeSpan(id, classList, spanText) {
    var elemSpan = document.createElement('span');
    if (id && id != '') elemSpan.id = id;
    _addClassListToElement(elemSpan, classList);
    elemSpan.innerHTML = spanText;
    
    return elemSpan;
  }

  function _makeImg(id, classList, src) {
    var elemImg = document.createElement('img');
    if (id && id != '') elemImg.id = id;
    _addClassListToElement(elemImg, classList);
    elemImg.src = src;
    
    return elemImg;
  }

  function _makeRadio(id, classList, name, value, checked, handler) {
    var elemRadio = document.createElement('input');
    if (id && id != '') elemRadio.id = id;
    _addClassListToElement(elemRadio, classList);
    elemRadio.type = 'radio';
    elemRadio.name = name;
    elemRadio.value = value;
    elemRadio.checked = checked;
    
    if (handler) elemRadio.addEventListener('change', handler);
    
    return elemRadio;
  }
  
  function _addClassListToElement(elem, classList) {
    for (var i = 0; i < classList.length; i++) {
      elem.classList.add(classList[i]);
    }
  }
  
  function _removeClassFromElement(elem, className) {
    if (elem.classList.contains(className)) {
      elem.classList.remove(className);
    }
  }
  
  function _makeParagraphId(paragraphNum) {
    return 'paragraph' + ('00' + paragraphNum).slice(-2);
  }
  
	//------------------------------------------------------------------
	// return for wrapper function
	//------------------------------------------------------------------
    
	return {
		init: init
 	};
}();