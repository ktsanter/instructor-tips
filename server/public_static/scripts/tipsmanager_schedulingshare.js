//-----------------------------------------------------------------------------------
// TipSchedulingShare class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipSchedulingShare {
  constructor() {
    this._version = '0.01';
    this._title = 'SchedulingShare';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render(notice) {
    this._container = CreateElement.createDiv(null, 'tipschedule-share ' + this._HIDE_CLASS);

    this._notice = notice;

    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (makeVisible) {
      this._clearSelectedText();
      this._container.getElementsByClassName('tipschedule-share-select')[0].focus();
      
    } else {
      this._container.classList.add(this._HIDE_CLASS);
    } 
  }

  isVisible() {
    return !this._container.classList.contains(this._HIDE_CLASS);
  }
    
  async update(shareInfo) {
    this._shareInfo = shareInfo;
    
    while (this._container.firstChild) this._container.removeChild(this._container.firstChild);

    var queryResult = await this._doGetQuery('tipmanager/query', 'userstosharewith');
    
    if (!queryResult.success) {
      this._container.innerHTML = 'query failed';
 
    } else {
      this._container.appendChild(this._renderUI(queryResult.data));      
    }

    this.show(true);
  }
  
  _renderUI(userData) {
    var container = CreateElement.createDiv(null, 'tipschedule-share-contents');
    
    container.appendChild(CreateElement.createDiv(null, 'tipschedule-share-title', 'Share this schedule with...'));

    var userList = [];
    for (var i = 0; i < userData.length; i++) {
      var user = userData[i];
      userList.push({id: user.userid, value: user.usershortname, textval: user.username});
    }
      
    container.appendChild(CreateElement.createSelect(null, 'tipschedule-share-select select-css', null, userList));
    var elemComment = CreateElement.createTextArea(null, 'tipschedule-share-comment');
    container.appendChild(elemComment);
    elemComment.placeholder = 'add a comment';
    elemComment.rows = 1;
    elemComment.cols = 60;
      
    var elemButtonContainer = CreateElement.createDiv(null, 'tipschedule-share-controlcontainer');
    container.appendChild(elemButtonContainer);

    elemButtonContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-share-control far fa-check-square', 'confirm you want to share the schedule', (e) => {return this._confirm(e);}));
    elemButtonContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-share-control far fa-window-close', 'cancel', (e) => {return this._cancel(e);}));

    return container;
  }
  

  //------------------------------------------------------------
  // handlers
  //------------------------------------------------------------  
  async _confirm(e) {
    var elemSelect = this._container.getElementsByClassName('tipschedule-share-select')[0];
    var shareWithUser = elemSelect[elemSelect.selectedIndex].id;
    
    var elemComment = this._container.getElementsByClassName('tipschedule-share-comment')[0];
    var commentText = this._sanitizeText(elemComment.value);
    
    this._shareInfo.sharewith = shareWithUser;
    this._shareInfo.commentText = commentText;
    
    var queryResults = await this._doPostQuery('tipmanager/insert', 'storesharedschedule', this._shareInfo);
    if (queryResults.success) {
      this._shareInfo.callback();
    }
    
    if (queryResults.success) this.show(false);
  }

  _cancel(e) {
    this.show(false);
  }

  //------------------------------------------------------------
  // utility methods
  //------------------------------------------------------------  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }

  _clearSelectedText() {
    if (window.getSelection) {
        if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
        }
        else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
        }
    }
    else if (document.selection) {  // IE?
        document.selection.empty();
    }
  }  
  
  _sanitizeText(str) {
    var cleaned = str; //str.replace(/"/g, '\\"');;
    
    // consider other cleaning e.g. <script> tags
    
    return cleaned;
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
