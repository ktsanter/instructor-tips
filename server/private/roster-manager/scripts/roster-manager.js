//-------------------------------------------------------------------
// roster manager app
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const page = {};

  //---------------------------------------
  // get things going
  //----------------------------------------
  function init () {
    page.body = document.getElementsByTagName('body')[0];
    _initControls(true);
  }

  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  function _initControls(attachHandlers) {
    if (attachHandlers) _attachHandlers();
  }
  
  function _attachHandlers() {
    page.body.getElementsByClassName('check-mentor-compare')[0].addEventListener('click', (e)=>{_handleMentorCompareClick(e);});
    page.body.getElementsByClassName('check-student-compare')[0].addEventListener('click', (e)=>{_handleStudentCompareClick(e);});
  }
  
  //---------------------------------------
	// update
	//----------------------------------------

  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleMentorCompareClick(e) {
    var elemCheck = page.body.getElementsByClassName('check-mentor-compare')[0];
    
    elem = page.body.getElementsByClassName('mentor-compare')[0];
    UtilityKTS.setClass(elem, 'hide-me', !elemCheck.checked);

    elem = page.body.getElementsByClassName('mentor-report-file2')[0];
    elem.required = elemCheck.checked;
  }

  function _handleStudentCompareClick(e) {
    var elemCheck = page.body.getElementsByClassName('check-student-compare')[0];
    
    elem = page.body.getElementsByClassName('student-compare')[0];
    UtilityKTS.setClass(elem, 'hide-me', !elemCheck.checked);

    elem = page.body.getElementsByClassName('student-report-file2')[0];
    elem.required = elemCheck.checked;
  }

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
