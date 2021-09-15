//-------------------------------------------------------------------
// Sharing
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Sharing {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async render() {
    this.selectSchedule = this.config.container.getElementsByClassName('select-schedule')[0];
    this.selectUser = this.config.container.getElementsByClassName('select-user')[0];
    this.textComment = this.config.container.getElementsByClassName('text-comment')[0];
    this.buttonShare = this.config.container.getElementsByClassName('button-share')[0];
    
    this.pendingSharesContainer = this.config.container.getElementsByClassName('pending-shares-container')[0];
    this.pendingSharesLabel = this.config.container.getElementsByClassName('pending-shares-label')[0];
    this.pendingSharesTemplate = this.config.container.getElementsByClassName('pending-shares-template')[0];
    
    this.selectSchedule.addEventListener('change', (e) => { this._handleSelect(e); });
    this.selectUser.addEventListener('change', (e) => { this._handleSelect(e); });
    this.buttonShare.addEventListener('click', (e) => { this._handleShareButton(e); });

    this._setShareCount(0);
    var pendingList = await this.config.db.getPendingSharedSchedules();
    if (!pendingList) return;
    this._setShareCount(pendingList.length);
  }
  
  async update() {
    this._updateSharing();
    this._updatePendingShares();
  }
  
  //--------------------------------------------------------------
  // private methods
  //-------------------------------------------------------------- 
  _setShareCount(count) {
    var elemInner = this.config.elemShareCount.getElementsByClassName('navbar-super')[0];
    
    if (count == 0) {
      elemInner.innerHTML = '';
      this.config.elemShareCount.title = '';
    
    } else if (count == 1) {
      elemInner.innerHTML = count;
      this.config.elemShareCount.title = '1 schedule has been shared with you';
    
    } else {
      elemInner.innerHTML = count;
      this.config.elemShareCount.title = count + ' schedules have been shared with you';
    }
  }
  
  async _updateSharing() {
    UtilityKTS.removeChildren(this.selectSchedule);
    UtilityKTS.removeChildren(this.selectUser);
    this.textComment.value = '';
    this.buttonShare.disabled = true;
    
    var scheduleList = await this.config.db.getScheduleList();
    if (!scheduleList) return;

    var userList = await this.config.db.getUserList();
    if (!userList) return;

    for (var i = 0; i < scheduleList.length; i++) {
      var schedule = scheduleList[i];
      var elemOption = CreateElement.createOption(null, null, schedule.scheduleid, schedule.schedulename);
      this.selectSchedule.appendChild(elemOption);
    }
    this.selectSchedule.selectedIndex = -1;
 
    for (var i = 0; i < userList.length; i++) {
      var user = userList[i];
      var elemOption = CreateElement.createOption(null, null, user.userid, user.username);
      this.selectUser.appendChild(elemOption);
    }
    this.selectUser.selectedIndex = -1;
  }

  async _updatePendingShares() {
    UtilityKTS.setClass(this.pendingSharesContainer, this.config.hideClass, true);

    this._setShareCount(0);
    var pendingList = await this.config.db.getPendingSharedSchedules();
    if (!pendingList || pendingList.length == 0) return;
    this._setShareCount(pendingList.length);
    
    UtilityKTS.removeChildren(this.pendingSharesContainer);
    
    var elemLabel = this.pendingSharesLabel.cloneNode(true);
    UtilityKTS.setClass(elemLabel, this.config.hideClass, false);
    this.pendingSharesContainer.appendChild(elemLabel);
    
    for (var i = 0; i < pendingList.length; i++) {
      var item = pendingList[i];

      var elem = this.pendingSharesTemplate.cloneNode(true);
      var elemAccept = elem.getElementsByClassName('accept')[0];
      elemAccept.setAttribute("pending-schedule", JSON.stringify(item));
      elemAccept.addEventListener('click', (e) => { this._handleAcceptShared(e); });
      
      elem.getElementsByClassName('date-shared')[0].innerHTML = item.dateshared;
      elem.getElementsByClassName('shared-by')[0].innerHTML = item.sharedby;
      
      var elemDescription = elem.getElementsByClassName('description')[0]
      elemDescription.appendChild(CreateElement.createDiv(null, null, item.schedulename));
      if (item.comment.length > 0) elemDescription.appendChild(CreateElement.createDiv(null, null, item.comment));
      
      UtilityKTS.setClass(elem, this.config.hideClass, false);
      this.pendingSharesContainer.appendChild(elem);
    }
    
    UtilityKTS.setClass(this.pendingSharesContainer, this.config.hideClass, false);
  }
  
  async _doShare() {
    var scheduleId = this.selectSchedule[this.selectSchedule.selectedIndex].value;
    var userId = this.selectUser[this.selectUser.selectedIndex].value;
    var comment = this.textComment.value;
    
    var shareParams = {
      "scheduleid": scheduleId,
      "userid": userId,
      "comment": comment
    }
    
    var success = await this.config.db.shareSchedule(shareParams);
    var msg = "The schedule has been shared successfully";
    if (!success) msg = "Unfortunately something went wrong and the schedule was not shared";
    alert(msg);
  }
  
  async _acceptShare(shareInfo) {
    console.log('_acceptShare', shareInfo);
    var msg = 'Accept this shared schedule?';
    msg += '\n"' + shareInfo.schedulename + '"';
    msg += '\n\n shared by ' + shareInfo.sharedby + ' on ' + shareInfo.dateshared;
    var proposedName = 'copy of ' + shareInfo.schedulename;
    
    var response = prompt(msg, proposedName);
    if (!response) return;
    response = response.trim();
    if (response.length == 0) return;
    
    var acceptParams = {
      "scheduleid": shareInfo.scheduleid,
      "schedulename": response
    }
    
    var success = await this.config.db.acceptSharedSchedule(acceptParams);
    if (success) this.update();
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _handleSelect(e) {
    this.buttonShare.disabled = (
      this.selectSchedule.selectedIndex < 0 ||
      this.selectUser.selectedIndex < 0
    );
  }
  
  async _handleShareButton(e) {
    await this._doShare();
  }
  
  async _handleAcceptShared(e) {
    await this._acceptShare(JSON.parse(e.target.getAttribute('pending-schedule')));
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
}
