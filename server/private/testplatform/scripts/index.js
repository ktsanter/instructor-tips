//-------------------------------------------------------------------
// test platform 
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appInfo = {
    appName: 'Test Platform'
  };
  
	const page = {};
  
  const settings = {};
   
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {
    console.log('init (inside)');
    await sodium.ready;
    console.log(sodium.to_hex(sodium.crypto_generichash(64, 'test')));

    document.title = appInfo.appName;

		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('colorscheme');
    
    page.maincontainer = _render(page.maincontainer);
    page.body.appendChild(page.maincontainer);    
	}
	
	//-----------------------------------------------------------------------------
	// rendering
	//-----------------------------------------------------------------------------  
  function _render() {
    var container = CreateElement.createDiv(null, 'testplatform');
    
    container.appendChild(_renderTitle());
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'testplatform-title', appInfo.appName);
    
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
