//-------------------------------------------------------------------
// pacing guide viewer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const appInfo = {
    appName: 'Pacing guide viewer'
  };

  const page = {};

  const settings = {
    testing: false,  // true => iframe won't be loaded and message will be displayed
    

// looks like [site]:[port]/api/guide/[coursekey]/pace/[start yyyy/mm/dd]/[end yyy/mm/dd]#w[weeknumber]

// Basic Web Design
// https://integrations.michiganvirtual.org:9092/api/guide/C-WBDN-MSTR-20/pace/2020/09/05/2021/01/22#w1

// Biology B
// https://integrations.michiganvirtual.org:9092/api/guide/C-BIOB-MSTR-19/pace/2020/09/05/2021/01/22#w1
  
    pgStem: 'https://integrations.michiganvirtual.org:9092/api/guide/',  // move to DB
    scaleWidth: 0.95,
    scaleHeight: 1.0,
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init () {
    document.title = appInfo.appName;
    
    page.body = document.getElementsByTagName('body')[0];
    window.addEventListener('resize', _windowResize);
    _tweakControls();
  }

  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  function _tweakControls() {
    var handler = (e) => {_handleParameterChange(e);};

    var elemSelect = page.body.getElementsByClassName('pgviewer-courseselect')[0];    
    elemSelect.addEventListener('change', handler);
    
    var elem = elemSelect.firstChild;
    elem.hidden = true;
    elem.disabled = true;
    elem.selected = true;
    
    var elemSelect = page.body.getElementsByClassName('pgviewer-dateselect')[0];    
    elemSelect.addEventListener('change', handler);
    
    var elemCustomStart = page.body.getElementsByClassName('pgviewer-startdate')[0];
    elemCustomStart.addEventListener('change', handler);
    
    var elemCustomStart = page.body.getElementsByClassName('pgviewer-enddate')[0];
    elemCustomStart.addEventListener('change', handler);
    
    var elemViewer = _getViewerElement();
    elemViewer.loadingViewer = false;
    elemViewer.addEventListener('load', (e) => {_handleViewerLoad(e);});
  }
  
  //---------------------------------------
	// update
	//----------------------------------------
  function _update() {
    var elemCourse = page.body.getElementsByClassName('pgviewer-courseselect')[0];
    var courseKey = elemCourse.options[elemCourse.selectedIndex].value;
    if (courseKey == -1) return;

    var elemDate = page.body.getElementsByClassName('pgviewer-dateselect')[0];
    var startEndValue = elemDate.options[elemDate.selectedIndex].value;
    var elemCustomDate = page.body.getElementsByClassName('pgviewer-customdate')[0];

    UtilityKTS.setClass(elemCustomDate, 'hide-me', startEndValue != 'custom');

    var startDate, endDate;    
    console.log(startEndValue);
    if (startEndValue == 'custom') {    
      startDate = page.body.getElementsByClassName('pgviewer-startdate')[0].value.replace(/-/g, '/');
      endDate = page.body.getElementsByClassName('pgviewer-enddate')[0].value.replace(/-/g, '/');
      
    } else {
      var splitDates = startEndValue.split(' ');
      startDate = splitDates[0];
      endDate = splitDates[1];
    }
    
    if (settings.testing) {
      var elemTesting = page.body.getElementsByClassName('pgviewer-test')[0];
      elemTesting.innerHTML = courseKey + '<br>' + startDate + '<br>' + endDate;
      
    } else {
      var src = _makePacingGuideURL(courseKey, startDate, endDate);
      var elem = _getViewerElement();
      elem.loadingViewer = true;
      elem.src = src;
    }
  }

  function _makePacingGuideURL(coursekey, startDate, endDate) {
    return settings.pgStem + coursekey + '/pace/' + startDate + '/' + endDate;
  }
  
  function _getViewerElement() {
    return page.body.getElementsByClassName('pgviewer-viewercontents')[0];
  }  
  
  function _resizeViewer() {
    var elem = _getViewerElement();
    elem.style.height = (document.documentElement.scrollHeight * settings.scaleHeight) +'px';
    elem.style.width = (document.documentElement.scrollWidth * settings.scaleWidth) + 'px';
  } 

  //---------------------------------------
	// handlers
	//----------------------------------------
  function _windowResize() {
    _resizeViewer();
  }
  
  function _handleViewerLoad(e) {
    _resizeViewer();
    if (e.target.loadingViewer) {
      UtilityKTS.setClass(e.target, 'hide-me', false);
      e.target.loadingViewer = false;
    }
  }

  function _handleParameterChange(e) {
    _update();
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
