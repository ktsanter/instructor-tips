//-----------------------------------------------------------------
// JavaScript Game Design: image size and position demo
//-----------------------------------------------------------------
const app = function () {
	const page = {body: null};
	
	const settings = {
    img: null,
    imageBaseURL: 'https://res.cloudinary.com/ktsanter/image/upload/v1581550363/JSGD_resources/supplemental/'
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0];  
    
    _renderPage();

     sjs.open("target", 500, 400);

     settings.img = new sjs.Image(settings.imageBaseURL + 'pizza.png');
     settings.img.type = "ball";
     settings.img.setSize(30, 30);
     
     setTimeout(showParams, 100);
     
     document.getElementById('btnSubmit').addEventListener('click', handleSubmit);
  }
  	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function _renderPage() {}

  function showParams() {
    document.getElementById('size').innerHTML = 
      '(' + settings.img.width + ', ' + settings.img.height + ')';
    document.getElementById('position').innerHTML = 
      '(' + settings.img.x + ', ' + settings.img.y + ')';
  }

  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function handleSubmit() {
    var w = parseInt(document.getElementById('inpWidth').value);
    var h = parseInt(document.getElementById('inpHeight').value);
    var x = parseInt(document.getElementById('inpX').value);
    var y = parseInt(document.getElementById('inpY').value);

    if (Number.isInteger(w) && Number.isInteger(h)) {
     settings.img.setSize(w, h);
    }
    if (Number.isInteger(x) && Number.isInteger(y)) {
     settings.img.moveTo(x, y);
    }
    showParams();
  }
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();
