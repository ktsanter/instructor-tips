//-------------------------------------------------------------------
// pacing guide viewer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const page = {};

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init () {
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
    _initializeIcon('linkicon', true);
    _initializeIcon('noteicon', true);
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
    
    UtilityKTS.setClass(page.body.getElementsByClassName('trashicon')[0], 'disabled', false);
    UtilityKTS.setClass(page.body.getElementsByClassName('linkicon')[0], 'disabled', false);
    UtilityKTS.setClass(page.body.getElementsByClassName('noteicon')[0], 'disabled', false);

    _enableElement('coursekey');
    _enableElement('exams');
    _enableElement('proctoring');
    _enableElement('retakes');
    _enableElement('resubmission')    
  }
  
  function _getSelectedCourse() {    
    var elem = page.body.getElementsByClassName('course')[0];
    if (elem.selectedIndex < 0) return null;
    
    var courseId = elem.options[elem.selectedIndex].value;
    var courseName = elem.options[elem.selectedIndex].text;
    return {id: courseId, name: courseName};
  }
    
  function _enableElement(className) {
    var elem = page.body.getElementsByClassName(className)[0];
    elem.disabled = false;
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
  
  function _createAndShareLink() {
    console.log('_createAndShareLink');
  }
  
  function _createAndShareNote() {
    console.log('_createAndShareNote');
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
      
    } else if (e.target.classList.contains('trashicon')) {
      await _deleteCourse();
      
    } else if (e.target.classList.contains('linkicon')) {
      await _createAndShareLink();
      
    } else if (e.target.classList.contains('noteicon')) {
      await _createAndShareNote();
    }
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
