"use strict";
//-----------------------------------------------------------------------------------
// wrapper class for tinyMCE
//-----------------------------------------------------------------------------------
// TODO: add show/hide and getElement ? 
//-----------------------------------------------------------------------------------
class MyTinyMCE {
  constructor (params) {
    this._version = '1.00';
    this._id = params.id;
    this._selector = params.selector;
    
    this._editorCallback = params.changeCallback;
    if (!this._editorCallback) this._editorCallback = function() {};
    
    this._height = params.height;
    if (!this._height) this._height = 500;
    
    this._escapeQuotes = params.escapeQuotes;
  }
  
  //---------------------------------------------------------------------------------
  // public methods
  //---------------------------------------------------------------------------------
  async init() {
    // note the textarea element must exist and be part of the DOM before this
    await this._initPromise();
  }
  
  setContent(content) {
    tinymce.get(this._id).setContent(content);
  }
  
  getContent() {
    var content = tinymce.get(this._id).getContent();

    if (this._escapeQuotes) {
      content = content.replace(/\'/g, '\\\'');
      content = content.replace(/\"/g, '\\"');
      content = content.replace(/[\r\n]+/g, '');
    }

    return content;
  }
  
  isDirty() {
    return !tinymce.get(this._id).isNotDirty;
  }

  //---------------------------------------------------------------------------------
  // private methods
  //---------------------------------------------------------------------------------
  _initPromise() {
    return new Promise((resolve) => {        
      this._init(() => {
        resolve();
      });
    })
  }

  _init(promiseCallback) {
    var changeCallback = this._editorCallback;

    tinymce.init({
      selector: this._selector,
      height: this._height,
      
      plugins: 'advlist link image lists charmap code codesample formatpainter fullscreen table lists',
      menubar: 'edit view insert format tools',
      toolbar: 'formatpainter image link  table code fullscreen numlist bullist',
      
      init_instance_callback : promiseCallback,
      setup: function (editor) {
        editor.on("change", function () {
          changeCallback(editor);
        })
      }
    });
  }
}