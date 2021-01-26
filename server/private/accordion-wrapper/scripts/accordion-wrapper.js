//-------------------------------------------------------------------
// accordion wrapper app
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
    //page.body.getElementsByClassName('check-mentor-compare')[0].addEventListener('click', (e)=>{_handleMentorCompareClick(e);});
  }
  
  //---------------------------------------
	// update
	//----------------------------------------
  
  //---------------------------------------
	// handlers
	//----------------------------------------

  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
