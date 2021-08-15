//-------------------------------------------------------------------
// Slide indexer config
// configure and generate links and embed code for Slide indexer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
  const appversion = '1.20';
  const appname = 'Slide indexer configuration';
  
  const apiInfo = {
    apibase: 'https://script.google.com/macros/s/AKfycbzG66LIoo5DOs040Wqh9mD0RR4YqJfxVmGLFXyNRui2MVv0MqM/exec',
    apikey: 'MVslideindexing'
  };  
  
  const page = {};
  const settings = {};
  
	//----------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    page.body = document.getElementsByTagName('body')[0];
    
    page.message = page.body.getElementsByClassName('title-message')[0];
    
    page.preview = page.body.getElementsByClassName('config-preview')[0];
    page.previewError = page.body.getElementsByClassName('preview-error')[0];
    page.previewContainer = page.body.getElementsByClassName('preview-container')[0];
    page.previewIframe = page.body.getElementsByClassName('preview-iframe')[0];
    
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
    
    elem = page.body.getElementsByClassName('tabcolor-input')[0];    
    elem.addEventListener('change', (e) => {_handleColorChange(e, 'tabcolor');});

    elem = page.body.getElementsByClassName('tabbackground-input')[0];    
    elem.addEventListener('change', (e) => {_handleColorChange(e, 'tabbackground');});

    elem = page.body.getElementsByClassName('tabcolor-text')[0];    
    elem.addEventListener('click', (e) => {_handleColorDefault(e, 'tabcolor');});

    elem = page.body.getElementsByClassName('tabbackground-text')[0];    
    elem.addEventListener('click', (e) => {_handleColorDefault(e, 'tabbackground');});

    elem = page.body.getElementsByClassName('config-link-control')[0];
    elem.addEventListener('click', (e) => {_handleLink();});    

    elem = page.body.getElementsByClassName('config-embed-control')[0];
    elem.addEventListener('click', (e) => {_handleEmbed();});  

  }
  
  //----------------------------------------
	// refresh / update
	//----------------------------------------
  function _updatePreview() {
    _showMessage('');
    var url = _makeURL({type: 'indexer'});
   
    if (url) {
      page.previewIframe.src = _makeURL({type: 'indexer'});
      _hideElement(page.previewError);
      _showElement(page.previewContainer);
      _showElement(page.previewIframe);
      
    } else {
      _showElement(page.previewError);
      _hideElement(page.previewContainer);
      _hideElement(page.previewIframe);
    }

    _showElement(page.preview);
  }
  
  function _makeURL(params) {
    var protocol = window.location.protocol;
    var hostname = window.location.hostname;
    if (hostname == 'localhost') hostname = 'localhost:8000';
    var path = 'slide-indexer';
    
    var tabColor = page.body.getElementsByClassName('tabcolor-input')[0].value.slice(-6);
    var tabBackground = page.body.getElementsByClassName('tabbackground-input')[0].value.slice(-6);
    console.log(tabColor, tabBackground);
    
    var queryParams = '?tabcolor=' + tabColor + '&tabbackground=' + tabBackground;

    var url = null;
    if (params.type == 'help') {
      url = protocol + '//' + hostname + '/' + path + '/' + 'help';
      
    } else if (params.type == 'indexer') {
      var id = _getPresentationId();      
      if (id) {
        url = protocol + '//' + hostname + '/' + path + '/' + id + queryParams;
        console.log(url);
      }
    }
    
    return url;
  }
  
  function _getPresentationId() {
    var elem = page.body.getElementsByClassName('id-input')[0];
    return _getIdFromUrl(elem.value);
  }
  
  function _isChecked(elemClass) {
    var elem = page.body.getElementsByClassName(elemClass)[0];
    return elem.checked;
  }
  
  function _makeAndCopyLink() {
    if (!_getPresentationId()) return;
    var linkCode = _makeURL({type: 'indexer'});
    
   _copyToClipboard(linkCode);
   _showMessage('link copied to clipboard');
  }
  
  async function _makeAndCopyEmbed() {
    var heightPadding = 150;
    if (!_getPresentationId()) return;
    var url = _makeURL({type: 'indexer'});
    
    var result = await _getSlideInfo();
    if (!result) return;
    
    var height = (result.pageHeight + heightPadding).toString();
    console.log(result.pageHeight + ' ' + height);
    
    var elem = CreateElement.createIframe(null, null, url, "100%", height, true);
    var embedCode = elem.outerHTML;
    console.log(embedCode);
    
   _copyToClipboard(embedCode);
   _showMessage('embed code copied to clipboard');
  }
  
  function _showMessage(msg) {
    page.message.innerHTML = msg;
  }
  
  async function _getSlideInfo() {
    var result = null;
    var id = _getPresentationId();
    if (id) {
      _showMessage('retrieving slide deck info...');
      var requestResult = await googleSheetWebAPI.webAppGet(apiInfo, 'slideindexinfo', {presentationid: id}, null);
      if (!requestResult.success) {
        _showMessage('slide deck info retrieval failed');
        
      } else {
        _showMessage('');
        if (requestResult.success) {
          result = requestResult.data;
        }
      }
      
      return result;
    }
  }
  
  //----------------------------------------
	// handlers
	//----------------------------------------
  function _handleHelp() {
    _showMessage('');
    window.open(_makeURL({type: 'help'}), '_blank');
  }
  
  function _handleIdInput() {
    _updatePreview();
  }
  
  function _handleColorChange(e, type) {
    if (!_getPresentationId()) return;
    _updatePreview();
  }
  
  function _handleColorDefault(e, type) {
    if (type == 'tabcolor') {
      var defaultColor = page.body.getElementsByClassName('default-tabcolor')[0].innerHTML;
      page.body.getElementsByClassName('tabcolor-input')[0].value = defaultColor;
      
    } else if (type == 'tabbackground') {
      var defaultColor = page.body.getElementsByClassName('default-tabbackround')[0].innerHTML;
      page.body.getElementsByClassName('tabbackground-input')[0].value = defaultColor;
    }
    
    if (!_getPresentationId()) return;
    _updatePreview();
  }
  
  function _handleLink() {
    _makeAndCopyLink();
  }
    
  function _handleEmbed() {
    _makeAndCopyEmbed();
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
