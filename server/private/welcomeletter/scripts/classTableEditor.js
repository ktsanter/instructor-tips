//-------------------------------------------------------------------
// TableEditor class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class TableEditor {
  constructor(config) {
    this._config = config;
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  async render() {
    var containerClasses = 'table-editor' + ' ' + this._config.hideClass;
    this._container = CreateElement.createDiv(null, containerClasses);
    
    this.update();
    
    return this._container;
  }
  
  _renderTableData(tableData) {
    var container = CreateElement.createDiv(null, null);

    container.appendChild(CreateElement.createDiv(null, null, 'TABLE DATA'));
    for (var i = 0; i < tableData.length; i++) {
      var row = tableData[i];
      container.appendChild(CreateElement.createDiv(null, null, JSON.stringify(row)));
    }
    
    return container;
  }
  
  _renderTableInfo(tableInfo) {
    var container = CreateElement.createDiv(null, null);
    
    container.appendChild(CreateElement.createDiv(null, null, 'TABLE INFO'));
    for (var key in tableInfo) {
      var col = tableInfo[key];
      var msg = 'columnName: ' + col.columnName + '<br>';
      msg += 'primaryKey: ' + col.primaryKey + '<br>';
      msg += 'dataType: ' + col.dataType + '<br>';
      msg += 'columnType: ' + col.columnType + '<br>';
      msg += 'maxColumnLength: ' + col.maxColumnLength + '<br>';
      msg += 'nullable: ' + col.nullable + '<br>';
      
      container.appendChild(CreateElement.createDiv(null, null, msg));
      container.appendChild(CreateElement._createElement('br', null, null));
    }
    
    return container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  async update() {
    this.resultData = await this._config.selectCallback(this._config.title);
    UtilityKTS.removeChildren(this._container);
    
    this._container.appendChild(this._renderTableData(this.resultData.tabledata));    
    this._container.appendChild(CreateElement._createElement('br', null, null));
    this._container.appendChild(this._renderTableInfo(this.resultData.tableinfo));    
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
