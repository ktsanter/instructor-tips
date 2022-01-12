//-----------------------------------------------------------------------
// AP CS Principles - binary conversion
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init() {
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);
    
    renderContents();
    setStyle();

    page.notice.setNotice('');
  }
    	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function renderContents() {
    page.contents = page.body.getElementsByClassName('contents')[0];    
  
    page.appInteger = page.contents.getElementsByClassName('app integer')[0];
    page.appDecimal = page.contents.getElementsByClassName('app decimal')[0];
    
    page.placeValueSummary = page.contents.getElementsByClassName('placevalue-summary')[0].getElementsByClassName('summary')[0];
    page.decimalResult = page.contents.getElementsByClassName('decimal-result')[0].getElementsByClassName('result')[0];
    
    page.switchDecimal = page.contents.getElementsByClassName('switch-decimal')[0];
    
    addHandlers();
  }
  
  function addHandlers() {
    var bitSelectors = page.contents.getElementsByClassName('selector');
    for (var i = 0; i < bitSelectors.length; i++) {
      bitSelectors[i].addEventListener('click', (e) => { handleBitSelector(e); });
    }
    
    page.switchDecimal.addEventListener('change', (e) => { handleStyleChange(e); });
  }
    
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  function setStyle() {
    UtilityKTS.setClass(page.appInteger, settings.hideClass, includeDecimals());
    UtilityKTS.setClass(page.appDecimal, settings.hideClass, !includeDecimals());

    var bitSelectors = page.contents.getElementsByClassName('selector');
    for (var i = 0; i < bitSelectors.length; i++) {
      bitSelectors[i].checked = false;
      bitSelectors[i].parentNode.getElementsByTagName('label')[0].innerHTML = '0';
    }
    
    displayResults();
  }
  
  function displayResults() {
    var bitSelectors = [];
    if (includeDecimals()) {
      bitSelectors = page.appDecimal.getElementsByClassName('selector');
    } else {
      bitSelectors = page.appInteger.getElementsByClassName('selector');
    }

    var summary = '';
    var decimalResult = 0;    
    for (var i = 0; i < bitSelectors.length; i++) {
      var selector = bitSelectors[i];
      if (isSelected(selector)) {
        var exponent = getExponentFromElement(selector);
        var decimalValue = 2.0**exponent;
        if (summary.length != 0) summary += ' + ';
        summary += decimalValue;
        
        decimalResult += decimalValue;
      }
    }
    
    if (summary == '') summary = ' ';
    
    page.placeValueSummary.value = summary;
    page.decimalResult.value = decimalResult;
  }
  
  function getExponentFromElement(elem) {
    var exponent = null;
    var idBaseSought = 'bit-selectorinteger';
    if (includeDecimals()) idBaseSought = 'bit-selectordecimal';

    if (elem.id.indexOf(idBaseSought) == 0) {
      exponent = elem.id.slice(idBaseSought.length) * 1.0;
    }

    return exponent;
  }
  
  function includeDecimals() {
    return page.switchDecimal.checked;
  }
  
  function isSelected(elem) {
    return elem.checked;
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function handleBitSelector(e) {
    var selectorLabel = e.target.parentNode.getElementsByTagName('label')[0];

    if (e.target.checked) {
      selectorLabel.innerHTML = '1';
    } else {
      selectorLabel.innerHTML = '0';
    }
    
    displayResults();
  }
  
  function handleStyleChange(e) {
    setStyle();
  }
  
  //----------------------------------------
  // callbacks
  //----------------------------------------

  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();