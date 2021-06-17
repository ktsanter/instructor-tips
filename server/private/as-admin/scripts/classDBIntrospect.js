//-------------------------------------------------------------------
// DBIntrospect class (for AS Admin)
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class DBIntrospect {
  constructor(config) {
    this._config = config;      
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------
  render() {
    this._config.container.getElementsByClassName('btnDBTest')[0].addEventListener('click', (e) => { this._handleDBTest(e); });
  }
   
  async update() {
    this.elemDBSelect = this._config.container.getElementsByClassName('db-selection')[0];
    this.elemDBSelect.addEventListener('change', (e) => { this._handleDBSelect(e); });
    
    this.elemTableSelect = this._config.container.getElementsByClassName('table-selection')[0];
    this.elemTableSelect.addEventListener('change', (e) => { this._handleTableSelect(e); });
    
    this.elemColumnDataBody = this._config.container.getElementsByClassName('columndata-body')[0];

    this.elemRowDataHead = this._config.container.getElementsByClassName('rowdata-head')[0];
    this.elemRowDataBody = this._config.container.getElementsByClassName('rowdata-body')[0];

    await this._loadDatabases();  
  }

  //--------------------------------------------------------------
  // private methods - rendering
  //--------------------------------------------------------------
  
  //--------------------------------------------------------------
  // private methods - updating
  //--------------------------------------------------------------
  async _loadDatabases() {
    this._clearDatabaseSelections();
    
    var result = await SQLDBInterface.doGetQuery('as-admin/admin', 'db-schemas', this._config.elemNotice);
    if (!result.success) return;
    
    var schemata = result.data.schemata;
    for (var i = 0; i < schemata.length; i++) {
      var schema = schemata[i];
      this.elemDBSelect.appendChild(CreateElement.createOption(null, null, schema.schema_name, schema.schema_name));
    }
    
    this.elemDBSelect.selectedIndex = -1;
  }
  
  async _loadTables(dbName) {
    this._clearTableSelections();
    
    var result = await SQLDBInterface.doPostQuery('as-admin/admin', 'db-tables', {"dbname": dbName}, this._config.elemNotice);
    if (!result.success) return;

    var tables = result.data.tables;
    for (var i = 0; i < tables.length; i++) {
      var table = tables[i];
      var label = table.table_name;
      if (table.table_type == 'VIEW') label += ' (view)';
      this.elemTableSelect.appendChild(CreateElement.createOption(null, null, table.table_name, label));
    }      
    
    this.elemTableSelect.selectedIndex = -1;
  }
  
  async _loadTableData(dbName, tableName) {
    this._clearColumnData();

    var result = await SQLDBInterface.doPostQuery('as-admin/admin', 'db-columns', {"dbname": dbName, "tablename": tableName}, this._config.elemNotice);
    if (!result.success) return;
    
    var columns = result.data.columns;
    for (var i = 0; i < columns.length; i++) {
      this.elemColumnDataBody.appendChild(this._createColumnDataRow(columns[i]));
    }
    
    var result = await SQLDBInterface.doPostQuery('as-admin/admin', 'db-rows', {"dbname": dbName, "tablename": tableName}, this._config.elemNotice);
    if (!result.success) return;
    
    this.elemRowDataHead.appendChild(this._createRowDataHeader(columns));
    
    var rows = result.data.rows;
    for (var i = 0; i < rows.length; i++) {
      this.elemRowDataBody.appendChild(this._createRowDataRow(rows[i]));
    }
  }
  
  _createColumnDataRow(columnData) {
    var row = CreateElement.createTableRow(null, null);
    
    row.appendChild(CreateElement.createTableCell(null, null, columnData.column_name));
    row.appendChild(CreateElement.createTableCell(null, null, columnData.column_type));
    row.appendChild(CreateElement.createTableCell(null, null, columnData.column_key));
    row.appendChild(CreateElement.createTableCell(null, null, columnData.is_nullable));
    
    return row;
  }
  
  _createRowDataHeader(columns) {
    var row = CreateElement.createTableRow(null, null);
    
    this._config.columnOrder = [];
    
    for (var i = 0; i < columns.length; i++) {
      row.appendChild(CreateElement.createTableCell(null, null, columns[i].column_name, true));
      this._config.columnOrder.push(columns[i].column_name);
    }

    return row;
  }
  
  _createRowDataRow(rowData) {
    var row = CreateElement.createTableRow(null, null);
    
    for (var i = 0; i < this._config.columnOrder.length; i++) {
      var columnKey = this._config.columnOrder[i];
      row.appendChild(CreateElement.createTableCell(null, null, rowData[columnKey]));
    }
    
    return row;
  }
  
  _clearDatabaseSelections() {
    UtilityKTS.removeChildren(this.elemDBSelect);
    this._clearTableSelections();  
  }
  
  _clearTableSelections() {
    UtilityKTS.removeChildren(this.elemTableSelect);
    this._clearColumnData();
  }
  
  _clearColumnData() {
    UtilityKTS.removeChildren(this.elemColumnDataBody);
    this._clearRowData();
  }
  
  _clearRowData() {
    UtilityKTS.removeChildren(this.elemRowDataHead);
    UtilityKTS.removeChildren(this.elemRowDataBody);
  }
  
  async _doDBTest() {
    console.log('_doDBTest');
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------  
  async _handleDBTest() {
    await this._doDBTest(); 
  }
  
  async _handleDBSelect(e) {
    await this._loadTables(e.target.value);
  }
          
  async _handleTableSelect(e) {
    var dbName = this.elemDBSelect.value;
    await this._loadTableData(dbName, e.target.value);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------          
  _show(containerName, showMe) {
    UtilityKTS.setClass(container, this._config.hideClass, !showMe);
  }  
}
