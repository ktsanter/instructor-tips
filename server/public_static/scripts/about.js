//-------------------------------------------------------------------
// "about" info for Instructor Tips "Tips Manager" tool
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const aboutInfo = {
    appVersion: '0.01',
    appName: 'InstructorTips',
    appAuthor: 'Kevin Santer',
    appContact: 'ksanter@michiganvirtual.org'
  };
  
	const page = {};
  
	const settings = {};
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.body.appendChild(_renderPage());
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    var container = CreateElement.createDiv(null, null);
    
    container.appendChild(_renderTitle());
    container.appendChild(_renderContents());
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'title-container');
    
    var titleLabel = CreateElement.createDiv(null, 'title', 'about ' + aboutInfo.appName);
    container.appendChild(titleLabel);
    
    return container;
  }
  
  function _renderContents() {
    var container = CreateElement.createDiv(null, 'title-contents');
    
    container.innerHTML = 'TBD';
    
    return container;
  }    
  
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
