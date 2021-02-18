//-------------------------------------------------------------------
// TableEditor class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class TableEditor {
  constructor(config) {
    this._config = config;
    console.log('TableEditor constructor');
    console.log(this._config);
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  async render() {
    console.log('TableEditor.render()');
    var containerClasses = 'table-editor' + ' ' + this._config.hideClass;
    this._container = CreateElement.createDiv(null, containerClasses);
    
    this._container.innerHTML = 'TableEditor: ' + this._config.title;
    
    this.resultData = await this._config.selectCallback(this._config.title);
    this._container.appendChild(CreateElement.createDiv(null, null, JSON.stringify(this.resultData)));    
    
    return this._container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(params) {
    console.log('TableEditor.update');
  }

  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {
    UtilityKTS.setClass(this._container, this._config.hideClass, !makeVisible);
  }
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------        
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
    //cleaned = cleaned.replace(/&(.*?);/g, '$1');  // replace ampersand characters
    
    return cleaned;
  }
}
