"use strict";
//-----------------------------------------------------------------------------------
// wrapper class for tinyMCE
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class myTinyMCE {
  constructor () {
    this._version = '1.00';
  }
      
  static initialize(initCallback) {
    console.log('initialize');
    if (!initCallback) initCallback = function() {};
    
    tinymce.init({
      selector: '.mytinyMCE-textarea',
      plugins: 'advlist link image lists charmap code codesample formatpainter fullscreen table',
      menubar: 'edit view insert format tools',
      toolbar: 'formatpainter image link  table code fullscreen',
      
      init_instance_callback : initCallback
    });
  }
  
  static setContent(id, content) {
    tinymce.get(id).setContent(content);
  }
  
  static getContent(id) {
    return tinymce.get(id).getContent();
  }
}
