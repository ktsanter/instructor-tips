//-------------------------------------------------------------------
// RosterViewer
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class RosterViewer {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      currentInfo: null
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(currentInfo) {
    this.settings.currentInfo = currentInfo;
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    UtilityKTS.setClass(this.config.container, 'hide-me', true);
    
    this.statusMessage = this.config.container.getElementsByClassName('status-message')[0];
    
    this.studentSelect = this.config.container.getElementsByClassName('student-select')[0];
    this.studentSelectInput = this.studentSelect.getElementsByClassName('dropdown-toggle')[0];
    this.studentSelectList = this.studentSelect.getElementsByClassName('dropdown-menu')[0];
    this.studentContent = this.config.container.getElementsByClassName('view-content')[0];
        
    this.studentSelectInput.addEventListener('input', (e) => { this._handleDropDownInputChange(e); });
  
    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, true);
  }

  _updateUI() {
    UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, true);
    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, true);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, true);

    UtilityKTS.removeChildren(this.studentSelectList);    

    if (!this.settings.currentInfo) {
      this.statusMessage.innerHTML = 'no target file selected';
      UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, false);
      
    } else if (this.settings.currentInfo.studentList.length == 0) {
      this.statusMessage.innerHTML = 'no current data';
      UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, false);

    } else {
      var studentList = this.settings.currentInfo.studentList;
      
      for (var i = 0; i < studentList.length; i++) {
        var listItem = CreateElement._createElement('li');
        this.studentSelectList.appendChild(listItem);
        var span = CreateElement.createSpan(null, 'dropdown-item', studentList[i]);
        listItem.appendChild(span);
        span.addEventListener('click', (e) => { this._handleDropDownItemClick(e); });
      }
  
      UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, false);  
    }
    
    UtilityKTS.setClass(this.config.container, this.settings.hideClass, false);
  }
  
  _filterDropdownItems(searchVal) {
    var itemSpans = this.studentSelectList.getElementsByTagName('span');

    try {
      var reg = new RegExp(searchVal.toLowerCase());
    } catch(err) {
      var reg = /.*/;
    }
    
    for (var i = 0; i < itemSpans.length; i++) {
      var spanVal = itemSpans[i].innerHTML.toLowerCase();
      UtilityKTS.setClass(itemSpans[i], 'hide-me', spanVal.match(reg) == null);
    }
  }    

  _selectStudent(studentName) {
    console.log('RosterViewer._selectStudent');
    this.studentSelectInput.value = studentName;
    
    var info = this.settings.currentInfo.students[studentName];
    console.log(info);
    
    UtilityKTS.removeChildren(this.studentContent);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, false);
    
    this.studentContent.appendChild(CreateElement.createDiv(null, null, JSON.stringify(info.enrollments)))
    this.studentContent.appendChild(CreateElement.createDiv(null, null, JSON.stringify(info.mentors)))
    this.studentContent.appendChild(CreateElement.createDiv(null, null, JSON.stringify(info.guardians)))
    /*
            .row
          .col-sm-1
            .item-label email
          .col-sm
            .email
            */

/*
    var enrollments = info.enrollments;
    this.studentContent.getElementsByClassName('email')[0].innerHTML = enrollments[0].email;
    this.studentContent.getElementsByClassName('affiliation')[0].innerHTML = enrollments[0].affiliation;
    
    var container = this.studentContent.getElementsByClassName('enrollments')[0];
    UtilityKTS.removeChildren(container);
    for (var i = 0; i < enrollments.length; i++) {
      var enrollment = enrollments[i];
      var val = enrollment.term + ' | ' + enrollment.section + ' | ' + this._formatDate(enrollment.startdate) + ' | ' + this._formatDate(enrollment.enddate);
      container.appendChild(CreateElement.createDiv(null, null, val));
    }
    */
  }

  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleDropDownInputChange(e) {
    this._filterDropdownItems(e.target.value);
  }
  
  _handleDropDownItemClick(e) {
    this._selectStudent(e.target.innerHTML);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _failResult(msg, methodName) {
    if (methodName) msg += ' in ' + methodName;
    
    return {
      success: false,
      details: msg,
      data: null
    };
  }
  
  _formatDate(str) {
    return str.slice(0, 10);
  }
}
