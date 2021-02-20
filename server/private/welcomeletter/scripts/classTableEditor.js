//-------------------------------------------------------------------
// TableEditor class
//-------------------------------------------------------------------
// TODO: add "usedby" count to each row, and disable delete if non-zero (?)
//-------------------------------------------------------------------
class TableEditor {
  constructor(config) {
    this._config = config;
    this._config.tableContainerClass = 'te-table-container';
    this._config.editContainerClass = 'te-edit-container';
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
    var container = CreateElement.createDiv(null, this._config.tableContainerClass + ' container-fluid');
    var tableData = dbData.tabledata;
    var tableInfo = dbData.tableinfo;
    
    var elemTable = CreateElement._createElement('table', null, 'table table-striped table-hover table-sm');
    var elemHead = CreateElement._createElement('thead', null, 'table-primary');
    var elemBody = CreateElement._createElement('tbody', null, null);
    
    container.appendChild(elemTable);
    elemTable.appendChild(elemHead);
    elemTable.appendChild(elemBody);
    
    elemHead.appendChild(this._renderTableHead(tableInfo));    
    
    for (var i = 0; i < tableData.length; i++) {
      elemBody.appendChild(this._renderTableRow(tableData[i], tableInfo));
    }
    
    return container;
  }
  
  _renderTableHead(tableInfo) {
    var elemRow = CreateElement._createElement('tr', null, null);
    var primaryKeyInfo = this._getPrimaryKeyInfo(tableInfo);
    
    elemRow.appendChild(this._renderRowControlCell('head', primaryKeyInfo));
    
    for (var columnName in tableInfo) {
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
    var primaryKeyInfo = this._getPrimaryKeyInfo(tableInfo, rowData);
    
    elemRow.appendChild(this._renderRowControlCell('data', primaryKeyInfo));
    
    for (var columnName in rowData) {
      var columnData = rowData[columnName];

      var columnInfo = tableInfo[columnName];
      columnInfo = {
        ...columnInfo,
        "primaryKeyInfo": primaryKeyInfo
      }
      if (!columnInfo.primaryKey) {
        elemRow.appendChild(this._renderTableCell(columnName, columnData, columnInfo));
      }
    }
    
    return elemRow;
  }
  
  _renderRowControlCell(controlType, primaryKeyInfo) {
    var elem = null;
    
    if (controlType == 'data') {
      elem = CreateElement._createElement('td', null, null);
      var handler = (e) => {this._handleRowDelete(e); };
      var elemIcon = CreateElement.createIcon(null, 'trash-icon fas fa-trash-alt', 'delete row', handler);
      elem.appendChild(elemIcon);
      elemIcon.primaryKeyInfo = primaryKeyInfo;
      
    } else if (controlType == 'head') {
      elem = CreateElement._createElement('th', null, null);
      var handler = (e) => {this._handleRowAdd(e); };
      var elemIcon = CreateElement.createIcon(null, 'add-icon fas fa-plus', 'add row', handler);
      elem.appendChild(elemIcon);
      elemIcon.primaryKeyInfo = primaryKeyInfo;
    }
    
    return elem;
  }
  
  _renderTableCell(columnName, columnData, columnInfo) {
    var elemCell = CreateElement._createElement('td', null, null);
    
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
    
    var elemText = CreateElement.createDiv(null, 'te-text-val', columnData);
    container.appendChild(elemText);
    
    container.columnStuff = {
      "columnName": columnName,
      "columnData": columnData,
      "columnInfo": columnInfo
    }
    container.addEventListener('click', (e) => {this._handleTextSelection(e);});
    
    return container;
  }
  
  _renderColumnSwitch(columnName, columnData, columnInfo) {
    var container = CreateElement.createDiv(null, 'te-col-container col-sm');
    var switchDiv = CreateElement.createDiv(null, 'form-check form-switch');
    var switchInput = CreateElement._createElement('input', null, 'form-check-input');

    container.appendChild(switchDiv);
    switchDiv.appendChild(switchInput);
    
    switchInput.type = 'checkbox';
    switchInput.checked = (columnData == 1);
    switchInput.columnStuff = {
      "columnName": columnName,
      "columnData": columnData,
      "columnInfo": columnInfo
    }
    switchInput.addEventListener('click', (e) => {this._handleSwitch(e);});
    
    return container;
  }
  
  _renderTableInfo(tableInfo) {  /*-- for debug --*/
    var container = CreateElement.createDiv(null, 'te-table-info');
    
    container.appendChild(CreateElement._createElement('hr', null, null));
    container.appendChild(CreateElement.createDiv(null, null, 'TABLE INFO'));
    for (var key in tableInfo) {
      var col = tableInfo[key];
      var msg = 'tableName: ' + col.tableName + '<br>';
      msg += 'columnName: ' + col.columnName + '<br>';
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
  
  _renderEditArea() {
    var container = CreateElement.createDiv(null, this._config.editContainerClass + ' container-fluid');
    
    var row1 = CreateElement.createDiv(null, 'row');
    var row2 = CreateElement.createDiv(null, 'row');
    var row3 = CreateElement.createDiv(null, 'row');
    
    var row1col1 = CreateElement.createDiv(null, 'col-sm');
    var row1col2 = CreateElement.createDiv(null, 'col-sm');
    var row2col1 = CreateElement.createDiv(null, 'col-sm');
    var row2col2 = CreateElement.createDiv(null, 'col-sm');
    var row3col1 = CreateElement.createDiv(null, 'col-sm');
    
    container.appendChild(row1);
    container.appendChild(row2);
    container.appendChild(row3);
    row1.appendChild(row1col1);
    row1.appendChild(row1col2);
    row2.appendChild(row2col1);
    row2.appendChild(row2col2);
    row3.appendChild(row3col1);
    
    // render row 1
    row1col1.appendChild(CreateElement.createSpan(null, 'te-edit-label', 'markdown'));
    row1col2.appendChild(CreateElement.createSpan(null, 'te-edit-label', 'rendered'));
    
    // render row 2
    var elem = CreateElement.createTextArea(null, 'edit-markdown');
    row2col1.appendChild(elem);
    elem.rows = 20;
    elem.cols = 80;
    elem.addEventListener('input', (e) => {this._handleTextChange(e);});
    
    row2col2.appendChild(CreateElement.createDiv(null, 'edit-rendered'));
    
    // render row 3
    var saveHandler = (e) => { this._handleEditSave(e); };
    var cancelHandler = (e) => { this._handleEditCancel(e); };
    var saveButton = CreateElement.createButton(null, 'save-button btn btn-primary', 'save',  null, saveHandler)
    saveButton.disabled = true;
    row3col1.appendChild(saveButton);
    row3col1.appendChild(CreateElement.createButton(null, 'cancel-button btn btn-primary', 'cancel', null, cancelHandler));
    
    return container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  async update() {
    var resultData = await this._config.selectCallback(this._config.title);
    UtilityKTS.removeChildren(this._container);

    this._container.appendChild(this._renderTableData(resultData));  
    this._container.appendChild(this._renderEditArea());
    
    this._showTableContainer(true);
    this._showEditContainer(false);
  }
  
  _updateRenderedText(elemSource, elemDest) {
    var msg = elemSource.value.trim();

    var cleanText = MarkdownToHTML.convert(this._sanitizeText(msg));
    elemDest.innerHTML = cleanText;
  }
  
  async _postUpdate(params) {
    var success = await this._config.updateCallback(params);
    if (success) await this.update();
  }
  
  _packageUpdateParams(columnName, columnInfo, columnValue) {
    return {
      "columnName": columnName,
      "tableName": columnInfo.tableName,
      "primaryKey": columnInfo.primaryKeyInfo,
      "columnValue": columnValue
    };
  }
  
  async _postDelete(params) {
    var success = await this._config.deleteCallback(params);
    if (success) await this.update();
  }
  
  async _postAdd(params) {
    var success = await this._config.addCallback(params);
    if (success) await this.update();
  }
  
  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {
    this._showTableContainer(makeVisible);
    this._showEditContainer(false);

    UtilityKTS.setClass(this._container, this._config.hideClass, !makeVisible);
  }
  
  _showTableContainer(makeVisible) {
    UtilityKTS.setClass(this._getTableContainer(), this._config.hideClass, !makeVisible);
  }
  
  _showEditContainer(makeVisible) {
    UtilityKTS.setClass(this._getEditContainer(), this._config.hideClass, !makeVisible);
  }
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleTextSelection(e) {
    // traverse up from target to find column info
    var targetContainer = e.target;
    var columnStuff = null;
    while (columnStuff == null) {
       if (!targetContainer || targetContainer.tagName == 'BODY') break;
       if (targetContainer.classList.contains('te-col-container')) {
         columnStuff = targetContainer.columnStuff;
       }
       targetContainer = targetContainer.parentNode;
    }       

    if (!columnStuff) {
      console.log('cannot find columnStuff in _handleTextSelection()');
      return;
    }
    
    var container = this._getEditContainer();
    container.columnStuff = columnStuff;
    
    var elemMarkdown = this._getMarkdownElement();
    var elemRendered = this._getRenderedElement();

    elemMarkdown.value = columnStuff.columnData;
    elemMarkdown.maxLength = columnStuff.columnInfo.maxColumnLength - 1;
    this._updateRenderedText(elemMarkdown, elemRendered);
    
    this._getSaveButtonElement().disabled = true;
    
    this._showTableContainer(false);
    this._showEditContainer(true);
  }
  
  _handleTextChange(e) {
    this._updateRenderedText(this._getMarkdownElement(), this._getRenderedElement());
    this._getSaveButtonElement().disabled = false;
  }
  
  async _handleSwitch(e) {
    var columnName = e.target.columnStuff.columnName;
    var columnInfo = e.target.columnStuff.columnInfo;
    
    var updateParams = this._packageUpdateParams(
      columnName, 
      columnInfo, 
      e.target.checked ? 1 : 0
    );
    
    await this._postUpdate(updateParams);
  }
  
  async _handleEditSave(e) {
    var columnStuff = this._getEditContainer().columnStuff;
    
    var columnName = columnStuff.columnName;
    var columnInfo = columnStuff.columnInfo;
    var updateParams = this._packageUpdateParams(
      columnName,
      columnInfo,
      '"' + this._sanitizeText(this._getMarkdownElement().value) + '"'
    );
    
    await this._postUpdate(updateParams);

    this._showEditContainer(false);
    this._showTableContainer(true);
  }
    
  _handleEditCancel(e) {
    this._showEditContainer(false);
    this._showTableContainer(true);
  }
  
  async _handleRowDelete(e) {
    await this._postDelete(e.target.primaryKeyInfo);
  }

  async _handleRowAdd(e) {
    console.log('_handleRowAdd');
    console.log(e.target.primaryKeyInfo);
    await this._postAdd({"tableName": e.target.primaryKeyInfo.tableName});
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------        
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
    //cleaned = cleaned.replace(/&(.*?);/g, '$1');  // replace ampersand characters
    
    return cleaned;
  }
  
  _getPrimaryKeyInfo(tableInfo, rowData) {
    var pkey = null;
    for (var columnName in tableInfo) {
      var columnInfo = tableInfo[columnName];
      if (columnInfo.primaryKey) {
        pkey = {
          "tableName": columnInfo.tableName,
          "columnName": columnName,
          "columnValue": rowData ? rowData[columnName] : null
        };
      }
    }
    
    return pkey;
  }
  
  _getTableContainer() {
    return this._container.getElementsByClassName(this._config.tableContainerClass)[0];
  }
  
  _getEditContainer() {
    return this._container.getElementsByClassName(this._config.editContainerClass)[0];
  }
  
  _getMarkdownElement() {
    return this._getEditContainer().getElementsByClassName('edit-markdown')[0];
  }
  
  _getRenderedElement() {
    return this._getEditContainer().getElementsByClassName('edit-rendered')[0];
  }
  
  _getSaveButtonElement() {
    return this._getEditContainer().getElementsByClassName('save-button')[0];
  }
}
