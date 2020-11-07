//-------------------------------------------------------------------
// Slide indexer config
// configure and generate embed code for Slide indexer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appversion = '1.01';
  const appname = 'Slide indexer configuration';
  
  const page = {};
  const settings = {};
  
  // presentation id for testing: 14X6SpTLlIZ_273f14e-thhYefJXGDvw4gP3VODnvA3w
  // link for testing: https://docs.google.com/presentation/d/14X6SpTLlIZ_273f14e-thhYefJXGDvw4gP3VODnvA3w/edit?usp=sharing
  
	//----------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    page.body = document.getElementsByTagName('body')[0];
    
    var expectedQueryParams = [];
    
    _renderPage();
  } 
  
  //-----------------------------------------
  // page rendering
  //-----------------------------------------  
  function _renderPage() {
    var elem = page.body.getElementsByClassName('config-help-control')[0];
    elem.addEventListener('click', (e) => {_handleHelp()});
    
    elem = page.body.getElementsByClassName('id-input')[0];
    elem.addEventListener('input', (e) => {_handleIdInput()});
    
    elem = page.body.getElementsByClassName('config-link-control')[0];
    elem.addEventListener('click', (e) => {_handleLink();});    

    elem = page.body.getElementsByClassName('config-embed-control')[0];
    elem.addEventListener('click', (e) => {_handleEmbed();});    
  }
  
  //----------------------------------------
	// refresh / update
	//----------------------------------------
  function _updatePreview() {
    var previewContainer = page.body.getElementsByClassName('config-preview')[0];
    var url = _makeURL({type: 'indexer'});
   
    if (url) {
      previewContainer.innerHTML = _makeURL({type: 'indexer'});
    } else {
      previewContainer.innerHTML = 'invalid slide link';
    }

    _showElement(previewContainer);
  }
  
  function _makeURL(params) {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    if (hostname == 'localhost') hostname = 'localhost:8000';
    var path = 'slide-indexer';
    var queryParams = window.location.search;

    var url = null;
    if (params.type == 'help') {
      url = protocol + '//' + hostname + '/' + path + '/' + 'help';
      
    } else if (params.type == 'indexer') {
      var id = _getPresentationId();
      if (id) {
        url = protocol + '//' + hostname + '/' + path + '/' + _getPresentationId();
      }
    }
    
    return url;
  }
  
  function _getPresentationId() {
    var elem = page.body.getElementsByClassName('id-input')[0];
    return _getIdFromUrl(elem.value);
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  function _handleHelp() {
    window.open(_makeURL({type: 'help'}), '_blank');
  }
  
  function _handleIdInput() {
    _updatePreview();
  }
  
  function _handleLink() {
    console.log('handle link');
  }
    
  function _handleEmbed() {
    console.log('handle embed');
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
  
  function _getIdFromUrl(url) { 
    var id = url.match(/[-\w]{25,}/);
    if (id) id = id[0];
    return id;
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
