//-------------------------------------------------------------------
// LookupInput class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

class LookupInput {
  constructor(initialParams) {
    console.log('lookupinput->constructor');
    this._version = '0.01';
    this._HIDE_CLASS = 'lookupinput-hide';
    
    var params = initialParams ? initialParams : {};
    this._config = {
      label: params.label ? initialParams.label : null,
      valueList: params.valueList ? params.valueList : null,
      selectedValueList: params.selectedValueList ? params.selectedValueList : null,
    };
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render() {
    console.log('lookupinput->render');
    this._container = CreateElement.createDiv(null, 'lookupinput' + ' ' + this._HIDE_CLASS); 
    
    if (this._config.label) this._container.appendChild(this._renderLabel(this._config.label));
    this._container.appendChild(this._renderInput());
    
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
      this._config.lookupInputType = 'full';
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
      outerContainer.appendChild(CreateElement.createSpan(null, null, '<em>error: empty value list</em>'));
      return;
    }
    
    var container = CreateElement.createDiv(null, 'lookupinput-headcontainer');
    outerContainer.appendChild(container);
    
    var elemInput = this._renderFallbackInput();
    container.appendChild(elemInput);
    elemInput.addEventListener('input', (e) => {this._handleTextInput(e)});
    
    var itemContainer = CreateElement.createDiv(null, 'lookupinput-itemcontainer');
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
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update() {
    console.log('lookupinput->update');    
  }

  _updateDisplayedItems(inputValue) {
    var elemItemsContainer = this._container.getElementsByClassName('lookupinput-itemcontainer')[0];
    var elemItems = this._container.getElementsByClassName('lookupinput-item');

    var nMatches = 0;
    for (var i = 0; i < elemItems.length; i++) {
      var elemItem = elemItems[i];
      var itemText = elemItem.lookupInputText;
      
      var minLength = Math.min(inputValue.length, itemText.length);
      var match = (inputValue.slice(0, minLength) == itemText.slice(0, minLength));
      console.log(inputValue + ' ' + itemText + ' ' + match);
      
      if (match) nMatches++;
      this._setClass(elemItem, 'notshown', !match);
    }

    this._setClass(elemItemsContainer, 'nomatches', (nMatches == 0));
  }
  
  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {
    console.log('lookupinput->show ' + makeVisible);    
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
    console.log('clicked on ' + elemItem.lookupInputText + ' (' + elemItem.lookupInputIndex + ')');
  }
  
  _handleTextInput(e) {
    this._updateDisplayedItems(e.target.value);
  }
  
  //--------------------------------------------------------------
  // utility
  //-------------------------------------------------------------- 
  _setClass(elem, className, add) {
    if (elem.classList.contains(className)) elem.classList.remove(className);
    if (add) elem.classList.add(className);
  }
}
