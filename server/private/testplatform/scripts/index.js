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
    
    return container;
  }
  
  function _renderTestContent() {
    var container = CreateElement.createDiv(null, 'testplatform-contents');
    
    var subcontainer = CreateElement.createDiv(null, 'testplatform-contents-sub');
    container.appendChild(subcontainer);
    var handler = (e) => {_handleCheck(e);}
    var elemCheck = _renderCheckbox(null, 'testplatform-checkbox', 'cbgroup', 'myValue', 'test', false, handler);
    subcontainer.appendChild(elemCheck);
    
    subcontainer = CreateElement.createDiv(null, 'testplatform-contents-sub');
    container.appendChild(subcontainer);
    elemCheck = _renderCheckbox(null, 'testplatform-checkbox', 'cbgroup', 'myValue', 'test2', true, handler);
    subcontainer.appendChild(elemCheck);
    
    subcontainer = CreateElement.createDiv(null, 'testplatform-contents-sub')
    container.appendChild(subcontainer);
    
    handler = (e) => {_handleCheck2(e);}
    //createSliderSwitch(dataOnLabel, dataOffLabel, addedClassList, handler, useTwoChoice)
    subcontainer.appendChild(CreateElement.createSliderSwitch('on', 'off', 'testplatform-slider', handler));

    return container;
  }
  
  function _renderTestOuput() {
    var container = CreateElement.createDiv(null, 'testplatform-output');
    
    return container;
  }
 
  function _renderCheckbox(id, classList, groupName, buttonValue, displayValue, checked, handler) {
    var container = CreateElement.createSpan(null, null);

    var revisedClassList = classList;
    if (classList) revisedClassList += ' ';
    if (checked) {
      revisedClassList += 'fas fa-check-square checkbox-checked';
    } else {
      revisedClassList += 'far fa-square'
    }
    
    var elem = CreateElement.createIcon(id, revisedClassList, null, (e) => {_checkboxHandler(e, handler);});
    container.appendChild(elem);
    elem.checked = checked;
    
    var label = CreateElement._createElement('label', null, classList);
    label.innerHTML = displayValue;
    container.appendChild(label);

    return container;
  }
  
  function _checkboxHandler(e, handler) {
    var elem = e.target;
    if (elem.checked) {
      elem.classList.remove('checkbox-checked');
      elem.classList.remove('fas');
      elem.classList.remove('fa-check-square');
      elem.classList.add('far');
      elem.classList.add('fa-square');

    } else {
      elem.classList.add('checkbox-checked');
      elem.classList.remove('far');
      elem.classList.remove('fa-square');
      elem.classList.add('fas');
      elem.classList.add('fa-check-square');
    }
    elem.checked = !elem.checked;
    
    handler(e);
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleCheck(e) {
    console.log(e.target);
    console.log(e.target.checked);
  }
  
  function _handleCheck2(e) {
    console.log(e.target);
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
