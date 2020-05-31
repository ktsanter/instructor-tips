//-------------------------------------------------------------------
// LookupInput class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

class LookupInput {
  constructor(initialParams) {
    this._version = '0.01';
    this._HIDE_CLASS = 'lookupinput-hide';
    
    var params = initialParams ? initialParams : {};
    this._config = {
      label: params.label,
      valueList: params.valueList,
      selectedValueList: params.selectedValueList,
      changeCallback: params.changeCallback
    };
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'lookupinput' + ' ' + this._HIDE_CLASS); 
    
    if (this._config.label) this._container.appendChild(this._renderLabel(this._config.label));
    this._container.appendChild(this._renderInput());
    if (this._config.lookupInputType == 'full') {
      this._container.appendChild(this._renderSelectedValues());
      this._updateDisplayedSelectedItems();
    }
    
    return this._container;
  }
  
  _renderLabel(label) {
    return CreateElement.createDiv(null, 'lookupinput-label', label);
  }
  
  _renderInput() {
    var container = CreateElement.createDiv(null, 'lookupinput-inputcontainer');
    
    if (!this._config.valueList) {
      container.appendChild(this._renderFallbackInput());
      this._config.lookupInputType = 'fallback';
      
    } else {
      this._renderFullInput(container);
    }
    
    return container;
  }
  
  _renderFallbackInput() {
    var elemInput = CreateElement.createTextInput(null, 'lookupinput-input');
    if (this._config.initialValue) elemInput.value = this._config.initialValue;
    if (this._config.placeholderValue) elemInput.placeholder = this._config.placeholderValue;
    
    return elemInput;
  }
  
  _renderFullInput(outerContainer) {
    var valueList = this._config.valueList;
    
    if (valueList.length == 0) {
      outerContainer.appendChild(CreateElement.createSpan(null, 'lookupinput-errortext', 'error: empty value list'));
      this._config.lookupInputType = 'error';
      return;
    }
    
    this._config.lookupInputType = 'full';
    var container = CreateElement.createDiv(null, 'lookupinput-headcontainer');
    outerContainer.appendChild(container);
    
    var elemInput = this._renderFallbackInput();
    container.appendChild(elemInput);
    elemInput.addEventListener('input', (e) => {this._handleTextInput(e)});
    elemInput.addEventListener('click', (e) => {this._handleTextInputClick(e)});
    elemInput.addEventListener('keyup', (e) => {this._handleTextInputKeyup(e)});
    elemInput.addEventListener('blur', (e) => {this._handleTextInputBlur(e)});
    
    var itemContainer = CreateElement.createDiv(null, 'lookupinput-itemcontainer ' + this._HIDE_CLASS);
    outerContainer.appendChild(itemContainer);
    
    for (var i = 0; i < valueList.length; i++) {
      var elemItem = CreateElement.createDiv(null, 'lookupinput-item');
      itemContainer.appendChild(elemItem);
      
      elemItem.innerHTML = valueList[i];
      elemItem.lookupInputIndex = i;
      elemItem.lookupInputText = valueList[i];
      elemItem.addEventListener('click', (e) => {this._handleItemClick(e);});
    }
    
    return container;
  }
  
  _renderSelectedValues() {
    var container = CreateElement.createDiv(null, 'lookupinput-selectedcontainer');
    
    return container;
  }
  
  _renderSelectedItem(value) {
    var container = CreateElement.createDiv(null, 'lookupinput-selecteditem');
    
    container.appendChild(CreateElement.createDiv(null, 'lookupinput-selecteditemvalue', value));
    
    var controlContainer = CreateElement.createDiv(null, 'lookupinput-selecteditemcontrol');
    container.appendChild(controlContainer);

    var handler = (e) => {this._handleSelectedItemRemove(e)};
    var elemIcon = CreateElement.createIcon(null, 'lookupinput-selecteditemicon far fa-times-circle', 'remove from filter', handler);
    controlContainer.appendChild(elemIcon); 
    elemIcon.lookupInputText = value;    
    
    return container;
  }
  
  //--------------------------------------------------------------
  // value
  //--------------------------------------------------------------
  value() {
    var theValue = '?';
    
    if (this._config.lookupInputType == 'fallback') {
      var elemInput = this._container.getElementsByClassName('lookupinput-input')[0];
      theValue = elemInput.value;
      
    } else if (this._config.lookupInputType == 'full') {
      theValue = this._config.selectedValueList;
    }
    
    return theValue;
  }
  
  setSelectedValues(selectedValues) {
    if (this._config.lookupInputType == 'full') {
      this._config.selectedValueList = selectedValues;
      this._updateDisplayedSelectedItems();
      
    } else {
      var elemInput = this._container.getElementsByClassName('lookupinput-input')[0];
      elemInput.value = selectedValues;      
    }
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  _updateDisplayedItems(inputValue) {
    if (this._config.lookupInputType != 'full') return;
    
    var elemItemsContainer = this._container.getElementsByClassName('lookupinput-itemcontainer')[0];
    var elemItems = this._container.getElementsByClassName('lookupinput-item');

    var nMatches = 0;
    for (var i = 0; i < elemItems.length; i++) {
      var elemItem = elemItems[i];
      var itemText = elemItem.lookupInputText;
      
      var minLength = Math.min(inputValue.length, itemText.length);
      var match = (inputValue.slice(0, minLength) == itemText.slice(0, minLength));
      
      if (match) nMatches++;
      this._setClass(elemItem, 'notshown', !match);
    }

    this._setClass(elemItemsContainer, this._HIDE_CLASS, false);
    this._setClass(elemItemsContainer, 'nomatches', (nMatches == 0));
  }
  
  _updateDisplayedSelectedItems() {
    var container = this._container.getElementsByClassName('lookupinput-selectedcontainer')[0];
    this._removeChildren(container);
    
    var valueList = this._config.selectedValueList;
    for (var i = 0; i < valueList.length; i++) {
      container.appendChild(this._renderSelectedItem(valueList[i]));
    }
    
    this._setClass(container, this._HIDE_CLASS, (valueList.length > 0));
  }
  
  _addSelectedItem(value) {
    if (!value) return;

    var valueList = this._config.selectedValueList;
    var valueSet = new Set(valueList);
    valueSet.add(value);
    valueList = Array.from(valueSet).sort();
    this._config.selectedValueList = valueList;
    
    if (this._config.changeCallback) this._config.changeCallback(this._config.selectedValueList);
  }
  
  _removeSelectedItem(value) {
    if (!value) return;

    var valueList = this._config.selectedValueList;
    var valueSet = new Set(valueList);
    if (valueSet.has(value)) valueSet.delete(value);
    valueList = Array.from(valueSet).sort();
    this._config.selectedValueList = valueList;

    if (this._config.changeCallback) this._config.changeCallback(this._config.selectedValueList);
  }
  
  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleItemClick(e) {
    var elemItem = e.target;
    this._addSelectedItem(elemItem.lookupInputText);
    this._updateDisplayedSelectedItems();

    this._hideInputItems(this);
  }
  
  _handleTextInput(e) {
    this._updateDisplayedItems(e.target.value);
  }
  
  _handleTextInputClick(e) {
    this._updateDisplayedItems(e.target.value);
  }
  
  _handleTextInputKeyup(e) {
    if (e.code == 'Escape') {
      this._hideInputItems(this);
    }
  }
  
  _handleTextInputBlur(e) {
    e.stopPropagation();
    setTimeout( () => { return this._hideInputItems(this); }, 300);
  }
  
  _hideInputItems(me) {
    var elemItemsContainer = me._container.getElementsByClassName('lookupinput-itemcontainer')[0];
    me._setClass(elemItemsContainer, me._HIDE_CLASS, true);
  }

  _handleSelectedItemRemove(e) {
    var elemItem = e.target;
    this._removeSelectedItem(elemItem.lookupInputText);
    this._updateDisplayedSelectedItems();
  }
  
  //--------------------------------------------------------------
  // utility
  //-------------------------------------------------------------- 
  _setClass(elem, className, add) {
    if (elem.classList.contains(className)) elem.classList.remove(className);
    if (add) elem.classList.add(className);
  }
  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }
}
