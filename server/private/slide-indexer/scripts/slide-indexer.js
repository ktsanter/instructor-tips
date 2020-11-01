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
    _renderNavigation();
    _renderIndex();
    _renderTableOfContents();
    _renderPresentation();
  }
  
  function _renderNavigation() {
    var container = page.body.getElementsByClassName('navigation')[0];

    var elemButton = CreateElement.createButton(null, null, 'home', null, (e) => {_handleButton('home');});
    container.appendChild(elemButton);

    var elemButton = CreateElement.createButton(null, null, 'index', null, (e) => {_handleButton('index');});
    container.appendChild(elemButton);

    var elemButton = CreateElement.createButton(null, null, 'toc', null, (e) => {_handleButton('toc');});
    container.appendChild(elemButton);
  }
  
  function _renderIndex() {
    var container = page.body.getElementsByClassName('index-container')[0];
    var arrIndexInfo = settings.presentationInfo.indexInfo.asArray;
    
    for (var i = 0; i < arrIndexInfo.length; i++) {
      var indexItem = arrIndexInfo[i];
      _renderIndexItem(indexItem, container);
    }
  }
  
  function _renderIndexItem(indexItem, appendToElem) {
    var container = CreateElement.createDiv(null, null);
    appendToElem.appendChild(container);
    
    var elem = CreateElement.createDiv(null, null, indexItem.indexValue);
    container.appendChild(elem);
    elem.addEventListener('click',  (e) => {_handleIndexLink(indexItem.slideNumber);});
  }
  
  function _renderTableOfContents() {
    var container = page.body.getElementsByClassName('toc-container')[0];
    var tocInfo = settings.presentationInfo.tocInfo;
    
    for (var i = 0; i < tocInfo.length; i++) {
      var tocItem = tocInfo[i];
      _renderTableOfContentsItem(tocItem, container);
    }
  }

  function _renderTableOfContentsItem(tocItem, appendToElem) {
    var container = CreateElement.createDiv(null, null);
    appendToElem.appendChild(container);
    
    var elem = CreateElement.createDiv(null, null, tocItem.slideNumber + ': ' + tocItem.tocValue + ' - ' + tocItem.slideTitle);
    container.appendChild(elem);
    elem.addEventListener('click', (e) => {_handleTOCLink(tocItem.slideNumber);});
  }
  
  function _renderPresentation() {
    settings.slideSource = 'https://docs.google.com/presentation/d/' + settings.presentationId + '/embed?rm=minimal';
    var numSlides = settings.presentationInfo.numSlides;
    var presentationPageWidth = settings.presentationInfo.pageWidth;
    var presentationPageHeight = settings.presentationInfo.pageHeight;
    
    var iframeWidth = presentationPageWidth + 'pt';
    var iframeHeight = presentationPageHeight + 'pt';

    page.slide = [];
    var container = page.body.getElementsByClassName('presentation-container')[0];

    for (var i = 0; i < numSlides; i++) {
      var sourceURL = settings.slideSource + '#' + (i + 1);
      page.slide.push(
        CreateElement.createIframe(null, 'slide hide-me', sourceURL, iframeWidth, iframeHeight, true)
      );
      container.appendChild(page.slide[i]);
    }
    
    settings.currentSlideNumber = -1;
    _moveToSlideNumber(0);
  }
  
  //----------------------------------------
	// refresh / update
	//----------------------------------------
  function _moveToSlideNumber(slideNumber) {
    if (settings.currentSlideNumber >= 0) {
      var slide = page.slide[settings.currentSlideNumber];
      UtilityKTS.setClass(slide, 'hide-me', true);
      slide.src = slide.src;
    }
    
    settings.currentSlideNumber = slideNumber;
    UtilityKTS.setClass(page.slide[settings.currentSlideNumber], 'hide-me', false);
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  function _handleButton(action) {
    if (action == 'home') {
      _moveToSlideNumber(0);
    } else if (action == 'index') {
      console.log('index');
    } else if (action == 'toc') {
      console.log('toc');
    }
  }
  
  function _handleIndexLink(slideNumber) {
    _moveToSlideNumber(slideNumber);
  }
  
  function _handleTOCLink(slideNumber) {
    _moveToSlideNumber(slideNumber);
  }
  
  //----------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
