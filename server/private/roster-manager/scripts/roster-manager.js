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
    page.body.getElementsByClassName('check-enrollment-compare')[0].addEventListener('click', (e)=>{_handleEnrollmentCompareClick(e);});
  }
  
  //---------------------------------------
	// update
	//----------------------------------------
  function _setFileControl(checkboxClass, filecontrolClass) {
    var elemCheck = page.body.getElementsByClassName(checkboxClass)[0];

    var elem = page.body.getElementsByClassName(filecontrolClass)[0];
    elem.required = elemCheck.checked;
    elem.disabled = !elemCheck.checked;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleMentorCompareClick(e) {
    _setFileControl('check-mentor-compare', 'mentor-report-file2');
  }

  function _handleEnrollmentCompareClick(e) {
    _setFileControl('check-enrollment-compare', 'enrollment-report-file2');
  }

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
