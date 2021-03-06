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
    this._config = config;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipshare ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    //this._container.appendChild(this._renderTitle());
    this._container.appendChild(this._renderContents());
    
    this._importDialog = new DialogContainer({
      dialogtype: 'accept-share',
      confirmcallback: (arg) => {this._finishAcceptSchedule(arg)},
      cancelcallback: () => {this._cancelAcceptSchedule()}
    });
    this._container.appendChild(this._importDialog.render());    
    
    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipshare-contents');
 
    container.appendChild(this._renderSendSchedule());     
    container.appendChild(this._renderReceivedSchedules());
    
    return container;
  }
  
  _renderSendSchedule() {
    var container = CreateElement.createDiv(null, 'tipshare-send');
    
    container.appendChild(this._renderSendTitle());
    container.appendChild(this._renderScheduleSelect());
    container.appendChild(this._renderScheduleUserSelect());
    container.appendChild(this._renderConfirmCancel());
    container.appendChild(this._renderScheduleComment());

    return container;
  }
  
  _renderSendTitle() {
    var container = CreateElement.createDiv(null, 'tipshare-sendtitle');
    
    container.appendChild(CreateElement.createDiv(null, 'tipshare-sendtitletext', 'share schedule with others'));
    
    return container;
  }
  
  _renderScheduleSelect() {
    var container = CreateElement.createDiv(null, 'tipshare-selectcontainer');
    
    var elemSelect = CreateElement.createSelect(null, 'tipshare-scheduleselect tipshare-select', null, []);
    container.appendChild(elemSelect);
    
    return container;
  }
  
  _renderScheduleUserSelect() {
    var container = CreateElement.createDiv(null, 'tipshare-usercontainer');
    
    var elemSelect = CreateElement.createSelect(null, 'tipshare-userselect tipshare-select', null, []);
    container.appendChild(elemSelect);
    
    return container;
  }
  
  _renderScheduleComment() {
    var container = CreateElement.createDiv(null, 'tipshare-commentcontainer');
    
    var elemComment = CreateElement.createTextInput(null, 'tipshare-comment');
    container.appendChild(elemComment);
    elemComment.placeholder = 'comment';
    elemComment.maxLength = 250;
    UtilityKTS.denyDoubleQuotes(elemComment);
        
    return container;
  }
  
  _renderConfirmCancel() {
    var container = CreateElement.createDiv(null, 'tipshare-confirmcancelcontainer disable-me');
    container.disabled = true;
    
    var handler = (e) => {this._handleConfirm(e);};
    var elem = CreateElement.createIcon(null, 'confirmcancel fas fa-file-export', 'share the selected schedule', handler);

    container.appendChild(elem);
    
    return container;
  }
  
  _renderReceivedSchedules() {
    var container = CreateElement.createDiv(null, 'tipshare-received');
    
    var subcontainer = CreateElement.createDiv(null, 'tipshare-received-title');
    container.appendChild(subcontainer);
    subcontainer.appendChild(CreateElement.createDiv(null, 'tipshare-received-titletext', 'schedules shared with you'));
    
    container.appendChild(CreateElement.createDiv(null, 'tipshare-received-contents'));
    
    return container;
  }
  
  _renderReceivedScheduleItem(scheduleInfo, evenItem) {
    var classString = 'tipshare-received-item' +  (evenItem ? ' evenitem' : ' odditem');
    var container = CreateElement.createDiv(null, classString);

    container.scheduleInfo = scheduleInfo;
    
    var handler = (e) => {this._handleAcceptSchedule(e);};
    var elemControlContainer = CreateElement.createDiv(null, 'tipshare-detail tipshare-control');
    container.appendChild(elemControlContainer);
    elemControlContainer.addEventListener('click', handler);
    elemControlContainer.appendChild(CreateElement.createIcon(null, 'fas fa-file-import', 'accept shared schedule'));
    
    container.appendChild(CreateElement.createDiv(null, 'tipshare-detail tipshare-date', scheduleInfo.datestamp));
    container.appendChild(CreateElement.createDiv(null, 'tipshare-detail tipshare-username', scheduleInfo.username));
    
    var subContainer = CreateElement.createDiv(null, 'tipshare-detail tipshare-commentcontrol');
    container.appendChild(subContainer);
    
    var handler = (e) => {this._handleCommentClick(e)};
    var classString = 'tipshare-commenticon far fa-comment-dots';
    if (scheduleInfo.comment.length == 0) classString += ' hide-me';
    var elemIcon = CreateElement.createIcon(null, classString, 'show/hide comment', handler);
    subContainer.appendChild(elemIcon);

    var elemScheduleName = CreateElement.createDiv(null, 'tipshare-detail tipshare-schedulename', scheduleInfo.schedulename);
    container.appendChild(elemScheduleName);
    
    container.appendChild(this._renderReceivedScheduleItemDelete(scheduleInfo, evenItem));
    
    var commentContainer = CreateElement.createDiv(null, 'tipshare-detail tipshare-comment hide-me');
    container.appendChild(commentContainer);
    commentContainer.appendChild(CreateElement.createDiv(null, 'tipshare-commenttext', scheduleInfo.comment));
    
    return container;
  }
  
  _renderReceivedScheduleItemDelete(scheduleInfo, evenItem) {
    var container = CreateElement.createDiv(null, 'tipshare-deletecontainer' + (evenItem ? ' evenitem' : ' odditem'));

    container.scheduleInfo = scheduleInfo;
    container.addEventListener('click', (e) => {this._handleDelete(e);});
    
    
    var elem = CreateElement.createIcon(null, 'tipshare-delete far fa-trash-alt', 'remove from your list of received schedules');
    container.appendChild(elem);
    
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
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'schedule-list', this._notice);
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
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'userstosharewith', this._notice);
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

    var newUserList = CreateElement.createSelect(null, 'tipshare-userselect tipshare-select select-css', null, selectValueList);
    var origUserList = this._container.getElementsByClassName('tipshare-userselect')[0];
    origUserList.parentNode.replaceChild(newUserList, origUserList);
  }
  
  _updateConfirm() {
    var elemSchedule = this._container.getElementsByClassName('tipshare-scheduleselect')[0];
    var elemUser = this._container.getElementsByClassName('tipshare-userselect')[0];
    var elemConfirm = this._container.getElementsByClassName('tipshare-confirmcancelcontainer')[0];
    
    UtilityKTS.setClass(elemConfirm, 'disable-me', ((elemSchedule.selectedIndex < 0) || (elemUser.selectedIndex < 0)));
  }

  async _updateReceived() {
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'sharedwithuser', this._notice);
    if (!queryResults.success) return;
    
    var sharedSchedules = queryResults.data;

    var container = this._container.getElementsByClassName('tipshare-received')[0];
    UtilityKTS.setClass(container, this._HIDE_CLASS, sharedSchedules.length == 0);
    
    var contents = this._container.getElementsByClassName('tipshare-received-contents')[0];
    UtilityKTS.removeChildren(contents);    
    for (var i = 0; i < sharedSchedules.length; i++) {
      contents.appendChild(this._renderReceivedScheduleItem(sharedSchedules[i], i % 2 == 0));
    }
    
    this._config.changeCallback({numSharedSchedules: sharedSchedules.length});
  }

  async _shareSchedule(params) {
    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/insert', 'shareschedule', params, this._notice);
    if (queryResults.success) {
      alert('The schedule has been shared successfully');
      await this._updateReceived();
    }
  }
  
  async _acceptSharedSchedule(params) {
    var dbParams = {
      schedulename: params.schedulename,
      sharescheduleid: params.sharedcheduleinfo.sharescheduleid
    };
    
    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/update', 'sharedschedule', dbParams, this._notice);
    if (!queryResults.success) {
      if (queryResults.details.indexOf('duplicate schedule name') >= 0) {
        this._notice.setNotice('');
        alert('You already have a schedule with this name. Please try again with a different name');
      }
    }
    
    await this._updateReceived();
  }
  
  async _removeSharedSchedule(params) {
    var dbParams = {sharescheduleid: params.sharescheduleid};
    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/delete', 'shareschedule', dbParams, this._notice);
    await this._updateReceived();
  }
  
  _showContents(visible) {
    var elemContents = this._container.getElementsByClassName('tipshare-contents')[0];
    elemContents.style.display = (visible ? 'block' : 'none');
  }
  
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  async _handleConfirm(e) {
    var elemContainer = this._container.getElementsByClassName('tipshare-confirmcancelcontainer')[0];
    if (elemContainer.classList.contains('disable-me')) return;
    
    var elemSchedule = this._container.getElementsByClassName('tipshare-scheduleselect')[0];
    var elemUser = this._container.getElementsByClassName('tipshare-userselect')[0];
    var elemComment = this._container.getElementsByClassName('tipshare-comment')[0];
    
    var shareParams = {
      scheduleid: elemSchedule[elemSchedule.selectedIndex].value,
      userid: elemUser[elemUser.selectedIndex].value,
      comment: elemComment.value
    };

    UtilityKTS.setClass(elemContainer, 'disable-me', true);
    await this._shareSchedule(shareParams);
    UtilityKTS.setClass(elemContainer, 'disable-me', false);
  }
  
  _handleCommentClick(e) {
    var elemComment = e.target.parentNode.parentNode.getElementsByClassName('tipshare-comment')[0];
    UtilityKTS.toggleClass(elemComment, 'hide-me', false);
  }
  
  async _handleAcceptSchedule(e) {
    var node = e.target.parentNode;
    if (node.classList.contains('tipshare-control')) node = node.parentNode;
    
    if (!node.scheduleInfo) {
      console.log('can\'t find scheduleInfo for e.target');
      return;
    }
    
    this._showContents(false);
    
    this._importDialog.show(true);
    this._importDialog.update({
      scheduleinfo: node.scheduleInfo
    });
  }    
  
  async _finishAcceptSchedule(params) {
    await this._acceptSharedSchedule(params);
    await this._updateScheduleList();

    this._showContents(true);
  }
  
  _cancelAcceptSchedule() {
    this._showContents(true);
  }
  
  async _handleDelete(e) {
    var node = e.target;
    if (node.classList.contains('tipshare-delete')) node = node.parentNode;

    if (!node.scheduleInfo) {
      console.log('can\'t find scheduleInfo for e.target');
      return;
    }
    
    var scheduleInfo = node.scheduleInfo;    
    var msg = 'This shared schedule will be removed:' +
              '\n"' + scheduleInfo.schedulename + '"' + 
              '\nshared by ' + scheduleInfo.username +
              ' on ' + scheduleInfo.datestamp +
              '\n\nThis can\'t be undone. Continue with removal?';
    if (!confirm(msg)) return;
    
    await this._removeSharedSchedule(node.scheduleInfo);
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  

}
