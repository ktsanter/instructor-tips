//-------------------------------------------------------------------
// Slide indexer
// present Google Slide deck along with indexing interface
//-------------------------------------------------------------------
// TODO: color specification for dropdown menus (?)
// TODO: size altcontrol icons based on slide size (for presentation only)
//-------------------------------------------------------------------

const app = function () {
  const appversion = '1.01';
  const appname = 'Slide Indexer';
  
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
    
    var expectedQueryParams = [
      {key: 'toc', required: false},
      {key: 'index', required: false},
      {key: 'altcontrol', required: false},
      {key: 'homeoverlay', required: false}
    ];
    
    if (_initializeSettings(expectedQueryParams)) {
      if (settings.toc == null) {
        settings.toc = true; 
      } else {
        settings.toc = ( settings.toc.toLowerCase() == 'true' || settings.toc == '1');
      }
      
      if (settings.index == null) {
        settings.index = true; 
      } else {
        settings.index = ( settings.index.toLowerCase() == 'true' || settings.index == '1');
      }
      
      if (settings.altcontrol == null) {
        settings.altcontrol = false;
      } else {
        settings.altcontrol = (settings.altcontrol.toLowerCase() == 'true' || settings.altcontrol == '1');
      }
      
      if (settings.homeoverlay == null) {
        settings.homeoverlay = false;
      } else {
        settings.homeoverlay = (settings.homeoverlay.toLowerCase() == 'true' || settings.homeoverlay == '1');
      }
    
      page.notice.setNotice('loading configuration data...', true);
        
      var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'slideindexinfo', {presentationid: settings.presentationId}, page.notice);
      page.notice.setNotice('', false);
      if (requestResult.success) {
        settings.presentationInfo = requestResult.data;
        _renderPage();
      } 
    }
  }

	//-------------------------------------------------------------------------------------
	// process query params
	//-------------------------------------------------------------------------------------
	function _initializeSettings(expectedParams) {
    var result = false;

    var urlParams = new URLSearchParams(window.location.search);
    for (var i = 0; i < expectedParams.length; i++) {
      var key = expectedParams[i].key;
      settings[key] = urlParams.has(key) ? urlParams.get(key) : null;
    }

    var receivedRequiredParams = true;
    for (var i = 0; i < expectedParams.length && receivedRequiredParams; i++) {
      var key = expectedParams[i].key;
      if (expectedParams[i].required) receivedRequiredParams = (settings[key] != null);
    }
    
    if (receivedRequiredParams) {
			result = true;

    } else {   
      page.notice.setNotice('failed to initialize: invalid parameters');
    }
    
    return result;
  }  
  
  //-----------------------------------------
  // page rendering
  //-----------------------------------------  
  function _renderPage() {
    settings.clientDimensions = {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight
    };
    window.addEventListener('resize', (e) => {_handleResize(e);});
    
    settings.sharelinks = false;
    
    _renderNavigation();
    _configureDropdown();
    _renderIndex();
    _renderTableOfContents();
    _renderPresentation();
    
    _setShareLinksView(false);
    
    settings.currentSlideNumber = -1;
    _moveToSlideNumber(settings.initialSlideNumber);    
        
    _sizeDropdown();
  }
  
  function _renderNavigation() {
    page.navigationContainer = page.body.getElementsByClassName('navigation')[0];
    if (!settings.altcontrol) _showElement(page.navigationContainer);

    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon fas fa-home', 'home', (e) => {_handleButton('home');}));
    if (settings.toc) {
      page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon fas fa-book', 'table of contents', (e) => {_handleButton('toc');}));
    }
    if (settings.index) {
      page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon fas fa-list-ul', 'index', (e) => {_handleButton('index');}));
    }

    if (settings.index || settings.toc) {
      page.navigationContainer.appendChild(CreateElement.createSpan(null, 'toggle-container-label', 'share links'));
      
      var elemToggleContainer = CreateElement.createDiv(null, 'toggle-container');
      page.navigationContainer.appendChild(elemToggleContainer);
      elemToggleContainer.appendChild(_createToggleSliderSwitch(null, null, 'on', 'off', (e) => {_handleShareToggle(e);}));
    }    

    page.message = CreateElement.createSpan(null, 'message', '')
    page.navigationContainer.appendChild(page.message);
    
    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon right fas fa-external-link-alt', 'open in new tab', (e) => {_handleButton('newtab');}));
    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon right far fa-question-circle', 'help', (e) => {_handleButton('help');}));

    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon nextpage right fas fa-angle-right', 'next page', (e) => {_handleButton('nextpage');}));
    page.navigationContainer.appendChild(CreateElement.createIcon(null, 'navicon prevpage right fas fa-angle-left', 'previous page', (e) => {_handleButton('prevpage');}));
  }
  
  function _configureDropdown() {
    page.dropdown = page.body.getElementsByClassName('dropdown-container')[0];
    
    window.addEventListener('click', (e) => {_closeDropdown(e);});
    page.body.getElementsByClassName('bwd-button')[0].addEventListener('click', (e) => {_handleButton('prevpage');});
    page.body.getElementsByClassName('fwd-button')[0].addEventListener('click', (e) => {_handleButton('nextpage');});
    
    var dropdowns = page.body.getElementsByClassName('dropbtn');
    for (var i = 0; i < dropdowns.length; i++) {
      dropdowns[i].addEventListener('click', (e) => {_handleDropdown(e);});
    }
    
    var items = page.body.getElementsByClassName('dropdown-item');
    for (var i = 0; i < items.length; i++) {
      items[i].addEventListener('click', (e) => {_handleDropdownItem(e)});
    }
    
    var dropdown2 = page.body.getElementsByClassName('dropdown2');
    for (var i = 0; i < dropdown2.length; i++) {
      if (settings.altcontrol) _showElement(dropdown2[i]);
    }
    
    var menuEntries = page.body.getElementsByClassName('dropdown-contents');
    for (var i = 0; i < menuEntries.length; i++) {
      if (settings.toc) {
        _showElement(menuEntries[i]);
      } else {
        _hideElement(menuEntries[i]);
      }
    }

    var menuEntries = page.body.getElementsByClassName('dropdown-index');
    for (var i = 0; i < menuEntries.length; i++) {
      if (settings.index) {
        _showElement(menuEntries[i]);
      } else {
        _hideElement(menuEntries[i]);
      }
    }

    var menuEntries = page.body.getElementsByClassName('dropdown-share');
    for (var i = 0; i < menuEntries.length; i++) {
      if (settings.toc || settings.index) {
        _showElement(menuEntries[i]);
      } else {
        _hideElement(menuEntries[i]);
      }
    }
  }
  
  function _renderIndex() {
    page.indexContainer = page.body.getElementsByClassName('index-container')[0];
    page.indexItems = page.body.getElementsByClassName('index-items')[0];

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
      
      var elemLink = CreateElement.createSpan(null, 'single-index-link', slideNumber);
      var elemShare = CreateElement.createIcon(null, 'itemshare index-itemshare fas fa-share', 'copy item link');
      td.appendChild(elemLink);
      td.appendChild(elemShare);

      (function(slideNumber) {
        elemLink.addEventListener('click', function(e) { 
          _handleIndexLink(slideNumber);
        });
        elemShare.addEventListener('click', function(e) { 
          _handleIndexShare(slideNumber);
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
    var defaultWidth = '10pt';
    var defaultHeight = '10pt';
    
    page.slide = [];
    page.presentationContainer = page.body.getElementsByClassName('presentation-container')[0];

    for (var i = 0; i < numSlides; i++) {
      var sourceURL = settings.slideSource + '#' + (i + 1);
      var iframeContainer = CreateElement.createDiv(null, 'slide-container hide-me');
      iframeContainer.appendChild(CreateElement.createIframe(null, 'slide', sourceURL, defaultWidth, defaultHeight, true));
      page.slide.push(iframeContainer);
      page.presentationContainer.appendChild(page.slide[i]);
    }
    
    if (settings.homeoverlay) {
      page.homeSlideOverlay = _renderHomeSlideOverlay();
      page.body.getElementsByClassName('display-container')[0].appendChild(page.homeSlideOverlay);
    }
    
    _sizeSlides();
  }
  
  function _renderHomeSlideOverlay() {
    var container = CreateElement.createDiv(null, 'homeslide-overlay hide-me');
    var toc = settings.presentationInfo.tocInfo;

    var navContainer = CreateElement.createDiv(null, 'homeslide-navcontainer');
    container.appendChild(navContainer);
    
    for (var i = 0; i < toc.length; i++) {
      navContainer.appendChild(_renderHomeOverlayLink(toc[i]));
    }
    
    return container;
  }
  
  function _renderHomeOverlayLink(tocEntry) {
    var container = CreateElement.createDiv(null, 'homeslide-navitem', tocEntry.slideTitle);
    
    container.slideNumber = tocEntry.slideNumber;
    container.addEventListener('click', _makeHomeOverlayFunction(tocEntry.slideNumber));
    
    return container;
  }
  
  function _makeHomeOverlayFunction(n) {
    return function() {_moveToSlideNumber(n);}
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
      var elemIframe = slide.getElementsByClassName('slide')[0];
      elemIframe.src = elemIframe.src;
    }
    
    if (settings.homeoverlay) {
      if (slideNumber == 0) {
        _showElement(page.homeSlideOverlay);
      } else {
        _hideElement(page.homeSlideOverlay);
      }
    }
    
    settings.currentSlideNumber = slideNumber;
    _showElement(page.presentationContainer);
    _showElement(page.slide[settings.currentSlideNumber]);
    
    _setVisibility(page.body.getElementsByClassName('nextpage')[0], slideNumber < settings.presentationInfo.numSlides - 1);
    _setVisibility(page.body.getElementsByClassName('fwd-button')[0], slideNumber < settings.presentationInfo.numSlides - 1);
    _setVisibility(page.body.getElementsByClassName('prevpage')[0], slideNumber > 0);
    _setVisibility(page.body.getElementsByClassName('bwd-button')[0], slideNumber > 0);
    _setVisibility(page.body.getElementsByClassName('dropbtn')[0], true);
    
    _sizeNavbar();   
    _sizeDropdown();    
  }
  
  function _makeSlideURL(slideNumber) {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    if (hostname == 'localhost') hostname = 'localhost:8000';
    var path = 'slide-indexer';
    var queryParams = window.location.search;
    
    return protocol + '//' + hostname + '/' + path + '/' + settings.presentationId + '/' + slideNumber + queryParams;
  }
  
  function _makeHelpURL() {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    if (hostname == 'localhost') hostname = 'localhost:8000';
    var path = 'slide-indexer';
    var filename = 'user-help';
    if (settings.altcontrol) filename = 'user-help2';
    
    return protocol + '//' + hostname + '/' + path + '/' + filename;
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
    
    var sharelinkIcons = page.body.getElementsByClassName('sharelinks-icon');
    for (var i = 0; i < sharelinkIcons.length; i++) {
      if (share) {
        _showElement(sharelinkIcons[i]);
      } else {
        _hideElement(sharelinkIcons[i]);
      }
    }    
  }
  
  function _sizeSlides() {
    // height is scaled to fit verticalSlideRatio percentage of client
    // width is scaled to same factor, preserving aspect ratio of orig slide dimensions
    var verticalSlideRatio = 0.92;  // proportion of client height used by slide
    var horizontalSlideRatio = 0.95;  // proportion of client width used by slide (when not scaling by height)
    var horizontalThresholdRatio = 0.98;  // cutoff for scaling by width rather than height
        
    var currentClientWidth = document.documentElement.clientWidth;
    var currentClientHeight = document.documentElement.clientHeight;
    
    var origSlideWidth = settings.presentationInfo.pageWidth;
    var origSlideHeight = settings.presentationInfo.pageHeight;
    
    var targetSlideHeight = verticalSlideRatio * currentClientHeight;
    var heightScale = targetSlideHeight / origSlideHeight;
    var widthScale = heightScale;
    
    var newSlideWidth = origSlideWidth * widthScale;
    var newSlideHeight = origSlideHeight * heightScale;
    
    if (newSlideWidth > currentClientWidth * horizontalThresholdRatio) {
      var targetSlideWidth = horizontalSlideRatio * currentClientWidth;
      widthScale = targetSlideWidth / origSlideWidth;
      heightScale = widthScale;
      newSlideWidth = origSlideWidth * widthScale;
      newSlideHeight = origSlideHeight * heightScale;
    }

    settings.currentSlideWidth = newSlideWidth;
    settings.currentSlideHeight = newSlideHeight;
    
    var numSlides = settings.presentationInfo.numSlides;
    for (var i = 0; i < numSlides; i++) {
      var slide = page.slide[i].getElementsByClassName('slide')[0];
      slide.width = settings.currentSlideWidth + 'pt';
      slide.height = settings.currentSlideHeight + 'pt';
    }
    
    var scale = 'scale(' + widthScale + ',' + heightScale + ')';
    page.body.getElementsByClassName('fwd-button')[0].style.transform = scale;
    page.body.getElementsByClassName('bwd-button')[0].style.transform = scale;    
    page.body.getElementsByClassName('dropbtn')[0].style.transform = scale; 
    if (page.homeSlideOverlay) page.homeSlideOverlay.style.transform = scale; 
  }
  
  function _sizeNavbar() {
    // now set to fixed size in CSS
  }

  function _sizeDropdown() {
    var dropdown = page.body.getElementsByClassName('dropdown-container')[0];

    var fudgeFactor = -55;
    var widthValue = (settings.currentSlideWidth + fudgeFactor).toString();
    var widthUnit = 'px';

    page.dropdown.style.left = widthValue + widthUnit;
    if (settings.altcontrol) _showElement(page.dropdown);
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  function _handleButton(action) {
    _showMessage('');
    var currentSlide = parseInt(settings.currentSlideNumber);

    if (action == 'newtab') {
      window.open(_makeSlideURL(currentSlide), '_blank');
          
    } else if (action == 'help') {
      window.open(_makeHelpURL(), '_blank');
      
    } else {
      _hideElement(page.presentationContainer);
      _hideElement(page.indexContainer);
      _hideElement(page.tocContainer);
      if (settings.homeoverlay) _hideElement(page.homeSlideOverlay);
      
      _setVisibility(page.body.getElementsByClassName('fwd-button')[0], false);
      _setVisibility(page.body.getElementsByClassName('nextpage')[0], false);
      _setVisibility(page.body.getElementsByClassName('bwd-button')[0], false);
      _setVisibility(page.body.getElementsByClassName('prevpage')[0], false);
      _setVisibility(page.body.getElementsByClassName('dropbtn')[0], false);

      if (action == 'home') {
        _showElement(page.presentationContainer);
        _moveToSlideNumber(0);
        
      } else if (action == 'nextpage') {
        _showElement(page.presentationContainer);
        if (currentSlide < settings.presentationInfo.numSlides - 1) {
          _moveToSlideNumber(currentSlide + 1);
        }
        
      } else if (action == 'prevpage') {
        _showElement(page.presentationContainer);
        if (currentSlide > 0) {
          _moveToSlideNumber(currentSlide - 1);
        }
        
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
  
  function _handleIndexShare(slideNumber) {
    _handleTOCShare(slideNumber);
  }
  
  function _handleShareToggle(e) {
    _setShareLinksView(_getToggleSliderValue(e.target));
  }
  
  function _handleResize(e) {
    _sizeSlides();
    _sizeNavbar();
    _sizeDropdown();
  }
  
  function _handleDropdown(e) {
    var content = e.target.parentNode.getElementsByClassName('dropdown-content')[0];
    
    content.classList.toggle("show");
  }

  function _closeDropdown(e) {
    if (!e.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");

      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }    
  
  function _handleDropdownItem(e) {
    if (e.target.classList.contains('dropdown-home')) {
      _handleButton('home');
    } else if (e.target.classList.contains('dropdown-contents')) {
      _handleButton('toc');
    } else if (e.target.classList.contains('dropdown-index')) {
      _handleButton('index');
    } else if (e.target.classList.contains('dropdown-share')) {
      settings.sharelinks = !settings.sharelinks;
      _setShareLinksView(settings.sharelinks);
    } else if (e.target.classList.contains('dropdown-newtab')) {
      _handleButton('newtab');
    } else if (e.target.classList.contains('dropdown-help')) {
      _handleButton('help');
    }    
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
  
  function _setVisibility(elem, visible) {
    if (visible) 
      elem.style.visibility = 'visible';
    else
      elem.style.visibility = 'hidden';
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
