//-------------------------------------------------------------------
// DBAdminTableEdit class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

class DBAdminTableEdit {
  constructor(dbData, callbacks, colgroupinfo) {
    this._version = '0.01';
    this._HIDE_CLASS = 'dbadmin-container-hide';
    this._INVISIBLE_CLASS = 'dbadmin-invisible';
    this._HIGHLIGHT_CLASS = 'dbadmin-highlight';

    this._dbData = dbData;
    this._displayFields = this._dbData.displayFields;
    this._callbacks = callbacks;
    this._colgroupInfo = colgroupinfo;
        
    this._container = null;
    this._changeDialogInProcess = false;
    this._origDBDataRow = null;
    this._newDBDataRow = null;
  }
  
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, null);

    this.update();
    
    return this._container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update() {
    this._clear(this._container);    
    this._changeDialogInProcess = false;
    this._origDBDataRow = null;
    this._newDBDataRow = null;
    
    var tableContainer = CreateElement.createDiv(null, 'dbadmin-tableedit');
    this._container.appendChild(this._makeAddContainer());
    this._container.appendChild(tableContainer);
    this._container.appendChild(this._makeEditContainer());
    this._container.appendChild(this._makeDeleteContainer());
    
    var headers = [
      CreateElement.createIcon(null, 'dbadmin-rowicon far fa-plus-square', 'add new row', (e) => {return this._startAdd(e);}),
      CreateElement.createIcon(null, 'dbadmin-rowicon far fa-trash-alt dbadmin-invisible')
    ];
    var contents = [];
    
    var displayFields = this._dbData.displayFields;
    for (var i = 0; i < displayFields.length; i++) {
      headers.push(CreateElement.createSpan(null, null, displayFields[i]));
    }
    headers.push(CreateElement.createSpan(null, 'dbadmin-editcell'));
    console.log(this._dbData);
    var primaryData = this._dbData.data;
    for (var i = 0; i < primaryData.length; i++) {
      contents[i] = [];
      contents[i].push(
        CreateElement.createIcon(null, 'dbadmin-rowicon fas fa-edit', 'edit', (e) => {return this._startEdit(e);}),
        CreateElement.createIcon(null, 'dbadmin-rowicon far fa-trash-alt', 'delete', (e) => {return this._startDelete(e);})
      );
      for (var j = 0; j < displayFields.length; j++) {
        var fieldVal = primaryData[i][displayFields[j]];
        if (fieldVal == null) fieldVal = 'null';
        contents[i].push(CreateElement.createSpan(null, 'dbadmin-field', fieldVal));
      }
      contents[i].push(CreateElement.createSpan(null, 'dbadmin-editcell'));
    }
    
    var dataTable = CreateElement.createTable(null, null, headers, contents, null, true, this._colgroupInfo);
    tableContainer.appendChild(dataTable);
    var rows = dataTable.getElementsByTagName('tr');
    for (var i = 1; i < rows.length; i++) {
      rows[i].dbDataIndex = i - 1;
    }
    
    var editCells = tableContainer.getElementsByClassName('dbadmin-editcell');
    for (var i = 0; i < editCells.length; i++) {
      editCells[i].parentNode.classList.add(this._INVISIBLE_CLASS);
    }
  }

  _makeEditContainer() {
    this._editContainer = CreateElement.createDiv(null, this._HIDE_CLASS + ' dbadmin-editcontainer');
    
    this._editContainer.appendChild(CreateElement.createDiv(null, 'dbadmin-content dbadmin-editcontent'));
    
    var iconContainer = CreateElement.createDiv(null, null);
    this._editContainer.appendChild(iconContainer);
    iconContainer.appendChild(CreateElement.createIcon(null, 'dbadmin-editicon far fa-check-square', 'save', (e) => {return this._finalizeEdit(e);}))
    iconContainer.appendChild(CreateElement.createIcon(null, 'dbadmin-editicon far fa-window-close', 'cancel', (e) => {return this._cancelEdit(e);}))

    return this._editContainer;
  }
  
  _makeDeleteContainer() {
    this._deleteContainer = CreateElement.createDiv(null, this._HIDE_CLASS + ' dbadmin-editcontainer' );
    
    this._deleteContainer.appendChild(CreateElement.createDiv(null, 'dbadmin-datacontent dbadmin-deletecontent'));
    
    var iconContainer = CreateElement.createDiv(null, null);
    this._deleteContainer.appendChild(iconContainer);
    iconContainer.appendChild(CreateElement.createIcon(null, 'dbadmin-editicon far fa-check-square', 'delete', (e) => {return this._finalizeDelete(e);}))
    iconContainer.appendChild(CreateElement.createIcon(null, 'dbadmin-editicon far fa-window-close', 'cancel', (e) => {return this._cancelDelete(e);}))

    return this._deleteContainer;
  }
  
  _makeAddContainer() {
    this._addContainer = CreateElement.createDiv(null, this._HIDE_CLASS + ' dbadmin-editcontainer');
    
    this._addContainer.appendChild(CreateElement.createDiv(null, 'dbadmin-content dbadmin-addcontent'));
    
    var iconContainer = CreateElement.createDiv(null, null);
    this._addContainer.appendChild(iconContainer);
    iconContainer.appendChild(CreateElement.createIcon(null, 'dbadmin-editicon far fa-check-square', 'add', (e) => {return this._finalizeAdd(e);}))
    iconContainer.appendChild(CreateElement.createIcon(null, 'dbadmin-editicon far fa-window-close', 'cancel', (e) => {return this._cancelAdd(e);}))

    return this._addContainer;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _startEdit(e) {
    if (this._changeDialogInProcess) return;
    this._changeDialogInProcess = true;

    var elemRow = e.target.parentNode.parentNode;
    var dbDataIndex = elemRow.dbDataIndex;
    this._origDBDataRow = this._dbData.data[dbDataIndex];
    this._highlight(elemRow, true);
    
    var editContent = this._editContainer.getElementsByClassName('dbadmin-editcontent')[0];
    this._clear(editContent);
    
    
    var fieldList = this._dbData.insertUpdateFields;
    for (var key in fieldList) {
      var field = fieldList[key];
      var fieldName = this._getKey(field);
      var fieldValue = this._origDBDataRow[fieldName];
      var editField = this._makeEditElementForField(field, fieldValue);
      editContent.appendChild(editField);
    }

    this._editContainer.parentNode.removeChild(this._editContainer);
    var newEditLocation = elemRow.getElementsByClassName('dbadmin-editcell')[0].parentNode;
    newEditLocation.appendChild(this._editContainer);
    newEditLocation.classList.remove(this._INVISIBLE_CLASS);
    
    this._show(this._editContainer, true);
  }
  
  async _finalizeEdit(e) {
    var editContent = this._editContainer.getElementsByClassName('dbadmin-editcontent')[0];
    var editData = this._getFieldsFromContent(editContent);

    var pkey = this._dbData.primaryKey;
    var pkeyVal = this._origDBDataRow[pkey];
    editData[pkey] = pkeyVal;

    await this._callbacks.update(editData);
    this._dbData = await this._callbacks.requery();
    this.update();
  }
  
  _cancelEdit(e) {
    this.update();
  }
    
  _startDelete(e) {
    if (this._changeDialogInProcess) return;
    this._changeDialogInProcess = true;
    var elemRow = e.target.parentNode.parentNode;
    var dbDataIndex = elemRow.dbDataIndex;
    this._origDBDataRow = this._dbData.data[dbDataIndex];
    
    this._highlight(elemRow, true);
    var deleteContent = this._deleteContainer.getElementsByClassName('dbadmin-deletecontent')[0];
    this._clear(deleteContent);
    for (var i = 0; i < this._displayFields.length; i++) {
      var dbVal = this._origDBDataRow[this._displayFields[i]];
      if (dbVal == null) dbVal = 'null';
      deleteContent.appendChild(CreateElement.createDiv(null, 'dbadmin-datacontent-item', dbVal));
    }

    this._deleteContainer.parentNode.removeChild(this._deleteContainer);
    var newDeleteLocation = elemRow.getElementsByClassName('dbadmin-editcell')[0].parentNode;
    newDeleteLocation.appendChild(this._deleteContainer);
    newDeleteLocation.classList.remove(this._INVISIBLE_CLASS);
    
    this._show(this._deleteContainer, true);
  }
  
  async _finalizeDelete(e) {
    if (confirm('Deletions cannot be undone\nAre you sure you want to delete this row?')) {
      var primaryKey = this._dbData.primaryKey;
      var primaryKeyValue = this._origDBDataRow[primaryKey];
      var deleteData = {};
      deleteData[primaryKey] = primaryKeyValue;
      
      await this._callbacks.delete(deleteData);
      this._dbData = await this._callbacks.requery();
    }
    this.update();
  }
  
  _cancelDelete(e) {
    this.update();
  }
  
  _startAdd(e) {
    if (this._changeDialogInProcess) return;
    this._changeDialogInProcess = true;

    var addContent = this._addContainer.getElementsByClassName('dbadmin-addcontent')[0];
    this._clear(addContent);
    
    var fieldList = this._dbData.insertUpdateFields;
    for (var key in fieldList) {
      var field = fieldList[key];
      var editField = this._makeEditElementForField(field);
      addContent.appendChild(editField);
    }
    
    this._show(this._addContainer, true);
  }

  async _finalizeAdd(e) {
    var addContent = this._addContainer.getElementsByClassName('dbadmin-addcontent')[0];
    var addData = this._getFieldsFromContent(addContent);
    
    await this._callbacks.insert(addData);
    this._dbData = await this._callbacks.requery();
    this.update();
  }
  
  _cancelAdd(e) {
    this.update();
  }
  

  //--------------------------------------------------------------
  // utility functions
  //--------------------------------------------------------------
  _show(elem, makeVisible) {
    if (makeVisible) {
        if (elem.classList.contains(this._HIDE_CLASS)) {
          elem.classList.remove(this._HIDE_CLASS);
          elem.style.display = 'block';
        }
        
    } else {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  _highlight(elem, makeHighlight) {
    if (!makeHighlight) {
        if (elem.classList.contains(this._HIGHLIGHT_CLASS)) {
          elem.classList.remove(this._HIGHLIGHT_CLASS);
        }
        
    } else {
      elem.classList.add(this._HIGHLIGHT_CLASS);
    }
  }

  _clear(elemParent) {
    while (elemParent.firstChild) {
      elemParent.removeChild(elemParent.firstChild);
    }
  }
  
  _getKey(obj) {
    var firstKey = null;
    for (var key in obj) {
      firstKey = key;
    }
    return firstKey;
  }
  
  _makeEditElementForField(field, fieldValue) {
    var elem;
    var fieldName = this._getKey(field);
    var fieldType = field[fieldName];
    
    if (fieldType == 'text') {
      elem = CreateElement.createTextInput('input' + fieldName, 'dbadmin-editfield');
      elem.placeholder = fieldName;
      if (fieldValue) {
        elem.value = fieldValue;
      }
      
    } else if (fieldType == 'textarea') {
      elem = CreateElement.createTextArea('textarea' + fieldName, 'dbadmin-editfield');
      elem.placeholder = fieldName;
      if (fieldValue) {
      elem.value = fieldValue;
      }
      elem.rows = 8;

    } else if (fieldType == 'foreignkey') {
      var constraint = this._dbData.constraints.foreignKeys[fieldName];
      var displayField = constraint.displayField;
      var constraintData = this._dbData.constraints[constraint.data];
      var allowNull = constraint.allownull;
      elem = this._buildSelectFromData(fieldName, displayField, constraintData, fieldValue, allowNull);

    } else if (fieldType == 'boolean') {
      elem = CreateElement.createCheckbox('boolean' + fieldName, 'dbadmin-editfield', fieldName, 'boolean', fieldName, false);
      if (fieldValue != null) {
        elem.firstChild.checked = (fieldValue == '1');
      }
      
    } else {
      elem = CreateElement.createSpan(null, null, 'unrecognized field type');
    }
    
    return elem;
  }
  
  _buildSelectFromData(keyField, displayField, data, initialValue, allowNull) {
    var selectVals = [];
    if (allowNull) {
      selectVals.push({id: 'null', value: null, textval: 'null'});
    }
    
    for (var i = 0; i < data.length; i++) {
      var rowData = data[i];
      selectVals.push({id: i, value: rowData[keyField], textval: rowData[displayField]});
    }
        
    var elemSelect = CreateElement.createSelect('select' + keyField, 'dbadmin-editfield', null, selectVals);

    if (initialValue) {
      var optionElements = elemSelect.getElementsByTagName('option');
      for (var i = 0; i < selectVals.length; i++) {
        var opt = optionElements[i];
        if (opt.value == initialValue) {
          elemSelect.selectedIndex = i;
        }
      }        
    }
    
    return elemSelect;
  }
  
  _getFieldsFromContent(contentContainer) {
    var fields = {};
    
    var editFields = contentContainer.getElementsByClassName('dbadmin-editfield');
    for (var i = 0; i < editFields.length; i++) {
      var fieldName = 'unknown';
      var fieldValue = null;
      var elem = editFields[i];

      if (elem.id.slice(0, 'input'.length) == 'input') {
        fieldName = elem.id.slice('input'.length);
        fieldValue = elem.value;
        
      } else if (elem.id.slice(0, 'textarea'.length) == 'textarea') {
        fieldName = elem.id.slice('textarea'.length);
        fieldValue = elem.value;

      } else if (elem.id.slice(0, 'select'.length) == 'select') {
        fieldName = elem.id.slice('select'.length);
        fieldValue = elem.value;

      } else if (elem.id.slice(0, 'boolean'.length) == 'boolean') {
        fieldName = elem.id.slice('boolean'.length);
        fieldValue = elem.checked;
        
      } else {
        //console.log('**ERR: _getFieldsFromContent - unrecognized child ID "' + elem.id + '"');
      }
      
      if (fieldValue != null) {
        fields[fieldName] = fieldValue;
      }
    }
        
    return fields;
  }
}
