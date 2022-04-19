//-------------------------------------------------------------------
// ProgressCheck widget
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class ProgressCheck {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(updatedInfo) {
    console.log('ProgressCheck.update', updatedInfo);

    this._updateUI();
  }
    
  closeUI() {
    console.log('ProgressCheck.closeUI');
  }
  
  getStudentName() {
    return this.config.student;
  }
  
  getLatestDate() {
    var sorted = this.config.progresscheck.sort();
    
    var latest = '';
    if (sorted.length > 0) latest = sorted[sorted.length - 1];

    return latest;
  }
  
  async action(actionType, callback) {
    if (actionType == 'add') {
      await this._addProgressCheck(callback);
      
    } else if (actionType == 'edit') {
      this._editProgressChecks();
      
    } else {
      console.log('ProgressCheck.action unknown actionType "' + actionType + '"');
    }
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    //console.log('ProgressCheck._initUI');
  }

  _updateUI() {
    console.log('ProgressCheck._updateUI');
  }
  
  async _addProgressCheck(callback) {
    var params = {
      "student": this.config.student,
      "term": this.config.term,
      "section": this.config.section,
      "datestamp": this._shortDateStamp(),
    }
    await callback('add', params);

  }

  _editProgressChecks() {
    console.log('_editProgressChecks', this.config);
  }

  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  _copyToClipboard(txt) {
    if (!this.settings.clipboard) this.settings.clipboard = new ClipboardCopy(this.config.container, 'plain');

    this.settings.clipboard.copyToClipboard(txt);
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
