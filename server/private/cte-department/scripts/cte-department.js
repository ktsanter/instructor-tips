//----------------------------------------
// CTE department site
//----------------------------------------
const app = function () {
	const page = {};
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0];  

    _attachHandlers();
    
    $('.navbar-collapse a').click(function(){
      $(".navbar-collapse").collapse('hide');
    });
  
    page.body.getElementsByClassName('anchor-home')[0].click();
  }
  
  function _attachHandlers() {
    var containerElements = page.body.getElementsByClassName('anchor');
    for (var i = 0; i < containerElements.length; i++) {
      containerElements[i].addEventListener('click', (e) => {_handleAnchor(e);});
    }

    var homeButtonElements = page.body.getElementsByClassName('btn');
    for (var i = 0; i < homeButtonElements.length; i++) {
      homeButtonElements[i].addEventListener('click', (e) => {_handleHomeButton(e);});
    }
  }
	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _handleAnchor(e) {
    var linkto = e.target.getAttribute('linkto');
    var containers = page.body.getElementsByClassName('container');

    if (linkto.indexOf('https://') == 0) {
      window.open(linkto, '_blank');
 
    } else {
      for (var i = 0; i < containers.length; i++) {
        if (containers[i].id == linkto) {
          containers[i].style.display = 'block';
        } else {
          containers[i].style.display = 'none';
        }
      }
    }
  }
  
  function _handleHomeButton(e) {
    _handleAnchor(e);
  }
  
	//---------------------------------------
	// utility functions
	//----------------------------------------

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();