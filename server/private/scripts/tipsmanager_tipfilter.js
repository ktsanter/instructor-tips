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
  async render(notice) {
    this._notice = notice;
    
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    this._container.appendChild(await this._renderInputs());
    
    return this._container;
  }
  
  async _renderInputs() {
    var container = CreateElement.createDiv(null, 'tipfilter-inputs');

   // search
    var subcontainer = CreateElement.createDiv(null, 'tipfilter-search');
    container.appendChild(subcontainer);
    
    var elem = CreateElement.createDiv(null, 'tipfilter-label', 'contains');
    subcontainer.appendChild(elem);

    elem = CreateElement.createTextInput(null, 'tipfilter-search-input');
    subcontainer.appendChild(elem);
    elem.placeholder = 'search for text';
    elem.addEventListener('input', (e) => {this._handleSearchChange();});
    
    // keywords
    subcontainer = CreateElement.createDiv(null, 'tipfilter-keyword');
    container.appendChild(subcontainer);

    var elem = CreateElement.createDiv(null, 'tipfilter-label', 'category');
    subcontainer.appendChild(elem);

    var valuesToSelectFrom = await this._loadCategoryListFromDB();
    var params = {
      valueList: valuesToSelectFrom,
      selectedValueList: [],
      changeCallback: (params) => {this._handleCategoryChange(params);}      
    }
    this._keywordInput = new LookupInput(params);
    subcontainer.appendChild(this._keywordInput.render());
    this._keywordInput.show(true);
    
    // common
    subcontainer = CreateElement.createDiv(null, 'tipfilter-common');
    container.appendChild(subcontainer);
    
    var handler = (e) => {this._handleCommonChange(e);};
    elem = CreateElement.createSliderSwitch('common', 'common', 'tipfilter-commonswitch', handler, false);
    subcontainer.appendChild(elem);
    elem.title = 'include "common" tips in results';
    CreateElement.setSliderValue(elem, true);
    
    return container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  async update() {
    var state = await this._loadFilterStateFromDB();
    this._setFilterState(state);
  }
  
  async _retrieveTips(e) {
    var filterState = this.getFilterState();
    await this._saveFilterStateToDB(filterState);
    
    this._config.updateCallback(true);
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
    var valKeywords = this._keywordInput.value();
    var valCommon = CreateElement.getSliderValue(this._container.getElementsByClassName('tipfilter-commonswitch')[0]);
    
    var filterState = {
      search: valSearch,
      keywords: valKeywords,
      common: valCommon
    }
    
    return filterState;
  }
  
  _setFilterState(filterState) {
    var elemSearch = this._container.getElementsByClassName('tipfilter-search-input')[0];
    var elems = this._container.getElementsByClassName('tipfilter-keyword-input')[0];
    var elemCommon = this._container.getElementsByClassName('tipfilter-commonswitch')[0];

    elemSearch.value = filterState.search;   
    this._keywordInput.setSelectedValues(filterState.keywords);
    CreateElement.setSliderValue(elemCommon, filterState.common);
  }
  
  async _loadFilterStateFromDB() {
    var state = null;
    
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'controlstate-filtering', this._notice);
    if (queryResults.success) {;
      state = JSON.parse(queryResults.controlstate[0].state);
    };
    
    return state;
  }
  
  async _saveFilterStateToDB(stateToSave) {
    var stateForDB = {
      search: stateToSave.search,
      keywords: stateToSave.keywords,
      common: stateToSave.common
    };
    await SQLDBInterface.doPostQuery('tipmanager/update', 'controlstate-filtering', stateForDB, this._notice);
  }
  
  //--------------------------------------------------------------
  // category processing
  //--------------------------------------------------------------   
  async _loadCategoryListFromDB() {
    var categoryList = null;
    
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'categorylist', this._notice);
    if (queryResults.success) {
      var data = queryResults.categorylist;
      categoryList = [];
      for (var i = 0; i < data.length; i++) {
        categoryList.push(data[i].categorytext);
      }
    };
    
    return categoryList;
  }
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleSearchChange() {
    await this._retrieveTips();
  }
  
  async _handleCategoryChange(params) {
    await this._retrieveTips();
  }
  
  async _handleCommonChange(e) {
    await this._retrieveTips();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------      
   
}
