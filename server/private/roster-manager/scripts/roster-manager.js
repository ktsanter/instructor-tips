//-------------------------------------------------------------------
// roster manager app
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const settings = {
    helpURL: '/roster-manager/help',
  }

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
    page.body.getElementsByClassName('help-link')[0].addEventListener('click', (e) => { _handleHelp(e); });
    page.body.getElementsByClassName('check-mentor-compare')[0].addEventListener('click', (e)=>{_handleMentorCompareClick(e);});
    page.body.getElementsByClassName('check-enrollment-compare')[0].addEventListener('click', (e)=>{_handleEnrollmentCompareClick(e);});
  }
  
  //---------------------------------------
	// update
	//----------------------------------------
  function _setFileControl(labelClass, checkboxClass, filecontrolClass) {
    var elemCheck = page.body.getElementsByClassName(checkboxClass)[0];

    var elem = page.body.getElementsByClassName(labelClass)[0];
    UtilityKTS.setClass(elem, 'diminish-me', !elemCheck.checked);
    
    elem = page.body.getElementsByClassName(filecontrolClass)[0];
    elem.required = elemCheck.checked;
    elem.disabled = !elemCheck.checked;
    UtilityKTS.setClass(elem, 'hide-me', !elemCheck.checked);
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleHelp(e) {
    window.open(settings.helpURL, '_blank');
  }
  
  function _handleMentorCompareClick(e) {
    _setFileControl('label-mentor-compare', 'check-mentor-compare', 'mentor-report-file2');
  }

  function _handleEnrollmentCompareClick(e) {
    _setFileControl('label-enrollment-compare', 'check-enrollment-compare', 'enrollment-report-file2');
  }

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
