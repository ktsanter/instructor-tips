//-----------------------------------------------------------------------------------
// TipSchedulingShare class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipSchedulingShare {
  constructor(config) {
    this._version = '0.01';
    this._title = 'SchedulingShare';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
    this._config = config;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'tipschedule-share ' + this._HIDE_CLASS);
    
    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }

  isVisible() {
    return !this._container.classList.contains(this._HIDE_CLASS);
  }
    
  async update() {
    console.log('update share');
    
    while (this._container.firstChild) this._container.removeChild(this._container.firstChild);

    var queryResult = await this._doGetQuery('tipmanager/query', 'otherusers');
    
    if (!queryResult.success) {
      this._container.innerHTML = 'query failed';
 
    } else {
      this._container.appendChild(this._renderUI(queryResult.data));      
    }

    this.show(true);
  }
  
  _renderUI(userData) {
    var container = CreateElement.createDiv(null, 'tipschedule-share-contents');

    var userList = [];
    for (var i = 0; i < userData.length; i++) {
      var user = userData[i];
      userList.push({id: i, value: user.usershortname, textval: user.username});
    }
      
    container.appendChild(CreateElement.createSelect(null, 'tipschedule-share-select select-css', null, userList));
      
    var elemButtonContainer = CreateElement.createDiv(null, 'tipschedule-share-controlcontainer');
    container.appendChild(elemButtonContainer);

    elemButtonContainer.appendChild(CreateElement.createButton(null, 'tipschedule-share-control', 'share schedule', 'confirm you want to share the schedule', (e) => {return this._confirm(e);}));
      
    return container;
  }
  

  //------------------------------------------------------------
  // handlers
  //------------------------------------------------------------  
  _confirm(e) {
    console.log('confirm');
  }

  //------------------------------------------------------------
  // utility methods
  //------------------------------------------------------------  
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
