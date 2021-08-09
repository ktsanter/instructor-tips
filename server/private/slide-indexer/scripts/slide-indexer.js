//-----------------------------------------------------------------------
// Slide indexer landing page
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
  const apiInfo = {
    apibase: 'https://script.google.com/macros/s/AKfycbxYvO5BB1hhXs1I71zQ8lJBs7CuJus7NpCpKefQMf6VVq7EuWHcj-GaPbeer_q7B7gO/exec',
    apikey: 'MVslideindexing'
  };  
// presentation id for testing: 1EccQWBLlv7w9YI-cN40FSFg1cQIf-wgg89Q1JMb2-io
  
  const settings = {
    hideClass: 'hide-me',
    invisibleClass: 'invisible-me',
    dropdownHeightRatio: 0.95
  };

	const page = {};
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    window.addEventListener('resize', (e) => { handleResize(e); });
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('slide indexer loading...', true);
        
    page.contents = page.body.getElementsByClassName('contents')[0];    
    
    var configSuccess = await getConfigurationInfo();
    if (!configSuccess) return;

    renderContents();

    page.notice.setNotice('');
    settings.currentSlideNumber = -1;
    
    moveToSlideNumber(settings.initialSlideNumber);    
  }
  
  async function getConfigurationInfo() {
    settings.presentationId = page.body.getElementsByClassName('presentationId')[0].innerHTML;
    settings.initialSlideNumber = page.body.getElementsByClassName('initialSlideNumber')[0].innerHTML; 
    
    var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'slideindexinfo', {presentationid: settings.presentationId}, page.notice);

    if (requestResult.success) {
      settings.presentationInfo = requestResult.data;
    } 
    
    return requestResult.success;
  }
  
  	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function renderContents() {
    page.presentationContainer = page.contents.getElementsByClassName('presentation-container')[0];
    
    renderSlides();
    renderNavigation();
    
    renderTableOfContents();
    renderIndex(); 
    
    renderTabs();
    
    initializeMessage();
    
    UtilityKTS.setClass(page.presentationContainer, settings.hideClass, false);
  }
  
  function renderSlides() {
    page.slideContainer = page.contents.getElementsByClassName('slide-container')[0];
    
    settings.slideSource = 'https://docs.google.com/presentation/d/' + settings.presentationId + '/embed?rm=minimal';
    var numSlides = settings.presentationInfo.numSlides;
    page.slide = [];

    for (var i = 0; i < numSlides; i++) {
      var sourceURL = settings.slideSource + '#' + (i + 1);
      
      var singleSlideContainer = CreateElement.createDiv(null, 'single-slide-container hide-me ratio ratio-16x9');
      var singleSlide = CreateElement._createElement('iframe', null);
      singleSlideContainer.appendChild(singleSlide);
      singleSlide.src = sourceURL;
      singleSlide.allowfullscreen = true;
      
      page.slide.push(singleSlideContainer);
      page.slideContainer.appendChild(page.slide[i]);
    }
            
    UtilityKTS.setClass(page.slideContainer, settings.hideClass, false);
  }
  
  function renderNavigation() {
    page.navigationContainer = page.contents.getElementsByClassName('navigation-container')[0];
    
    page.tocControl = page.navigationContainer.getElementsByClassName('toc')[0];
    page.indexControl = page.navigationContainer.getElementsByClassName('index')[0];
    page.directLinkControl = page.navigationContainer.getElementsByClassName('link')[0];
    
    UtilityKTS.setClass(page.tocControl, settings.hideClass, settings.presentationInfo.tocInfo.length == 0);
    UtilityKTS.setClass(page.indexControl, settings.hideClass, settings.presentationInfo.indexInfo.asArray.length == 0);
    
    page.tocControl.addEventListener('click', (e) => { handleTableOfContents(e, 'toggle'); });
    page.indexControl.addEventListener('click', (e) => { handleIndex(e, 'toggle'); });
    page.directLinkControl.addEventListener('click', (e) => { handleDirectLink(e); });
    page.navigationContainer.getElementsByClassName('open')[0].addEventListener('click', (e) => { handleOpenInNewTab(e); });
    
    page.nextSlide = page.navigationContainer.getElementsByClassName('next')[0];
    page.previousSlide = page.navigationContainer.getElementsByClassName('previous')[0];
    page.nextSlide.addEventListener('click', (e) => handleNextSlide(e));
    page.previousSlide.addEventListener('click', (e) => handlePreviousSlide(e));
    
    UtilityKTS.setClass(page.navigationContainer, settings.hideClass, false);
  }
  
  function renderTableOfContents() {
    var tocInfo = settings.presentationInfo.tocInfo;

    page.toc = page.presentationContainer.getElementsByClassName('toc-container')[0];
    UtilityKTS.removeChildren(page.toc);
    
    page.toc.appendChild(CreateElement.createDiv(null, 'toc-title', 'Table of Contents'));
    
    for (var i = 0; i < tocInfo.length; i++) {
      var item = tocInfo[i];
      var mainEntry = CreateElement.createDiv(null, 'toc-item toc-level0', item.slideTitle);
      page.toc.appendChild(mainEntry);
      mainEntry.setAttribute("slide-number", item.slideNumber);
      mainEntry.addEventListener('click', (e) => { handleTocOrIndexSelection(e); });
      
      for (var j = 0; j < item.children.length; j++) {
        var subItem = item.children[j];
        var subEntry = CreateElement.createDiv(null, 'toc-item toc-level1', subItem.slideTitle);
        page.toc.appendChild(subEntry);
        subEntry.setAttribute("slide-number", subItem.slideNumber);
        subEntry.addEventListener('click', (e) => { handleTocOrIndexSelection(e); });
      }
    }
  }
  
  function renderIndex() {
    var indexInfo = settings.presentationInfo.indexInfo.asList;
    
    page.index = page.presentationContainer.getElementsByClassName('index-container')[0];
    UtilityKTS.removeChildren(page.index);

    page.index.appendChild(CreateElement.createDiv(null, 'index-title', 'Index'));
    
    for (var key in indexInfo) {
      var item = indexInfo[key];
      var elem = CreateElement.createDiv(null, 'index-item');

      page.index.appendChild(elem);
      elem.appendChild(CreateElement.createDiv(null, 'index-key', key));

      var links = CreateElement.createDiv(null, 'index-links');
      elem.appendChild(links);
      for (var i = 0; i < item.length; i++) {
        var singleLink = CreateElement.createSpan(null, 'index-singlelink', item[i]);
        links.appendChild(singleLink);
        singleLink.setAttribute("slide-number", item[i]);
        singleLink.addEventListener('click', (e) => { handleTocOrIndexSelection(e); });
      }
    }
  }
  
  function renderTabs() {
    page.tabContainer = page.contents.getElementsByClassName('tab-container')[0];
    var numTabColors = 7;

    var row = CreateElement.createDiv(null, 'tab-row row');
    var col = CreateElement.createDiv(null, 'tab-col col-8');
    var elem = CreateElement.createDiv(null, 'tab-item py-1', 'home');
    elem.classList.add('color0');
    elem.setAttribute('slide-number', 0);
    elem.setAttribute('tab-index', 0);
    elem.addEventListener('click', (e) => { handleTabClick(e); });
    
    page.tabContainer.appendChild(row);
    row.appendChild(col);
    col.appendChild(elem);
    
    var tabArray = settings.presentationInfo.tabInfo;
    for (var i = 0; i < tabArray.length; i++) {
      var tabItem = tabArray[i];
      var row = CreateElement.createDiv(null, 'tab-row row');
      var col = CreateElement.createDiv(null, 'tab-col col-8');
      var elem = CreateElement.createDiv(null, 'tab-item py-1', tabItem.tabtext);
      elem.classList.add('color' + ((i + 1) % numTabColors));
      elem.setAttribute('slide-number', tabItem.slidenumber);
      elem.setAttribute('tab-index', (i + 1));
      elem.addEventListener('click', (e) => { handleTabClick(e); });
      
      page.tabContainer.appendChild(row);
      row.appendChild(col);
      col.appendChild(elem);
    }
    
    UtilityKTS.setClass(page.tabContainer, settings.hideClass, false);
  }
  
  function initializeMessage() {
    page.message = page.contents.getElementsByClassName('message')[0];
  }
  
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  function moveToSlideNumber(slideNumber) {
    if (settings.currentSlideNumber >= 0) {
      UtilityKTS.setClass(page.slide[settings.currentSlideNumber], settings.hideClass, true);
    }
    
    showTableOfContents('close');
    showIndex('close');
    message('');
    
    settings.currentSlideNumber = slideNumber;
    UtilityKTS.setClass(page.slide[settings.currentSlideNumber], settings.hideClass, false);
    setTabForSlide(slideNumber);
    
    UtilityKTS.setClass(page.nextSlide, settings.invisibleClass, slideNumber >= settings.presentationInfo.numSlides - 1);
    UtilityKTS.setClass(page.previousSlide, settings.invisibleClass, slideNumber == 0);
  }
  
  function setTabForSlide(slideNumber) {
    var tabElements = page.tabContainer.getElementsByClassName('tab-item');
    var tabList = [];
    
    for (var i = 0; i < tabElements.length; i++) {
      tabList.push({ 
        "firstSlide": tabElements[i].getAttribute('slide-number') * 1,
        "tabElement": tabElements[i]
      });
    }
    tabList.sort(function(a, b) {
      return a.firstSlide - b.firstSlide;
    });
    
    var tabForSlide = null
    for (var i = 0; i < tabList.length; i++) {
      if (slideNumber >= tabList[i].firstSlide) tabForSlide = tabList[i].tabElement;
    }

    for (var i = 0; i < tabElements.length; i++) {
      UtilityKTS.setClass(tabElements[i], 'selected', false);
    }
    
    if (tabForSlide) UtilityKTS.setClass(tabForSlide, 'selected', true);
  }
  
  function makeSlideURL(slideNumber) {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    if (hostname == 'localhost') hostname = 'localhost:8000';
    var path = 'slide-indexer';
    //var queryParams = window.location.search;
    
    return protocol + '//' + hostname + '/' + path + '/' + settings.presentationId + '/' + slideNumber; // + queryParams;
  }
  
  function showTableOfContents(state) {
    UtilityKTS.setClass(page.index, settings.hideClass, true);
    
    if (state == 'close') {
      UtilityKTS.setClass(page.toc, settings.hideClass, true);
      
    } else {
      var isOpen = !page.toc.classList.contains(settings.hideClass);
      setDropdownHeights();
      UtilityKTS.setClass(page.toc, settings.hideClass, isOpen);
      if (!isOpen) message('');
    }
  }
  
  function showIndex(state) {
    UtilityKTS.setClass(page.toc, settings.hideClass, true);
    
    if (state == 'close') {
      UtilityKTS.setClass(page.index, settings.hideClass, true);
      
    } else {
      var isOpen = !page.index.classList.contains(settings.hideClass);
      setDropdownHeights();
      UtilityKTS.setClass(page.index, settings.hideClass, isOpen);
      if (!isOpen) message('');
    }
  }
  
  function setDropdownHeights() {
    var maxHeight = page.slideContainer.offsetHeight * settings.dropdownHeightRatio;
    page.toc.style.maxHeight = maxHeight + 'px';
    page.index.style.maxHeight = maxHeight + 'px';
  }
  
  function createAndCopyDirectLink() {
    var url = makeSlideURL(settings.currentSlideNumber);
    _copyToClipboard(url);
    message('link copied');
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function handleTabClick(e) {
    moveToSlideNumber(e.target.getAttribute('slide-number'));
  }
  
  function handleTableOfContents(e, state) {
    showTableOfContents(state);
  }
  
  function handleIndex(e, state) {
    showIndex(state);
  }
  
  function handleDirectLink(e) {
    createAndCopyDirectLink();
  }
  
  function handleOpenInNewTab(e) {
    window.open(makeSlideURL(settings.currentSlideNumber), '_blank');
  }
  
  function handleNextSlide(e) {
    var newSlideNumber = settings.currentSlideNumber * 1 + 1;
    if (newSlideNumber < settings.presentationInfo.numSlides) moveToSlideNumber(newSlideNumber);
  }
  
  function handlePreviousSlide(e) {
    var newSlideNumber = settings.currentSlideNumber * 1 - 1;
    if (newSlideNumber >= 0) moveToSlideNumber(newSlideNumber);
  }
  
  function handleTocOrIndexSelection(e) {
     moveToSlideNumber(e.target.getAttribute("slide-number"));
  }
  
  function handleResize(e) {
    setDropdownHeights();
  }
 
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	
    

  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  
  function message(txt) {
    page.message.innerHTML = txt;
    UtilityKTS.setClass(page.message, settings.hideClass, txt.length == 0);
  }
  
	//--------------------------------------------------------------------------
	// init:
	//--------------------------------------------------------------------------
	return {
		init: init
 	};
}();