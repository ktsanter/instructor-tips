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
    var containerClasses = 'te-table-editor' + ' ' + this._config.hideClass;
    this._container = CreateElement.createDiv(null, containerClasses);
    
    this.update();
    
    return this._container;
  }
  
  _renderTableData(dbData) {
    var container = CreateElement.createDiv(null, 'te-table-container container-fluid');
    var tableData = dbData.tabledata;
    var tableInfo = dbData.tableinfo;
    
    var elemTable = CreateElement._createElement('table', null, 'table table-striped table-hover table-sm');
    var elemHead = CreateElement._createElement('thead', null, 'thead-dark');
    var elemBody = CreateElement._createElement('tbody', null, null);
    
    container.appendChild(elemTable);
    elemTable.appendChild(elemHead);
    elemTable.appendChild(elemBody);
    
    elemHead.appendChild(this._renderTableHead(tableData[0], tableInfo));    
    
    for (var i = 0; i < tableData.length; i++) {
      elemBody.appendChild(this._renderTableRow(tableData[i], tableInfo));
    }

    container.appendChild(this._renderTableInfo(tableInfo));    
    
    return container;
  }
  
  _renderTableHead(firstDataRow, tableInfo) {
    var elemRow = CreateElement._createElement('tr', null, null);
    
    for (var columnName in firstDataRow) {
      if (!tableInfo[columnName].primaryKey) {
        var headCell = CreateElement._createElement('th', null, null);
        elemRow.appendChild(headCell);
        headCell.innerHTML = columnName;
      }
    }
    
    return elemRow;
  }
  
  _renderTableRow(rowData, tableInfo) {
    var elemRow = CreateElement._createElement('tr', null, null);
    for (var columnName in rowData) {
      var columnData = rowData[columnName];

      var columnInfo = tableInfo[columnName];
      if (!columnInfo.primaryKey) {
        elemRow.appendChild(this._renderTableCell(columnName, columnData, columnInfo));
      }
    }
    
    return elemRow;
  }
  
  _renderTableCell(columnName, columnData, columnInfo) {
    var elemCell = CreateElement._createElement('td', null, 'unhandled dataType: ' + columnInfo.dataType + ' for ' + columnName);
    
    var cellContents = CreateElement.createDiv(null, null, 'unhandled dataType: ' + columnInfo.dataType + ' for ' + columnName);
    if (columnInfo.dataType == 'varchar') {
      cellContents = this._renderColumnTextInput(columnName, columnData, columnInfo);

    } else if (columnInfo.dataType == 'tinyint') {
      cellContents = this._renderColumnSwitch(columnName, columnData, columnInfo);
    }
    
    elemCell.appendChild(cellContents);
    
    return elemCell;
  }
  
  _renderColumnTextInput(columnName, columnData, columnInfo) {
    var container = CreateElement.createDiv(null, 'te-col-container col-sm');
    
    container.appendChild(CreateElement.createDiv(null, null, 'text input: ' + columnName + ' ' + columnData));
    
    return container;
  }
  
  _renderColumnSwitch(columnName, columnData, columnInfo) {
    var container = CreateElement.createDiv(null, 'te-col-container col-sm');
    
    container.appendChild(CreateElement.createDiv(null, null, 'switch: ' + columnName + ' ' + columnData));
    
    return container;
  }
  
  _renderTableInfo(tableInfo) {
    var container = CreateElement.createDiv(null, 'te-table-info');
    
    container.appendChild(CreateElement._createElement('hr', null, null));
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
    var resultData = await this._config.selectCallback(this._config.title);
    UtilityKTS.removeChildren(this._container);
    
    this._container.appendChild(this._renderTableData(resultData));    
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
