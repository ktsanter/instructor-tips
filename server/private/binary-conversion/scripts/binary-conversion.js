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
		page.body = document.getElementsByTagName('body')[0];  
    
    _tweakContents();
    _updateTotal();
	}
	
  function _tweakContents() {
    var elem = page.body.getElementsByClassName('mode')[0];
    settings.proMode = (elem.innerHTML == 'pro');
    if (settings.proMode) appInfo.appName += ' (pro)';
    document.title = appInfo.appName;
    
    elem = page.body.getElementsByClassName('target-input')[0];
    elem.addEventListener('change', (e) => {_handleInputChange(e);});
    elem.addEventListener('input', (e) => {_handleInputChange(e);});   

    var handler = (e) => {_handleSwitch(e);};   
    var switches = page.body.getElementsByClassName('switch');
    for (var i = 0; i < switches.length; i++) {
      switches[i].addEventListener('click', handler); 
      
      var pairIndex = switches[i].getAttribute('pairindex');
      switches[i].pairedArrowElement = page.body.getElementsByClassName('arrow' + pairIndex)[0];
      switches[i].pairedSumElement = page.body.getElementsByClassName('sum' + pairIndex)[0];   
    }      
    
    handler = (e) => {_handleReset(e);};
    elem = page.body.getElementsByClassName('reset')[0];
    elem.addEventListener('click', handler);
  }
  
  
	//---------------------------------------
	// updating
	//----------------------------------------
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
        valDecimal += switches[i].getAttribute('decvalue') * 1;
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
      UtilityKTS.setClass(elemSwitch.pairedArrowElement, 'invisible-me', true);
      UtilityKTS.setClass(elemSwitch.pairedSumElement, 'invisible-me', true);
      UtilityKTS.setClass(elemSwitch, 'switch-selected', false);
    }
    
    _updateTotal();
  }
  
  function _handleInputChange(e) {
    var val = e.target.value * 1;
    if (val < e.target.min) val = e.target.min;
    if (val > e.target.max) val = e.target.max;
    e.target.value = val;

    _updateTotal();
  }
  
  function _handleSwitch(e) {
    var elemSwitch = e.target.parentNode;
    var isSelected = elemSwitch.classList.contains('switch-selected');
    UtilityKTS.setClass(elemSwitch.pairedArrowElement, 'invisible-me', isSelected);
    UtilityKTS.setClass(elemSwitch.pairedSumElement, 'invisible-me', isSelected);
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
