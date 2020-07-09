//-------------------------------------------------------------------
// TreasureHunt landing page
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const settings = {};
  
	//----------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    settings.container = document.getElementsByClassName('treasurehunt-landing')[0];
    _buildNotice();
    _getResponseTemplates();
    _attachHandlers();
  }
  
  function _buildNotice() {
    var noticeContainer = document.getElementsByClassName('notice')[0];
    settings.notice = new StandardNotice(noticeContainer, noticeContainer);
    settings.notice.setNotice('');  
	} 
  
  function _getResponseTemplates() {
    var elem = settings.container.getElementsByClassName('positiveresponse')[0];
    settings.positiveResponseTemplate = elem.innerHTML;

    elem = settings.container.getElementsByClassName('negativeresponse')[0];
    settings.negativeResponseTemplate = elem.innerHTML;

    elem = settings.container.getElementsByClassName('response-container')[0];
    UtilityKTS.removeChildren(elem);
  }
  
  function _attachHandlers() {
    var elem = settings.container.getElementsByClassName('userinputcheck')[0];
    elem.addEventListener('click', _handleUserInputCheck);
    
    elem = settings.container.getElementsByClassName('userinput')[0];
    elem.addEventListener('keyup', _handleUserInputKeyup);
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  async function _handleUserInputCheck(e) {
    var elemResultContainer = settings.container.getElementsByClassName('response-container')[0];
    
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
      var elemCheck = settings.container.getElementsByClassName('userinputcheck')[0];
      elemCheck.click();
    }
  }
  
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
    var container = settings.container.getElementsByClassName('action-container')[0];
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
  
  //----------------------------------------
	// DB interaction
	//----------------------------------------
  async function _checkAnswer() {
    var elemProjectId = settings.container.getElementsByClassName('projectid')[0];
    var elemUserInput = settings.container.getElementsByClassName('userinput')[0];

    var params = {
      projectid: elemProjectId.innerHTML,
      answer: elemUserInput.value
    };
    var queryResults = await SQLDBInterface.doPostQuery('treasurehunt/landing', 'check-answer', params, settings.notice);
    return queryResults;
  }
  
  //----------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
