"use strict";
//-----------------------------------------------------------------------------------
// navigation bar class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class NavigationBar {
  constructor(config) {
    this._version = '0.01';
    
    this._config = config;
  }
 
  render() {    
    var elemList = CreateElement._createElement('ul', null, 'navbar');
    this._navbar = elemList;
    
    var nullLink = 'javascript:void(0)';
    
    var elemItem = CreateElement._createElement('li', null, 'navbar-item navbar-title');
    elemItem.innerHTML = this._config.title;
    elemList.appendChild(elemItem);
    
    var hamburgeritems = this._config.hamburgeritems;
    if (hamburgeritems.length > 0) {
      var classList = 'navbar-item dropdown navbar-item-right';
      elemItem = CreateElement._createElement('li', null, classList);
      elemList.appendChild(elemItem);
        
      elemItem.appendChild(CreateElement.createIcon(null, 'dropbtn fas fa-bars hamburger-btn'));
    
      var elemDiv = CreateElement.createDiv(null, 'dropdown-content hamburger', '');
      elemItem.appendChild(elemDiv);
      for (var i = 0; i < hamburgeritems.length; i++) {
        var subitem = hamburgeritems[i];
        var elemSubitem = CreateElement.createDiv(null, null, subitem.label);
        elemDiv.appendChild(elemSubitem);
        elemSubitem.addEventListener('click', this._makeHamburgerItemCallback(this, subitem.callback, subitem.markselected));
      }
    }
    
    for (var i = 0; i < this._config.items.length; i++) {
      var item = this._config.items[i];
      var classList = 'navbar-item';

      if (!item.subitems) {
        classList += ' navbar-main-item';
        if (item.rightjustify) classList += ' navbar-item-right';
        elemItem = CreateElement._createElement('li', null, classList);
        elemList.appendChild(elemItem);
        elemItem.innerHTML = item.label;
        if (item.callback) {
          elemItem.addEventListener('click', this._makeMainItemCallback(this, item.callback));
        } else {
          elemItem.classList.add('navbar-disabled');
        }
        
      } else {
        classList += ' dropdown';
        if (item.rightjustify) classList += ' navbar-item-right';
        elemItem = CreateElement._createElement('li', null, classList);
        elemList.appendChild(elemItem);
        elemItem.appendChild(CreateElement.createSpan(null, 'dropbtn', item.label));
        
        var elemDiv = CreateElement.createDiv(null, 'dropdown-content', '');
        elemItem.appendChild(elemDiv);
        for (var j = 0; j < item.subitems.length; j++) {
          var subitem = item.subitems[j];
          var callback = this._makeSubItemCallback(this, subitem.callback);
          
          var elemSubitem = CreateElement.createDiv(null, null);
          elemDiv.appendChild(elemSubitem);
          
          if (item.hasOwnProperty('checks') && item.checks) {
            var classes = 'navbar-check fas fa-check';
            if (!subitem.defaultcheck) {
              classes += ' ' + 'navbar-invisible';
            }

            var elemSubitemIcon = CreateElement.createIcon(null, classes);
            elemSubitem.appendChild(elemSubitemIcon);
            
            callback = this._makeCallbackWithCheckToggle(callback, elemSubitemIcon);
          }

          elemSubitem.addEventListener('click', callback);

          var elemSubitemLabel = CreateElement.createSpan(null, 'dropdown-content-item', subitem.label);
          elemSubitem.appendChild(elemSubitemLabel);
        }
      }
    }
    
    return elemList;
  }
  
  _makeMainItemCallback(me, origCallback) {
    return function(e) { 
      if (origCallback) {
        var elemMainItem = e.target;
        me._setSelectedItem(elemMainItem);
        origCallback();
      }
    }
  }

  _makeSubItemCallback(me, origCallback) {
    return function(e) { 
      var node = e.target;
      var elemMainItem = null;
      for (var i = 0; i < 10 && !elemMainItem; i++) {
        if (node.classList.contains('navbar-item')) elemMainItem = node;
        node = node.parentNode;
      }

      me._setSelectedItem(elemMainItem);
      origCallback();
    }
  }

  _makeHamburgerItemCallback(me, origCallback, markSelected) {
    return function(e) { 
      if (markSelected) {
        var node = e.target;
        var elemMainItem = null;
        for (var i = 0; i < 10 && !elemMainItem; i++) {
          if (node.classList.contains('navbar-item')) elemMainItem = node;
          node = node.parentNode;
        }

        me._setSelectedItem(elemMainItem);
      }
      origCallback();
    }
  }

  _makeCallbackWithCheckToggle(origCallback, elemIcon) {
    return function() { 
      elemIcon.classList.toggle('navbar-invisible');
      origCallback();
    }
  }
  
  _setSelectedItem(elemToSelect) {
    var className = 'navbar-selected';
    
    var elemMainItems = this._navbar.getElementsByClassName('navbar-item');
    for (var i = 0; i < elemMainItems.length; i++) {
      var elem = elemMainItems[i];
      UtilityKTS.setClass(elem, className, false);
    }

    if (elemToSelect) UtilityKTS.setClass(elemToSelect, className, true);
  }
 
  selectOption(optionLabel) {
    var elemMainItems = this._navbar.getElementsByClassName('navbar-item');
    var elemToTarget = null;
    
    for (var i = 0; i < elemMainItems.length && !elemToTarget; i++) {
      var elem = elemMainItems[i];
      if (elem.innerHTML.indexOf(optionLabel) >= 0) elemToTarget = elem;
    }
    
    if (elemToTarget) elemToTarget.click();
  }
  
  changeOptionLabel(currentLabel, newLabel) {
    var elemMainItems = this._navbar.getElementsByClassName('navbar-item');
    var elemToTarget = null;
    
    for (var i = 0; i < elemMainItems.length && !elemToTarget; i++) {
      var elem = elemMainItems[i];
      if (elem.innerHTML.indexOf(currentLabel) >= 0) elemToTarget = elem;
    }

    if (elemToTarget) elemToTarget.innerHTML = newLabel;
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
}
