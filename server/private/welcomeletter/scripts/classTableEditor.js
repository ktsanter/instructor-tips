//-------------------------------------------------------------------
// TableEditor class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class TableEditor {
  constructor(config) {
    this._config = config;
    this._config.tableContainerClass = 'te-table-container';
    this._config.editContainerClass = 'te-edit-container';    
    this._container = document.getElementById('te-tableeditor-' + this._config.key);
    this.tiny = null;
  }
  
  //--------------------------------------------------------------
  // initializing
  //--------------------------------------------------------------
  async init() {
    var editorId = 'mytiny' + this._config.key;
    this.tiny = new MyTinyMCE({
      id: editorId,
      selector: '#' + editorId,
      changeCallback: this._handleEditorChange
    });
    await this.tiny.init();
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  async render() { 
    var containerClasses = 'te-table-editor' + ' ' + this._config.hideClass;

    var saveHandler = (e) => { this._handleEditSave(e); };
    var cancelHandler = (e) => { this._handleEditCancel(e); };
    
    this._getSaveButtonElement().addEventListener('click', saveHandler);
    this._getCancelButtonElement().addEventListener('click', cancelHandler);

    await this.update();
    
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
      if (!tableInfo[columnName].primaryKey && columnName != 'usageCount') {
        var headCell = CreateElement._createElement('th', null, null);
        elemRow.appendChild(headCell);
        headCell.innerHTML = columnName;
      }
    }
    
    var usageHeadCell = CreateElement._createElement('th', null, null);
    elemRow.appendChild(usageHeadCell);
    usageHeadCell.innerHTML = 'usage';
    
    return elemRow;
  }
  
  _renderTableRow(rowData, tableInfo) {
    var elemRow = CreateElement._createElement('tr', null, null);
    var primaryKeyInfo = this._getPrimaryKeyInfo(tableInfo, rowData);
    
    elemRow.appendChild(this._renderRowControlCell('data', primaryKeyInfo, rowData.usagecount));
    
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
  
  _renderRowControlCell(controlType, primaryKeyInfo, usageCount) {
    var elem = null;
    
    if (controlType == 'data') {
      elem = CreateElement._createElement('td', null, null);
      var classes = 'trash-icon fas fa-trash-alt';
      if (usageCount && usageCount > 0) classes += ' invisible-icon';

      var handler = (e) => {this._handleRowDelete(e); };
      var elemIcon = CreateElement.createIcon(null, classes, 'delete row', handler);
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
      
    } else if (columnName == 'usagecount') {
      cellContents = CreateElement.createDiv(null, null, columnData ? columnData : 0);
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

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  async update() {
    var resultData = await this._config.selectCallback(this._config.title);
       
    var tableContainer = this._getTableContainer();
    if (tableContainer) tableContainer.parentNode.removeChild(tableContainer);
    
    this._container.appendChild(this._renderTableData(resultData));
    this._getSaveButtonElement.disabled = true;
    
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
    
    this.tiny.setContent(columnStuff.columnData);
    this._getSaveButtonElement().disabled = true;
    
    this._showTableContainer(false);
    this._showEditContainer(true); 
  }
    
  _handleEditorChange(editor) {
    // traverse up from target to get save button
    var elem = document.getElementById(editor.id);
    while (!elem.classList.contains('te-edit-container')) {
      elem = elem.parentNode;
    }
    var elemSave = elem.getElementsByClassName('save-button')[0];
    
    elemSave.disabled = editor.isNotDirty;
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
      //'"' + this._sanitizeText(this._getMarkdownElement().value) + '"'
      '"' + this._sanitizeText(this.tiny.getContent()) + '"'
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
    await this._postAdd({"tableName": e.target.primaryKeyInfo.tableName});
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------        
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    //cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
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
  
  _getCancelButtonElement() {
    return this._getEditContainer().getElementsByClassName('cancel-button')[0];
  }
}
