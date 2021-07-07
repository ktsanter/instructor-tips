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
      currentInfo: null,
      renderType: 'plain',
      editingEnabled: true,
      editIconClasses: 'fas fa-edit',
      selectedStudentInfo: null
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(currentInfo, renderType, editingEnabled) {
    this.settings.currentInfo = currentInfo;
    this.settings.renderType = renderType;
    this.settings.editingEnabled = editingEnabled;
    this.settings.selectedStudentInfo = null;
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    UtilityKTS.setClass(this.config.container, 'hide-me', true);
    
    this.statusMessage = this.config.container.getElementsByClassName('status-message')[0];
    
    this.studentImages = this.config.container.getElementsByClassName('item-images')[0];
    this.studentImageIEP = this.studentImages.getElementsByClassName('item-image image-iep')[0];
    this.studentImage504 = this.studentImages.getElementsByClassName('item-image image-504')[0];
    this.studentIconHomeSchooled = this.config.container.getElementsByClassName('item-icon icon-homeschooled')[0];
    this.studentImageInfo = this.studentImages.getElementsByClassName('item-image image-info')[0];
    
    this.studentSelect = this.config.container.getElementsByClassName('student-select')[0];
    this.studentSelectInput = this.studentSelect.getElementsByClassName('dropdown-toggle')[0];
    this.studentSelectList = this.studentSelect.getElementsByClassName('dropdown-menu')[0];
    this.studentContent = this.config.container.getElementsByClassName('view-content')[0];
        
    this.studentSelectInput.addEventListener('input', (e) => { this._handleDropDownInputChange(e); });
  
    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, true);
  }

  _updateUI() {
    UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, true);

    UtilityKTS.setClass(this.studentImages, this.settings.hideClass, true);       

    UtilityKTS.setClass(this.studentSelect, this.settings.hideClass, true);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, true);

    UtilityKTS.removeChildren(this.studentSelectList);    

    if (!this.settings.currentInfo) {
      this.statusMessage.innerHTML = 'no target file selected';
      UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, false);
      
    } else if (this.settings.currentInfo.studentList.length == 0) {
      this.statusMessage.innerHTML = 'no data in target file';
      UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, false);

    } else {
      var currentStudentInput = this.studentSelectInput.value;
      var currentStudent = null;
      
      var studentList = this.settings.currentInfo.studentList;
      
      for (var i = 0; i < studentList.length; i++) {
        if (studentList[i] == currentStudentInput) currentStudent = currentStudentInput;

        var listItem = CreateElement._createElement('li');
        this.studentSelectList.appendChild(listItem);
        
        var span = CreateElement.createSpan(null, 'dropdown-item', studentList[i]);
        listItem.appendChild(span);
        span.addEventListener('click', (e) => { this._handleDropDownItemClick(e); });
      }

      if (currentStudent) this._selectStudent(currentStudent);  
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
    this.studentSelectInput.value = studentName;
    
    var info = this.settings.currentInfo.students[studentName];
    this.settings.selectedStudentInfo = info;
    
    UtilityKTS.setClass(this.studentImages, this.settings.hideClass, false);

    UtilityKTS.removeChildren(this.studentContent);
    UtilityKTS.setClass(this.studentContent, this.settings.hideClass, false);

    UtilityKTS.setClass(this.studentImageIEP, this.settings.hideClass, !info.iep);       
    UtilityKTS.setClass(this.studentImage504, this.settings.hideClass, !info["504"]);
    UtilityKTS.setClass(this.studentIconHomeSchooled, this.settings.hideClass, !info.homeschooled);

    var infoTitle = this._determineStudentInfoMessage(info);
    this.studentImageInfo.title = infoTitle;
    UtilityKTS.setClass(this.studentImageInfo, this.settings.hideClass, infoTitle == '');    
    
    this.studentContent.appendChild(this._renderProperty("affiliation", info.enrollments[0].affiliation));
    this.studentContent.appendChild(this._renderProperty('email', info.enrollments[0].email));
    
    var handler = null;
    if (this.settings.editingEnabled) handler = (a, b, c) => { this._handlePropertyEdit(a, b, c); };
    this.studentContent.appendChild(this._renderProperty('preferred name', info.preferredname, 'preferredname', handler));

    this._renderPropertyArray(
      ['term', 'section', 'startdate', 'enddate'], 
      ['term', 'section', 'start date', 'end date'],
      info.enrollments, 
      this.studentContent
    );

    this._renderPropertyArray(
      ['name', 'email', 'phone', 'affiliationphone'], 
      ['mentor', 'email', 'phone', 'affiliation phone'],
      info.mentors, 
      this.studentContent
    );

    this._renderPropertyArray(
      ['name', 'email', 'phone'], 
      ['guardian', 'email', 'phone'],
      info.guardians, 
      this.studentContent
    );
    
    this._renderPropertyArray(
      ['datestamp', 'notetext'], 
      ['note', 'note text'],
      info.notes, 
      this.studentContent
    );
  }
  
  _determineStudentInfoMessage(info) {
    // figure out what to do with this (if anything)
    return '';
  }
  
  _renderProperty(label, value, property, handler) {
    var row = CreateElement.createDiv(null, 'row');
    
    var col1 = CreateElement.createDiv(null, 'col-sm-3');
    row.appendChild(col1);
    col1.appendChild(CreateElement.createSpan(null, 'item-label', label));
    
    var col2 = CreateElement.createDiv(null, 'col-sm');
    row.appendChild(col2);
    var elem = CreateElement.createSpan(null, null, value);
    col2.appendChild(elem);

    if (handler) {
      var classList = this.settings.editIconClasses + ' icon editicon ms-1';
      var wrapperHandler = this._makePropertyEditHandler(label, property, elem, handler);
      col1.appendChild(CreateElement.createIcon(null, classList, 'edit ' + label, wrapperHandler));
    }
    
    return row;
  }
  
  _makePropertyEditHandler(label, property, targetElement, origHandler) {
    return function() {
      origHandler(label, property, targetElement);
    }
  }
    
  _renderPropertyArray(propertyArray, labelArray, source, container) {
    container.appendChild(CreateElement.createDiv(null, null, label));

    if (this.settings.renderType == 'plain') {
      for (var i = 0; i < source.length; i++) {
        var item = source[i];
        for (var j = 0; j < propertyArray.length; j++) {
          var label = labelArray[j];
          var property = propertyArray[j];
          var value = item[property];
          if (property == 'startdate' || property == 'enddate') value = value.slice(0, 10);
          var elemProperty = this._renderProperty(label, value);
          container.appendChild(elemProperty);
          if (j == 0) elemProperty.classList.add('mt-3');
        }
      }
      
    } else if (this.settings.renderType == 'table') {
      var tableContents = [];
      for (var i = 0; i < source.length; i++) {
        var item = source[i];
        var rowContents = [];
        for (var j = 0; j < propertyArray.length; j++) {
          var property = propertyArray[j];
          var value = item[property];
          if (property == 'startdate' || property == 'enddate') value = value.slice(0, 10);
          rowContents.push(value);
        }
        tableContents.push(rowContents);
      }
      
      if (source.length > 0) {
        var table = CreateElement.createTable(null, 'table table-striped table-hover table-sm mt-3', labelArray, tableContents);
        container.append(table);
        table.getElementsByTagName('thead')[0].classList.add('table-primary');
      }
    }
  }

  async _doPropertyEdit(label, property, targetElement) {
    var currentValue = targetElement.innerHTML;

    var msg = 'Please enter a value for "' + label + '"';
    var result = prompt(msg, currentValue);
    if (!result || result == currentValue) return;
    
    var studentName;
    if (this.settings.selectedStudentInfo.enrollments.length > 0) {
      studentName = this.settings.selectedStudentInfo.enrollments[0].student;
    }
    if (!studentName) return;
    
    var result = await this.config.callbackChange({"student": studentName, "property": property, "value": result});
    if (!result.success) return;
    
    console.log('_doPropertyEdit result', result.data);
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
  
  async _handlePropertyEdit(label, property, targetElement) {
    await this._doPropertyEdit(label, property, targetElement);
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
