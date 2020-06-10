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
}
