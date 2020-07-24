//-------------------------------------------------------------------
// pacing guide viewer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const appInfo = {
    appName: 'Welcome letter configuration'
  };

  const page = {};

  const settings = {
    testing: false,  // true => iframe won't be loaded and message will be displayed
    

// looks like [site]:[port]/api/guide/[coursekey]/pace/[start yyyy/mm/dd]/[end yyy/mm/dd]#w[weeknumber]

// Basic Web Design
// https://integrations.michiganvirtual.org:9092/api/guide/C-WBDN-MSTR-20/pace/2020/09/05/2021/01/22#w1

// Biology B
// https://integrations.michiganvirtual.org:9092/api/guide/C-BIOB-MSTR-19/pace/2020/09/05/2021/01/22#w1
  
    pgStem: 'https://integrations.michiganvirtual.org:9092/api/guide/',
    scaleWidth: 0.95,
    scaleHeight: 1.0,
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init () {
    document.title = appInfo.appName;
    
    page.body = document.getElementsByTagName('body')[0];
    _tweakControls();
  }

  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  function _tweakControls() {
    var handler = (e) => {_handleCourseSelect(e);};

    var elemCourseSelect = page.body.getElementsByClassName('course')[0];    
    elemCourseSelect.addEventListener('change', handler);
    
    var elem = elemCourseSelect.firstChild;
    elem.hidden = true;
    elem.disabled = true;
    elem.selected = true;
    
    _initializeSelect('exams');
    _initializeSelect('proctoring');
    _initializeSelect('retakes');
    _initializeSelect('resubmission');
    
    _initializeIcon('addicon', false);
    _initializeIcon('trashicon', true);
  }
  
  function _initializeSelect(selectClass) {
    var handler = (e) => {_handleParameterChange(e);};
    
    var elem = page.body.getElementsByClassName(selectClass)[0];
    elem.addEventListener('change', handler);
    elem.selectedIndex = -1;
    elem.disabled = true;
  }
  
  function _initializeIcon(iconClass, disable) {
    var handler = (e) => {_handleConfigControl(e);};
    
    var elem = page.body.getElementsByClassName(iconClass)[0];
    elem.addEventListener('click', handler);
    elem.disabled = disable;
    UtilityKTS.setClass(elem, 'disabled', disable);
  }
  
  //---------------------------------------
	// update
	//----------------------------------------
  async function _loadCourseInfo() {
    console.log('_loadCourseInfo');
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return;
    
    console.log(courseInfo);
    UtilityKTS.setClass(page.body.getElementsByClassName('trashicon')[0], 'disabled', false);
  }
  
  async function _addCourse(e) {  
    var msg = 'Enter the name of the new course';
    var courseName = prompt(msg);
    if (!courseName) return;
    
    console.log('add course: ' + courseName);
  }

  async function _deleteCourse() {
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return;

    var msg = 'This course will be deleted:';
    msg += '\n' + courseInfo.name;
    msg += '\n\nThis action cannot be undone.  Continue with deletion?';
    
    if (confirm(msg)) {
      console.log('delete: ' + courseInfo.id + ' ' + courseInfo.name);
    }
  }

  function _getSelectedCourse() {    
    var elem = page.body.getElementsByClassName('course')[0];
    if (elem.selectedIndex < 0) return null;
    
    var courseId = elem.options[elem.selectedIndex].value;
    var courseName = elem.options[elem.selectedIndex].text;
    return {id: courseId, name: courseName};
  }
    
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleCourseSelect(e) {
    _loadCourseInfo();
  }
  
  function _handleParameterChange(e) {
    console.log('_handleParameterChange');
  }
  
  
  async function _handleConfigControl(e) {
    if (e.target.classList.contains('disabled')) return;
    
    if (e.target.classList.contains('addicon')) {
      await _addCourse();
    } else {
      await _deleteCourse();
    }
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
