//-----------------------------------------------------------------------------------
// TipShare class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipShare {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Schedule sharing';
    
    this._HIDE_CLASS = 'tipshare-hide';

    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipshare ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderTitle());

    this._container.appendChild(this._renderContents());
    
    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipshare-contents');
    
    container.appendChild(this._renderScheduleSelect());
    container.appendChild(this._renderScheduleTargetUI());
    container.appendChild(this._renderConfirmCancel());
    
    container.appendChild(this._renderReceivedSchedules());
    
    return container;
  }
  
  _renderScheduleSelect() {
    var container = CreateElement.createDiv(null, 'tipshare-selectcontainer');
    
    var elemSelect = CreateElement.createSelect(null, 'tipshare-scheduleselect tipshare-select', null, []);
    container.appendChild(elemSelect);
    
    return container;
  }
  
  _renderScheduleTargetUI() {
    var container = CreateElement.createDiv(null, 'tipshare-targetcontainer');
    
    var elemSelect = CreateElement.createSelect(null, 'tipshare-targetselect tipshare-select', null, []);
    container.appendChild(elemSelect);
    
    var elemComment = CreateElement.createTextInput(null, 'tipshare-comment');
    container.appendChild(elemComment);
    elemComment.placeholder = 'comment';
        
    return container;
  }
  
  _renderConfirmCancel() {
    var container = CreateElement.createDiv(null, 'tipshare-confirmcancelcontainer');
    
    var handler = (me) => {this._handleConfirm(this);};
    var elem = CreateElement.createButton(null, 'confirmcancel confirm', 'share', 'share the selected schedule', handler);
    elem.disabled = true;
    container.appendChild(elem);
    
    return container;
  }
  
  _renderReceivedSchedules() {
    var container = CreateElement.createDiv(null, 'tipshare-received');
    
    var subcontainer = CreateElement.createDiv(null, 'tipshare-received-title');
    container.appendChild(subcontainer);
    subcontainer.appendChild(CreateElement.createDiv(null, 'tipshare-received-titletext', 'Schedules shared with you'));
    
    container.appendChild(CreateElement.createDiv(null, 'tipshare-received-contents'));
    
    return container;
  }
  
  _renderSharedSchedule(scheduleInfo) {
    var container = CreateElement.createDiv(null, 'tipshare-received-item');

    container.scheduleInfo = scheduleInfo;
    console.log(scheduleInfo);
    
    container.appendChild(CreateElement.createDiv(null, 'tipshare-detail tipshare-date', scheduleInfo.datestamp));
    container.appendChild(CreateElement.createDiv(null, 'tipshare-detail tipshare-username', scheduleInfo.username));
    
    var elemScheduleName = CreateElement.createDiv(null, 'tipshare-detail tipshare-schedulename', scheduleInfo.schedulename);
    container.appendChild(elemScheduleName);
    
    if (scheduleInfo.comment.length > 0) {
      var handler = (e) => {this._handleCommentClick(e)};
      var elemIcon = CreateElement.createIcon(null, 'tipshare-commenticon far fa-comment-dots', 'comment', handler);
      elemScheduleName.appendChild(elemIcon);
      elemIcon.fullCommentText = scheduleInfo.comment;
    }
    
    return container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    this._showElement(this._container, makeVisible);
  }
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    await this._updateScheduleList();
    await this._updateUserList();
    this._updateConfirm();
    await this._updateReceived();
  }
  
  async _updateScheduleList() {
    var queryResults = await this._doGetQuery('tipmanager/query', 'schedule-list');
    if (!queryResults.success) return;
    
    var scheduleList = queryResults.schedules;
    var selectValueList = [];
    for (var i = 0; i < scheduleList.length; i++) {
      var schedule = scheduleList[i];
      selectValueList.push({
        value: schedule.scheduleid,
        textval: schedule.schedulename
      });
    }
    
    var newSchedule = CreateElement.createSelect(null, 'tipshare-scheduleselect tipshare-select select-css', null, selectValueList);
    var origSchedule = this._container.getElementsByClassName('tipshare-scheduleselect')[0];
    origSchedule.parentNode.replaceChild(newSchedule, origSchedule);
  }
  
  async _updateUserList() {
    var queryResults = await this._doGetQuery('tipmanager/query', 'userstosharewith');
    if (!queryResults.success) return;
    
    var userList = queryResults.users;
    var selectValueList = [];
    for (var i = 0; i < userList.length; i++) {
      var user = userList[i];
      selectValueList.push({
        value: user.userid,
        textval: user.username
      });
    }    

    var newUserList = CreateElement.createSelect(null, 'tipshare-targetselect tipshare-select select-css', null, selectValueList);
    var origUserList = this._container.getElementsByClassName('tipshare-targetselect')[0];
    origUserList.parentNode.replaceChild(newUserList, origUserList);
  }
  
  _updateConfirm() {
    var elemSchedule = this._container.getElementsByClassName('tipshare-scheduleselect')[0];
    var elemUser = this._container.getElementsByClassName('tipshare-targetselect')[0];
    var elemConfirm = this._container.getElementsByClassName('confirm')[0];
    
    elemConfirm.disabled = ((elemSchedule.selectedIndex < 0) || (elemUser.selectedIndex < 0));
  }

  async _updateReceived() {
    console.log('_updateReceived');
    var queryResults = await this._doGetQuery('tipmanager/query', 'sharedwithuser');
    if (!queryResults.success) return;
    
    var sharedSchedules = queryResults.data;

    var container = this._container.getElementsByClassName('tipshare-received')[0];
    this._setClass(container, this._HIDE_CLASS, sharedSchedules.length == 0);
    
    var contents = this._container.getElementsByClassName('tipshare-received-contents')[0];
    this._removeChildren(contents);    
    for (var i = 0; i < sharedSchedules.length; i++) {
      contents.appendChild(this._renderSharedSchedule(sharedSchedules[i]));
    }      
  }

  async _shareSchedule(params) {
    var queryResults = await this._doPostQuery('tipmanager/insert', 'shareschedule', params);
    if (queryResults.success) {
      alert('The schedule has been shared successfully');
    }
  }
  
  
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  async _handleConfirm(me) {
    var elemSchedule = this._container.getElementsByClassName('tipshare-scheduleselect')[0];
    var elemUser = this._container.getElementsByClassName('tipshare-targetselect')[0];
    var elemComment = this._container.getElementsByClassName('tipshare-comment')[0];
    
    var shareParams = {
      scheduleid: elemSchedule[elemSchedule.selectedIndex].value,
      userid: elemUser[elemUser.selectedIndex].value,
      comment: elemComment.value
    };
    
    await this._shareSchedule(shareParams);
  }
  
  _handleCommentClick(e) {
    var commentText = e.target.fullCommentText;
    alert(commentText + '\n[find better way to display this]');
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
  _setClass(elem, className, add) {
    if (elem.classList.contains(className)) elem.classList.remove(className);
    if (add) elem.classList.add(className);
  }
  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
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
      resultData.details = requestResult.details;
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }  
}
