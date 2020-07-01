//-------------------------------------------------------------------
// TreasureHuntDialog class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class TreasureHuntDialog {
  constructor(config) {
    this._version = '0.01';
    this._HIDE_CLASS = 'treasurehuntdialog-hide';
    
    this._config = config;
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'treasurehuntdialog' + ' ' + this._HIDE_CLASS);
    
    var dialogType = this._config.dialogtype;
    
    // project dialogs
    if (dialogType == 'add-project') this._container.appendChild(this._renderAddProject());
    else if (dialogType == 'edit-project') this._container.appendChild(this._renderEditProject());
    else if (dialogType == 'delete-project') this._container.appendChild(this._renderDeleteProject());
    
    // other
    else console.log('unrecognized dialog type: ' + dialogType);    
    
    return this._container;
  }
  
  _renderAddProject() {
    var container = CreateElement.createDiv(null, 'dialog-addproject');
    
    container.appendChild(this._renderTitle('Add new project'));
        
    var subContainer = CreateElement.createDiv(null, 'dialog-sub');
    container.appendChild(subContainer);
    
    var elem = CreateElement.createTextInput(null, 'dialog-input');
    subContainer.appendChild(elem);
    elem.placeholder = 'project name';
    elem.maxLength = 200;
    elem.addEventListener('input', (e) => {this._handleProjectName(e);});
    UtilityKTS.denyDoubleQuotes(elem);
    
    container.appendChild(this._renderConfirmCancel('add', 'add new projecct', 'cancel', 'cancel new project'));
 
    return container;
  }
  
  _renderEditProject() {
    var container = CreateElement.createDiv(null, 'dialog-editproject');
    
    container.appendChild(this._renderTitle('Edit project'));

    var subContainer = CreateElement.createDiv(null, 'dialog-sub');
    container.appendChild(subContainer);
    
    var elem = CreateElement.createTextInput(null, 'dialog-input');
    subContainer.appendChild(elem);
    elem.placeholder = 'project name';
    elem.maxLength = 200;
    elem.addEventListener('input', (e) => {this._handleProjectName(e);});
    UtilityKTS.denyDoubleQuotes(elem);
        
    container.appendChild(this._renderConfirmCancel('save', 'save changes', 'cancel', 'discard changes'));
 
    return container;
  }
  
  _renderDeleteProject() {
    var container = CreateElement.createDiv(null, 'dialog-delete');
    
    container.appendChild(this._renderTitle('Delete project'));
    container.appendChild(CreateElement.createDiv(null, 'dialog-message'));    
    container.appendChild(this._renderConfirmCancel('confirm', 'delete projecct', 'cancel', 'do not delete project'));
 
    return container;
  }
 
  _renderTitle(titleText) {
    var container = CreateElement.createDiv(null, 'dialog-title');
    container.appendChild(CreateElement.createDiv(null, 'dialog-titletext', titleText));
    
    return container;
  }
  
  _renderConfirmCancel(confirmLabel, confirmTitle, cancelLabel, cancelTitle) {
    var container = CreateElement.createDiv(null, 'dialog-sub confirmcancel');
    
    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'confirmcancelcontrol confirm', confirmLabel, confirmTitle, handler);
    container.appendChild(elem);
    elem.disabled = true;

    handler = (me) => {this._handleCancel(this);};
    container.appendChild(CreateElement.createButton(null, 'confirmcancelcontrol cancel', cancelLabel, cancelTitle, handler));
    
    return container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(params) {
    var dialogType = this._config.dialogtype;
    
    // project dialogs
    if (dialogType == 'add-project') this._updateAddProject(params); 
    else if (dialogType == 'edit-project') this._updateEditProject(params); 
    else if (dialogType == 'delete-project') this._updateDeleteProject(params); 
    
    // other
    else console.log('unrecognized dialog type: ' + dialogType);    
  }
  
  _updateAddProject(params) {
    var elem = this._container.getElementsByClassName('dialog-input')[0];
    elem.value = '';
    elem.focus();
  }
  
  _updateEditProject(params) {
    var elem = this._container.getElementsByClassName('dialog-input')[0];
    elem.value = params.projectname;
    elem.originalValue = elem.value;
    elem.projectid = params.projectid;    
    elem.focus();
  }

  _updateDeleteProject(params) {
    var elem = this._container.getElementsByClassName('dialog-message')[0];
    var msg = 'The project named: "' + params.projectname + '" will be deleted.' +
              '<br>Deletions cannot be undone<br><br>Are you sure you want to delete this project?';
    
    elem.innerHTML = msg;
    elem.projectid = params.projectid;
    this._updateConfirm(true);
  }
  
  _updateConfirm(enable) {
    this._container.getElementsByClassName('confirm')[0].disabled = !enable;
  }  

  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  //--------------------------------------------------------------
  // package callback data
  //--------------------------------------------------------------   
  _packageCallbackData() {
    var callbackData = {};
    
    var dialogType = this._config.dialogtype;
    if (dialogType == 'add-project') {
      var elem = this._container.getElementsByClassName('dialog-input')[0];
      callbackData = {projectname: elem.value};
      
    } else if (dialogType == 'edit-project') {
      var elem = this._container.getElementsByClassName('dialog-input')[0];
      callbackData = {projectid: elem.projectid, projectname: elem.value};

    } else if (dialogType == 'delete-project') {
      var elem = this._container.getElementsByClassName('dialog-message')[0];
      callbackData = {projectid: elem.projectid};
      
    } else {
      console.log('unrecognized dialog type: ' + dialogType); 
    }
    
    return callbackData;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _handleConfirm(me) {
    await me._config.confirmcallback(me._packageCallbackData());
    me.show(false);
  }
  
  _handleCancel(me) {
    me.show(false);
    me._config.cancelcallback();
  }
  
  _handleProjectName(e) {
    var nameValue = e.target.value.trim();
    var enableConfirm = (nameValue.length > 0);
    
    if (this._config.dialogtype == 'edit-project') {
      enableConfirm = (enableConfirm && nameValue != e.target.originalValue);
    }
    
    this._updateConfirm(enableConfirm);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------      
  _formatDate(d) {
    var y = d.getFullYear();
    var m = ('00' + (d.getMonth() + 1)).slice(-2);
    var d = ('00' + d.getDate()).slice(-2);
    
    return y + '-' + m + '-' + d;    
  }
  
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
    //cleaned = cleaned.replace(/&(.*?);/g, '$1');  // replace ampersand characters
    
    return cleaned;
  }
}
