"use strict";
//-----------------------------------------------------------------------------------
// tool index page
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

const app = function () {
  const appversion = '0.01';
  const appname = 'Support tool index';
	const page = {};
  const settings = {};
  
  const TOOLINDEX_SPREADSHEETID = '1-M4mw9TFt7J7ytZdn_-mDP95HjSAH84oupOVBG-XNZM';
  
  const apiInfo = {
    apibase: 'https://script.google.com/macros/s/AKfycbxAHeZ1fkN8Ei82SWPytXwLqDa2FqwJCgDyIVSbbRNmimujxYcu/exec',
    apikey: 'KTS_toolindex'
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
  async function init() {
		page.body = document.getElementsByTagName('body')[0];

    _renderStandardElements();
		
    settings.indexdata = await _loadInitialData();
    if (settings.indexdata) {
      page.body.appendChild(_renderPage());
    }
  }
  
  async function _loadInitialData() {
    var result = null;
    
    page.notice.setNotice('loading...', true);
    var requestParams = {sourcefileid: TOOLINDEX_SPREADSHEETID};
    var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'indexinfo', requestParams, page.notice);

    if (requestResult.success) {
      page.notice.setNotice('');
      var result = requestResult.data;
      
    } else {
      page.notice.setNotice('load failed');
    }
    
    return result;
  }
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderStandardElements() {
    var title = CreateElement.createDiv(null, 'titlecontainer', null);
    page.body.appendChild(title);
    title.appendChild(CreateElement.createDiv(null, 'titletext', appname));
    
    page.notice = new StandardNotice(page.body, title);
  }

  function _renderPage() {
    var container = CreateElement.createDiv(null, 'contents');

    var currentCategory;
    var categoryContainer;

    for (var i = 0; i < settings.indexdata.length; i++) {
      var item = settings.indexdata[i];

      if (i == 0 || (item.category != currentCategory && item.category != '')) {
        currentCategory = item.category;
        categoryContainer = _renderCategory(currentCategory);
        container.appendChild(categoryContainer);
      }
      
      categoryContainer.appendChild(_renderIndexItem(item));
    }
    /*
    
    for (var i = 0; i < settings.indexdata.length; i++) {
      var item = settings.indexdata[i];

      var newSection = false;
      if (i == 0 || item.category != currentCategory) {
        newSection = true;
        currentCategory = item.category;
        var categoryContainer = CreateElement.createDiv(null, 'category');
        container.appendChild(categoryContainer);
      }
      
      if (item.category != '') {
        container.appendChild(_renderIndexItem(settings.indexdata[i], newSection));
      }
    }
    */
    
    return container;
  }
  
  function _renderCategory(categoryName) {
    var container = CreateElement.createDiv(null, 'category');
    container.appendChild(CreateElement.createDiv(null, 'category-label', categoryName));
    
    return container;
  }
  
  function _renderIndexItem(item) {
    var container = CreateElement.createDiv(null, 'item');
    
    var toolLink = CreateElement.createLink(null, 'item-contents', item.label, null, item.url);
    container.appendChild(toolLink);
    toolLink.target = '_blank';
    
    return container;
  }

	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------    
  
	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
