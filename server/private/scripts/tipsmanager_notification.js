//-----------------------------------------------------------------------------------
// TipNotification class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TipNotification {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Notification';
    
    this._HIDE_CLASS = 'tipnotification-hide';

    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipnotification ' + this._HIDE_CLASS);
    
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
    var container = CreateElement.createDiv(null, 'tipnotification-contents');
    
    container.appendChild(this._renderShareNotifications());
    container.appendChild(this._renderScheduleNotifications());
    
    return container;
  }
  
  _renderShareNotifications() {
    var container = CreateElement.createDiv(null, 'tipnotification-share');
    
    var handler = (e) => {this._handleShareChange(e);}
    var elem = CreateElement.createSliderSwitch('yes', 'no', 'tipnotification-sharecontrol', handler);
    container.appendChild(elem);
    container.appendChild(CreateElement.createDiv(null, 'tipnotification-sharelabel', 'Receive notification when a schedule is shared with you'));
    
    return container;
  }

  _renderScheduleNotifications() {
    var container = CreateElement.createDiv(null, 'tipnotification-schedule');
    
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
    var state = await this._loadStateFromDB();
    this._setState(state);
  }

  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  getState() {
    console.log('getState');
    var state = {};
    
    return state;
  }
  
  _setState(state) {
    console.log('_setState');
  }
  
  async _loadStateFromDB() {
    console.log('_loadStateFromDB');
    var state = null;
    
    var queryResults = await this._doGetQuery('tipmanager/query', 'notification');
    if (queryResults.success) {
      console.log(queryResults.data);
      //state = JSON.parse(queryResults.controlstate[0].state);
    };
    
    return state;
  }
  
  async _saveStateToDB(stateToSave) {
    console.log('_saveStateToDB');
    /*
    var stateForDB = {
      search: stateToSave.search,
      keywords: stateToSave.keywords
    };
    await this._doPostQuery('tipmanager/update', 'controlstate-filtering', stateForDB);
    */
  }
  

  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  _handleShareChange(e) {
    var share = CreateElement.getSliderValue(e.target.parentNode);
    console.log(share);
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
