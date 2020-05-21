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
    var elem = this._createSliderSwitch('browse tips', 'browse tips', 'schedulecontrol-browse', handler, false);
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
    console.log('_handleBrowseTips ' + this._getSliderValue(e.target.parentNode));
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
  // slider switch
  //--------------------------------------------------------------
  _createSliderSwitch(dataOnLabel, dataOffLabel, addedClassList, handler, useTwoChoice) {
    var classList = 'switch';
    if (useTwoChoice) {
      classList += ' switch-two-choice';
    } else {
      classList += ' switch-yes-no';
    }
    if (addedClassList && addedClassList != '') classList += ' ' + addedClassList;
    var container = CreateElement._createElement('label', null, classList);
    
    
    var elemCheckbox = CreateElement._createElement('input', null, 'switch-input');
    elemCheckbox.type = 'checkbox';
    container.appendChild(elemCheckbox);
    if (handler) elemCheckbox.addEventListener('click', e => handler(e));
    
    var elemDataSpan = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemDataSpan);
    elemDataSpan.setAttribute('data-on', dataOnLabel);
    elemDataSpan.setAttribute('data-off', dataOffLabel);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));
    return container;
  }

  _createSliderRadio(groupName, dataOnLabel, dataOffLabel, addedClassList, handler) {
    var classList = 'switch switch-yes-no';
    if (addedClassList && addedClassList != '') classList += ' ' + addedClassList;
    var container = CreateElement._createElement('label', null, classList);
    
    
    var elemRadio = CreateElement._createElement('input', null, 'switch-input');
    elemRadio.type = 'radio';
    elemRadio.name = groupName;
    container.appendChild(elemRadio);
    if (handler) elemRadio.addEventListener('click', e => handler(e));
    
    var elemDataSpan = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemDataSpan);
    elemDataSpan.setAttribute('data-on', dataOnLabel);
    elemDataSpan.setAttribute('data-off', dataOffLabel);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));
    return container;
  }

  _getSliderValue(elem) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];    
    return elemInput.checked;
  }

  _setSliderValue(elem, checked) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];
    elemInput.checked = checked;
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
