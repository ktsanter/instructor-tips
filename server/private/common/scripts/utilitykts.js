"use strict";
//-----------------------------------------------------------------------------------
// general purpose methods
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class UtilityKTS {
  constructor () {
    this._version = '1.00';
  }
      
  static setClass(elem, className, add) {
    if (elem.classList.contains(className)) elem.classList.remove(className);
    if (add) elem.classList.add(className);
  }
  
  static removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }    
  
  static toggleClass(elem, className) {
    if (elem.classList.contains(className)) {
      elem.classList.remove(className);
    } else {
      elem.classList.add(className);
    }
  }
  
  static escapeQuotes(str) {
    console.log('escapeQuotes');
    console.log(str);
    
    var escaped = str.replace(/\"/g, "\\\"");
    console.log(escaped)
    
    return escaped;
  }
  
  static denyDoubleQuotes(elem) {
    elem.addEventListener('keypress', function(e) {
      if (e.key == '"') {
        e.stopPropagation();
        e.preventDefault();  
        e.returnValue = false;
        e.cancelBubble = true;
        return false;
      }
    });
  }
  
  static setDifference(a, b) {
    return new Set([...a].filter(x => !b.has(x)));
  }
}
