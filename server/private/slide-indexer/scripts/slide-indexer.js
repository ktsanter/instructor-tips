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
    hideClass: 'hide-me'
  };

	const page = {};
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
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
    console.log('renderContents');
    page.presentationContainer = page.contents.getElementsByClassName('presentation-container')[0];
    
    renderSlides();
    renderNavigation();
    renderTabs();
    
    UtilityKTS.setClass(page.presentationContainer, settings.hideClass, false);
  }
  
  function renderSlides() {
    console.log('renderSlides');
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
    console.log('renderNavigation');
    page.navigationContainer = page.contents.getElementsByClassName('navigation-container')[0];
    
    renderTableOfContents();
    renderIndex();
    
    UtilityKTS.setClass(page.navigationContainer, settings.hideClass, false);
  }
  
  function renderTableOfContents() {
    console.log('renderTableOfContents');
    page.toc = page.navigationContainer.getElementsByClassName('toc-container')[0];
  }
  
  function renderIndex() {
    console.log('renderIndex');
    page.index = page.navigationContainer.getElementsByClassName('index-container')[0];
  }
  
  function renderTabs() {
    console.log('renderTabs');
    page.tabContainer = page.contents.getElementsByClassName('tab-container')[0];
    
    var tabArray = settings.presentationInfo.tabInfo;
    console.log('tabArray', tabArray);
    for (var i = 0; i < tabArray.length; i++) {
      var tabItem = tabArray[i];
      var row = CreateElement.createDiv(null, 'tab-row row');
      var col = CreateElement.createDiv(null, 'tab-col col-8');
      var elem = CreateElement.createDiv(null, 'tab-item', tabItem.tabtext);
      elem.setAttribute('slide-number', tabItem.slidenumber);
      elem.addEventListener('click', (e) => { handleTabClick(e); });
      
      page.tabContainer.appendChild(row);
      row.appendChild(col);
      col.appendChild(elem);
    }
    
    UtilityKTS.setClass(page.tabContainer, settings.hideClass, false);
  }
  
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  function moveToSlideNumber(slideNumber) {
    console.log('moveToSlideNumber', slideNumber);
    if (settings.currentSlideNumber >= 0) UtilityKTS.setClass(page.slide[settings.currentSlideNumber], settings.hideClass, true);
    
    settings.currentSlideNumber = slideNumber;
    UtilityKTS.setClass(page.slide[settings.currentSlideNumber], settings.hideClass, false);
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function handleTabClick(e) {
    var slideNumber = e.target.getAttribute('slide-number');
    
    var tabElements = page.tabContainer.getElementsByClassName('tab-item');
    for (var i = 0; i < tabElements.length; i++) {
      UtilityKTS.setClass(tabElements[i], 'selected', false);
    }
    UtilityKTS.setClass(e.target, 'selected', true);
    
    moveToSlideNumber(slideNumber);
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
  
	//--------------------------------------------------------------------------
	// init:
	//--------------------------------------------------------------------------
	return {
		init: init
 	};
}();