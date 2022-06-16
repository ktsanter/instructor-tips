//-------------------------------------------------------------------
// WalkthroughSummary
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class WalkthroughSummary {
  constructor(config) {
    this.config = config;
    this.config.cvs = null;
    this.config.chart = null;
    this.originalData = null;
    this.filteredData = null;
    
    this.sorting = {
      "type": 'itemname',
      "direction": 'natural'
    }
    this.objSorting = new WalkthroughSorting({});
    
    let elemSortNatural = this.config.container.getElementsByClassName('sort-natural')[0];
    elemSortNatural.checked = true; 
    elemSortNatural.addEventListener('click', (e) => { this._handleSortClick(e, 'natural'); });    

    let elemHighLow = this.config.container.getElementsByClassName('sort-highlow')[0];
    elemHighLow.addEventListener('click', (e) => { this._handleSortClick(e, 'percent'); });    
    
    let btnCloseZoomItem = this.config.container.getElementsByClassName('icon-close')[0];
    btnCloseZoomItem.addEventListener('click', (e) => { this._handleCloseZoomItem(e); });
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  show(dataItems) {
    this.originalData = dataItems;
    this.filteredData = this.config.filter.applyFilter(dataItems);
    let sortedData = this.objSorting.applySorting(this.filteredData, this.sorting);
    
    let container = this.config.container.getElementsByClassName('summary-contents')[0];
    UtilityKTS.removeChildren(container);
    
    this.config.cvs = CreateElement._createElement('canvas', null, 'walkthrough-summary-canvas');
    container.appendChild(this.config.cvs);
    this.config.cvs.addEventListener('click', (e) => { this._handleSummaryClick(e); });
      
    let summaryLabels = [];
    let summaryPercentages = [];
    for (let i = 0; i < sortedData.length; i++) {
      let itemConfig = sortedData[i];

      let item = new WalkthroughItem({
        "data": itemConfig.count,
        "restrictValues": true
      });
      
      let percentageYes = item.getDataAsPercentages().percentageData[0];
      summaryLabels.push(itemConfig.criteriontext);
      summaryPercentages.push(percentageYes);
    }
    
    this._makeBarChart(summaryLabels, summaryPercentages);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------
  _makeBarChart(summaryLabels, summaryPercentages) {
    let chartOptions = {
      animation: false,
      
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            callback: function(val, index, ticks) {
              let label = this.getLabelForValue(val);
              if (label.length > 13) label = label.substr(0,10) + '...';
              return label;
            }
          }
        },
        
        y: {
          suggestedMin: 0,
          suggestedMax: 100,
          ticks: {
            callback: function(val, index, ticks) {
              return val + '%';
            }
          }
        }        
      },
      
      plugins: {
        legend: false,
        tooltip: {
          callbacks: {
            label: function (context) {
              return context.formattedValue + '% yes';
            }
          }
        }
      }
    }
    
    const ctx = this.config.cvs.getContext('2d');
    
    this.config.chart = new Chart(ctx, {
      type: 'bar',
      
      title: 'Walkthrough Summary',

      data: {
        labels: summaryLabels,
        datasets: [{
          "data": summaryPercentages,
          "backgroundColor": ['rgba(75, 192, 192, 0.2)'],
          "borderColor": ['rgba(75, 192, 192, 1)'],
          "borderWidth": 1
        }]
      },

      options: chartOptions
    });
  }
  
  _showSingleItem(label) {
    let item = this._getChartDataForLabel(label);
    if (item == null) return;
    
    item.labels =  ['yes', 'no', 'other'];
    
    let container = this.config.container.getElementsByClassName('single-item-container')[0];
    UtilityKTS.removeChildren(container);

    let zoomItem = new WalkthroughItem({
      "className": 'walkthrough-zoomitem-container',
      "title": item.criteriontext,
      "data": item.count,
      "labels": item.label,
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
    for (let i = 0; i < item.count.length; i++) {
      let statMsg = item.labels[i] + ': ';
      
      if (i < 2) {
        statMsg += ' ' + chartStats.percentageData[i];
        if (chartStats.percentageData[i] != 'n/a') statMsg += '%';
        statMsg += ' (' + chartStats.rawData[i] + '/' + chartStats.sum + ')';
      } else {
        statMsg += ' ' + item.count[i];
      }

      statsContainer.appendChild(CreateElement.createDiv(null, 'item-singlestat', statMsg));
    }
 
    this._showZoomComtainer(true);    
  }
  
  _getChartDataForLabel(label) {
    let chartDataItem = null;
    
    for (let id in this.filteredData) {
      let itemConfig = this.filteredData[id];
      if (itemConfig.criteriontext == label) {
        chartDataItem = itemConfig;
        break;
      }      
    }
    
    return chartDataItem;
  }
  
  _showZoomComtainer(show) {
    let tableContainer = this.config.container.getElementsByClassName('summary-outer-container')[0];
    UtilityKTS.setClass(tableContainer, 'hide-me', show);
    let zoomContainer = this.config.container.getElementsByClassName('zoomItem-container')[0];
    UtilityKTS.setClass(zoomContainer, 'hide-me', !show);
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleSortClick(e, type) {
    this.sorting.type = type;

    if (this.sorting.type == 'itemname') {
      this.sorting.direction = 'natural';
    } else {
      this.sorting.direction = -1;
    }

    this.show(this.originalData);    
  }
  
  _handleSummaryClick(e) {
    let chart = this.config.chart;
    const points = chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
    let label = '';
    
    if (points.length) {
      const firstPoint = points[0];
      label = chart.data.labels[firstPoint.index];
      
    } else {
      /*
      let xIndex = Math.round(chart.scales.x.getValueForPixel(e.x));
      let yIndex = Math.round(chart.scales.y.getValueForPixel(e.y));
      
      let yMin = Math.round(chart.scales.y.getPixelForValue(0, 0));
      let yMax = Math.round(chart.scales.y.getPixelForValue(100, 0));
      
      if (xIndex >= 0 && xIndex < chart.data.labels.length) // && yIndex >= -16 && yIndex <= -13) {
        label = chart.data.labels[xIndex];
      }
      */
    }      

    if (label != '') {
      this._showSingleItem(label);
    }
  }
  
  _handleCloseZoomItem(e) {
    this._showZoomComtainer(false);
  }  
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
