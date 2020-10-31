//-------------------------------------------------------------------
// Slide Indexer
// present Google Slide deck along with indexing interface
//-------------------------------------------------------------------
// TODO: add scaling for presentation iframe and other containers to suit
//-------------------------------------------------------------------

const app = function () {
  const appversion = '1.01';
  const appname = 'Slide indexer';
  
  const apiInfo = {
    apibase: 'https://script.google.com/macros/s/AKfycbzG66LIoo5DOs040Wqh9mD0RR4YqJfxVmGLFXyNRui2MVv0MqM/exec',
    apikey: 'MVslideindexing'
  };  
  
  const page = {};
  const settings = {};
  
  // presentation id for testing: 14X6SpTLlIZ_273f14e-thhYefJXGDvw4gP3VODnvA3w
  
	//----------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    page.body = document.getElementsByTagName('body')[0];

    page.notice = new StandardNotice(page.body, page.body);
    page.notice.setNotice('', false);
    
    settings.presentationId = page.body.getElementsByClassName('presentationId')[0].innerHTML;
    page.notice.setNotice('loading configuration data...', true);
      
    var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'slideindexinfo', {presentationid: settings.presentationId}, page.notice);
    page.notice.setNotice('', false);
    if (requestResult.success) {
      settings.presentationInfo = requestResult.data;
      _renderPage();
    } 
  }

  //-----------------------------------------
  // page rendering
  //-----------------------------------------  
  function _renderPage() {
    _renderIndex();
    _renderTableOfContents();
    _renderPresentation();
  }
  
  function _renderIndex() {
    var container = page.body.getElementsByClassName('index-container')[0];
    var arrIndexInfo = settings.presentationInfo.indexInfo.asArray;
    
    for (var i = 0; i < arrIndexInfo.length; i++) {
      var indexItem = arrIndexInfo[i];
      container.appendChild(CreateElement.createDiv(null, null, indexItem.indexValue + ' | ' + indexItem.slideNumber + ' | ' + indexItem.slideTitle));
    }
  }  
  
  function _renderTableOfContents() {
    var container = page.body.getElementsByClassName('toc-container')[0];
    container.appendChild(CreateElement.createDiv(null, null, 'toc'));
  }  
  
  function _renderPresentation() {
    var slideSource = 'https://docs.google.com/presentation/d/' + settings.presentationId + '/embed?rm=minimal';
    var presentationPageWidth = settings.presentationInfo.pageWidth;
    var presentationPageHeight = settings.presentationInfo.pageHeight;
    
    var iframeWidth = presentationPageWidth + 'pt';
    var iframeHeight = presentationPageHeight + 'pt';
    console.log(presentationPageWidth + ' ' + presentationPageHeight);
    var presentation = CreateElement.createIframe('presentation', null, slideSource, iframeWidth, iframeHeight, true);
    
    var container = page.body.getElementsByClassName('presentation-container')[0];
    container.appendChild(presentation);
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  
  //----------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
