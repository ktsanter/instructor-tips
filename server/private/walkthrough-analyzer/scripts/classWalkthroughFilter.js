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
  
  async refreshFilterSettings() {
    await this._getFilterSettingsFromDB();
  }
  
  applyFilter(data) {
    let filteredData = {};
    for (let id in data) {
      let item = data[id];      
      let include = true;
      
      if (this.filterSettings.filterEmpty) include = include && !this._isEmptyItem(item);
      if (this.filterSettings.excludedCriteria.has(item.criterionid)) include = false;

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
      this.filterSettings.filterEmpty = hideEmpty;
    }

    return dbResult.success;
  }  
  
  getHideEmpty() {
    return this.filterSettings.filterEmpty;
  }
  
  criterionIsExcluded(criterion) {
    return this.filterSettings.excludedCriteria.has(criterion.criterionid);
  }
  
  getFullCriteria() {
    return this.filterSettings.fullCriteria;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------
  async _getFilterSettingsFromDB() {
    this.filterSettings = null;
    
    let dbResult = await SQLDBInterface.doGetQuery('walkthrough-analyzer/query', 'walkthrough-filter', this.config.notice);
    
    if (!dbResult.success) {
      console.log('failed to get filter settings');
      return;
    }
    
    this.filterSettings = {
      "filterEmpty": dbResult.data.filterEmpty,
      "excludedCriteria": this._excludedCriteriaIdSet(dbResult.data.filterCriteria),
      "fullCriteria": this._collateCriteria(dbResult.data.fullCriteria)
    };
  }
  
  _isEmptyItem(item) {
    let empty = (item.count[0] + item.count[1] == 0);
    return empty;
  }
  
  _excludedCriteriaIdSet(criteria) {
    let idSet = new Set();
    for (let i = 0; i < criteria.length; i++) {
      var criterion = criteria[i];
      if (criterion.include == 0) idSet.add(criteria[i].criterionid);
    }
    
    return idSet;
  }
  
  _collateCriteria(criteria) {
    let collated = {};
    
    for (let i = 0; i < criteria.length; i++) {
      let criterion = criteria[i];
      
      if (!collated.hasOwnProperty(criterion.domainnumber)) {
        collated[criterion.domainnumber] = {
          "domainnumber": criterion.domainnumber,
          "domaindescription": criterion.domaindescription,
          "criteria": []
        }        
      }
      collated[criterion.domainnumber].criteria.push(criterion);
    }
    
    for (let id in collated) {
      collated[id].criteria = collated[id].criteria.sort(function(a, b) {
        return (a.indexwithindomain - b.indexwithindomain);
      });
    }
    
    return collated;
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
