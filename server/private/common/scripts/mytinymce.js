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
    
    this.btnMathFormula = null;
    this.btnChemistryFormula = null;
    
    this.isShowing = true;
  }
  
  //---------------------------------------------------------------------------------
  // public methods
  //---------------------------------------------------------------------------------
  async init() {
    // note the textarea element must exist and be part of the DOM before this
    await this._initPromise();
  }
  
  getObj() {
    return tinymce.get(this._id);
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
      tinymce.get(this._id).show();
      this.isShowing = true;
    } else {
      tinymce.get(this._id).hide();
      this.isShowing = false;
    }
  }

  triggerButton(buttonType) {
    if (buttonType == 'math-formula' && this.btnMathFormula != null) {
      this.btnMathFormula.click();
    } else if (buttonType == 'chemistry-formula' && this.btnChemistryFormula != null) {
      this.btnChemistryFormula.click();
    } else {
      console.log('unrecognized buttonType', buttonType);
    }
  }
  
  //---------------------------------------------------------------------------------
  // private methods
  //---------------------------------------------------------------------------------
  _initPromise() {
    return new Promise((resolve) => {        
      this._init(() => {
        var buttons = tinymce.get(this._id).editorContainer.getElementsByTagName('button');
        this.btnMathFormula = null;
        this.btnChemistryFormula = null;
        for (var i = 0; i < buttons.length; i++) {
          var btn = buttons[i];
          var ariaLabel = btn.getAttribute('aria-label');
          if (ariaLabel && ariaLabel.includes('math equation')) this.btnMathFormula = btn;
          if (ariaLabel && ariaLabel.includes('chemistry formula')) this.btnChemistryFormula = btn;
        }

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
    var paramExternalPlugins = {};

    if (this._initializationParams.hasOwnProperty('readonly')) paramReadOnly = this._initializationParams.readonly;
    if (this._initializationParams.hasOwnProperty('plugins')) paramPlugins = this._initializationParams.plugins;
    if (this._initializationParams.hasOwnProperty('menubar')) paramMenubar = this._initializationParams.menubar;
    if (this._initializationParams.hasOwnProperty('toolbar')) paramToolbar = this._initializationParams.toolbar;
    if (this._initializationParams.hasOwnProperty('wiris') && this._initializationParams.wiris) {
      paramToolbar += ' tiny_mce_wiris_formulaEditor tiny_mce_wiris_formulaEditorChemistry';
      paramExternalPlugins.tiny_mce_wiris = 'https://www.wiris.net/demo/plugins/tiny_mce/plugin.js';
    }

    tinymce.init({
      selector: this._selector,
      height: this._height,
      readonly: paramReadOnly,
      convert_urls: false,
      //external_plugins: { tiny_mce_wiris: 'https://www.wiris.net/demo/plugins/tiny_mce/plugin.js' },
      external_plugins: paramExternalPlugins,

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