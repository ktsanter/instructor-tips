//-------------------------------------------------------------------
// Slide indexer
// present Google Slide deck along with indexing interface
//-------------------------------------------------------------------
// TODO: add scaling for presentation iframe and other containers to suit
// TODO: query params for enabling TOC and index
// TODO: slider button to show/hide share links?
// TODO: add subsub item to TOC
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
    settings.initialSlideNumber = page.body.getElementsByClassName('initialSlideNumber')[0].innerHTML;
    
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
    
    _setShareLinksView(false);
    
    settings.currentSlideNumber = -1;
    _moveToSlideNumber(settings.initialSlideNumber);    
  }
  
  function _renderNavigation() {
    page.navigationContainer = page.body.getElementsByClassName('navigation')[0];
    page.navigationContainer.style.width = (settings.presentationInfo.pageWidth - 7) + 'px';
    _showElement(page.navigationContainer);

    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon fas fa-home', 'home', (e) => {_handleButton('home');}));
    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon fas fa-book', 'table of contents', (e) => {_handleButton('toc');}));
    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon fas fa-list-ul', 'index', (e) => {_handleButton('index');}));

    page.message = CreateElement.createSpan(null, 'message', '')
    page.navigationContainer.appendChild(page.message);
    
    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon right fas fa-external-link-alt', 'open in new tab', (e) => {_handleButton('newtab');}));

    page.navigationContainer.appendChild(CreateElement.createSpan(null, 'toggle-container-label', 'share links'));
    
    var elemToggleContainer = CreateElement.createDiv(null, 'toggle-container');
    page.navigationContainer.appendChild(elemToggleContainer);
    elemToggleContainer.appendChild(_createToggleSliderSwitch(null, null, 'on', 'off', (e) => {_handleShareToggle(e);}));
    
  }
  
  function _renderIndex() {
    page.indexContainer = page.body.getElementsByClassName('index-container')[0];
    page.indexItems = page.body.getElementsByClassName('index-items')[0];

/*    
    var elemTitle = page.indexContainer.getElementsByClassName('index-title')[0];
    elemTitle.appendChild(CreateElement.createSpan(null, 'toggle-container-label', 'share links'));
    
    var elemToggleContainer = CreateElement.createDiv(null, 'toggle-container');
    elemTitle.appendChild(elemToggleContainer);
    elemToggleContainer.appendChild(_createToggleSliderSwitch(null, null, 'on', 'off', (e) => {_handleShareToggle(e);}));
*/  
    var arrIndexInfo = settings.presentationInfo.indexInfo.asArray;
    
    for (var i = 0; i < arrIndexInfo.length; i++) {
      var indexItem = arrIndexInfo[i];
      _renderIndexItem(indexItem, page.indexItems);
    }
  }
  
  function _renderIndexItem(indexItem, appendToElem) {
    var tr = CreateElement._createElement('tr', null, 'index-item-row');
    appendToElem.appendChild(tr);
    
    var td = CreateElement._createElement('td', null, 'index-item-cell index-value');
    tr.appendChild(td);
    td.innerHTML = indexItem.indexValue;
    
    td = CreateElement._createElement('td', null, 'index-item-cell index-link');
    tr.appendChild(td);
    
    for (var i = 0; i < indexItem.slideArray.length; i++) {
      var slideNumber = indexItem.slideArray[i];
      var elem = CreateElement.createSpan(null, 'single-index-link', slideNumber);
      td.appendChild(elem);

      (function(slideNumber) {
        elem.addEventListener('click', function(e) { 
          _handleIndexLink(slideNumber);
        });
      })(slideNumber);
      
      if (i < indexItem.slideArray.length - 1) {
        td.appendChild(CreateElement.createSpan(null, 'index-link-separator', ','));
      }
    }
  }
  
  function _renderTableOfContents() {
    page.tocContainer = page.body.getElementsByClassName('toc-container')[0];
    var tocInfo = settings.presentationInfo.tocInfo;
    
/*    
    var elemTitle = page.tocContainer.getElementsByClassName('toc-title')[0];
    elemTitle.appendChild(CreateElement.createSpan(null, 'toggle-container-label', 'share links'));
    
    var elemToggleContainer = CreateElement.createDiv(null, 'toggle-container');
    elemTitle.appendChild(elemToggleContainer);
    elemToggleContainer.appendChild(_createToggleSliderSwitch(null, null, 'on', 'off', (e) => {_handleShareToggle(e);}));
*/        
    for (var i = 0; i < tocInfo.length; i++) {
      var tocItem = tocInfo[i];
      _renderTableOfContentsItem(tocItem, page.tocContainer, true);
    }
  }

  function _renderTableOfContentsItem(tocItem, appendToElem, mainItem) {
    var container = CreateElement.createDiv(null, 'toc-item');
    appendToElem.appendChild(container);
    
    var classes = 'toc-mainitem';
    if (!mainItem) classes = 'toc-subitem';
    var elem = CreateElement.createDiv(null, classes, '');
    container.appendChild(elem);
    
    var elemLink = CreateElement.createSpan(null, 'toc-itemlink', tocItem.slideTitle);
    elem.appendChild(elemLink);
    elemLink.addEventListener('click', (e) => {_handleTOCLink(tocItem.slideNumber);});
    elem.appendChild(CreateElement.createIcon(null, 'itemshare toc-itemshare fas fa-share', 'copy item link', (e) => {_handleTOCShare(tocItem.slideNumber);}));
    
    for (var i = 0; i < tocItem.children.length; i++) {
      var subItem = tocItem.children[i];
      _renderTableOfContentsItem(subItem, container, false);
    }
  }
  
  function _renderPresentation() {
    settings.slideSource = 'https://docs.google.com/presentation/d/' + settings.presentationId + '/embed?rm=minimal';
    var numSlides = settings.presentationInfo.numSlides;
    var presentationPageWidth = settings.presentationInfo.pageWidth;
    var presentationPageHeight = settings.presentationInfo.pageHeight;
    
    var iframeWidth = presentationPageWidth + 'pt';
    var iframeHeight = presentationPageHeight + 'pt';

    page.slide = [];
    page.presentationContainer = page.body.getElementsByClassName('presentation-container')[0];

    for (var i = 0; i < numSlides; i++) {
      var sourceURL = settings.slideSource + '#' + (i + 1);
      page.slide.push(
        CreateElement.createIframe(null, 'slide hide-me', sourceURL, iframeWidth, iframeHeight, true)
      );
      page.presentationContainer.appendChild(page.slide[i]);
    }
  }
  
  //----------------------------------------
	// refresh / update
	//----------------------------------------
  function _moveToSlideNumber(slideNumber) {
    if (slideNumber < 0 || slideNumber >= settings.presentationInfo.numSlides) {
      console.log('invalid slide number: ' + slideNumber);
      return;
    }
    
    if (settings.currentSlideNumber >= 0) {
      var slide = page.slide[settings.currentSlideNumber];
      _hideElement(slide);
      slide.src = slide.src;
    }
    
    settings.currentSlideNumber = slideNumber;
    _showElement(page.presentationContainer);
    _showElement(page.slide[settings.currentSlideNumber]);
  }
  
  function _makeSlideURL(slideNumber) {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    if (hostname == 'localhost') hostname = 'localhost:8000';
    var path = 'slide-indexer';
    
    return protocol + '//' + hostname + '/' + path + '/' + settings.presentationId + '/' + slideNumber;
  }
  
  function _copySlideURLToClipboard(slideNumber) {
    _copyToClipboard(_makeSlideURL(slideNumber));
  }
  
  function _setShareLinksView(share) {
    var arrElemShare = page.body.getElementsByClassName('itemshare');
    for (var i = 0; i < arrElemShare.length; i++) {
      var elem = arrElemShare[i];
      if (share) {
        _showElement(elem);
      } else {
        _hideElement(elem);
      }
    }
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  function _handleButton(action) {
    _showMessage('');

    if (action == 'newtab') {
      window.open(_makeSlideURL(settings.currentSlideNumber), '_blank');
          
    } else {
      _hideElement(page.presentationContainer);
      _hideElement(page.indexContainer);
      _hideElement(page.tocContainer);
      
      if (action == 'home') {
        _showElement(page.presentationContainer);
        _moveToSlideNumber(0);
        
      } else if (action == 'index') {
        _showElement(page.indexContainer);
        
      } else if (action == 'toc') {
        _showElement(page.tocContainer);  
      }
    }
  }
  
  function _handleIndexLink(slideNumber) {
    _hideElement(page.indexContainer);
    _moveToSlideNumber(slideNumber);
    _showMessage('');
  }
  
  function _handleTOCLink(slideNumber) {
    _hideElement(page.tocContainer);
    _moveToSlideNumber(slideNumber);
    _showMessage('');
  }
  
  function _handleTOCShare(slideNumber) {
    _copySlideURLToClipboard(slideNumber);
    _showMessage('link copied to clipboard');
  }
  
  function _handleShareToggle(e) {
    _setShareLinksView(_getToggleSliderValue(e.target));
  }
    
  //----------------------------------------
	// utility
	//----------------------------------------
  function _hideElement(elem) {
    UtilityKTS.setClass(elem, 'hide-me', true);
  }
  
  function _showElement(elem) {
    UtilityKTS.setClass(elem, 'hide-me', false);
  }
  
  function _showMessage(txt) {
    page.message.innerHTML = txt;
  }  

  function _createToggleSliderSwitch(id, classes, onText, offText, handler) {
    var fullClassList = 'switch';
    if (classes && classes != '') fullClassList += ' ' + classes;
    
    var container = CreateElement._createElement('label', id, fullClassList);
    
    var elemCheckbox = CreateElement._createElement('input', null, 'switch-input');
    container.appendChild(elemCheckbox);
    elemCheckbox.type = 'checkbox';
    if (handler) elemCheckbox.addEventListener('click', e => handler(e));
    
    var elemSpanLabel = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemSpanLabel);
    elemSpanLabel.setAttribute('data-on', onText);
    elemSpanLabel.setAttribute('data-off', offText);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));

    return container;
  }
  
   function _getToggleSliderValue(elem) {
    return elem.checked;
  }

  function _setToggleSliderValue(elem, checked) {
    elem.checked = checked;
  }  
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	

  function _copyRenderedToClipboard(txt) {
    if (!page._renderedclipboard) page._renderedclipboard = new ClipboardCopy(page.body, 'rendered');

    page._renderedclipboard.copyRenderedToClipboard(txt);
	}
  
  //----------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
