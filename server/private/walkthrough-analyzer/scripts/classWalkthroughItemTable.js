//-------------------------------------------------------------------
// WalkthroughItemTable
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class WalkthroughItemTable {
  constructor(config) {
    this.config = config;
    
    this.config.itemContainers = this.config.container.getElementsByClassName('walkthrough-item-containers')[0];

    this.config.elemHeaderItemName = this.config.container.getElementsByClassName('header-itemname')[0];    
    this.config.elemHeaderItemName.addEventListener('click', (e) => { this._handleItemNameClick(e); });

    this.config.elemHeaderPercent = this.config.container.getElementsByClassName('header-percentYes')[0];
    this.config.elemHeaderPercent.addEventListener('click', (e) => { this._handlePercentClick(e); });
    
    let btnCloseZoomItem = this.config.container.getElementsByClassName('icon-close')[0];
    btnCloseZoomItem.addEventListener('click', (e) => { this._handleCloseZoomItem(e); });
    
    this.sortingParams = {
      "type": 'itemname',
      "direction": 'natural'
    };
    this.objSorting = new WalkthroughSorting({});    
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  show(dataItems) {
    this.originalData = dataItems;
    let filteredData = this.config.filter.applyFilter(dataItems);
    let sortedData = this.objSorting.applySorting(filteredData, this.sortingParams);
    
    let rowTemplate = this.config.container.getElementsByClassName('row-template')[0];
    let itemTableBody = this.config.container.getElementsByClassName('item-table-body')[0];

    UtilityKTS.removeChildren(itemTableBody);
    
    for (let i = 0; i < sortedData.length; i++) {
      let itemData = sortedData[i];
      
      let item = new WalkthroughItem({
        "className": 'walkthrough-item-container',
        "title": itemData.criteriontext,
        "data": itemData.count,
        "labels": itemData.label,
        "restrictValues": true,
        "suppressTitle": true,
        "suppressLegend": true,
        "suppressTooltips": true,
        "clickCallback": (item) => { this._walkthroughItemClickCallback(item); }
      });
      
      let elemChart = item.drawChart();
      elemChart.walkthroughitem = item;
      
      let elemRow = rowTemplate.cloneNode(true);
      UtilityKTS.setClass(elemRow, 'row-template', false);
      UtilityKTS.setClass(elemRow, 'item-table-row', true);
      
      itemTableBody.appendChild(elemRow);

      let percentYes = item.getDataAsPercentages().percentageData[0];
      elemRow.getElementsByClassName('item-name')[0].innerHTML = itemData.criteriontext;
      elemRow.getElementsByClassName('item-domain')[0].innerHTML = itemData.domainnumber;
      elemRow.getElementsByClassName('item-percent-yes')[0].innerHTML = percentYes;
      elemRow.getElementsByClassName('item-chart')[0].appendChild(elemChart);
    }
  }
    
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------  
  _showSingleItem(item) {    
    let container = this.config.container.getElementsByClassName('single-item-container')[0];
    UtilityKTS.removeChildren(container);

    let zoomItem = new WalkthroughItem({
      "className": 'walkthrough-zoomitem-container',
      "title": item.config.title,
      "data": item.config.data,
      "labels": item.config.labels,
      "restrictValues": true,
      "suppressTitle": false,
      "suppressLegend": true,
      "suppressTooltips": false,
      "clickCallback": null
    });
    
    let elemChart = zoomItem.drawChart();
    container.appendChild(elemChart);
    
    let statsContainer = CreateElement.createDiv(null, 'item-stats');
    container.appendChild(statsContainer);

    let chartStats = zoomItem.getDataAsPercentages();    
    for (let i = 0; i < item.config.data.length; i++) {
      let statMsg = item.config.labels[i] + ': ';
      
      if (i < 2) {
        statMsg += ' ' + chartStats.percentageData[i] + '%';
        statMsg += ' (' + chartStats.rawData[i] + '/' + chartStats.sum + ')';
      } else {
        statMsg += ' ' + item.config.data[i];
      }

      statsContainer.appendChild(CreateElement.createDiv(null, 'item-singlestat', statMsg));
    }
    
    this._showZoomComtainer(true);
  }

  _showZoomComtainer(show) {
    let tableContainer = this.config.container.getElementsByClassName('full-table-container')[0];
    UtilityKTS.setClass(tableContainer, 'hide-me', show);
    let zoomContainer = this.config.container.getElementsByClassName('zoomItem-container')[0];
    UtilityKTS.setClass(zoomContainer, 'hide-me', !show);
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  _walkthroughItemClickCallback(item) {
    this._showSingleItem(item);
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleItemNameClick(e) {
    if (this.sortingParams.type == 'itemname') {
      if (this.sortingParams.direction == 'natural') {
        this.sortingParams.direction = 1;
      } else if (this.sortingParams.direction == 1) {
        this.sortingParams.direction = -1;
      } else {
        this.sortingParams.direction = 'natural';
      }
      
    } else {
      this.sortingParams.type = 'itemname';
      this.sortingParams.direction = 'natural';
    }
    
    this.show(this.originalData);
  }
  
  _handlePercentClick(e) {
    if (this.sortingParams.type == 'percent') {
      this.sortingParams.direction *= -1;
      
    } else {
      this.sortingParams.type = 'percent';
      this.sortingParams.direction = 1;
    }
    
    this.show(this.originalData);
  }
  
  _handleCloseZoomItem(e) {
    this._showZoomComtainer(false);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
