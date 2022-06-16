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
  
  async setFilterEmpty(hideEmpty) {
    let params = {
      "hideempty": hideEmpty
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('walkthrough-analyzer/update', 'filter-hideempty', params, this.config.notice);
    if (dbResult.success) {
      this.filterSettings.filterEmpty = hideEmpty;
    }

    return dbResult.success;
  }  
  
  getFilterEmpty() {
    return this.filterSettings.filterEmpty;
  }
  
  criterionIsExcluded(criterion) {
    return this.filterSettings.excludedCriteria.has(criterion.criterionid);
  }

  getFilterState() {
    let criteriaCount = 0;
    let excludedCount = 0;
    
    for (let key in this.filterSettings.fullCriteria) {
      let domainState = this.getDomainFilterState(this.filterSettings.fullCriteria[key]);
      criteriaCount += domainState.criteriaCount;
      excludedCount += domainState.excludedCount;
    }
    
    return this._packageFilterState(criteriaCount, excludedCount);
  }
  
  getDomainFilterState(domainInfo) {
    let criteriaCount = domainInfo.criteria.length;
    let excludedCount = 0;
    for (let i = 0; i < domainInfo.criteria.length; i++) {
      let criterionId = domainInfo.criteria[i].criterionid;
      if (this.filterSettings.excludedCriteria.has(criterionId)) excludedCount++;
    }
     
    return this._packageFilterState(criteriaCount, excludedCount);
  }
    
  getMandatoryFilterState() {
    let mandatoryCriteria = this.filterSettings.mandatoryCriteria
    let criteriaCount = mandatoryCriteria.length;
    let excludedCount = 0;
    for (let i = 0; i < mandatoryCriteria.length; i++) {
      if (this.filterSettings.excludedCriteria.has(mandatoryCriteria[i])) excludedCount++;
    }
    
    return this._packageFilterState(criteriaCount, excludedCount);
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
      "fullCriteria": this._collateDomainCriteria(dbResult.data.fullCriteria),
      "mandatoryCriteria": this._collateMandatoryCriteria(dbResult.data.fullCriteria)
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
  
  _collateDomainCriteria(criteria) {
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
  
  _collateMandatoryCriteria(criteria) {
    let collated = [];
    
    for (let i = 0; i < criteria.length; i++) {
      let criterion = criteria[i];
      if (criterion.mandatory == 1) collated.push(criterion.criterionid);
    }
    
    return collated;
  }
  
  _packageFilterState(criteriaCount, excludedCount) {
    let allIncluded = (excludedCount == 0);
    let noneIncluded = (excludedCount == criteriaCount);

    return {
      "criteriaCount": criteriaCount,
      "excludedCount": excludedCount,
      "allIncluded": allIncluded,
      "noneIncluded": noneIncluded,
      "indeterminate": !(allIncluded || noneIncluded)
    };
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
