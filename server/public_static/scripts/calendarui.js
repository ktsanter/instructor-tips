//-----------------------------------------------------------------------------------
// CalendarUI class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class CalendarUI {
  constructor(callbackLoginComplete) {
    this._version = '0.01';
    
    this._HIDE_CLASS = 'calendarui-hide';
    
    this._callbackLoginComplete = callbackLoginComplete;
    this._container = null;
  }
 
  render() {
    var elemContainer = CreateElement.createDiv(null, 'calendarui ' + this._HIDE_CLASS);
    this._container = elemContainer;

    var elemTitle = CreateElement.createDiv(null, 'calendarui-title', 'Calendar settings');
    elemContainer.appendChild(elemTitle);

    elemContainer.appendChild(CreateElement.createDiv(null, 'calendarui-contents'));
    
    elemContainer.appendChild(this._renderControls());  
    elemContainer.appendChild(CreateElement.createDiv(null, 'calendarui-error'));
    
    return elemContainer;
  }

  async show(makeVisible) {   
    if (makeVisible) {
      await this._updateContents();
      if (this._container.classList.contains(this._HIDE_CLASS)) this._container.classList.remove(this._HIDE_CLASS);
      
    } else {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  _renderControls() {
    var container = CreateElement.createDiv(null, null);
    
    container.appendChild(CreateElement.createIcon(null, 'calendarui-icon far fa-check-square', 'save changes', (e) => {return this._completeCalendarChange(e);}));
    container.appendChild(CreateElement.createIcon(null, 'calendarui-icon far fa-window-close', 'discard changes', (e) => {return this._cancelCalendarChange(e);}));
    
    return container;
  }
  
  async _updateContents() {
    /*-- add query to get this data --*/
    var calendarOptions = {
      schoolyears: ['2019-2020'],
      terms: [
        {termgroupname: 'semester', termname: 'Sem 1'},
        {termgroupname: 'semester', termname: 'Sem 2'},
        {termgroupname: 'trimester', termname: 'Tri 1'},
        {termgroupname: 'trimester', termname: 'Tri 2'},
        {termgroupname: 'trimester', termname: 'Tri 3'}
      ]
    };
    
    var organizedOptions = this._organizeOptions(calendarOptions);
    var handler = () => {return this._saveChanges();}
    
    var container = this._container.getElementsByClassName('calendarui-contents')[0];
    while (container.firstChild) container.removeChild(container.firstChild);
    
    var years = [];
    for (var i = 0; i < organizedOptions.schoolyears.length; i++) {
      var year = organizedOptions.schoolyears[i];
      years.push({id: i, value: year, textval: year});
    }
    container.appendChild(CreateElement.createSelect(null, 'calendarui-year select-css', handler, years));
  }
  
  _organizeOptions(calendarOptions) {
    console.log(calendarOptions);
    var organizedOptions = {};
    var schoolyears = calendarOptions.schoolyears;
    var terms = calendarOptions.terms;
    var termgroupSet = new Set();

    organizedOptions.schoolyears = schoolyears;
    organizedOptions.termgroups = {};
    
    for (var i = 0; i < terms.length; i++) {
      termgroupSet.add(terms[i].termgroupname);
    }
    
    var termgroups = Array.from(termgroupSet);
    for (var i = 0; i < termgroups.length; i++) {
      organizedOptions.termgroups[termgroups[i]] = [];
    }
    
    for (var i = 0; i < terms.length; i++) {
      var tgname = terms[i].termgroupname;
      var tname = terms[i].termname;
      console.log(tgname + ' ' + tname);
      organizedOptions.termgroups[tgname].push(tname);
    }
    
    return organizedOptions;
  }
  
  //------------------------------------------------------------
  // handlers
  //------------------------------------------------------------
  async _completeCalendarChange(e) {
    this._callbackLoginComplete();

    /*
    var elemSelect = this._container.getElementsByClassName('calendarui-select')[0];
    var userShortName = elemSelect.options[elemSelect.selectedIndex].text;
    
    var dbResult = await this._doGetQuery('usermanagement/setuser', 'username/' + userShortName);
    if (dbResult.success) {
      this.show(false);
      this._callbackLoginComplete();
    }
    */
  }
  
  async _saveChanges() {
    console.log('save changes');
    this._callbackLoginComplete();
    this._show(false);
  }

  _cancelCalendarChange(e) {
    this.show(false);
  }

  //------------------------------------------------------------
  // utility methods
  //------------------------------------------------------------
  _showError(msg) {
    var elemErr = this._container.getElementsByClassName('calendarui-error')[0];
    elemErr.innerHTML = msg;
  }    

  //------------------------------------------------------------
  // DB methods
  //------------------------------------------------------------
  async _getUserInfo() {
    var userInfo = null;
    
    var dbResult = await this._doGetQuery('usermanagement', 'getuser');
    if (dbResult.success) {
      userInfo = dbResult.data;
    }
    return userInfo;
  }
  
  async _doGetQuery(queryType, queryName) {
    var resultData = null;
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._showError('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }
}
