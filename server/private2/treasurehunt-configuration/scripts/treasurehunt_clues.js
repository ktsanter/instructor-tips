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
    
    this._config.effectDescription = {
      none: 'none',
      effect: 'special effect',
      url: 'URL link',
      google_search: 'Google search',
      header: 'action'
    };
    
    this._container = null;
    this._editContainer = null;
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

  projectSelectionChanged() {
    this.clueInfo = this._config.projectControl.getProjectClues();
    if (this.clueInfo) {
      this._updateClues(this.clueInfo);
    } else {
      this.show(false);
    }
  }
  
  _updateClues(clueInfo) {
    var container = this._container.getElementsByClassName('clues-contents')[0];
    UtilityKTS.removeChildren(container);
    
    var header = {
      clueid: -1,
      number: 0,
      prompt: 'prompt',
      response: 'response',
      action: {type: 'header'},
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
    var elem;
    var classList = 'clue';
    if (isHeader) classList += ' header';
    
    var container = CreateElement.createDiv(null, classList);
    container.clueInfo = clue;
    container.addEventListener('dragover', (e) => {return this._dragoverHandler(e);});
    container.addEventListener('drop', (e) => {return this._dropHandler(e);});
    
    classList = 'clueval';
    var handler = (e) => {return this._handleClueEdit(e);};
    
    if (isHeader) {
      elem = CreateElement.createDiv(null, 'clue-reorder ' + classList);
    } else {
      var iconHandler = null;
      elem = CreateElement.createIcon(null, 'clue-handle fas fa-grip-vertical fa-lg ' + classList, null, iconHandler);
      elem.draggable = true;
      elem.addEventListener('dragstart', (e) => {this._dragstartHandler(e)});
      elem.addEventListener('dragend', (e) => {this._dragendHandler(e)});
    }
    container.appendChild(elem);
    
    elem = CreateElement.createDiv(null, 'clue-prompt ' + classList, clue.prompt);
    container.appendChild(elem);
    elem.editType = 'prompt';
    elem.addEventListener('click', handler);
    
    elem = CreateElement.createDiv(null, 'clue-response ' + classList, clue.response);
    container.appendChild(elem);
    elem.editType = 'response';
    elem.addEventListener('click', handler);
    
    var fieldVal = this._config.effectDescription[clue.action.type];
    if (clue.action.type == 'effect') fieldVal = 'effect (' + clue.action.effecttype + ')';
    elem = CreateElement.createDiv(null, 'clue-action ' + classList, fieldVal);
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
    if (this._editContainer && (this._editTarget == elemTarget)) {
      this._closeEdit();
      return;
    }

    if (this._editContainer) this._closeEdit();
    
    var elemEdit = CreateElement.createDiv(null, 'editcontainer');
    elemEdit.clueInfo = clueInfo;
    
    var elemField;
    
    if (editType == 'number') {
      var nClues = this.clueInfo.length;
      elemField = CreateElement.createSpinner(null, 'editnumber treasurehunt-spinner', clueInfo.number, 1, nClues, 1); 
      
    } else if (editType == 'prompt') {
      elemField = CreateElement.createTextInput(null, 'editprompt edittext treasurehunt-input', clueInfo.prompt);
      elemField.maxLength = 100;
      elemField.placeholder = 'prompt for clue';
      
    } else if (editType == 'response') {
      elemField = CreateElement.createTextInput(null, 'editresponse edittext treasurehunt-input', clueInfo.response);
      elemField.maxLength = 100;
      elemField.placeholder = 'correct response for clue';
      
    } else if (editType =='action') {
      elemField = this._buildActionDialog(clueInfo.action);
      
    } else if (editType == 'confirmation') {
      elemField = CreateElement.createTextInput(null, 'editconfirmation edittext treasurehunt-input', clueInfo.confirmation);
      elemField.maxLength = 100;
      elemField.placeholder = 'confirmation message to send to instructor';
    }
    
    if (elemField) {
      this._editContainer = elemEdit;
      this._editTarget = elemTarget;
      UtilityKTS.setClass(elemTarget, 'editing', true);
      UtilityKTS.setClass(elemTarget.parentNode, 'editing', true);
      
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
    UtilityKTS.setClass(this._editTarget.parentNode, 'editing', false);
    this._editContainer.parentNode.removeChild(this._editContainer);
    this._editContainer = null;
    this._editTarget = null;
  }
 
  _buildActionDialog(actionInfo) {
    var container = CreateElement.createDiv(null, 'editaction');
    container.actionInfo = actionInfo;
    
    var actionTypes = [
      {value: 'none', textval: this._config.effectDescription['none']},
      {value: 'url', textval: this._config.effectDescription['url']},
      {value: 'effect', textval: this._config.effectDescription['effect']},
      {value: 'google_search', textval: this._config.effectDescription['google_search']}
    ];
    
    var handler = (e) => {return this._handleActionSelect(e);};
    var elem = CreateElement.createSelect(null, 'editaction-select select-css', handler, actionTypes);
    container.appendChild(elem);
    elem.value = actionInfo.type;
    
    if (actionInfo.type == 'url') {
      var elem = CreateElement.createTextInput(null, 'actionurl treasurehunt-input', actionInfo.target);
      elem.maxLength = 100;
      elem.placeholder = 'https://';
      container.appendChild(elem);
      
    } else if (actionInfo.type == 'effect') {
      var effectTypes = [
        {value: 'bouncing_text', textval: 'bouncing text'}, 
        {value: 'fireworks', textval: 'fireworks'},
        {value: 'cannon_text', textval: 'cannon text'}
      ];
      var handler = (e) => {return this._handleActionEffectSelect(e);};
      var elem = CreateElement.createSelect(null, 'actioneffect-select select-css', handler, effectTypes)
      container.appendChild(elem);
      elem.value = actionInfo.effecttype;

      if (actionInfo.effecttype == 'bouncing_text' || actionInfo.effecttype == 'cannon_text') {
        var elem = CreateElement.createTextInput(null, 'actioneffect-message treasurehunt-input', actionInfo.message);
        elem.maxLength = 100;
        elem.placeholder = 'message';
        container.appendChild(elem);
      }

    } else if (actionInfo.type == 'google_search') {
      var elem = CreateElement.createTextInput(null, 'actionsearch treasurehunt-input', actionInfo.searchfor);
      elem.maxLength = 100;
      elem.placeholder = 'search phrase';
      container.appendChild(elem);
    }
    
    return container;
  }
  
  _rebuildActionDialog(actionType) {
    var currentContainer = this._container.getElementsByClassName('editaction')[0];
    var actionInfo = currentContainer.actionInfo;
    actionInfo.type = actionType;

    var newContainer = this._buildActionDialog(actionInfo);
    currentContainer.parentNode.replaceChild(newContainer, currentContainer);
  }
  
  _getClueInfoFromEditing(container) {
    var clueInfo = container.clueInfo;
    
    var elemType = container.firstChild;
    if (elemType.classList.contains('editprompt')) {
      clueInfo.prompt = elemType.value;
      
    } else if (elemType.classList.contains('editresponse')) {
      clueInfo.response = elemType.value;

    } else if (elemType.classList.contains('editaction')) {
      var action = {type: elemType.getElementsByClassName('editaction-select')[0].value};
      if (action.type == 'url') {
        action.target = elemType.getElementsByClassName('actionurl')[0].value;

      } else if (action.type == 'effect') {
        action.effecttype = elemType.getElementsByClassName('actioneffect-select')[0].value;
        if (action.effecttype == 'bouncing_text' || action.effecttype == 'cannon_text') {
          action.message = elemType.getElementsByClassName('actioneffect-message')[0].value
        }

      } else if (action.type == 'google_search') {
        action.searchfor = elemType.getElementsByClassName('actionsearch')[0].value;
      }
      clueInfo.action = action;

    } else if (elemType.classList.contains('editconfirmation')) {
      clueInfo.confirmation = elemType.value;
    }
    
    return clueInfo;
  }
   
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  async _handleClueAdd(e) {
    var params = this._config.defaultClue;
    params.projectid = this._config.projectControl.getProjectLayout().projectid;
    params.number = this.clueInfo.length + 1;
    
    await this._config.projectControl.insertClue(params);
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
      await this._config.projectControl.deleteClue(clueInfo);
    }
  }
  
  async _handleEditSave(e) {
    var params = this._getClueInfoFromEditing(e.target.parentNode);
    await this._config.projectControl.updateClue(params);

    this._closeEdit();
  }
  
  async _handleEditCancel(e) {
    this._closeEdit();
  }
  
  _handleActionSelect(e) {
    this._rebuildActionDialog(e.target.value);
  }
  
  _handleActionEffectSelect(e) {
    e.target.parentNode.actionInfo.effecttype = e.target.value;
    this._rebuildActionDialog(e.target.parentNode.actionInfo.type);
  }
  
  //--------------------------------------------------------------
  // drag and drop
  //-------------------------------------------------------------- 
  _dragstartHandler(e) {
    var clueInfo = e.target.parentNode.clueInfo;
    if (!clueInfo) {
      e.preventDefault();
      return false;
    }
    
    this._dragTarget = null;
    
    e.dataTransfer.setData('text', JSON.stringify(clueInfo));
    UtilityKTS.setClass(e.target.parentNode, 'dragsource', true);
    return true;
  }

  _dragoverHandler(e) {
    if (this._dragTarget) this._dragTarget.parentNode.removeChild(this._dragTarget);
    this._dragTarget = null;
    
    var dropContainer = this._getDropContainer(e.target);

    this._dragTarget = CreateElement._createElement('hr', null, 'dragtarget');    
    dropContainer.after(this._dragTarget);
    
    e.preventDefault();
  }  
  
  _dragendHandler(e) {
    if (this._dragTarget) this._dragTarget.parentNode.removeChild(this._dragTarget);
    this._dragTarget = null;

    UtilityKTS.setClass(e.target.parentNode, 'dragsource', false);

    return true;
  }
  
  async _dropHandler(e) {
    var data = e.dataTransfer.getData('text');
    if (!data) return false;
    
    var sourceClueInfo = JSON.parse(data);
    var destClueInfo = this._getDropContainer(e.target).clueInfo;
    var projectInfo = this._config.projectControl.getProjectLayout();

    var params = {
      projectid: projectInfo.projectid,
      sourceclueid: sourceClueInfo.clueid,
      sourcecluenumber: sourceClueInfo.number,
      destcluenumber: destClueInfo.number
    }
    
    if (params.sourcecluenumber == params.destcluenumber) return true; // no move
    
    await this._config.projectControl.repositionClue(params);
    
    return true;    
  }
  
  _getDropContainer(elemDroppedOn) {
    var container = null;
    var node = elemDroppedOn;
    for (var i = 0; i < 5  && !container; i++) {
      if (node.classList.contains('clue')) container = node;
      node = node.parentNode;
    }
    
    return container;
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
}
