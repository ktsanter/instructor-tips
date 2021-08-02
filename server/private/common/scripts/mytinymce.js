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
    
    this._initializationParams = {};
    if (params.hasOwnProperty('initializationParams')) this._initializationParams = params.initializationParams;
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
  
  show(makeVisible) {
    if (makeVisible) {
      tinymce.show();
    } else {
      tinymce.hide();
    }
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
    
    var paramReadOnly = false;
    var paramPlugins = 'advlist link image lists charmap code codesample fullscreen table lists';
    var paramMenubar = 'edit view insert format tools';
    var paramToolbar = 'image link  table code fullscreen numlist bullist';

    if (this._initializationParams.hasOwnProperty('readonly')) paramReadOnly = this._initializationParams.readonly;
    if (this._initializationParams.hasOwnProperty('plugins')) paramPlugins = this._initializationParams.plugins;
    if (this._initializationParams.hasOwnProperty('menubar')) paramMenubar = this._initializationParams.menubar;
    if (this._initializationParams.hasOwnProperty('toolbar')) paramToolbar = this._initializationParams.toolbar;
    
    tinymce.init({
      selector: this._selector,
      height: this._height,
      readonly: paramReadOnly,
      convert_urls: false,

      plugins: paramPlugins,
      menubar: paramMenubar,
      toolbar: paramToolbar,
      
      init_instance_callback : promiseCallback,
      setup: function (editor) {
        editor.on("change", function () {
          changeCallback(editor);
        })
      }
    });
  }
}