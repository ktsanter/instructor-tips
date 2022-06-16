//-------------------------------------------------------------------
// WalkthroughSorting
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class WalkthroughSorting {
  constructor(config) {
    this.config = config;    
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------       
  applySorting(data, sortingParams) {
    let dataArray = [];
    for (let id in data) {
      dataArray.push(data[id]);
    }

    let sorted = dataArray.sort(function(a, b) {
      let cmp = 0;
      
      if (sortingParams.type == 'itemname') {
        if (sortingParams.type == 'natural') {
          cmp = a.domainnumber - b.domainnumber;
          if (cmp == 0) {
            cmp = a.indexwithindomain - b.indexwithindomain;
          }
        } else {
          cmp = sortingParams.direction * (a.criteriontext.localeCompare(b.criteriontext));
        }
        
      } else if (sortingParams.type == 'percent') {
        let itemA = new WalkthroughItem({
          "data": a.count,
          "restrictValues": true
        });
        let pctYesA = itemA.getDataAsPercentages().percentageData[0];
        if (pctYesA == 'n/a') pctYesA = 0;

        let itemB = new WalkthroughItem({
          "data": b.count,
          "restrictValues": true
        });
        let pctYesB = itemB.getDataAsPercentages().percentageData[0];
        if (pctYesB == 'n/a') pctYesB = 0;

        cmp =  sortingParams.direction * (pctYesA - pctYesB);  
      }
      
      return cmp;
    });
    
    return sorted;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------

  
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
