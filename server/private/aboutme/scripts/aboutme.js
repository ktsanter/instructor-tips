//-------------------------------------------------------------------------
// "About me" app
//-------------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------------
const app = function () {
	const page = {};	
	const settings = {
    flipperURL: window.location.origin + '/image-flipper/flipper?configkey=1'
  };
	
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    page.body = document.getElementsByTagName('body')[0];
		page.title = page.body.getElementsByClassName('title')[0];
		page.contents = page.body.getElementsByClassName('contents')[0];
    page.flipperframe = page.contents.getElementsByClassName('flipperframe')[0];

    _renderPage();
	}
	
	//--------------------------------------------------------------
	// rendering
	//--------------------------------------------------------------
	function _renderPage() {
    console.log(settings.flipperURL);
    page.flipperframe.src = settings.flipperURL;
  }
  
	//--------------------------------------------------------------
	// handlers
	//--------------------------------------------------------------
	
	//---------------------------------------
	// utility functions
	//----------------------------------------
	
	return {
		init: init
 	};
}();