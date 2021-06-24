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
        
    this.studentContent.appendChild(this._renderProperty("affiliation", info.enrollments[0].affiliation));
    this.studentContent.appendChild(this._renderProperty('email', info.enrollments[0].email));
    console.log('add preferred name');

    this.studentContent.appendChild(this._renderEmptyRow());
    
    this._renderPropertyArray(
      ['term', 'section', 'startdate', 'enddate'], 
      ['term', 'section', 'start date', 'end date'],
      info.enrollments, 
      this.studentContent
    );

    this.studentContent.appendChild(this._renderEmptyRow());
    
    this._renderPropertyArray(
      ['name', 'email', 'phone', 'affiliationphone'], 
      ['mentor', 'email', 'phone', 'affiliation phone'],
      info.mentors, 
      this.studentContent
    );

    this.studentContent.appendChild(this._renderEmptyRow());
    
    this._renderPropertyArray(
      ['name', 'email', 'phone'], 
      ['guardian', 'email', 'phone'],
      info.guardians, 
      this.studentContent
    );
    
    console.log('add notes');
  }
  
  _renderProperty(label, value) {
    var row = CreateElement.createDiv(null, 'row');
    
    var col = CreateElement.createDiv(null, 'col-sm-2');
    row.appendChild(col);
    col.appendChild(CreateElement.createDiv(null, 'item-label', label));
    
    col = CreateElement.createDiv(null, 'col-sm');
    row.appendChild(col);
    col.appendChild(CreateElement.createDiv(null, null, value));

    return row;
  }
  
  _renderEmptyRow() {
    var row = CreateElement.createDiv(null, 'row');
    row.appendChild(CreateElement.createDiv(null, 'col-sm-2', '&nbsp;'));

    return row;
  }    
  
  _renderPropertyArray(propertyArray, labelArray, source, container) {
    console.log('use table instead?');
    container.appendChild(CreateElement.createDiv(null, null, label));

    for (var i = 0; i < source.length; i++) {
      var item = source[i];
      for (var j = 0; j < propertyArray.length; j++) {
        var label = labelArray[j];
        var property = propertyArray[j];
        var value = item[property];
        if (property == 'startdate' || property == 'enddate') value = value.slice(0, 10);
        container.appendChild(this._renderProperty(label, value));
      }
    }
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
