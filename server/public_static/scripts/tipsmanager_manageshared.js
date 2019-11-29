//-----------------------------------------------------------------------------------
// TipSchedulingShareManagement class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipSchedulingShareManagement {
  constructor() {
    this._version = '0.01';
    this._title = 'Shared schedules';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'manageschedule ' + this._HIDE_CLASS);
            
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
    var queryResults = await this._doGetQuery('tipmanager/query', 'sharedwithuser');
    this._prepContainerForUpdate();
    
    if (queryResults.success) {
      var schedulesSharedWithUser = queryResults.data;
      var userCourseData = queryResults.usercourses;
      
      if (schedulesSharedWithUser.length == 0) {
        this._container.appendChild(CreateElement.createDiv(null, 'manageschedule-noresults', 'no schedules have been shared with you'));
        
      } else {
        this._container.appendChild(this._renderScheduleList(schedulesSharedWithUser, userCourseData));
      }
    }
  }
  
  _prepContainerForUpdate() {
    this._removeChildren(this._container);

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    this._container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
  }
  
  _renderScheduleList(schedulesSharedWithUser, userCourseData) {
    var container;

    container = CreateElement.createDiv(null, 'manageschedule-content');

    var organizedUserCourses = this._organizeUserCourses(userCourseData);

    var headerList = ['shared by', 'shared', 'term group', 'source course', 'target course', 'import'];
    var elemTable = CreateElement.createTable(null, 'managschedule-sharelist', headerList);
    container.appendChild(elemTable);

    for (var i = 0; i < schedulesSharedWithUser.length; i++) {
      this._buildScheduleRow(elemTable, schedulesSharedWithUser[i], organizedUserCourses);
    }

    return container;
  }

  _organizeUserCourses(userCourseData) {
    var organized = {};
    
    for (var i = 0; i < userCourseData.length; i++) {
      var userCourseItem = userCourseData[i];
      var termgroupName = userCourseItem.termgroupname;
      if (!organized.hasOwnProperty(termgroupName)) {
        organized[termgroupName] = [];
      }
      organized[termgroupName].push({usercourseid: userCourseItem.usercourseid, coursename: userCourseItem.coursename});
    }
    
    return organized;
  }
  
  _buildScheduleRow(elemTable, scheduleItem, userCourses) {
    var elemRow = CreateElement.createTableRow(null, null, elemTable);
    elemRow.scheduleItem = scheduleItem;

    var handler = (e) => {return this._importSchedule(e)};
      
    elemRow.appendChild(CreateElement.createTableCell(null, null, scheduleItem.username));
    elemRow.appendChild(CreateElement.createTableCell(null, null, this._formatTimeStamp(scheduleItem.timestampshared)));
    elemRow.appendChild(CreateElement.createTableCell(null, null, scheduleItem.termgroupname));
    elemRow.appendChild(CreateElement.createTableCell(null, null, scheduleItem.coursename));
    
    var courseList = [];
    var termgroupName = scheduleItem.termgroupname;
    var coursesForTermgroup = userCourses[termgroupName];
    
    if (coursesForTermgroup) {
      for (var i = 0; i < coursesForTermgroup.length; i++) {
        courseList.push({id: coursesForTermgroup[i].usercourseid, value: JSON.stringify(coursesForTermgroup[i]), textval: coursesForTermgroup[i].coursename});
      }

      var elemCell = CreateElement.createTableCell(null, null, '');
      elemRow.appendChild(elemCell);
   
      var selectContainer = CreateElement.createDiv(null, 'manageschedule-coursecontainer');
      elemCell.appendChild(selectContainer);
      selectContainer.appendChild(CreateElement.createSelect(null, 'manageschedule-course select-css', null, courseList));      
      
      elemCell = CreateElement.createTableCell(null, 'manageschedule-import', '');
      elemRow.appendChild(elemCell);
      
      elemCell.appendChild(CreateElement.createButton(null, 'manageschedule-use', 'import', 'add schedule info to selected course', handler));
    
    } else {
      var elemCell = CreateElement.createTableCell(null, null, '');
      elemRow.appendChild(elemCell);      
      elemCell.appendChild(CreateElement.createDiv(null, 'manageschedule-coursecontainer no-courses', 'no matching course schedules'));

      var elemCell = CreateElement.createTableCell(null, 'manageschedule-import', '');
      elemRow.appendChild(elemCell);    
    }
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------    
  async _importSchedule(e) {
    var elemRow = e.target.parentNode.parentNode;
    var elemSelect = elemRow.getElementsByClassName('manageschedule-course')[0];
    
    var scheduleItem = elemRow.scheduleItem;
    var courseSelection = JSON.parse(elemSelect[elemSelect.selectedIndex].value);
    
    var postData = {
      "scheduleItem": elemRow.scheduleItem,
      "courseSelection": JSON.parse(elemSelect[elemSelect.selectedIndex].value)
    };
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'integrate-shared', postData);
    if (queryResults.success) {
      await this.update();
    }
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------    
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }  
  
  _formatTimeStamp(timeStamp) {
    var formatted = timeStamp;
    
    if (this._isValidDate(formatted)) {
      formatted = '';
      if (timeStamp != null & timeStamp != '') {
        var objDate = new Date(timeStamp);
        var day = objDate.getDate();
        var month = objDate.getMonth() + 1;
        var year = objDate.getFullYear();
        formatted = (objDate.getMonth() + 1) + '/' + objDate.getDate() + '/' + objDate.getFullYear();
        formatted += ' ' + objDate.getHours() + ':' + objDate.getMinutes() + ':' + objDate.getSeconds();
      }
    }
    
    return formatted;
  }
  
  _isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
  }
  
  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async _doGetQuery(queryType, queryName) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = {success: false};
    
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
