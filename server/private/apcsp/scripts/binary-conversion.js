//-----------------------------------------------------------------------
// AP CS Principles - binary conversion
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init() {
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);
    
    page.contents = page.body.getElementsByClassName('contents')[0];    
    
    renderContents();

    page.notice.setNotice('');
  }
    	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function renderContents() {
    console.log('renderContents');
  }
    
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------

  
  //----------------------------------------
  // callbacks
  //----------------------------------------

  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();