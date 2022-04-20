//-------------------------------------------------------------------
// ProgressCheck widget
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class ProgressCheck {
  static editDialogClass = 'pc-edit-dialog';
  static pcHideClass = 'pc-hide-me';
  
  constructor(config) {
    this.config = config;
    this.settings = {
      pcHideClass: 'pc-hide-me',
    }
    
    this.editCompletionCallback = null;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  getStudentName() {
    return this.config.student;
  }
  
  getLatestDate() {
    var sorted = this.config.progresscheck.sort();
    
    var latest = '';
    if (sorted.length > 0) latest = sorted[sorted.length - 1];

    return latest;
  }
  
  formatDateList(delimiter) {
    var formatted = '';
    
    var sorted = this.config.progresscheck.sort();
    if (sorted.length > 0) formatted = sorted.join(delimiter);
    
    return formatted;
  }
  
  async action(actionType, callback, anchorElement) {
    if (actionType == 'add') {
      await this._addProgressCheck(callback);
      
    } else if (actionType == 'edit') {
      this._startEditProgressChecks(callback, anchorElement);
      
    } else {
      console.log('ProgressCheck.action unknown actionType: "' + actionType + '"');
    }
  }
  
  static closeDialogs() {
    ProgressCheck._closeEditDialogs();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  async _addProgressCheck(callback) {
    var pcSet = new Set(this.config.progresscheck);
    pcSet.add(this._shortDateStamp());
    var pcList = Array.from(pcSet);

    var params = {
      "student": this.config.student,
      "term": this.config.term,
      "section": this.config.section,
      "datestamp": pcList,
    }
    
    await callback('add', params);
  }

  _startEditProgressChecks(editCompletionCallback, anchorElement) {
    this.editCompletionCallback = editCompletionCallback;
    ProgressCheck._closeEditDialogs();
    this._openEditDialog(anchorElement, this.config.progresscheck.slice());
  }
  
  static _closeEditDialogs() {
    var hideClass = ProgressCheck.pcHideClass;

    var dialogs = document.getElementsByClassName(ProgressCheck.editDialogClass);
    while (dialogs.length > 0) {
      var parentNode = dialogs[0].parentNode;
      dialogs[0].remove();
      parentNode.childNodes.forEach(function (node) {
        UtilityKTS.setClass(node, hideClass, false);
      })
    }
  }
  
  _openEditDialog(anchorElement, pcList) {
    var hideClass = this.settings.pcHideClass;
    anchorElement.childNodes.forEach(function (node) {
      UtilityKTS.setClass(node, hideClass, true);
    })

    this.editContainer = CreateElement.createDiv(null, ProgressCheck.editDialogClass);
    anchorElement.appendChild(this.editContainer);
    
    this.editContainer.appendChild( this._buildEditTable(anchorElement, pcList) );
    
    var btn = CreateElement.createButton(null, null, 'save', '', (e) => { this._handleFinishEditing(e, 'save'); });
    this.editContainer.appendChild(btn);
    var btn = CreateElement.createButton(null, null, 'cancel', '', (e) => { this._handleFinishEditing(e, 'cancel'); });
    this.editContainer.appendChild(btn);
  }
  
  _buildEditTable(anchorElement, pcList) {
    var container = CreateElement.createDiv(null, 'pc-table-container');
    this.editingPCList = pcList;
    
    pcList = pcList.sort();
    for (var i = 0; i < pcList.length; i++) {
      var pcRow = CreateElement.createDiv(null, null);
      container.appendChild(pcRow);

      var elem = CreateElement.createIcon(null, 'far fa-trash-alt pc-delete-icon', 'delete progress check date');
      pcRow.appendChild(elem);
      elem.setAttribute("pcIndex", i);
      elem.addEventListener('click', (e) => { 
        e.stopPropagation();
        this.editingPCList.splice(e.target.getAttribute("pcIndex"), 1);
        ProgressCheck._closeEditDialogs()
        this._openEditDialog(anchorElement, this.editingPCList);
      });
      
      var pc = pcList[i];
      elem = CreateElement._createElement('input', null, 'pc-edit-input');
      pcRow.appendChild(elem);
      elem.type = 'date';
      elem.value = pc;
      elem.addEventListener('click', (e) => { e.stopPropagation(); });
    }
    
    var elem = CreateElement.createIcon(null, 'far fa-plus-square pc-add-icon', 'add pc date');
    container.appendChild(elem);
    var me = this;
    elem.addEventListener('click', (e) => { 
      me.editingPCList.push(me._shortDateStamp());
      me.editingPCList = Array.from(new Set(me.editingPCList));
      ProgressCheck._closeEditDialogs()
      me._openEditDialog(anchorElement, me.editingPCList);
      
      e.stopPropagation();
    });
    
    return container;
  }

  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _handleFinishEditing(e, finishType) {
    e.stopPropagation();
    
    if (finishType == 'save') {
      var pcList = [];
      var editInputs = this.editContainer.getElementsByClassName('pc-edit-input');
      for (var i = 0; i < editInputs.length; i++) {
        pcList.push(editInputs[i].value);
      }
      
      console.log(pcList);
      
      var params = {
        "student": this.config.student,
        "term": this.config.term,
        "section": this.config.section,
        "datestamp": pcList
      }

      console.log('save params', params);
      await this.editCompletionCallback('update', params);
    }
    
    ProgressCheck._closeEditDialogs();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _formatDate(str) {
    return str.slice(0, 10);
  }
  
  _shortDateStamp() {
     var now = new Date();
     var y = String(now.getFullYear()).padStart(4, '0');
     var m = String(now.getMonth() + 1).padStart(2, '0');
     var d = String(now.getDate()).padStart(2, '0');
     
     return y + '-' + m + '-' + d;
  }
}
