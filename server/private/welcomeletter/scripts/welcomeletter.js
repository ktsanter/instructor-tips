//-------------------------------------------------------------------
// welcome letter configuration
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
    await _initControls(true);
  }

  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  async function _initControls(attachHandlers) {
    await _loadCourseList()
    
    page.body.getElementsByClassName('coursekey')[0].value = '';
    
    _initializeTextInput('coursekey');
    
    _initializeSwitch('apcourse');

    _initializeSelect('exams');
    _initializeSelect('proctoring');
    _initializeSelect('retakes');
    _initializeSelect('resubmission');
    
    _initializeIcon('addicon', false);
    _initializeIcon('trashicon', true);
    _initializeIcon('linkstudent', true);
    _initializeIcon('linkmentor', true);
    _initializeIcon('notestudent', true);
    _initializeIcon('notementor', true);
    
    if (attachHandlers) {
      var handler = (e) => {_handleCourseSelect(e);};
      page.body.getElementsByClassName('course')[0].addEventListener('change', handler); 

      handler = (e) => {_handleParameterChange(e);};
      page.body.getElementsByClassName('coursekey')[0].addEventListener('input', handler);
      page.body.getElementsByClassName('apcourse')[0].addEventListener('click', handler);
      page.body.getElementsByClassName('exams')[0].addEventListener('change', handler);
      page.body.getElementsByClassName('proctoring')[0].addEventListener('change', handler);
      page.body.getElementsByClassName('retakes')[0].addEventListener('change', handler);
      page.body.getElementsByClassName('resubmission')[0].addEventListener('change', handler);
      
      handler = (e) => {_handleConfigControl(e);};
      page.body.getElementsByClassName('addicon')[0].addEventListener('click', handler);
      page.body.getElementsByClassName('trashicon')[0].addEventListener('click', handler);
      page.body.getElementsByClassName('linkstudent')[0].addEventListener('click', handler);
      page.body.getElementsByClassName('linkmentor')[0].addEventListener('click', handler);
      page.body.getElementsByClassName('notestudent')[0].addEventListener('click', handler);
      page.body.getElementsByClassName('notementor')[0].addEventListener('click', handler);
    }
  }
  
  function _initializeTextInput(selectClass) {
    var elem = page.body.getElementsByClassName(selectClass)[0];
    elem.disabled = true;
  }
  
  function _initializeSwitch(selectClass) {
    var elem = page.body.getElementsByClassName(selectClass)[0];
    UtilityKTS.setClass(elem, 'disabled', true);
  }
  
  function _initializeSelect(selectClass) {
    var elem = page.body.getElementsByClassName(selectClass)[0];
    elem.selectedIndex = -1;
    elem.disabled = true;
  }
  
  function _initializeIcon(iconClass, disable) {
    var elem = page.body.getElementsByClassName(iconClass)[0];
    elem.disabled = disable;
    UtilityKTS.setClass(elem, 'disabled', disable);
  }
  
  //---------------------------------------
	// update
	//----------------------------------------
  async function _loadCourseList() {
    _displayMessage('');

    var elemCourseSelect = page.body.getElementsByClassName('course')[0];
    UtilityKTS.removeChildren(elemCourseSelect);
    
    var elem = document.createElement('option');
    elem.value = -1;
    elem.text = 'select a course';
    elem.hidden = true;
    elem.disabled = true;
    elem.selected = true;
    elemCourseSelect.appendChild(elem);
    
    var queryResult = await queryCourseList();
    
    if (queryResult.success) {
      var courseList = queryResult.data;
      for (var i = 0; i < courseList.length; i++) {
        var course = courseList[i];
        elem = document.createElement('option');
        elem.value = course.courseid;
        elem.text = course.coursename;
        elem.courseInfo = course;
        elemCourseSelect.appendChild(elem);
      }    
    }
  }
  
  async function _loadCourseInfo() {
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return;
    
    _displayMessage('');
    
    var dbResult = await queryCourse(courseInfo);
    if (dbResult.success) {
      UtilityKTS.setClass(page.body.getElementsByClassName('trashicon')[0], 'disabled', false);
      UtilityKTS.setClass(page.body.getElementsByClassName('linkstudent')[0], 'disabled', false);
      UtilityKTS.setClass(page.body.getElementsByClassName('linkmentor')[0], 'disabled', false);
      UtilityKTS.setClass(page.body.getElementsByClassName('notestudent')[0], 'disabled', false);
      UtilityKTS.setClass(page.body.getElementsByClassName('notementor')[0], 'disabled', false);

      var course = dbResult.data.course[0];
      _enableElement('coursekey');
      page.body.getElementsByClassName('coursekey')[0].value = course.coursekey;
      _setSwitch('apcourse', course.ap);
      
      var configuration = dbResult.data.configuration[0];   
      _setSelectValue('exams', configuration.examid);
      _setSelectValue('proctoring', configuration.proctoringid);
      _setSelectValue('retakes', configuration.retakeid);
      _setSelectValue('resubmission', configuration.resubmissionid);
    }
  }
  
  async function _saveCourseInfo() {
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return;
    
    var configurationInfo = {
      courseid: courseInfo.courseid,
      coursekey: page.body.getElementsByClassName('coursekey')[0].value,
      ap: _getSwitch('apcourse'),
      examid: page.body.getElementsByClassName('exams')[0].value,
      proctoringid: page.body.getElementsByClassName('proctoring')[0].value,
      retakeid: page.body.getElementsByClassName('retakes')[0].value,
      resubmissionid: page.body.getElementsByClassName('resubmission')[0].value,
    };
    
    await queryUpdateCourse(configurationInfo);
  }
  
  function _getSelectedCourse() {    
    var elem = page.body.getElementsByClassName('course')[0];
    if (elem.selectedIndex < 0) return null;
    
    return elem.options[elem.selectedIndex].courseInfo;
  }
  
  function _setSelectValue(className, selectValue) {
    var elem = page.body.getElementsByClassName(className)[0];
    elem.disabled = false;
    if (selectValue) {
      elem.value = selectValue;
    } else {
      elem.selectedIndex = -1;
    }      
  }
    
  function _enableElement(className) {
    var elem = page.body.getElementsByClassName(className)[0];
    elem.disabled = false;
  }
  
  function _setSwitch(className, switchValue) {
    var elemSwitch = page.body.getElementsByClassName(className)[0];
    UtilityKTS.setClass(elemSwitch, 'disabled', false);
    elemSwitch.getElementsByClassName('switch-input')[0].checked = switchValue;
  }
  
  function _getSwitch(className) {
    var elemSwitch = page.body.getElementsByClassName(className)[0];
    return elemSwitch.getElementsByClassName('switch-input')[0].checked;
  }

  async function _addCourse(e) {  
    var msg = 'Enter the name of the new course';
    var courseName = prompt(msg);
    if (!courseName) return;
    
    var result = await queryInsertCourse({coursename: courseName});
    if (result.success) { 
      await _initControls(false);
      var elemSelect = page.body.getElementsByClassName('course')[0];
      for (var i = 0; i < elemSelect.options.length; i++) {
        var elem = elemSelect.options[i];
        if (elem.text == courseName) {
          elemSelect.selectedIndex = i;
        }
      }
      await _loadCourseInfo();
    }
  }

  async function _deleteCourse() {
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return;

    var msg = 'This course will be deleted:';
    msg += '\n' + courseInfo.coursename;
    msg += '\n\nThis action cannot be undone.  Continue with deletion?';
    
    if (confirm(msg)) {
      var result = await queryDeleteCourse(courseInfo);
      if (result.success) {
        await _initControls(false);
      }
    }
  }
  
  function _createAndShareLink(audience) {
    var linkText = _makeWelcomeLetterLink(audience);
    if (!linkText) return;
    
    _copyToClipboard(linkText);
    _displayMessage(audience + ' link copied to clipboard');
  }
  
  function _makeWelcomeLetterLink(audience) {
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return null;

    var basePath = window.location.origin + '/welcomeletter/' + page.body.getElementsByClassName('coursekey')[0].value ;
    var linkText = basePath + '/' + audience;
    return linkText;
  }
  
  async function _createAndShareNote(audience) {
    var courseInfo = _getSelectedCourse();
    if (!courseInfo) return null;

    var linkText = _makeWelcomeLetterLink(audience);
    if (!linkText) return;
    
    courseInfo.audience = audience;
    courseInfo.linktext = linkText;
    
    var elem = page.body.getElementsByClassName('exams')[0];
    var elemText = elem.options[elem.selectedIndex].text;
    courseInfo.haspasswords = (elemText != 'There is no midterm or final.');
    
    var result = await queryMailMessage(courseInfo);
    if (result.success) {
      var renderedMessage = result.data;
      _copyRenderedToClipboard(renderedMessage);
      _displayMessage(audience + ' message copied to clipboard');
    }
  }
  
  function _displayMessage(msg) {
    page.body.getElementsByClassName('message')[0].innerHTML = msg;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  async function _handleCourseSelect(e) {
    await _loadCourseInfo();
  }
  
  async function _handleParameterChange(e) {
    if (e.target.classList.contains('switch-label')) return;
    await _saveCourseInfo();
  }
  
  async function _handleConfigControl(e) {
    if (e.target.classList.contains('disabled')) return;
    
    if (e.target.classList.contains('addicon')) {
      await _addCourse();
      
    } else if (e.target.classList.contains('trashicon')) {
      await _deleteCourse();
      
    } else if (e.target.classList.contains('linkstudent')) {
      await _createAndShareLink('student');
      
    } else if (e.target.classList.contains('linkmentor')) {
      await _createAndShareLink('mentor');
      
    } else if (e.target.classList.contains('notestudent')) {
      await _createAndShareNote('student');
      
    } else if (e.target.classList.contains('notementor')) {
      await _createAndShareNote('mentor');
    }
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------
  async function queryCourseList() {
    return await SQLDBInterface.doGetQuery('welcome/query', 'courselist');
  }
  
  async function queryCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcome/query', 'course', courseInfo);
  }
  
  async function queryInsertCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcome/insert', 'course', courseInfo);
  }
  
  async function queryUpdateCourse(configurationInfo) {
    return await SQLDBInterface.doPostQuery('welcome/update', 'course', configurationInfo);
  }

  async function queryDeleteCourse(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcome/delete', 'course', courseInfo);
  }
  
  async function queryMailMessage(courseInfo) {
    return await SQLDBInterface.doPostQuery('welcome/query', 'mailmessage', courseInfo);
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	

  function _copyRenderedToClipboard(txt) {
    if (!page._renderedclipboard) page._renderedclipboard = new ClipboardCopy(page.body, 'rendered');

    page._renderedclipboard.copyRenderedToClipboard(txt);
	}	  

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
