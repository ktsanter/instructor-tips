//-----------------------------------------------------------------------------------
// TipCourseSelection class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipCourseSelection {
  constructor() {
    this._version = '0.01';
    this._title = 'Course/Term selection';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'tipcourse ' + this._HIDE_CLASS);
            
    return this._container;;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------  
  async show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    this._prepContainerForUpdate();    
        
    var queryResults = await this._doGetQuery('tipmanager/query', 'tipcourses-usercourses');
    if (queryResults.success) {
      var usercourses = queryResults.usercourses;
      var courses = queryResults.courses;
      var termgroups = queryResults.termgroups;
      
      //createTable(id, classList, headers, contents, captionLabel, attachContents, colgroupinfo)
      var headerList = ['course'];
      for (var i = 0; i < termgroups.length; i++) headerList.push(termgroups[i].termgroupname);
      
      var elemTable = CreateElement.createTable(null, null, headerList);
      this._container.appendChild(elemTable);
      
      for (var i = 0; i < courses.length; i++) {
        this._buildCourseRow(elemTable, courses[i], termgroups, usercourses);
      }
    }
  }
  
  async userchange() {
    await this.update();
  }
  
  _prepContainerForUpdate() {
    this._removeChildren(this._container);

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    this._container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
  }
  
  _buildCourseRow(elemTable, course, termgroupList, usercourseList) {
    var container = CreateElement.createDiv(null, null);

    var handler = (e) => {return this._selectionChange(e)};
    
    var elemRow = CreateElement.createTableRow(null, null, elemTable);
    var cell = CreateElement.createTableCell(null, null, course.coursename, false, elemRow);
    elemRow.courseinfo = course;
    
    var msg = course.coursename;
    for (var i = 0; i < termgroupList.length; i++) {
      var termgroup = termgroupList[i];
      var isSelected = this._isCourseSelectedForUser(course, termgroup, usercourseList);
      cell = CreateElement.createTableCell(null, null, '', false, elemRow);
      var elemCheckbox = CreateElement.createCheckbox(null, null, 'course-selected', 'is-selected', '', isSelected, handler)
      cell.appendChild(elemCheckbox);
      cell.termgroupinfo = termgroup;
    }
    
    return container;
  }
  
  _isCourseSelectedForUser(course, termgroup, userCourseList) {
    var isSelected = false;
    
    for (var i = 0; i < userCourseList.length && !isSelected; i++) {
      var usercourse = userCourseList[i];
      isSelected = (usercourse.courseid == course.courseid && usercourse.termgroupid == termgroup.termgroupid);
    }
    
    return isSelected;
  }

  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------    
  _selectionChange(e) {
    var isSelected = e.target.checked;
    var elemCell = e.target.parentNode.parentNode;
    var elemRow = elemCell.parentNode;
    var termgroup = elemCell.termgroupinfo;
    var course = elemRow.courseinfo;
    
    console.log('set selection for ' + course.coursename + ' ' + termgroup.termgroupname + ' to ' + isSelected);
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------    
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }  
  
  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async _doGetQuery(queryType, queryName) {
    var resultData = null;
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = null;
    
    var requestResult = await SQLDBInterface.dbPost(queryType, queryName, postData);
    if (requestResult.success) {
      resultData = requestResult;
      this._notice.setNotice('');
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }    
}
