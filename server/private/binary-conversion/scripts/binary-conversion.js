//-------------------------------------------------------------------
// Binary conversion demo app
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appInfo = {
    appVersion: '0.1.0',
    appName: 'Binary conversion'
  };
  
	const page = {};
  
  const settings = {};
   
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
    
    _checkQueryParams();
    if (settings.proMode) appInfo.appName += ' (pro)';
    document.title = appInfo.appName;

		page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('colorscheme');
    
    page.body.appendChild(_render());  
    _updateTotal();
	}
	
	function _checkQueryParams() {
    var result = false;

    var urlParams = new URLSearchParams(window.location.search);
		settings.proMode = urlParams.has('pro') ? urlParams.get('pro').toLowerCase() == 'true' : false;
    
    return result;
  }  
	//-----------------------------------------------------------------------------
	// rendering
	//-----------------------------------------------------------------------------  
  function _render() {
    var container = CreateElement.createDiv(null, 'binary-conversion');

    container.appendChild(_renderContents());    

    return container;
  }
  
  function _renderContents() {
    var container = CreateElement.createDiv(null, 'contents');
    
    container.appendChild(_renderTitle());
    container.appendChild(_renderTarget());
    container.appendChild(_renderSwitches());
    container.appendChild(_renderInstructions());
    container.appendChild(_renderTotal());
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'title');
    
    var title = 'Binary/decimal conversion';
    if (settings.proMode) title += ' (pro)';
    container.appendChild(CreateElement.createDiv(null, 'title-text', title));
    
    return container;
  }
  
  function _renderTarget() {
    var container = CreateElement.createDiv(null, 'target');
    
    container.appendChild(CreateElement.createDiv(null, 'target-label', 'Enter the decimal number you\'d like to convert to binary'))

    var elem = CreateElement.createSpinner(null, 'target-input', 0, 0, 300, 1);
    container.appendChild(elem);
    elem.placeholder = 'decimal value';
    elem.maxLength = 4;
    elem.addEventListener('change', (e) => {_handleInputChange(e);});
    elem.addEventListener('input', (e) => {_handleInputChange(e);});
    
    return container;
  }
  
  function _renderSwitches() {
    var container = CreateElement.createDiv(null, 'switches');
    var binContainer = CreateElement.createDiv(null, 'switches-bin');
    var decContainer = CreateElement.createDiv(null, 'switches-dec');
    var userContainer = CreateElement.createDiv(null, 'switches-user');
    var arrowContainer = CreateElement.createDiv(null, 'arrow-container');
    var sumContainer = CreateElement.createDiv(null, 'sum-container');
    
    var handler = (e) => {_handleSwitch(e);};
    
    var upperPower = settings.proMode ? 5 : 7;
    var lowerPower = upperPower - 7;
    
    for (var i = upperPower; i >= lowerPower; i--) {      
      var binValue = '2' + '<span class="super-me">' + i + '</span';
      var decValue = 2**i;

      var extraClasses = '';

      var binElem = CreateElement.createDiv(null, 'switch-value bin-switch' + extraClasses);
      binElem.appendChild(CreateElement.createDiv(null, 'switch-label', binValue));
      binElem.decValue = decValue;
      binContainer.appendChild(binElem);

      var decElem = CreateElement.createDiv(null, 'switch-value dec-switch' + extraClasses);
      decElem.appendChild(CreateElement.createDiv(null, 'switch-label', decValue));
      decContainer.appendChild(decElem);
      decElem.decValue = decValue;
      
      var switchContainer = CreateElement.createDiv(null, 'switch-container' + extraClasses);
      userContainer.appendChild(switchContainer);
      var elemSwitch = CreateElement.createDiv(null, 'switch');
      switchContainer.appendChild(elemSwitch);
      elemSwitch.addEventListener('click', handler);
      elemSwitch.appendChild(CreateElement.createDiv(null, 'switch-face switch-on', '1'));
      elemSwitch.appendChild(CreateElement.createDiv(null, 'switch-face switch-off', '0'));
      
      var elemArrow = CreateElement.createDiv(null, 'arrow invisible-me' + extraClasses);
      arrowContainer.appendChild(elemArrow);
      elemArrow.appendChild(CreateElement.createIcon(null, 'arrow-icon fa fa-arrow-down'));
      
      var elemSum = CreateElement.createDiv(null, 'sum-value invisible-me' + extraClasses);
      sumContainer.appendChild(elemSum);
      elemSum.appendChild(CreateElement.createDiv(null, 'sum-label', decValue));
      
      elemSwitch.decValue = decValue;
      elemSwitch.pairedArrowElement = elemArrow;
      elemSwitch.pairedSumElement = elemSum;
    }
    
    container.appendChild(binContainer);
    container.appendChild(decContainer);
    container.appendChild(userContainer);
    container.appendChild(arrowContainer);  
    container.appendChild(sumContainer);
    
    return container;
  }
  
  function _renderInstructions() {
    var container = CreateElement.createDiv(null, 'instructions');
    
    var instructions = 'Click on the 0s and 1s to set the binary value.  <br>Hint: work from the left and keep an eye on the "remaining" amount.';
    var elem = CreateElement.createDiv(null, 'instructions-text', instructions);
    container.appendChild(elem);    

    return container;
  }
  
  function _renderTotal() {
    var container = CreateElement.createDiv(null, 'total');
    
    container.appendChild(CreateElement.createDiv(null, 'total-section total-label total-binary-label', 'binary'));
    container.appendChild(CreateElement.createDiv(null, 'total-section total-value total-binary'));
    
    container.appendChild(CreateElement.createDiv(null, 'total-section total-label total-decimal-label', 'decimal'));
    container.appendChild(CreateElement.createDiv(null, 'total-section total-value total-decimal'));
    
    container.appendChild(CreateElement.createDiv(null, 'total-section total-status'));

    var handler = (e) => {_handleReset(e);};
    container.appendChild(CreateElement.createButton(null, 'reset', 'reset', null, handler));
        
    return container;
  }
  
  function _updateTotal() {
    var totalDecimal = _getSelectedValue();    
    var totalBinary = totalDecimal.toString(2);

    if (settings.proMode) {
      var totalSplit = totalBinary.split('.');
      totalBinary = ('000000' + totalSplit[0]).slice(-6);
      if (totalSplit.length == 1) {
        totalBinary += '.00';
      } else {
        totalBinary += '.' + (totalSplit[1] + '00').slice(0,2);
      }

    } else {
      totalBinary = ('00000000' + totalBinary).slice(-8);
    }
        
    var elemTarget = page.body.getElementsByClassName('target-input')[0];
    var elemTotalBinary = page.body.getElementsByClassName('total-binary')[0];
    var elemTotalDecimal = page.body.getElementsByClassName('total-decimal')[0];
    var elemTotalStatus = page.body.getElementsByClassName('total-status')[0];
    
    var targetDecimal = elemTarget.value * 1;
    
    elemTotalDecimal.innerHTML = totalDecimal;
    elemTotalBinary.innerHTML = totalBinary;
    
    var msg = ''
    var correct = false;
    if (totalDecimal > targetDecimal) {
      msg = 'the value is too large';
      
    } else if (totalDecimal < targetDecimal) {
      msg = (targetDecimal - totalDecimal) + ' remaining';
      
    } else if (totalDecimal == targetDecimal && targetDecimal != 0) {
      msg = 'exactly right!';
      correct = true;
    }
    
    elemTotalStatus.innerHTML = msg
    UtilityKTS.setClass(elemTotalStatus, 'correct', correct);
  }
  
  function _getSelectedValue() {
    var switches = page.body.getElementsByClassName('switch');
    var valDecimal = 0;
    
    for (var i = 0; i < switches.length; i++) {
      if (switches[i].classList.contains('switch-selected')) {
        valDecimal += switches[i].decValue;
      }
    }
    
    return valDecimal;
  }
  
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleReset(e) {
    var switches = page.body.getElementsByClassName('switch');
    for (var i = 0; i < switches.length; i++) {
      var elemSwitch = switches[i];
      var elemSum = elemSwitch.pairedSumElement;
      var elemArrow = elemSwitch.pairedArrowElement;
    
      UtilityKTS.setClass(elemArrow, 'invisible-me', true);
      UtilityKTS.setClass(elemSum, 'invisible-me', true);
      UtilityKTS.setClass(elemSwitch, 'switch-selected', false);
    }
    
    _updateTotal();
  }
  
  function _handleInputChange(e) {
    var val = e.target.value * 1;
    if (val < 0) val = 0;
    if (val > 9999) val = e.target.value.substring(0, 4);
    e.target.value = val;

    _updateTotal();
  }
  
  function _handleSwitch(e) {
    var elemSwitch = e.target.parentNode;
    var elemSum = elemSwitch.pairedSumElement;
    var elemArrow = elemSwitch.pairedArrowElement;
    
    var isSelected = elemSwitch.classList.contains('switch-selected');
    UtilityKTS.setClass(elemArrow, 'invisible-me', isSelected);
    UtilityKTS.setClass(elemSum, 'invisible-me', isSelected);
    UtilityKTS.setClass(elemSwitch, 'switch-selected', !isSelected);

    _updateTotal();
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
