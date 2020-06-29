//-----------------------------------------------------------------------------------
// TreasureHuntClues class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TreasureHuntClues {
  constructor(config) {
    this._version = '0.01';
    this._title = 'TreasureHuntClues';
    
    this._HIDE_CLASS = 'clues-hide';

    this._config = {};
    if (config) this._config = config;
    
    this._container = null;
    this._editContainer = null;
    
    this.dummyClueInfo = [
      {
        clueId: 101,
        prompt: 'prompt1',
        response: 'response1',
        action: {
          type: 'url',
          target: 'http://andrew.wang-hoyer.com/experiments/cloth/'
        },
        confirmation: 'confirmation1'
      },      
      {
        clueId: 102,
        prompt: 'prompt2',
        response: 'response2',
        action: {
          type: 'effect',
          effecttype: 'bouncing_text',
          message: 'Congratulations!'
        },
        confirmation: 'confirmation2'
      },
      {
        clueId: 103,
        prompt: 'prompt3xxxxxxxxxxxxxxxxxxxyyyyyyyyyyyyyyyyyyyyy',
        response: 'response3',
        action: {
          type: 'google_search',
          searchfor: 'do a barrel roll'
        },
        confirmation: 'confirmation3'
      },
      {      
        clueId: 104,
        prompt: 'prompt4',
        response: 'response4',
        action: {
          type: 'effect',
          effecttype: 'cannon_text',
          message: 'well done!!'
        },
        confirmation: 'confirmation1'
      }      
    ];
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'treasurehuntclues ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderContents());

    return this._container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'clues-contents');
    
    return container;
  }
            
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) { 
    this._showElement(this._container, makeVisible);
  }
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update(params) {
    console.log('TreasureHuntClues.update');
    this.projectParams = params;
    this.clueInfo = await this._getClueInfo(params);
    
    this._updateClues(this.clueInfo);
  }
  
  _updateClues(clueInfo) {
    var container = this._container.getElementsByClassName('clues-contents')[0];
    UtilityKTS.removeChildren(container);
    
    var header = {
      number: '#',
      prompt: 'prompt',
      response: 'response',
      action: {type: 'action'},
      confirmation: 'confirmation'
    };
    container.appendChild(this._renderClue(header, true));
      
    for (var i = 0; i < clueInfo.length; i++) {
      var clue = clueInfo[i];
      clue.number = (i + 1);
      container.appendChild(this._renderClue(clue, false));
    }
  }
  
  _renderClue(clue, isHeader) {
    var classList = 'clue';
    if (isHeader) classList += ' header';
    var container = CreateElement.createDiv(null, classList);
    container.clueInfo = clue;
    
    classList = 'clueval';
    var handler = (e) => {return this._handleClueEdit(e);};
    
    var elem = CreateElement.createDiv(null, 'clue-number ' + classList, clue.number);
    container.appendChild(elem);
    elem.editType = 'number';
    elem.addEventListener('click', handler);
    
    elem = CreateElement.createDiv(null, 'clue-prompt ' + classList, clue.prompt);
    container.appendChild(elem);
    elem.editType = 'prompt';
    elem.addEventListener('click', handler);
    
    elem = CreateElement.createDiv(null, 'clue-response ' + classList, clue.response);
    container.appendChild(elem);
    elem.editType = 'response';
    elem.addEventListener('click', handler);
    
    elem = CreateElement.createDiv(null, 'clue-action ' + classList, clue.action.type)
    container.appendChild(elem);
    elem.editType = 'action';
    elem.addEventListener('click', handler);
    
    elem = CreateElement.createDiv(null, 'clue-confirmation ' + classList, clue.confirmation);
    container.appendChild(elem);
    elem.editType = 'confirmation';
    elem.addEventListener('click', handler);
    
    if (isHeader) {
      handler = (e) => {return this._handleClueAdd(e);};
      container.appendChild(CreateElement.createIcon(null, 'clueicon far fa-plus-square', 'add a new clue', handler))

    } else {
      handler = (e) => {return this._handleClueDelete(e);};
      container.appendChild(CreateElement.createIcon(null, 'clueicon far fa-trash-alt', 'delete this clue', handler))
    }
    
    return container;
  }
  
  //--------------------------------------------------------------
  // clue editing
  //--------------------------------------------------------------
  _startEdit(editType, clueInfo, elemTarget) {
    if (this._editContainer) this._closeEdit();

    var elemEdit = CreateElement.createDiv(null, 'editcontainer');
    elemEdit.clueInfo = clueInfo;
    
    var elemField;
    
    if (editType == 'number') {
      var nClues = this.clueInfo.length;
      elemField = CreateElement.createSpinner(null, 'editnumber treasurehunt-spinner', clueInfo.number, 1, nClues, 1);  // calculate max
      
    } else if (editType == 'prompt') {
      console.log('prompt');
      
    } else if (editType == 'response') {
      console.log('response');
      
    } else if (editType =='action') {
      console.log('action');
      
    } else if (editType == 'confirmation') {
      console.log('confirmation');
    }
    
    if (elemField) {
      this._editContainer = elemEdit;
      this._editTarget = elemTarget;
      UtilityKTS.setClass(elemTarget, 'editing', true);
      
      elemEdit.appendChild(elemField);

      var handler = (e) => {return this._handleEditSave(e);};
      elemEdit.appendChild(CreateElement.createIcon(null, 'editicon far fa-check-square', 'save changes', handler))
      handler = (e) => {return this._handleEditCancel(e);};
      elemEdit.appendChild(CreateElement.createIcon(null, 'editicon far fa-window-close', 'discard changes', handler))

      //append save/cancel
      elemTarget.parentNode.appendChild(elemEdit);
    } else {
      this._editContainer = null;
    }
  }
  
  _closeEdit() {
    if (!this._editContainer) return;
    
    UtilityKTS.setClass(this._editTarget, 'editing', false);
    this._editContainer.parentNode.removeChild(this._editContainer);
    this._editContainer = null;
  }
  
  //--------------------------------------------------------------
  // save and load with DB
  //--------------------------------------------------------------
  async _getClueInfo(params) {
    console.log('TreasureHuntClues._getClueInfo for id=' + params.projectId + ' name=' + params.projectName);
    
    return this.dummyClueInfo;  // get from DB
  }

  async _dbInsertClue() {
    console.log('insert clue');
    var params = this._config.defaultClue;
    console.log(params);
  }
  
  async _dbUpdateClue(clueInfo) {
    var clueId = clueInfo.clueId
    console.log('update clue: id=' + clueId);
  }
  
  async _dbDeleteClue(clueInfo) {
    var clueId = clueInfo.clueId
    console.log('delete clue: id=' + clueId);
  }    
   
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  async _handleClueAdd(e) {
    await this._dbInsertClue();
    await this.update(this.projectParams);
  }
  
  _handleClueEdit(e) {
    var editType = e.target.editType;
    var clueInfo = e.target.parentNode.clueInfo;
    
    this._startEdit(editType, clueInfo, e.target);
  }
  
  async _handleClueDelete(e) {
    var clueInfo = e.target.parentNode.clueInfo;
    var msg = 'This clue will be deleted and cannot be recovered:';
    msg += '\nnumber: ' + clueInfo.number;
    msg += '\nprompt: ' + clueInfo.prompt;
    msg += '\n\nAre you sure?';
    
    if (confirm(msg)) {
      await this._dbDeleteClue(clueInfo);
      await this.update(this.projectParams);
    }
  }
  
  async _handleEditSave(e) {
    console.log('edit save');
    console.log(e.target.parentNode);
  }
  
  async _handleEditCancel(e) {
    console.log('edit cancel');
    this._closeEdit();
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
}
