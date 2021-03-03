"use strict";
//-----------------------------------------------------------------------------------
// wrapper class for tinyMCE
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class MyTinyMCE {
  constructor () {
    this._version = '1.00';
  }
      
  static initialize(initCallback, changeCallback, defaultHeight) {
    if (!initCallback) initCallback = function() {};
    if (!changeCallback) changeCallback = function() {};
    if (!defaultHeight) defaultHeight = 500;
    
    tinymce.init({
      selector: '.mytinyMCE-textarea',
      height: defaultHeight,
      
      plugins: 'advlist link image lists charmap code codesample formatpainter fullscreen table lists',
      menubar: 'edit view insert format tools',
      toolbar: 'formatpainter image link  table code fullscreen numlist bullist',
      
      init_instance_callback : initCallback,
      setup: function (ed) {
        ed.on("change", function () {
          changeCallback(ed);
        })
      }
    });
  }
  
  static setContent(id, content) {
    tinymce.get(id).setContent(content);
  }
  
  static getContent(id) {
    return tinymce.get(id).getContent();
  }
  
  static isDirty(id) {
    return !tinymce.get(id).isNotDirty;
  }
}
