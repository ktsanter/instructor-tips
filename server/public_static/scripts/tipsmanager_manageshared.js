//-----------------------------------------------------------------------------------
// TipSchedulingShareManagement class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipSchedulingShareManagement {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Shared schedules';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
    this._config = config;
    this._callback = config.callback;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render(notice) {
    this._container = CreateElement.createDiv(null, 'manageschedule ' + this._HIDE_CLASS);

    this._notice = notice;
    
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
    await this._callback();
    var queryResults = await this._doGetQuery('tipmanager/query', 'sharedwithuser');
    this._prepContainerForUpdate();
    
    if (queryResults.success) {
      var schedulesSharedWithUser = queryResults.data;
      var userCourseData = queryResults.usercourses;
      var allCourseData = queryResults.allcourses;
      
      if (schedulesSharedWithUser.length == 0) {
        this._container.appendChild(CreateElement.createDiv(null, 'manageschedule-noresults', 'no schedules have been shared with you'));
        
      } else {
        this._container.appendChild(this._renderScheduleList(schedulesSharedWithUser, userCourseData, allCourseData));
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
  
  _renderScheduleList(schedulesSharedWithUser, userCourseData, allCourseData) {
    var container;

    container = CreateElement.createDiv(null, 'manageschedule-content');

    var organizedUserCourses = this._organizeUserCourses(userCourseData, allCourseData);

    var headerList = ['', 'shared by', 'shared', 'term', 'source course', 'target course', ''];
    var elemTable = CreateElement.createTable(null, 'managschedule-sharelist', headerList);
    container.appendChild(elemTable);

    for (var i = 0; i < schedulesSharedWithUser.length; i++) {
      this._buildScheduleRow(elemTable, schedulesSharedWithUser[i], organizedUserCourses);
    }
    
    this._commentRow = this._buildCommentRow(headerList.length);

    return container;
  }

  _organizeUserCourses(userCourseData, allCourseData) {
    var organizedCourses = {};
    var organizedAllCourses = {};
    
    for (var i = 0; i < userCourseData.length; i++) {
      var userCourseItem = userCourseData[i];
      var termgroupName = userCourseItem.termgroupname;
      if (!organizedCourses.hasOwnProperty(termgroupName)) {
        organizedCourses[termgroupName] = [];
      }
      organizedCourses[termgroupName].push({usercourseid: userCourseItem.usercourseid, coursename: userCourseItem.coursename});
    }
    
    for (var i = 0; i < allCourseData.length; i++) {
      var userAllCourseItem = allCourseData[i];
      var termgroupName = userAllCourseItem.termgroupname;
      if (!organizedAllCourses.hasOwnProperty(termgroupName)) {
        organizedAllCourses[termgroupName] = [];
      }
      organizedAllCourses[termgroupName].push({usercourseid: userAllCourseItem.usercourseid, coursename: userAllCourseItem.coursename});
    }

    return {specific: organizedCourses, all: organizedAllCourses};
  }
  
  _buildScheduleRow(elemTable, scheduleItem, userCourses) {
    var elemRow = CreateElement.createTableRow(null, null, elemTable);
    elemRow.scheduleItem = scheduleItem;

    var importHandler = (e) => {return this._importSchedule(e)};
    var deleteHandler = (e) => {return this._deleteSchedule(e)};
    var commentHandler = (e) => {return this._showComment(e)};
    
    var courseList = [];
    var termgroupName = scheduleItem.termgroupname;
    var coursesForTermgroup = userCourses.specific[termgroupName];
    var allcoursesForTermgroup = userCourses.all[termgroupName][0];

    if (coursesForTermgroup) {
      var elemCell = CreateElement.createTableCell(null, 'manageschedule-import', '');
      elemRow.appendChild(elemCell);
      
      elemCell.appendChild(CreateElement.createIcon(null, 'manageschedule-import fas fa-file-import', 'import schedule', importHandler));

    } else {
      var elemCell = CreateElement.createTableCell(null, 'manageschedule-import', '');
      elemRow.appendChild(elemCell);    
    }
    
    elemRow.appendChild(CreateElement.createTableCell(null, null, scheduleItem.username));
    if (scheduleItem.commenttext && scheduleItem.commenttext.length > 0) {
      elemRow.lastChild.appendChild(CreateElement.createIcon(null, 'manageschedule-comment far fa-comment', 'show comment', commentHandler));
    }
    
    elemRow.appendChild(CreateElement.createTableCell(null, null, this._formatTimeStamp(scheduleItem.timestampshared)));
    elemRow.appendChild(CreateElement.createTableCell(null, null, scheduleItem.termgroupname));
    elemRow.appendChild(CreateElement.createTableCell(null, null, scheduleItem.coursename));
    
    
    if (coursesForTermgroup) {
      for (var i = 0; i < coursesForTermgroup.length; i++) {
        courseList.push({id: coursesForTermgroup[i].usercourseid, value: JSON.stringify({specific: coursesForTermgroup[i], all: allcoursesForTermgroup}), textval: coursesForTermgroup[i].coursename});
      }

      var elemCell = CreateElement.createTableCell(null, null, '');
      elemRow.appendChild(elemCell);
   
      var selectContainer = CreateElement.createDiv(null, 'manageschedule-coursecontainer');
      elemCell.appendChild(selectContainer);
      selectContainer.appendChild(CreateElement.createSelect(null, 'manageschedule-course select-css', null, courseList));      
      
    
    } else {
      var elemCell = CreateElement.createTableCell(null, null, '');
      elemRow.appendChild(elemCell);      
      elemCell.appendChild(CreateElement.createDiv(null, 'manageschedule-coursecontainer no-courses', 'no matching course schedules'));
    }
    
    var elemCell = CreateElement.createTableCell(null, null, '');
    elemRow.appendChild(elemCell);
    elemCell.appendChild(CreateElement.createIcon(null, 'manageschedule-delete far fa-trash-alt', 'delete this shared schedule', deleteHandler));    
  }
  
  _buildCommentRow(numCells) {
    var elemRow = CreateElement.createTableRow(null, 'manageschedule-commentrow');
    
    var elemCell = CreateElement.createTableCell(null, null, '');
    elemRow.appendChild(elemCell);
    
    elemCell = CreateElement.createTableCell(null, 'manageschedule-commentcell', '');
    elemRow.appendChild(elemCell);
    elemCell.colSpan = numCells-2;
    
    elemCell.appendChild(CreateElement.createDiv(null, 'manageschedule-commenttext'));
    
    var elemCell = CreateElement.createTableCell(null, null, '');
    elemRow.appendChild(elemCell);

    return elemRow;
  }

  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------    
  async _importSchedule(e) {
    var elemRow = e.target.parentNode.parentNode;
    var elemSelect = elemRow.getElementsByClassName('manageschedule-course')[0];
    
    var scheduleItem = elemRow.scheduleItem;
    var courseSelections = JSON.parse(elemSelect[elemSelect.selectedIndex].value);
    var specificCourse = courseSelections.specific;
    var allCourse = courseSelections.all;
    
    var postData = {
      "scheduleItem": elemRow.scheduleItem,
      "courseSelection": JSON.parse(elemSelect[elemSelect.selectedIndex].value).specific,
      "allCourseSelection": allCourse
    };
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'integrate-shared', postData);
    if (queryResults.success) {
      await this.update();
    }
  }
  
  async _deleteSchedule(e) {
    var elemRow = e.target.parentNode.parentNode;
    elemRow.classList.add('manageschedule-highlight');
    
    setTimeout( () => { return this._confirmDelete(this, elemRow); }, 1);
  }
  
  async _confirmDelete(me, elemRow) {
    if (confirm('Are you sure you want to delete this shared schedule?')) {
      var scheduleItem = elemRow.scheduleItem;

      var queryResults = await this._doPostQuery('tipmanager/delete', 'delete-shared', scheduleItem);
      if (queryResults.success) {
        await this.update();
      }
      
    } else {
      elemRow.classList.remove('manageschedule-highlight');
    }
  }
  
  _showComment(e) {
    var elemRow = e.target.parentNode.parentNode;  
    var action = null;
    
    if (this._commentRow.scheduleItem) {
      this._commentRow.parentNode.removeChild(this._commentRow);
      
      if (this._commentRow.scheduleItem.sharedscheduleid != elemRow.scheduleItem.sharedscheduleid) {
         this._commentRow.scheduleItem = elemRow.scheduleItem;
      } else {
        this._commentRow.scheduleItem = null;
      }
      
    } else {
       this._commentRow.scheduleItem = elemRow.scheduleItem;
    }

    if (this._commentRow.scheduleItem) {
      var commentText = elemRow.scheduleItem.commenttext;
      var commentCell = this._commentRow.getElementsByClassName('manageschedule-commenttext')[0];
      
      commentCell.innerHTML = MarkdownToHTML.convert(commentText);
      
      elemRow.parentNode.insertBefore(this._commentRow, elemRow.nextSibling);
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
