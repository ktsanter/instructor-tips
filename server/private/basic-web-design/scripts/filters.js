//
//
const app = function () {		
	const page = {
		body: null,
    contents: null
	};

  const settings = {
    imageurls: [
      {url: 'https://res.cloudinary.com/ktsanter/image/upload/v1612459622/BasicWebDesign_resources/penguin.jpg'},
      {url: 'https://res.cloudinary.com/ktsanter/image/upload/v1612459622/BasicWebDesign_resources/mountain.jpg'},
      {url: 'https://res.cloudinary.com/ktsanter/image/upload/v1612459622/BasicWebDesign_resources/eiffeltower.jpg'}
    ],

    filtersettings: [
      { 
        name: "blur", 
        params: [
          {val: 3, suffix: "px", minval: 0, maxval: 20, title: "size of blur", defaultval: 0}
        ] 
      },
      
      { 
        name: "hue-rotate", 
        params: [
          {val: 90, suffix: "deg", minval: 0, maxval: 360, title: "degrees of rotation", defaultval: 0}
        ]
      },
      
      { 
        name: "opacity", 
        params: [
          {val: 25, suffix: "%", minval: 0, maxval: 100, title: "0%=transparent, 100%=opaque", defaultval: 100}
        ]
      },
      
      { 
        name: "brightness", 
        params: [
          {val: 50, suffix: "%", minval: 0, maxval: 200, title: "100% = original brightness", defaultval: 100}
        ]
      },
      
      { 
        name: "contrast", 
        params: [
          {val: 150, suffix: "%", minval: 0, maxval: 200, title: "100% = original contrast", defaultval: 100}
        ]
      },
      
      { 
        name: "saturate", 
        params: [
          {val: 50, suffix: "%", minval: 0, maxval: 200, title: "100% = original saturation", defaultval: 100}
        ]
      },
      
      {  
        name: "drop-shadow", 
        params: [
          {val: -5, suffix: "px", minval: -10, maxval: 10, title: "horizontal", defaultval: 0}, 
          {val: -5, suffix: "px", minval: -10, maxval: 10, title: "vertical", defaultval: 0},
          {val: 5, suffix: "px", minval: -10, maxval: 10, title: "shadow blur", defaultval: 0},
          {val: "#000000", suffix: "", color: true, title: "shadow color", defaultval: "#000000"}
        ]
      },
      
      { 
        name: "grayscale", 
        params: [
          {val: 100, suffix: "%", minval: 0, maxval: 100, title: "0%=original, 100%=black & white", defaultval: 0}
        ]
      },
      
      { 
        name: "invert", 
        params: [
          {val: 100, suffix: "%", minval: 0, maxval: 100, title: "0% = original", defaultval: 0}
        ]
      },
      
      { 
        name: "sepia", 
        params: [
          {val: 100, suffix: "%", minval: 0, maxval: 100, title: "0% = original", defaultval: 0}
        ]
      }
    ], 
        
    bordersettings: [
      { 
        name: "border", 
        params: [
          {val: 1, suffix: "px", minval: 0, maxval: 10, title: "border width", defaultval: 1},
          {
            val: "solid", suffix: "", 
            dropdown: true, 
            dropdownvals: ["dotted","dashed","solid","double","groove","ridge","inset","outset"],            
            title: "border type - note many of these depend on the color and/or size settings",
            defaultval: "solid"
          },
          {val: "#000000", suffix: "", color: true, title: "border color", defaultval: "#000000"}
        ],                
      },
      
      {
        name: "radius (all)",
        params: [
          {val: 0, suffix: "%", minval: 0, maxval: 100, title: "radius size", defaultval: 0}
        ]
      },
      
      {
        name: "radius (individual)",
        params: [
          {val: 0, suffix: "%", minval: 0, maxval: 100, title: "upper left radius size", defaultval: 0},
          {val: 0, suffix: "%", minval: 0, maxval: 100, title: "upper right radius size", defaultval: 0},
          {val: 0, suffix: "%", minval: 0, maxval: 100, title: "lower right radius size", defaultval: 0},
          {val: 0, suffix: "%", minval: 0, maxval: 100, title: "lower left radius size", defaultval: 0}
        ]
      }    
    ] 
  };

  //---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.contents = page.body.getElementsByClassName('contents')[0];
        
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
    var elemTopRow = _makeDiv('topRow', ['flex-container']);

    var elemDiv = _makeDiv('all-image-containers', ['flex-container']);
    elemDiv.appendChild(_makeImageContainer());
    elemDiv.appendChild(_makeImageSelectionContainer());
    elemTopRow.appendChild(elemDiv);
    
    //elemTopRow.appendChild(_makeImageContainer());
    //elemTopRow.appendChild(_makeImageSelectionContainer());
    
    elemTopRow.appendChild(_makeResultTextContainer());
    page.contents.appendChild(elemTopRow);
    
    page.contents.appendChild(_makeFilterContainer());
    page.contents.appendChild(_makeBorderContainer());

    _setDefaultValues(settings.filtersettings);
    _setDefaultValues(settings.bordersettings);
    page.imagebutton[0].click();  // trigger loading of image
  }	
  
  function _makeImageContainer() {
    var elemContainer = _makeDiv('image-container', []);
    var elemDiv = _makeDiv('',[]);
    var elemImage = _makeImg('image', []);
    
    elemDiv.appendChild(elemImage);
    page.imageelement = elemImage; 
    elemContainer.appendChild(elemDiv); 

    settings.imagecontainer = elemContainer;

    return elemContainer;
  }
  
  function _makeImageSelectionContainer() {
    var elemContainer = _makeDiv('image-selection-container', []);
    page.imagebutton = [];
    for (var i = 0; i < 3; i++) {
      elemContainer.appendChild(_makeImageSelectionLabel(i, 'image ' + (i + 1)));
    }
    
    var elemDiv = _makeDiv('upload-image-container', []);
    var elemUploadOption = _makeImageSelectionLabel(3, '');
    elemDiv.appendChild(elemUploadOption);

    var elemFilepicker = _makeFilePicker('uploadFilePicker', ['inputfile'], 'choose image to upload', 'uploadFilePicker');
    elemFilepicker.addEventListener('change', function() { _handleFilePicker(this); });
    page.filepicker = elemFilepicker;
    elemDiv.appendChild(elemFilepicker);
    
    var elemLabel = _makeLabel('', ['primary-button', 'filepicker']);
    elemLabel.innerHTML = 'upload image';
    elemLabel.htmlFor = 'uploadFilePicker';
    elemDiv.appendChild(elemLabel);
    
    var elemUploadedFile = _makeSpan('uploadedFile', []);
    elemUploadedFile.innerHTML = 'no file selected';
    page.uploadedfile = elemUploadedFile;
    elemDiv.appendChild(elemUploadedFile);
    
    elemContainer.appendChild(elemDiv);
    
    return elemContainer;
  }
  
  function _makeImageSelectionLabel(n, labelText) {
      var id = 'image_select' + n;
      var elemLabel = _makeLabel('', ['image-select-label']);
      
      var elemRadio = _makeRadio(id, ['image-select'], 'image_select', n);
      elemRadio.addEventListener('change', function (e) { _handleImageSelection(e); });
      page.imagebutton.push(elemRadio);
      
      var elemSpan = _makeSpan('', []);
      elemSpan.innerHTML = labelText;
      elemLabel.appendChild(elemRadio);
      elemLabel.appendChild(elemSpan);
      
      return elemLabel;
  }
    
  function _makeResultTextContainer() {
    var elemContainer = _makeDiv('result-text-container', []);
    
    elemContainer.appendChild(_makeFilterTextContainer());
    elemContainer.appendChild(_makeBorderTextContainer());
    elemContainer.appendChild(_makeBorderRadiusTextContainer());
    
    return elemContainer;
  }
  
  function _makeFilterTextContainer() {
    var elemContainer = _makeDiv('filter-text-container', ['text-container']);
       
    var elemContainerTitle = _makeSpan('filter-text-container-title', ['text-container-title']);
    elemContainerTitle.innerHTML = 'filter: ';
    elemContainer.appendChild(elemContainerTitle);

    var elemContainerContents = _makeSpan('filter-text-container-contents', []);
    page.filtertext = elemContainerContents;
    elemContainer.appendChild(elemContainerContents);
    
    settings.filtertextcontainer = elemContainer;
   
    return elemContainer;
  }
    
  function _makeBorderTextContainer() {
    var elemContainer = _makeDiv('border-text-container', ["text-container"]);
       
    var elemContainerTitle = _makeSpan('border-text-container-title', ["text-container-title"]);
    elemContainerTitle.innerHTML = 'border: ';
    elemContainer.appendChild(elemContainerTitle);

    var elemContainerContents = _makeSpan('border-text-container-contents', []);
    page.bordertext = elemContainerContents;
    elemContainer.appendChild(elemContainerContents);
    
    settings.bordertextcontainer = elemContainer;
   
    return elemContainer;
  }  

    
  function _makeBorderRadiusTextContainer() {
    var elemContainer = _makeDiv('border-radius-text-container', ["text-container"]);
       
    var elemContainerTitle = _makeSpan('border-text-container-title', ["text-container-title"]);
    elemContainerTitle.innerHTML = 'border-radius: ';
    elemContainer.appendChild(elemContainerTitle);

    var elemContainerContents = _makeSpan('border-radius-text-container-contents', []);
    page.borderradiustext = elemContainerContents;
    elemContainer.appendChild(elemContainerContents);
    
    settings.borderradiustextcontainer = elemContainer;
   
    return elemContainer;
  }  

  function _makeFilterContainer() {
    var elemContainer = _makeDiv('filter-container', []);
    
    var elemTitle = _makeSpan('filter-container-title', ['effect-container-title']);
    elemTitle.innerHTML = 'filters';
    elemContainer.appendChild(elemTitle);
    
    var elemDefaultsButton = _makeButton('btnFilterDefaults', ['primary-button', 'defaults-button'], 'defaults', 'set filters to default values', _handleFilterDefaultsButton); 
    elemContainer.appendChild(elemDefaultsButton);    
    
    var elemTable = document.createElement('table');
    elemContainer.appendChild(elemTable);
    
    for (var i = 0; i < settings.filtersettings.length; i++) {
      elemTable.appendChild(_makeSelectionRow(settings.filtersettings[i], i, 'filter'));
      var params = settings.filtersettings[i].params;
    }

    return elemContainer;
  }
      
  function _makeBorderContainer() {
    var elemContainer = _makeDiv('border-container', []);
    
    var elemTitle = _makeSpan('border-container-title', ['effect-container-title']);
    elemTitle.innerHTML = 'borders';
    elemContainer.appendChild(elemTitle);
    
    var elemDefaultsButton = _makeButton('btnBorderDefaults', ['primary-button', 'defaults-button'], 'defaults', 'set borders to default values', _handleBorderDefaultsButton); 
    elemContainer.appendChild(elemDefaultsButton);    
    
    var elemTable = document.createElement('table');
    elemContainer.appendChild(elemTable);
    
    for (var i = 0; i < settings.bordersettings.length; i++) {
      elemTable.appendChild(_makeSelectionRow(settings.bordersettings[i], i, 'border'));
      var params = settings.bordersettings[i].params;
    }
    
    return elemContainer;
  }  
  
  function _makeSelectionRow(setting, index, rowtype) {
    var elemRow = document.createElement('tr');
 
    var elemCell = document.createElement('td');
    if (rowtype == 'filter') {
      var elemCheckbox = _makeCheckbox('filter_select' + ('00' + index).slice(-2), ['filter-select'], 'filter', index);
      elemCheckbox.addEventListener('change', function(e) { _handleFilterSelection(e); });
    } else {
      var elemCheckbox = _makeCheckbox('border_select' + ('00' + index).slice(-2), ['border-select'], 'border', index);
      elemCheckbox.addEventListener('change', function(e) { _handleBorderSelection(e); });
    }
    elemCell.appendChild(elemCheckbox);
    
    var elemSpan = _makeSpan('', []);
    elemSpan.innerHTML = setting.name;
    elemCell.appendChild(elemSpan);
    elemRow.appendChild(elemCell);
    
    for (var i = 0; i < setting.params.length; i++) {
      var param = setting.params[i];
      elemCell = document.createElement('td');
      
      var idPrefix = 'filter_paramcontrol';
      if (rowtype == 'border') idPrefix = 'border_paramcontrol';
      var rId = idPrefix + ('00' + index).slice(-2) + '_' + ('00' + i).slice(-2);
      
      if (param.color) {
        var elemColor = _makeColorSelector(rId, [], param.title, rId, param.defaultval);
        elemColor.oninput = function() { _handleColorChange(this); };
        if (rowtype == 'filter') {
          settings.filtersettings[index].params[i].controlElement = elemColor;
        } else {
          settings.bordersettings[index].params[i].controlElement = elemColor;
        }
        elemCell.appendChild(elemColor);
        
      } else if (param.dropdown) {
        var elemDropdown = _makeDropdown(rId, [], param.title, param.dropdownvals, param.defaultval);
        elemDropdown.addEventListener('change', function() { _handleDropdownChange(this); });
        if (rowtype == 'filter') {
          settings.filtersettings[index].params[i].controlElement = elemDropdown;
        } else {
          settings.bordersettings[index].params[i].controlElement = elemDropdown;
        }
        elemCell.appendChild(elemDropdown);
        
      }else {  
        var elemRange = _makeRange(rId, [], param.title  , param.minval, param.maxval, param.defaultval);
        elemRange.oninput = function() { _handleRangeChange(this); };
        if (rowtype == 'filter') {
          settings.filtersettings[index].params[i].controlElement = elemRange;
        } else {
          settings.bordersettings[index].params[i].controlElement = elemRange;
        }
        elemCell.appendChild(elemRange);
      }

      elemRow.appendChild(elemCell);
    }    
    
    return elemRow;
  }  
  
  //---------------------------------------------------------------
  // image and filtering functions 
  //---------------------------------------------------------------
  function _loadImage(n) {
    page.imageelement.src = settings.imageurls[n].url;
  }

  function _setDefaultValues(settingsToChange) {
    for (var i = 0; i < settingsToChange.length; i++) {
      var params = settingsToChange[i].params;
      
      for (var j=0; j < params.length; j++) {
        params[j].val = params[j].defaultval;
        params[j].controlElement.value = params[j].val;
      }
    }
  }
  
  function _applySelections() {
    _applySelectedFilters();
    _applySelectedBorders();
  }
  
  function _applySelectedFilters() {
    var filterString = '';
    var elems = document.getElementsByClassName('filter-select');
    
    for (var i = 0; i < elems.length; i++) {
      if (elems[i].checked) {
        filterString += _buildFilterString(settings.filtersettings[i]) + ' ';
      }
    }
    
    if (filterString ==  '') filterString = 'initial';
    page.filtertext.innerHTML = filterString;
    
    page.imageelement.style.filter = filterString;
    page.imageelement.style.WebkitFilter = filterString;
  }
  
  function _buildFilterString(filterSetting) {
    var filterString = filterSetting.name;
    var params = filterSetting.params;
    
    filterString += '(';
    for (var i = 0; i < params.length; i++) {
      filterString += params[i].val + params[i].suffix;
      if (i < params.length - 1) filterString += ' ';
    }
    filterString += ')'
    
    return filterString;
  }
  
  function _applySelectedBorders() {
    var borderString = '';
    var borderRadiusString = '';
    var elems = document.getElementsByClassName('border-select');
    
    if (elems[0].checked) {
      borderString = _buildBorderString(settings.bordersettings[0]);
    }
    if (elems[2].checked) {
      borderRadiusString = _buildBorderString(settings.bordersettings[2]);
    } else if (elems[1].checked) {
      borderRadiusString = _buildBorderString(settings.bordersettings[1]);
    }
    
    if (borderString ==  '') borderString = 'none';
    page.bordertext.innerHTML = borderString;
    
    page.borderradiustext.innerHTML = borderRadiusString;
    
    page.imageelement.style.border = borderString;
    page.imageelement.style.borderRadius = borderRadiusString;
  }
  
  function _buildBorderString(borderSetting) {
    var borderString = '';
    var params = borderSetting.params;
    
    for (var i = 0; i < params.length; i++) {
      borderString += params[i].val + params[i].suffix + ' ';
    }
    
    return borderString;
  }  
  
  function _doImageUpload(elemPicker) {
    if (elemPicker.value == '') return;
    
    var val = elemPicker.value;
    var filename = val;
    if (val.indexOf('/') >= 0) {
      filename = val.substring(val.lastIndexOf('/')+1);
    } else if (val.indexOf('\\') >= 0) {
      filename = val.substring(val.lastIndexOf('\\')+1);
    }
    
    page.uploadedfile.innerHTML = filename;
    
    var file = elemPicker.files[0];
    var reader  = new FileReader();

    reader.onloadend = function () {
       page.imageelement.src = reader.result;
    }

    if (file) {
       reader.readAsDataURL(file); //reads the data as a URL
    } else {
       page.imageelement.src = "";
    }   

    document.getElementById('image_select3').checked = true;    
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
  function _handleImageSelection(e) {
    if (e.target.value < 3) {
      _loadImage(e.target.value);
    } else {
      _doImageUpload(page.filepicker);
    }
    
    _applySelections();
  }
  
  function _handleFilterSelection(e) {
    _applySelections();
  }
  
  function _handleBorderSelection(e) {
    _applySelections();
  }
  
  function _handleRangeChange(elem) {
    var indexInfo = elem.id.slice(-5);
    var filterIndex = indexInfo.slice(0,2) * 1;
    var paramIndex = indexInfo.slice(-2) * 1;

    if (elem.id.indexOf('filter') == 0) {
      settings.filtersettings[filterIndex].params[paramIndex].val = elem.value;
    } else {
      settings.bordersettings[filterIndex].params[paramIndex].val = elem.value;
    }
    _applySelections();
  }
  
  function _handleColorChange(elem) {
    _handleRangeChange(elem);
  }
   
  function _handleDropdownChange(elem) {
    var indexInfo = elem.id.slice(-5);
    var filterIndex = indexInfo.slice(0,2) * 1;
    var paramIndex = indexInfo.slice(-2) * 1;
    var borderControl = (elem.id.indexOf('border') == 0);
    
    if (elem.id.indexOf('filter') == 0) {
      settings.filtersettings[filterIndex].params[paramIndex].val = elem.options[elem.selectedIndex].value;
    } else {
      settings.bordersettings[filterIndex].params[paramIndex].val = elem.options[elem.selectedIndex].value;
    }
    _applySelections();
  }
  
  function _handleFilterDefaultsButton() {
    _setDefaultValues(settings.filtersettings);
    _applySelections();
  }
  
  function _handleBorderDefaultsButton() {
    _setDefaultValues(settings.bordersettings);
    _applySelections();
  }
  
  function _handleFilePicker(elem) {
    _doImageUpload(elem);
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
  
  function _makeSpan(id, classList) {
    var elemSpan = document.createElement('span');
    if (id && id != '') elemSpan.id = id;
    _addClassListToElement(elemSpan, classList);
    
    return elemSpan;
  }

  function _makeImg(id, classList) {
    var elemImg = document.createElement('img');
    if (id && id != '') elemImg.id = id;
    _addClassListToElement(elemImg, classList);
    
    return elemImg;
  }

  function _makeLabel(id, classList) {
    var elemLabel = document.createElement('label');
    if (id && id != '') elemLabel.id = id;
    _addClassListToElement(elemLabel, classList);
    
    return elemLabel;
  }
  
  function _makeRadio(id, classList, name, value) {
    var elemRadio = document.createElement('input');
    if (id && id != '') elemRadio.id = id;
    _addClassListToElement(elemRadio, classList);
    elemRadio.type = 'radio';
    elemRadio.name = name;
    elemRadio.value = value;
    
    return elemRadio;
  }
  
  function _makeCheckbox(id, classList, name, value) {
    var elemCheckbox = document.createElement('input');
    if (id && id != '') elemCheckbox.id = id;
    _addClassListToElement(elemCheckbox, classList);
    elemCheckbox.type = 'checkbox';
    elemCheckbox.name = name;
    elemCheckbox.value = value;
    
    return elemCheckbox;
  }

  function _makeRange(id, classList, title, minval, maxval, value) {
    var elemRange = document.createElement('input');
    if (id && id != '') elemRange.id = id;
    _addClassListToElement(elemRange, classList);
    elemRange.type = 'range';
    elemRange.title = title;
    elemRange.min = minval;
    elemRange.max = maxval;
    elemRange.value = value;
    
    return elemRange;
  }
  
  function _makeColorSelector(id, classList, title, name, value) {
    var elemColor = document.createElement('input');
    if (id && id != '') elemColor.id = id;
    _addClassListToElement(elemColor, classList);
    elemColor.type = 'color';
    elemColor.title = title;
    elemColor.name = name;
    elemColor.value = value;
    
    return elemColor;
  }
  
  function _makeDropdown(id, classList, title, valueList, defaultValue) {
    var elemDropdown = document.createElement('select');
    if (id && id != '') elemDropdown.id = id;
    _addClassListToElement(elemDropdown, classList);
    elemDropdown.title = title;

    for (var i = 0; i < valueList.length; i++) {
      var elemOption = document.createElement('option');
      var value = valueList[i];
      elemOption.value = value;
      elemOption.text = value;
      elemDropdown.appendChild(elemOption);
      if (defaultValue == value) elemDropdown.selectedIndex = i;
    }
    
    return elemDropdown;
  }
  
  function _makeFilePicker(id, classList, title, name) {
    var elemFilePicker = document.createElement('input');
    if (id && id != '') elemFilePicker.id = id;
    _addClassListToElement(elemFilePicker, classList);
    elemFilePicker.type = 'file';
    elemFilePicker.title = title;
    elemFilePicker.name = name;
    
    return elemFilePicker;
  }

  function _makeButton(id, classList, label, title, listener) {
		var btn = document.createElement('button');
		btn.id = id;
		_addClassListToElement(btn, classList)
		btn.innerHTML = label;
		btn.title = title;
		btn.addEventListener('click', listener, false);
		return btn;
	}
  
  function _addClassListToElement(elem, classList) {
    for (var i = 0; i < classList.length; i++) {
      elem.classList.add(classList[i]);
    }
  }

	//------------------------------------------------------------------
	// return for wrapper function
	//------------------------------------------------------------------
    
	return {
		init: init
 	};
}();