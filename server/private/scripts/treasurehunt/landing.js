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
    console.log(settings.container);
    _buildNotice();
    _getResponseTemplates();
    _attachHandlers();
  }
  
  function _buildNotice() {
    var noticeContainer = document.getElementsByClassName('notice')[0];
    this._notice = new StandardNotice(noticeContainer, noticeContainer);
    this._notice.setNotice('');  
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
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  async function _handleUserInputCheck(e) {
    var elemResultContainer = settings.container.getElementsByClassName('response-container')[0];
    
    UtilityKTS.removeChildren(elemResultContainer);
    var result = await checkAnswer();
    if (result.success) {
      elemResultContainer.appendChild(_renderResponse(result));
      doAction(result.correct);
    }
  }
  
  function _renderResponse(responseInfo) {
    var container = CreateElement.createDiv(null, 'response-specific');
    
    var posResponse = settings.positiveResponseTemplate
    posResponse = posResponse.replace(/\[\[cluenumber\]\]/g, responseInfo.clueNumber);
    posResponse = posResponse.replace(/\[\[numberofclues\]\]/g, responseInfo.numberOfClues);
    posResponse = posResponse.replace(/\[\[confirmation\]\]/g, responseInfo.confirmation);
  
    var negResponse = settings.negativeResponseTemplate
    negResponse = negResponse.replace(/\[\[cluenumber\]\]/g, responseInfo.clueNumber);
    negResponse = negResponse.replace(/\[\[numberofclues\]\]/g, responseInfo.numberOfClues);
    negResponse = negResponse.replace(/\[\[confirmation\]\]/g, responseInfo.confirmation);
    
    var splitResponse = posResponse.split('[[standardbox]]');
    if (splitResponse.length > 0) {
      posResponse = splitResponse.join('');
      var standardBox = CreateElement.createDiv(null, 'standardbox');
      standardBox.innerHTML = posResponse;
      standardBox.appendChild(CreateElement.createDiv(null, 'standardbox-confirmation', responseInfo.confirmation));
      posResponse = standardBox.outerHTML;
    }
    
    if (responseInfo.correct) {
      container.innerHTML = posResponse;
     
    } else {
      container.innerHTML = negResponse;
    }
    
    return container;
  }
  
  function doAction(enable) {
    var container = settings.container.getElementsByClassName('action-container')[0];
    UtilityKTS.setClass(container, 'hide-me', !enable);
  }
  
  //----------------------------------------
	// DB interaction
	//----------------------------------------
  async function checkAnswer() {
    var result = {success: false, correct: false};
    
    result.success = true;
    result.correct = (Math.random() > 0.5);
    
    result.numberOfClues = 10;
    result.clueNumber = 3;
    result.confirmation = 'aardvark';
    
    return result;
  }
  
  //----------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
