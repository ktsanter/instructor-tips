//-------------------------------------------------------------------
// WalkthroughItem
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class WalkthroughItem {
  constructor(config) {
    this.config = config;
    this.config.cvs = null;
    this.chart = null;
    
    if (!this.config.hasOwnProperty('restrictValues')) {
      this.config.restrictValues = false;
    }
    if (!this.config.hasOwnProperty('usePercentages')) {
      this.config.usePercentages = false;
    }
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  drawChart(params) {
    const container = CreateElement.createDiv(null, 'walkthrough-item-container');

    this.config.cvs = CreateElement._createElement('canvas', null, 'walkthrough-item-canvas');
    container.appendChild(this.config.cvs);
    
    this._renderItemChart();
    
    return container;
  }
  
  chartRestrictedValues(useRestrictedValues) {
    this.config.restrictValues = useRestrictedValues;
    this._renderItemChart();
  }
  
  chartPercentages(usePercentages) {
    this.config.usePercentages = usePercentages;
    this._renderItemChart();
  }
  
  getDataAsPercentages() {
    let chartData = [...this.config.data];
    if (this.config.restrictValues) chartData = chartData.slice(0, -1);
    
    let sum = 0;
    
    for (let i = 0; i < chartData.length; i++) {
      sum += chartData[i];
    }
    for (let i = 0; i < chartData.length; i++) {
      let pct = ((chartData[i] * 1.0) / sum) * 100;
      chartData[i] = Number((pct).toFixed(1));;
    }
    
    return chartData;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------
  _renderItemChart() {
    let chartData = this.config.data;
    if (this.config.restrictValues) chartData = chartData.slice(0, -1);
    if (this.config.usePercentages) {
      chartData = this.getDataAsPercentages();
    }

    this._makeDoughnutChart(
      this.config.cvs,
      {
        "title": this.config.title,
        "isThreeValue": true,
        "data": chartData,
        "labels": this.config.labels,
        "suppressTitle": false,
        "suppressLegend": true
      }
    );
    
  }
  
  _makeDoughnutChart(cvs, params) {
    const segmentStyling = this._defaultSegmentStyling(params.isThreeValue);
    
    var chartData = params.data;

    const chartParams = {
      "chartType": "doughnut",
      "title": params.title,
      "data": chartData,
      "labels": params.labels,
      "segmentBackgroundColor": segmentStyling.backgroundColor,
      "segmentBorderColor": segmentStyling.borderColor,
      "segmentBorderWidth": segmentStyling.borderWidth,
      "suppressTitle": params.suppressTitle,
      "suppressLegend": params.suppressLegend
    }
    
    this._makeChart(cvs, chartParams);
  }
  
  _makeChart(cvs, params) {
    const ctx = cvs.getContext('2d');
    const me = this;
    
    let chartOptions = {
      plugins: {
        legend: true,
        
        title: {
          display: true,
          text: params.title
        },
        
        tooltip: {
          callbacks: {
            label: function (context) {
              let value = context.formattedValue;
              if (me.config.usePercentages) value += '%';
              return context.label + ' ' + value;
            }
          }
        }
      }
    }
    
    if (params.suppressLegend) chartOptions.plugins.legend = false;
    if (params.suppressTitle) chartOptions.plugins.title.display = false;

    if (this.chart != null) this.chart.destroy();
    
    this.chart = new Chart(ctx, {
      type: params.chartType,

      data: {
        labels: params.labels,
        datasets: [{
          "data": params.data,
          "backgroundColor": params.segmentBackgroundColor,
          "borderColor": params.segmentBorderColor,
          "borderWidth": params.segmentBorderWidth
        }]
      },

      options: chartOptions
    });
  }

  _defaultSegmentStyling(isThreeValue) {
    var segmentStyling = {};
    
    if (isThreeValue) {
      segmentStyling.backgroundColor = [
        'rgba(75, 192, 192, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(127, 127, 127, 0.2)'
      ];

      segmentStyling.borderColor = [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(127, 127, 127, 1)'
      ];
      
      segmentStyling.borderWidth = 1;      
      
    } else {
      segmentStyling.backgroundColor = [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ];

      segmentStyling.borderColor = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ];
      
      segmentStyling.borderWidth = 1;      
    }

    return segmentStyling;
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
