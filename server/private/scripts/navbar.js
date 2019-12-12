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
    this._navbar = this._renderNavbar();
    
    return this._navbar;
  }
 
  _renderNavbar() {    
    var nullLink = 'javascript:void(0)';
    var elemList = CreateElement._createElement('ul', null, 'navbar');
    
    var elemItem = CreateElement._createElement('li', null, 'navbar-item navbar-title');
    elemItem.innerHTML = this._config.title;
    elemList.appendChild(elemItem);
    
    var hamburgeritems = this._config.hamburgeritems;
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
      elemSubitem.addEventListener('click', subitem.callback);
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
        elemItem.addEventListener('click', item.callback);
        
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
          var callback = subitem.callback;
          
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
  
  _makeCallbackWithCheckToggle(origCallback, elemIcon) {
    return function() { 
      elemIcon.classList.toggle('navbar-invisible');
      origCallback();
    }
  }
}
