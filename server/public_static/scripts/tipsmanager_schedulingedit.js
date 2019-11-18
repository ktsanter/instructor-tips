//-----------------------------------------------------------------------------------
// TipSchedulingEdit class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipSchedulingEdit {
  constructor(config) {
    this._version = '0.01';
    this._title = 'SchedulingEdit';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
    this._config = config;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'tipschedule-edit');
    
    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  update(tipsData) {
    if (this._config.editType == 'add tip') {
      this._updateForAdd(tipsData);
    } else if (this._config.editType == 'edit tip') {
      this._updateForEdit(tipsData);
    }
  }
  
  _updateForAdd(tipsData) {
    var tipValues = [];
    for (var i = 0; i < tipsData.length; i++) {
      var tip = tipsData[i];
      tipValues.push({id: tip.tipid, value: tip.tipid, textval: tip.tiptext});
    }
    
    this._prepContainerForUpdate();    

    var selectContainer = CreateElement.createDiv(null, 'tipschedule-edit-container');
    var inputContainer = CreateElement.createDiv(null, 'tipschedule-edit-container');
    var controlContainer = CreateElement.createDiv(null, 'tipschedule-edit-container');

    this._container.appendChild(inputContainer);
    this._container.appendChild(selectContainer);
    this._container.appendChild(controlContainer);

    var optionChangeHandler = (e) => {return this._optionChangeAdd(e);};
    var finalizeAddHandler =  (e) => {return this._finalizeAdd(e);};
    var cancelHandler = (e) => {return this._cancelOperation(e);};
    
    inputContainer.appendChild(CreateElement.createRadio(null, 'tipschedule-add-choice', 'add-choice', 'new', '', true, optionChangeHandler));
    var tipTextArea = CreateElement.createTextArea(null, 'tipschedule-add-text');
    tipTextArea.rows = 8;
    inputContainer.appendChild(tipTextArea);

    selectContainer.appendChild(CreateElement.createRadio(null, 'tipschedule-add-choice', 'add-choice', 'existing', '', false, optionChangeHandler));
    var elemSelect = CreateElement.createSelect(null, 'tipschedule-add-select', null, tipValues)
    selectContainer.appendChild(elemSelect);
    elemSelect.disabled = true;
    
    controlContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-editicon far fa-check-square', 'save', finalizeAddHandler));
    controlContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-editicon far fa-window-close', 'cancel', cancelHandler));
  }
  
  _updateForEdit(tipsData) {
    this._prepContainerForUpdate();
    
    var controlContainer = CreateElement.createDiv(null, 'tipschedule-edit-container');

    this._container.appendChild(controlContainer);

    var finalizeEditHandler =  (e) => {return this._finalizeEdit(e);};
    var cancelHandler = (e) => {return this._cancelOperation(e);};

    controlContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-editicon far fa-check-square', 'save', finalizeEditHandler));
    controlContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-editicon far fa-window-close', 'cancel', cancelHandler));
  }
  
  _prepContainerForUpdate() {
    this._removeChildren(this._container);
  }

  //------------------------------------------------------------
  // handlers
  //------------------------------------------------------------  
  _optionChangeAdd(e) {
    this._container.getElementsByClassName('tipschedule-add-select')[0].disabled = !(e.target.value == 'existing');
    this._container.getElementsByClassName('tipschedule-add-text')[0].disabled = (e.target.value == 'existing');
  }
  
  _finalizeAdd(e) {
    var addData = null;

    var optionList = this._container.getElementsByClassName('tipschedule-add-choice');
    var optionSelected = null;
    for (var i = 0; i < optionList.length; i++) {
      if (optionList[i].type == 'radio' && optionList[i].checked) {
        optionSelected = optionList[i].value;
      }
    }
    
    if (optionSelected == 'new') {
      var dataElement = this._container.getElementsByClassName('tipschedule-add-text')[0];
      
    } else {
      var dataElement = this._container.getElementsByClassName('tipschedule-add-select')[0];
      dataElement = dataElement[dataElement.selectedIndex]
    }
    
    addData = {
      addType: optionSelected,
      addValue: dataElement.value
    }
    
    this._config.callbacks.finishAdd(addData);
  }

  _finalizeEdit(e) {
    var editData = null;
    
    editData = 'here is the edit data';

/*
    var optionList = this._container.getElementsByClassName('tipschedule-add-choice');
    var optionSelected = null;
    for (var i = 0; i < optionList.length; i++) {
      if (optionList[i].type == 'radio' && optionList[i].checked) {
        optionSelected = optionList[i].value;
      }
    }
    
    if (optionSelected == 'new') {
      var dataElement = this._container.getElementsByClassName('tipschedule-add-text')[0];
      
    } else {
      var dataElement = this._container.getElementsByClassName('tipschedule-add-select')[0];
      dataElement = dataElement[dataElement.selectedIndex]
    }
    
    addData = {
      addType: optionSelected,
      addValue: dataElement.value
    }
    */
    
    this._config.callbacks.finishEdit(editData);
  }

  _cancelOperation(e) {
    this._config.callbacks.cancelChange();
  }

  //------------------------------------------------------------
  // utility methods
  //------------------------------------------------------------  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }
}
