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
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  async function _handleUserInputCheck(e) {
    var elemResultContainer = settings.container.getElementsByClassName('response-container')[0];
    
    UtilityKTS.removeChildren(elemResultContainer);
    var result = await checkAnswer();
    console.log(result);
    if (result.success) {
      var resultParams = result.data;
      elemResultContainer.appendChild(_renderResponse(resultParams));
      doAction(resultParams);
    }
  }
  
  function _renderResponse(responseInfo) {
    console.log(responseInfo);
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
  
  function doAction(resultParams) {
    var container = settings.container.getElementsByClassName('action-container')[0];
    UtilityKTS.removeChildren(container);
    if (resultParams.correct) {
      container.appendChild(CreateElement.createDiv(null, 'action', JSON.stringify(resultParams.action)))
    }
    UtilityKTS.setClass(container, 'hide-me', !resultParams.correct);
  }
  
  //----------------------------------------
	// DB interaction
	//----------------------------------------
  async function checkAnswer() {  // get from DB, including action
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
