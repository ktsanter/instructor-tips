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
    scaleHeight: 0.8,
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init () {
    document.title = appInfo.appName;
    
    page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('pgviewer-colorscheme');
    
    if (await _getCourseListings() && await _getStartEndDates()) {
      page.body.appendChild(_renderPage());
      window.addEventListener('resize', _windowResize);
      
    } else {
      page.body.appendChild(_renderError());
    }
  }

  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  function _renderPage() {
    var container = CreateElement.createDiv(null, 'pgviewer-contents');
    
    container.appendChild(_renderTitle());    
    container.appendChild(_renderControls());
    container.appendChild(_renderTestSection());
    container.appendChild(_renderViewer());
    
    return container;
  }
  
  function _renderError() {
    return CreateElement.createDiv(null, 'pgviewer-error', 'error in retrieving data');
  }

  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'pgviewer-title');
    
    container.appendChild(CreateElement.createDiv(null, 'pgviewer-titletext', appInfo.appName));
    
    return container;
  }

  function _renderControls() {
    var container = CreateElement.createDiv(null, 'pgviewer-controls');
    
    var handler = (e) => {_handleParameterChange(e);};

    // schedule selection
    var info = settings.courseKeyInfo;
    var elemSelect = CreateElement.createSelect(null, 'pgviewer-courseselect select-css', handler, settings.courseKeyInfo);
    container.appendChild(elemSelect);
    
    var elem = elemSelect.firstChild;
    elem.hidden = true;
    elem.disabled = true;
    elem.selected = true;
    
    // start/end date selection
    var elemSelect = CreateElement.createSelect(null, 'pgviewer-dateselect select-css', handler, settings.startEndInfo);
    container.appendChild(elemSelect);

    // custom start/end date
    var subcontainer = CreateElement.createDiv(null, 'pgviewer-customdate hide-me');
    container.appendChild(subcontainer);

    var elemScheduleStart = CreateElement.createDatePicker(null, 'pgviewer-date pgviewer-startdate', settings.defaultStartDate, '2020-06-01', '2030-12-31');
    elemScheduleStart.title = 'start date';
    elemScheduleStart.addEventListener('change', handler);
    subcontainer.appendChild(elemScheduleStart);      

    // end date
    var elemScheduleEnd = CreateElement.createDatePicker(null, 'pgviewer-date pgviewer-enddate', settings.defaultEndDate, '2020-06-01', '2030-12-31');
    elemScheduleEnd.title = 'end date';
    elemScheduleEnd.addEventListener('change', handler);
    subcontainer.appendChild(elemScheduleEnd);    

    return container;
  }
  
  function _renderViewer() {
    var container = CreateElement.createDiv(null, 'pgviewer-viewer');

    var elem = CreateElement.createIframe(null, 'pgviewer-viewercontents hide-me', 'about:blank', null, null, false);
    container.appendChild(elem);
    elem.loadingViewer = false;
    elem.addEventListener('load', (e) => {_handleViewerLoad(e);});
    
    return container;
  }
  
  function _renderTestSection() {
    var container = CreateElement.createDiv(null, 'pgviewer-test');
    
    return container;
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
	// DB queries
	//----------------------------------------
  async function _getCourseListings() {
    settings.courseKeyInfo = [{value: -1, textval: 'select a course'}];
    
    var dbResult = await SQLDBInterface.doGetQuery('pacingguide-viewer/query', 'courselistings');
    if (!dbResult.success) return false;
    
    var courseData = dbResult.data;
    for (var i = 0; i < courseData.length; i++) {
      settings.courseKeyInfo.push({
        value: courseData[i].textkey,
        textval: courseData[i].description
      });
    }

    return true;
  }
  
  async function _getStartEndDates() {
    settings.defaultStartDate = '2020-09-05',
    settings.defaultEndDate = '2021-01-22',
    
    settings.startEndInfo = [];
    
    var dbResult = await SQLDBInterface.doGetQuery('pacingguide-viewer/query', 'startend');
    if (!dbResult.success) return false;
    
    var startEndData = dbResult.data;
    for (var i = 0; i < startEndData.length; i++) {
      settings.startEndInfo.push({
        value: startEndData[i].startdate + ' ' + startEndData[i].enddate,
        textval: startEndData[i].description
      });
    }
    
    settings.startEndInfo.push({
      value: 'custom',
      textval: 'custom'
    });
    
    return true;
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

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------      
  function _formatDate(d) {
    var y = d.getFullYear();
    var m = ('00' + (d.getMonth() + 1)).slice(-2);
    var d = ('00' + d.getDate()).slice(-2);
    
    return y + '-' + m + '-' + d;    
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
