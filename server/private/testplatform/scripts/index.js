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
    container.appendChild(_renderTestOuput());
    
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
    
    handler = (e) => {_handleValueButton(e)};
    container.appendChild(CreateElement.createButton(null, 'testplatform-controls-button', 'value', null, handler));
    
    return container;
  }
  
  function _renderTestContent() {
    var params = {
      label: 'choose from',
      valueList: ['bob', 'bill', 'fred', 'frannie'],
      selectedValueList: [],
      changeCallback: (params) => {_testCallback(params);}
    };
    
    if (params.valueList) params.valueList = params.valueList.sort();
    
    this._lookupInput = new LookupInput(params);
    
    var elem = this._lookupInput.render();
    this._lookupInput.show(true);
    
    return elem;
  }
  
  function _renderTestOuput() {
    var container = CreateElement.createDiv(null, 'testplatform-output');
    
    return container;
  }
 
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleShowButton(e, showValue) {
    this._lookupInput.show(showValue);
  }

  function _handleValueButton(e) {
    var value = this._lookupInput.value();
    var elemOutput = page.maincontainer.getElementsByClassName('testplatform-output')[0];
    elemOutput.innerHTML = JSON.stringify(value);
  }
  
  function _testCallback(params) {
    console.log('test callback: ' + JSON.stringify(params));
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
