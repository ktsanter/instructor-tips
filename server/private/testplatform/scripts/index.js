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
   
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
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
    container.appendChild(_renderControls());
    container.appendChild(_renderTestContent());
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'testplatform-title', appInfo.appName);
    
    return container;
  }
  
  function _renderControls() {
    var container = CreateElement.createDiv(null, 'testplatform-controls');
    
    var handler = (e, showValue) => {_handleShowButton(e, true)};
    container.appendChild(CreateElement.createButton(null, 'testplatform-controls-button', 'show', null, handler));
    var handler = (e, showValue) => {_handleShowButton(e, false)};
    container.appendChild(CreateElement.createButton(null, 'testplatform-controls-button', 'hide', null, handler));

    handler = (e) => {_handleUpdateButton(e)};
    container.appendChild(CreateElement.createButton(null, 'testplatform-controls-button', 'update', null, handler));
    
    return container;
  }
  
  function _renderTestContent() {
    var params = {
      label: 'choose from',
      initialValue: 'initial',
      valueList: ['bob', 'bill', 'fred', 'frannie'],
      selectedValueList: ['bill', 'fred']
    };
    
    if (params.valueList) params.valueList = params.valueList.sort();
    
    this._lookupInput = new LookupInput(params);
    
    var elem = this._lookupInput.render();
    this._lookupInput.show(true);
    
    return elem;
  }
 
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleShowButton(e, showValue) {
    this._lookupInput.show(showValue);
  }

  function _handleUpdateButton(e) {
    this._lookupInput.update();
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
