//-----------------------------------------------------------------------------------
// TipManagerSchedulingControl class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipManagerSchedulingControl {
  constructor(updateCallback) {
    this._version = '0.01';
    
    this._HIDE_CLASS = 'schedulecontrol-hide';
    
    this._updateCallback = updateCallback;

    this._container = CreateElement.createDiv(null, 'schedulecontrol');
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render(notice) {
    this._notice = notice;
    
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
    
    this._container.appendChild(this._buildUI());
        
    return this._container;
  }

  show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
    
  _buildUI() {
    var container = CreateElement.createDiv(null, null);
    
    var valueList = [];
    var scheduleList = ['schedule aaa', 'schedule bbb']; // temporary - pull from DB
    for (var i = 0; i < scheduleList.length; i++) {
      valueList.push({id: i, value: scheduleList[i], textval: scheduleList[i]});
    }    
    var handler = (e) => {return this._handleScheduleSelect(e);};
    container.appendChild(CreateElement.createSelect(null, 'schedulecontrol-select select-css', handler, valueList));

    handler = (e) => {return this._handleScheduleAdd(e);};
    container.appendChild(CreateElement.createIcon(null, 'schedulecontrol-icon far fa-plus-square', 'add new schedule', handler));
    
    handler = (e) => {return this._handleBrowseTips(e);};   
    var elem = CreateElement.createSliderSwitch('browse tips', 'browse tips', 'schedulecontrol-browse', handler, false);
    elem.title = 'search and select from tip list';
    container.appendChild(elem);
        
    return container;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleScheduleSelect(e) {
    console.log('_handleScheduleSelect ' + e.target.value);
    this._updateCallback();
  }
        
  _handleScheduleAdd() {
    console.log('_handleScheduleAdd');
  }
  
  _handleBrowseTips(e) {
    console.log('_handleBrowseTips ' + e.target.checked);
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------
  _showElement(elem, makeVisible, override) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
    
    if (override) {
      if (makeVisible) {
        elem.style.display = 'inline-block';
      } else {
        elem.style.display = 'none';
      }
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
      console.log('queryType: ' + queryType + ' queryName: ' + queryName);
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
      console.log('queryType: ' + queryType + ' queryName: ' + queryName);
      console.log(postData);
    }
    
    return resultData;
  }    
}
