//-------------------------------------------------------------------
// WalkthroughFilter
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class WalkthroughFilter {
  constructor(config) {
    this.config = config;
    
    this._getFilterSettingsFromDB();
  }
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  getFilterSettings() {
    return this.filterSettings;
  }
  
  applyFilter(data) {
    let filteredData = {};
    for (let id in data) {
      let item = data[id];      
      let include = true;
      
      if (this.filterSettings.hideEmptyItems) include = include && !this._isEmptyItem(item);
      
      if (include) filteredData[id] = item;
    }
    
    return filteredData;
  }
  
  async setHideEmpty(hideEmpty) {
    let params = {
      "hideempty": hideEmpty
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('walkthrough-analyzer/update', 'filter-hideempty', params, this.config.notice);
    if (dbResult.success) {
      this.filterSettings.hideEmptyItems = hideEmpty;
    }

    return dbResult.success;
  }  
  
  getHideEmpty() {
    return this.filterSettings.hideEmptyItems;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------
  async _getFilterSettingsFromDB() {
    this.filterSettings = {
      hideEmptyItems: false
    };
    
    let dbResult = await SQLDBInterface.doGetQuery('walkthrough-analyzer/query', 'walkthrough-filter', this.config.notice);
    
    if (!dbResult.success) {
      console.log('failed to get filter settings');
      return;
    }
    
    this.filterSettings.hideEmptyItems = dbResult.data.hideemptyitems;
  }
  
  _isEmptyItem(item) {
    let empty = (item.count[0] + item.count[1] == 0);
    return empty;
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
