//-------------------------------------------------------------------
// TipFilter class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

class TipFilter {
  constructor(config) {
    this._version = '0.01';
    this._HIDE_CLASS = 'tipfilter-hide';
    
    this._config = config;
    this._container = CreateElement.createDiv(null, 'tipfilter');
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render(notice) {
    this._notice = notice;
    
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    this._container.appendChild(this._renderInputs());
    this._container.appendChild(this._renderControls());
    
    return this._container;
  }
  
  _renderInputs() {
    var container = CreateElement.createDiv(null, 'tipfilter-inputs');

   // search
    var subcontainer = CreateElement.createDiv('tipfilter-search');
    container.appendChild(subcontainer);
    
    var elem = CreateElement.createDiv(null, 'tipfilter-label', 'contains ');
    subcontainer.appendChild(elem);

    elem = CreateElement.createTextInput(null, 'tipfilter-search-input');
    subcontainer.appendChild(elem);
    elem.placeholder = 'search for text';
    
    // keywords
    subcontainer = CreateElement.createDiv('tipfilter-keyword');
    container.appendChild(subcontainer);

    var elem = CreateElement.createDiv(null, 'tipfilter-label', 'keyword(s) ');
    subcontainer.appendChild(elem);

    var elem = CreateElement.createTextInput(null, 'tipfilter-keyword-input');
    subcontainer.appendChild(elem);
    elem.placeholder = 'keywords, comma-separated';
    
    return container;
  }
  
  _renderControls() {
    var container = CreateElement.createDiv(null, 'tipfilter-controls');
    
    var handler = (e) => {this._handleRetrieveTips(e)};
    container.appendChild(CreateElement.createIcon(null, 'tipfilter-icon fas fa-search', 'retrieve tips', handler));

    return container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  async update() {
    var state = await this._loadFilterStateFromDB();
    this._setFilterState(state);
  }

  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  toggleShow() {
    this.show(this._container.classList.contains(this._HIDE_CLASS));
  }

  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  getFilterState() {
    var valSearch = this._container.getElementsByClassName('tipfilter-search-input')[0].value;
    var valKeywords = this._container.getElementsByClassName('tipfilter-keyword-input')[0].value;
    
    var filterState = {
      search: valSearch,
      keywords: this._buildArrayFromString(valKeywords, ',')
    }
    
    return filterState;
  }
  
  _setFilterState(filterState) {
    var elemSearch = this._container.getElementsByClassName('tipfilter-search-input')[0];
    var elemKeywords = this._container.getElementsByClassName('tipfilter-keyword-input')[0];

    elemSearch.value = filterState.search;
    elemKeywords.value = this._buildStringFromArray(filterState.keywords, ',');    
  }
  
  async _loadFilterStateFromDB() {
    var state = null;
    
    var queryResults = await this._doGetQuery('tipmanager/query', 'controlstate-filtering');
    if (queryResults.success) {;
      state = JSON.parse(queryResults.controlstate[0].state);
    };
    
    return state;
  }
  
  async _saveFilterStateToDB(stateToSave) {
    var stateForDB = {
      search: stateToSave.search,
      keywords: stateToSave.keywords
    };
    await this._doPostQuery('tipmanager/update', 'controlstate-filtering', stateForDB);
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _handleRetrieveTips(e) {
    var filterState = this.getFilterState();
    await this._saveFilterStateToDB(filterState);
    
    this._config.updateCallback();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _buildStringFromArray(arr, delimiter) {
    var s = '';
    
    for (var i = 0; i < arr.length; i++) {
      if (i > 0) s += delimiter;
      s += arr[i].trim();
    }
    
    return s;
  }    
    
  _buildArrayFromString(str, delimiter) {
    var arr = [];;
    
    var tokenized = str.split(delimiter);
    for (var i = 0; i < tokenized.length; i++) {
      arr.push(tokenized[i].trim());
    }
    
    return arr;
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
