//-------------------------------------------------------------------
// ClueEditor class (for Treasure Hunt configuration)
//-------------------------------------------------------------------
// TODO: styling
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
        changeCallback: (e) => { this._handleEditorChange(); },
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
    this.elemActionEffectMessage = this.elemEditContainer.getElementsByClassName('input-effectmessage')[0];
    
    this.elemTableContainer.getElementsByClassName('add-icon')[0].addEventListener('click', (e) => { this._handleRowAdd(e); });
    this.elemActionSelect.addEventListener('change', (e) => { this._handleActionChange(e); });
    
    this.elemEditContainer.getElementsByClassName('button-clue-okay')[0].addEventListener('click', () => { this._handleRowEditEnd(true); });
    this.elemEditContainer.getElementsByClassName('button-clue-cancel')[0].addEventListener('click', () => { this._handleRowEditEnd(false); });
   }
    
  _renderTableRow(rowData) {
    var elemRow = CreateElement._createElement('tr', null, 'clues-table-row');

    elemRow.clue = rowData;
    if (rowData.number == 1) {
      elemRow.appendChild(this._renderRowControlCell('none'));
    } else {
      elemRow.appendChild(this._renderRowControlCell('move'));
    }
    elemRow.appendChild(this._renderTableCell(rowData.prompt));
    elemRow.appendChild(this._renderTableCell(rowData.response));
    elemRow.appendChild(this._renderTableCell(rowData.confirmation));
    elemRow.appendChild(this._renderTableCell(rowData.action.type));
    elemRow.appendChild(this._renderRowControlCell('delete'));

    return elemRow;
  }
  
  _renderRowControlCell(controlType) {
    var elemCell = CreateElement._createElement('td', null, null);
    
    if (controlType == 'move') {
      var handler = (e) => { this._handleRowControl(e, 'move'); };
      elemCell.appendChild(CreateElement.createIcon(null, 'clues-control reorder fas fa-arrow-circle-up', null, handler));

    } else if (controlType == 'delete') {
      var handler = (e) => { this._handleRowControl(e, 'delete'); };
      elemCell.appendChild(CreateElement.createIcon(null, 'clues-control delete fas fa-trash-alt', null, handler));
    }
    
    return elemCell;
  }
  
  _renderTableCell(columnData) {
    var elemCell = CreateElement._createElement('td', null, 'clues-table-cell');
    
    elemCell.innerHTML = columnData;
    
    elemCell.addEventListener('click', (e) => { this._handleRowEditInitiation(e); });
    
    return elemCell;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(clueList) {
    this.clueList = [...clueList];
    
    UtilityKTS.removeChildren(this.elemTableBody);
    
    for (var i = 0; i < clueList.length; i++) {
      var clue = clueList[i];
      this.elemTableBody.appendChild(this._renderTableRow(clue));
    }
    
    this._config.callbackShowSaveReload(true);

    UtilityKTS.setClass(this.elemTableContainer, this._config.hideClass, false);
    UtilityKTS.setClass(this.elemEditContainer, this._config.hideClass, true);  
  }
  
  getClueList() {
    return this.clueList;
  }
  
  _initiateRowEdit(clue) {
    this.clueBeingEdited = clue;

    this.tiny.tinyCluePrompt.setContent(clue.prompt);
    this.tiny.tinyClueResponse.setContent(clue.response);
    this.tiny.tinyClueConfirmation.setContent(clue.confirmation);
    
    this.elemActionSelect.value = clue.action.type;
    this.elemActionSearchFor.value = clue.action.searchfor;
    this.elemActionURL.value = clue.action.target;
    this.elemActionEffectSelect.value = clue.action.effecttype;
    this.elemActionEffectMessage.value = clue.action.message;
    
    this.elemActionSelect.dispatchEvent(new Event("change"));

    this._config.callbackShowSaveReload(false);
    UtilityKTS.setClass(this.elemTableContainer, this._config.hideClass, true);
    UtilityKTS.setClass(this.elemEditContainer, this._config.hideClass, false);
  }
  
  _endRowEdit(saveChanges) {
    if (saveChanges) {
      var updatedClue = {...this.clueBeingEdited};
      updatedClue.prompt = this.tiny.tinyCluePrompt.getContent();
      updatedClue.response = this.tiny.tinyClueResponse.getContent();
      updatedClue.confirmation = this.tiny.tinyClueConfirmation.getContent();
      updatedClue.action = {
        type: this.elemActionSelect.value,
        searchfor: this.elemActionSearchFor.value,
        target: this.elemActionURL.value,
        effecttype: this.elemActionEffectSelect.value,
        message: this.elemActionEffectMessage.value
      };

      this._updateTableRow(updatedClue);
      this._config.callbackClueChange();
    }
    
    this._config.callbackShowSaveReload(true);
    
    UtilityKTS.setClass(this.elemTableContainer, this._config.hideClass, false);
    UtilityKTS.setClass(this.elemEditContainer, this._config.hideClass, true);  
  }
  
  _updateTableRow(updatedClue) {
    var foundClueIndex = null;
    for (var i = 0; i < this.clueList.length && !foundClueIndex; i++) {
      if (this.clueList[i].clueid == updatedClue.clueid) foundClueIndex = i; 
    }

    if (foundClueIndex != null) {
      var updatedClueList = [...this.clueList];
      updatedClueList[foundClueIndex] = updatedClue;
      this.update(updatedClueList);
    }  
  }
  
  _addClue() {
    var updatedClueList = [...this.clueList];

    var clueNumber = updatedClueList.length + 1;
    var clueId = 'tempid' + clueNumber;

    updatedClueList.push({
      clueid: clueId,
      number: clueNumber,
      prompt: '<p>default prompt</p>',
      response: '<p>default response</p>',
      confirmation: '<p>default confirmation</p>',
      action: {
        type: 'none',
        effecttype: '',
        target: '',
        message: '',
        searchfor: ''
      }
    });
      
    this.update(updatedClueList);
    this._config.callbackClueChange();    
    this._config.callbackShowSaveReload(true);      
  }
  
  _deleteClue(clue) {
    var clueIndex = clue.number - 1;
    var updatedClueList = [...this.clueList];
    updatedClueList.splice(clueIndex, 1);
    
    for (var i = 0; i < updatedClueList.length; i++) {
      updatedClueList[i].number = (i + 1);
    }
    
    this.update(updatedClueList);
    this._config.callbackClueChange();    
    this._config.callbackShowSaveReload(true);      
  }
  
  _moveClueUp(clue) {
    var clueIndex = clue.number - 1;
    
    this.clueList[clueIndex].number--;
    this.clueList[clueIndex - 1].number++;
    
    this.clueList = this.clueList.sort( function(a, b) {
      return (a.number - b.number);
    });
    
    this.update(this.clueList);
    this._config.callbackClueChange();    
    this._config.callbackShowSaveReload(true);     
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
  _handleEditorChange(edit) {}
  
  _handleRowEditInitiation(e) {
    var target = e.target;
    while (!target.classList.contains('clues-table-row')) {
      target = target.parentNode;
    }

    this._initiateRowEdit({...target.clue});
  }
  
  _handleRowEditEnd(saveChanges) {
    this._endRowEdit(saveChanges);
  }
  
  _handleActionChange(e) {
    var action = this.elemActionSelect.value;
    UtilityKTS.setClass(this.elemActionSearchFor.parentNode, this._config.hideClass, action != 'google_search');
    UtilityKTS.setClass(this.elemActionURL.parentNode, this._config.hideClass, action != 'url');
    UtilityKTS.setClass(this.elemActionEffectSelect.parentNode, this._config.hideClass, action != 'effect');
    UtilityKTS.setClass(this.elemActionEffectMessage.parentNode, this._config.hideClass, action != 'effect');
  }

  _handleRowAdd(e) {
    this._addClue();
  }
  
  _handleRowControl(e, controlType) {
    var target = e.target;
    while (!target.classList.contains('clues-table-row')) {
      target = target.parentNode;
    }
    if (controlType == 'move') {
      this._moveClueUp(target.clue);
    } else {
      this._deleteClue(target.clue);
    }
  }

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------        
}
