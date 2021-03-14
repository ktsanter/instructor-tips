//-------------------------------------------------------------------
// Treasure Hunt landing
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const page = {};

  const settings = {
    hideClass: 'hide-me',  
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  async function init () {
    page.body = document.getElementsByTagName('body')[0];
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('');
    
    page.contents = page.body.getElementsByClassName('contents')[0];
        
    _getResponseTemplates();
    _attachHandlers();
  }

  
  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------
  function _getResponseTemplates() {
    var elem = page.contents.getElementsByClassName('positiveresponse')[0];
    settings.positiveResponseTemplate = elem.innerHTML;

    elem = page.contents.getElementsByClassName('negativeresponse')[0];
    settings.negativeResponseTemplate = elem.innerHTML;
    
    elem = page.contents.getElementsByClassName('response-container')[0];
    UtilityKTS.removeChildren(elem);
  }
  
  function _attachHandlers() {
    var elem = page.contents.getElementsByClassName('userinputcheck')[0];
    elem.addEventListener('click', _handleUserInputCheck);
    
    elem = page.contents.getElementsByClassName('userinput')[0];
    elem.addEventListener('keyup', _handleUserInputKeyup);
  }
  
  //---------------------------------------
	// updating
	//----------------------------------------
  function _renderResponse(responseInfo) {
    var container = CreateElement.createDiv(null, 'response-specific');
    
    var posResponse = settings.positiveResponseTemplate
    posResponse = posResponse.replace(/\[\[cluenumber\]\]/g, responseInfo.cluenumber);
    posResponse = posResponse.replace(/\[\[numberofclues\]\]/g, responseInfo.numberofclues);
    posResponse = posResponse.replace(/\[\[confirmation\]\]/g, responseInfo.confirmation);
    
    var splitResponse = posResponse.split('[[custom]]');
    if (splitResponse.length > 1) {
      posResponse = splitResponse.join('');

    } else {
      var standardBox = CreateElement.createDiv(null, 'standardbox');
      standardBox.innerHTML = posResponse;
      standardBox.appendChild(CreateElement.createDiv(null, 'standardbox-confirmation', responseInfo.confirmation));
      posResponse = standardBox.outerHTML;
    }
    
    if (responseInfo.correct) {
      container.innerHTML = posResponse;
     
    } else {
      container.innerHTML = settings.negativeResponseTemplate;
    }
    
    return container;
  }
  
  function _doAction(resultParams) {
    var container = page.contents.getElementsByClassName('action-container')[0];
      var actionLookup = {
        'url': {className: 'action-url', func: _doActionURL},
        'google_search': {className: 'action-search', func: _doActionSearch},
        'effect': {className: 'action-effect', func: _doActionEffect},
      };
    
    var actionElements = container.getElementsByClassName('action');
    for (var i = 0; i < actionElements.length; i++) {
      UtilityKTS.setClass(actionElements[i], 'hide-me', true);
    }
    
    if (resultParams.correct) {
      var actionInfo = resultParams.action;
      if (actionInfo.type != 'none') {
        var lookupInfo = actionLookup[actionInfo.type];
        var elem = container.getElementsByClassName(lookupInfo.className)[0];
        lookupInfo.func(actionInfo, elem);
      }
    }
    
    UtilityKTS.setClass(container, 'hide-me', !resultParams.correct);
  }
  
  function _doActionURL(info, container) {
    var elem = container.getElementsByClassName('action-url-link')[0];
    elem.href = info.target;
    
    UtilityKTS.setClass(container, 'hide-me', false);
  }
  
  function _doActionSearch(info, container) {
    var elem = container.getElementsByClassName('action-search-text')[0];
    elem.innerHTML = info.searchfor;
    
    UtilityKTS.setClass(container, 'hide-me', false);
  }
  
  function _doActionEffect(info, container) {
    UtilityKTS.setClass(container, 'hide-me', false);    
    var effect = new TreasureHuntEffect({'effect': info.effecttype, 'arg1': info.message, 'container': container});  
    effect.doEffect();    
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  async function _handleUserInputCheck(e) {
    var elemResultContainer = page.contents.getElementsByClassName('response-container')[0];
    
    UtilityKTS.removeChildren(elemResultContainer);
    var result = await _checkAnswer();

    if (result.success) {
      var resultParams = result.data;
      elemResultContainer.appendChild(_renderResponse(resultParams));
      _doAction(resultParams);
    }
  }
  
  async function _handleUserInputKeyup(e) {
    if (e.key == 'Enter') {
      var elemCheck = page.contents.getElementsByClassName('userinputcheck')[0];
      elemCheck.click();
    }
  }
  
  //---------------------------------------
	// DB interface
	//----------------------------------------
  async function _checkAnswer() {
    var elemProjectId = page.contents.getElementsByClassName('projectid')[0];
    var elemUserInput = page.contents.getElementsByClassName('userinput')[0];

    var params = {
      projectid: elemProjectId.innerHTML,
      answer: elemUserInput.value
    };
    
    var queryResults = await SQLDBInterface.doPostQuery('treasurehunt/landing', 'check-answer', params, settings.notice);
    return queryResults;
  }
  
  //---------------------------------------
  // utility functions
  //---------------------------------------- 
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
