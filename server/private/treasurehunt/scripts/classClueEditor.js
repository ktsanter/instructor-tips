//-------------------------------------------------------------------
// ClueEditor class (for Treasure Hunt configuration)
//-------------------------------------------------------------------
// TODO: support reordering of clues
//-------------------------------------------------------------------
class ClueEditor {
  constructor(config) {
    this._config = config;
    this._config.tableContainerClass = 'clues-table-container';
    this._config.editContainerClass = 'clues-editor-container';
    this._config.tableBodyClass = 'clues-table-body';    
    
    this.tiny = null;
  }
  
  //--------------------------------------------------------------
  // initializing
  //--------------------------------------------------------------
  async init() {
    this.tiny = {};
    var editorList = ['tinyCluePrompt', 'tinyClueResponse', 'tinyClueConfirmation'];
    
    for (var i = 0; i < editorList.length; i++) {
      var editorId = editorList[i];

      var tiny = new MyTinyMCE({
        id: editorId,
        selector: '#' + editorId,
        changeCallback: this._handleEditorChange,
        height: 200
      });
      await tiny.init();
      
      this.tiny[editorId] = tiny;
    }
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render() { 
    this.elemTableContainer = document.getElementsByClassName(this._config.tableContainerClass)[0];
    this.elemTableBody = this.elemTableContainer.getElementsByClassName(this._config.tableBodyClass)[0];
    
    this.elemEditContainer = document.getElementsByClassName(this._config.editContainerClass)[0];
    this.elemActionSelect = this.elemEditContainer.getElementsByClassName('select-action')[0];
    this.elemActionSearchFor = this.elemEditContainer.getElementsByClassName('input-searchfor')[0];
    this.elemActionURL = this.elemEditContainer.getElementsByClassName('input-url')[0];
    this.elemActionEffectSelect = this.elemEditContainer.getElementsByClassName('select-effect')[0];
    
    this.elemTableContainer.getElementsByClassName('add-icon')[0].addEventListener('click', (e) => { this._handleRowAdd(e); });
    this.elemActionSelect.addEventListener('change', (e) => { this._handleActionChange(e); });
    
    this.elemEditContainer.getElementsByClassName('button-clue-okay')[0].addEventListener('click', () => { this._handleEndEdit(true); });
    this.elemEditContainer.getElementsByClassName('button-clue-cancel')[0].addEventListener('click', () => { this._handleEndEdit(false); });
   }
    
  _renderTableRow(rowData) {
    var elemRow = CreateElement._createElement('tr', null, null);
    
    elemRow.clue = rowData;
    elemRow.appendChild(this._renderRowControlCell());
    elemRow.appendChild(this._renderTableCell(rowData.prompt));
    elemRow.appendChild(this._renderTableCell(rowData.response));
    elemRow.appendChild(this._renderTableCell(rowData.confirmation));
    elemRow.appendChild(this._renderTableCell(rowData.action.type));

    return elemRow;
  }
  
  _renderRowControlCell() {
    var elemCell = CreateElement._createElement('td', null, null);
    
    elemCell.innerHTML = 'tbd';
    
    return elemCell;
  }
  
  _renderTableCell(columnData) {
    var elemCell = CreateElement._createElement('td', null, null);
    
    elemCell.innerHTML = columnData;
    
    elemCell.addEventListener('click', (e) => { this._handleRowEdit(e); });
    
    return elemCell;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(clueList) {
    console.log('ClueEditor update');
    
    UtilityKTS.removeChildren(this.elemTableBody);
    
    for (var i = 0; i < clueList.length; i++) {
      var clue = clueList[i];
      this.elemTableBody.appendChild(this._renderTableRow(clue));
    }
    
    UtilityKTS.setClass(this.elemTableContainer, this._config.hideClass, false);
    UtilityKTS.setClass(this.elemEditContainer, this._config.hideClass, true);  
  }
  
  _initiateEdit(clue) {
    console.log('_initiateEdit');
    console.log(JSON.stringify(clue));
    
    this.tiny.tinyCluePrompt.setContent(clue.prompt);
    this.tiny.tinyClueResponse.setContent(clue.response);
    this.tiny.tinyClueConfirmation.setContent(clue.confirmation);
    
    this.elemActionSelect.value = clue.action.type;
    this.elemActionSearchFor.value = clue.action.searchfor;
    this.elemActionURL.value = clue.action.target;
    this.elemActionEffectSelect.value = clue.action.effecttype;
    
    this.elemActionSelect.dispatchEvent(new Event("change"));

    UtilityKTS.setClass(this.elemTableContainer, this._config.hideClass, true);
    UtilityKTS.setClass(this.elemEditContainer, this._config.hideClass, false);  
  }
  
  _endEdit(saveChanges) {
    console.log('_endEdit: ' + saveChanges);

    UtilityKTS.setClass(this.elemTableContainer, this._config.hideClass, false);
    UtilityKTS.setClass(this.elemEditContainer, this._config.hideClass, true);  
  }
  
  async _postUpdate(params) {
    var success = await this._config.updateCallback(params);
    if (success) await this.update();
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
  _handleRowEdit(e) {
    this._initiateEdit(e.target.parentNode.clue);
  }
  
  _handleEndEdit(saveChanges) {
    this._endEdit(saveChanges);
  }
  
  _handleActionChange(e) {
    console.log('_handleActionChange');
    var action = this.elemActionSelect.value;
    UtilityKTS.setClass(this.elemActionSearchFor.parentNode, this._config.hideClass, action != 'google_search');
    UtilityKTS.setClass(this.elemActionURL.parentNode, this._config.hideClass, action != 'url');
    UtilityKTS.setClass(this.elemActionEffectSelect.parentNode, this._config.hideClass, action != 'effect');
  }
  
  async _handleRowDelete(e) {
    console.log('_handleRowDelete (callback?)');
    //await this._postDelete(e.target.primaryKeyInfo);
  }

  async _handleRowAdd(e) {
    console.log('_handleRowAdd (callback?)');
    //await this._postAdd({"tableName": e.target.primaryKeyInfo.tableName});
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------        
}
