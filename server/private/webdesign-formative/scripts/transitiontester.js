//
//
const app = function () {		
	const page = {
		body: null,
    contents: null
	};

  const settings = {
    displayproperties: {
      "font-size": {orig: "14px", hover: "18px", transitionclass: "font-size-transition"},
      "width": {orig: "200px", hover: "300px", transitionclass: "width-transition"},
      "height": {orig: "120px", hover: "200px", transitionclass: "height-transition"},
      "background-color": {orig: "#2f8d98", hover: "#0000FF", transitionclass: "background-color-transition"},
      "opacity": {orig: "1.0", hover: "0.4", transitionclass: "opacity-transition"}      
    },
    
    transitionsettings: [
      { 
        name: "property", 
        params: [
          {
            val: "width", suffix: "", 
            dropdown: true, 
            dropdownvals: ["font-size", "width", "height", "background-color", "opacity"],            
            title: "property which will transition (these can be combined in CSS)",
            defaultval: "width"
          }
        ],                
      },
      
      { 
        name: "duration", 
        params: [
          {val: 0.0, suffix: "s", minval: 0.1, maxval: 7.5, step: 0.1, title: "length in seconds of transition", defaultval: 0.5}
        ] 
      },
      
      { 
        name: "function", 
        params: [
          {
            val: "solid", suffix: "", 
            dropdown: true, 
            dropdownvals: ["ease", "ease-in", "ease-out", "ease-in-out", "linear"],            
            title: "timing function",
            defaultval: "ease"
          }
        ]         
      },
      
      { 
        name: "delay", 
        params: [
          {val: 0.0, suffix: "s", minval: 0.0, maxval: 5.0, step: 0.1, title: "delay before beginning transition", defaultval: 0.0}
        ]
      }      
    ]
  };

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
    var elemTopRow = _makeDiv('topRow', ['flex-container']);
    
    elemTopRow.appendChild(_makeDisplayEffectsContainer());
    elemTopRow.appendChild(_makeResultTextContainer());
    page.contents.appendChild(elemTopRow);
        
    page.contents.appendChild(_makeEffectControlsContainer(settings.transitionsettings, 'transition', _handleTransitionDefaultsButton));
    // force checkboxes to be selected and hide them
    var checkboxElements = document.getElementsByClassName('transition-select');
    for (var i = 0; i < checkboxElements.length; i++) {
      var elem = checkboxElements[i];
      elem.checked = true;
      elem.style.display = 'none';
    }
    
    _setDefaultValues(settings.transitionsettings);
    _applySelections();
  }	
    
  function _makeDisplayEffectsContainer() {
    var elemContainer = _makeDiv('effects-container', []);
    
    var elemEffectsDiv = _makeDiv('effects-div', []);
    page.effectsdiv = elemEffectsDiv;
    elemContainer.appendChild(elemEffectsDiv);
    
    elemEffectsDiv.innerHTML = '';
    
    return elemContainer;
  }
  
  function _makeResultTextContainer() {
    var elemContainer = _makeDiv('result-text-container', []);
    
    elemContainer.appendChild(_makeEffectTextContainer('transition'));
    
    return elemContainer;
  }
  
  function _makeEffectTextContainer(effectGroup) {
    var elemContainer = _makeDiv(effectGroup + '-text-container', ['text-container']);
       
    var elemContainerTitle = _makeSpan(effectGroup + '-text-container-title', ['text-container-title']);
    elemContainerTitle.innerHTML = effectGroup + ': ';
    elemContainer.appendChild(elemContainerTitle);

    var elemContainerContents = _makeSpan(effectGroup + '-text-container-contents', []);
    page[effectGroup + 'text'] = elemContainerContents;
    elemContainer.appendChild(elemContainerContents);
    
    settings[effectGroup + 'textcontainer'] = elemContainer;
   
    return elemContainer;
  }
    
  function _makeEffectControlsContainer(effectSettings, effectTypeName, defaultButtonHandler) {
    var elemContainer = _makeDiv(effectTypeName + '-container', []);
    
    var elemTitle = _makeSpan(effectTypeName + '-container-title', ['effect-container-title']);
    elemTitle.innerHTML = effectTypeName + 's';
    elemContainer.appendChild(elemTitle);
    
    var elemDefaultsButton = _makeButton('btn' + effectTypeName + 'Defaults', ['primary-button', 'defaults-button'], 'defaults', 'set effects to default values', defaultButtonHandler); 
    elemContainer.appendChild(elemDefaultsButton);    
    
    var elemTable = document.createElement('table');
    elemContainer.appendChild(elemTable);
    
    for (var i = 0; i < effectSettings.length; i++) {
      elemTable.appendChild(_makeSelectionRow(effectSettings[i], i, effectTypeName));
    }

    return elemContainer;
  }
  
  function _makeSelectionRow(setting, index, rowtype) {
    var elemRow = document.createElement('tr');
    var elemCheckbox;
 
    var elemCell = document.createElement('td');
    elemCheckbox = _makeCheckbox(rowtype + '_select' + ('00' + index).slice(-2), [rowtype + '-select'], rowtype, index);
    elemCheckbox.addEventListener('change', function(e) { _handleEffectSelection(e); });

    elemCell.appendChild(elemCheckbox);
    
    var elemSpan = _makeSpan('', []);
    elemSpan.innerHTML = setting.name;
    elemCell.appendChild(elemSpan);
    elemRow.appendChild(elemCell);
    
    var effectGroup = rowtype + 'settings';
    
    for (var i = 0; i < setting.params.length; i++) {
      var param = setting.params[i];
      elemCell = document.createElement('td');
      
      var idPrefix = rowtype + '_paramcontrol';
      var rId = idPrefix + ('00' + index).slice(-2) + '_' + ('00' + i).slice(-2);
      var elemControlToAdd;
      
      if (param.color) {
        var elemColor = _makeColorSelector(rId, [], param.title, rId, param.defaultval);
        elemColor.oninput = function() { _handleColorChange(this); };
        elemControlToAdd = elemColor;
        
      } else if (param.dropdown) {
        var elemDropdown = _makeDropdown(rId, [], param.title, param.dropdownvals, param.defaultval);
        elemDropdown.addEventListener('change', function() { _handleDropdownChange(this); });
        elemControlToAdd = elemDropdown;
        
      }else {  
        var elemRange = _makeRange(rId, [], param.title  , param.minval, param.maxval, param.defaultval, param.step);
        elemRange.oninput = function() { _handleRangeChange(this); };
        elemControlToAdd = elemRange;
      }

      settings[effectGroup][index].params[i].controlElement = elemControlToAdd;
      elemCell.appendChild(elemControlToAdd);
      elemRow.appendChild(elemCell);
    }    
    
    return elemRow;
  }  
  
  //---------------------------------------------------------------
  // effects functions 
  //---------------------------------------------------------------
  function _setDefaultValues(settingsToChange) {
    for (var i = 0; i < settingsToChange.length; i++) {
      var params = settingsToChange[i].params;
      
      for (var j = 0; j < params.length; j++) {
        params[j].val = params[j].defaultval;
        params[j].controlElement.value = params[j].val;
      }
    }
  }
  
  function _setDisplayEffectsProperties() {    
    var transitionProperty = settings.transitionsettings[0].params[0].val;
    var origval = settings.displayproperties[transitionProperty].orig;
    var hoverval = settings.displayproperties[transitionProperty].hover;
    var className = settings.displayproperties[transitionProperty].transitionclass;
    
    var strEffects = '<b>Hover to test the transition</b><br>';
    strEffects += 'property: <i>' + transitionProperty + '</i><br>';
    strEffects += 'original: <i>' + origval + '</i><br>';
    strEffects += 'hover: <i>' + hoverval + '</i>';
    page.effectsdiv.innerHTML = strEffects;
    
    _removeClassFromElement(page.effectsdiv, settings.displayproperties['font-size'].transitionclass);
    _removeClassFromElement(page.effectsdiv, settings.displayproperties['width'].transitionclass);
    _removeClassFromElement(page.effectsdiv, settings.displayproperties['height'].transitionclass);
    _removeClassFromElement(page.effectsdiv, settings.displayproperties['background-color'].transitionclass);
    _removeClassFromElement(page.effectsdiv, settings.displayproperties['opacity'].transitionclass);

    page.effectsdiv.classList.add(className);
  }
  
  function _applySelections() {
    _setDisplayEffectsProperties(settings.transitionsettings);
    _applySelectedTransitions();
  }
  
  function _applySelectedTransitions() {
    var effectString = '';
    var elems = document.getElementsByClassName('transition-select');
    for (var i = 0; i < elems.length; i++) {
      if (elems[i].checked) {
        effectString += _buildTransitionString(settings.transitionsettings[i]) + ' '
      }
    }
    
    page.transitiontext.innerHTML = effectString;
    page.effectsdiv.style.transition = effectString;
  }
  
  function _buildTransitionString(transitionSetting) {
    var transitionString = '';
    var params = transitionSetting.params;
    
    for (var i = 0; i < params.length; i++) {
      transitionString += params[i].val + params[i].suffix;
      if (i < params.length - 1) transitionString += ' ';
    }
    
    return transitionString;
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
  function _handleEffectSelection(e) {
    _applySelections();
  }
  
  function _handleRangeChange(elem) {
    var effectGroup = elem.id.slice(0, elem.id.indexOf('_')) + 'settings';
    var indexInfo = elem.id.slice(-5);
    var effectIndex = indexInfo.slice(0,2) * 1;
    var paramIndex = indexInfo.slice(-2) * 1;
    
    settings[effectGroup][effectIndex].params[paramIndex].val = elem.value;

    _applySelections();
  }
  
  function _handleColorChange(elem) {
    _handleRangeChange(elem);
  }
   
  function _handleDropdownChange(elem) {
    var effectGroup = elem.id.slice(0, elem.id.indexOf('_')) + 'settings';
    var indexInfo = elem.id.slice(-5);
    var effectIndex = indexInfo.slice(0,2) * 1;
    var paramIndex = indexInfo.slice(-2) * 1;
    
    settings[effectGroup][effectIndex].params[paramIndex].val = elem.options[elem.selectedIndex].value;

    _applySelections();
  }

  function _handleTransitionDefaultsButton() {
    _setDefaultValues(settings.transitionsettings);
    _applySelections();
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

  function _makeRange(id, classList, title, minval, maxval, value, step) {
    var elemRange = document.createElement('input');
    if (id && id != '') elemRange.id = id;
    _addClassListToElement(elemRange, classList);
    elemRange.type = 'range';
    elemRange.title = title;
    elemRange.min = minval;
    elemRange.max = maxval;
    elemRange.value = value;
    if (step != undefined) elemRange.step = step;
    
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
  
  function _removeClassFromElement(elem, className) {
    if (elem.classList.contains(className)) {
      elem.classList.remove(className);
    }
  }

	//------------------------------------------------------------------
	// return for wrapper function
	//------------------------------------------------------------------
    
	return {
		init: init
 	};
}();