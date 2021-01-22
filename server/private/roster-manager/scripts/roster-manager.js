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

  function _handleEnrollmentCompareClick(e) {
    var elemCheck = page.body.getElementsByClassName('check-enrollment-compare')[0];
    
    elem = page.body.getElementsByClassName('enrollment-compare')[0];
    UtilityKTS.setClass(elem, 'hide-me', !elemCheck.checked);

    elem = page.body.getElementsByClassName('enrollment-report-file2')[0];
    elem.required = elemCheck.checked;
  }

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
