//-------------------------------------------------------------------
// accordion wrapper app
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const ACCORDION_WRAPPER_CODE_URL = 'https://drive.google.com/uc?id=1tTJ69DYuDyqVTIwkYuUFfHPC9hJoh66z';
  
  const page = {};

  //---------------------------------------
  // get things going
  //----------------------------------------
  function init () {
    page.body = document.getElementsByTagName('body')[0];
    page.embedIcon = page.body.getElementsByClassName('embed-icon')[0];
    page.embedMessage = page.body.getElementsByClassName('embed-complete')[0];
    page.itemDescription = page.body.getElementsByClassName('description')[0];
    page.itemContents = page.body.getElementsByClassName('contents')[0];
    page.preview = page.body.getElementsByClassName('preview-section')[0];
    
    _initControls(true);
  }

  //-----------------------------------------------------------------------------
  // page rendering
  //-----------------------------------------------------------------------------  
  function _initControls(attachHandlers) {
    if (attachHandlers) _attachHandlers();
  }
  
  function _attachHandlers() {
    page.embedIcon.addEventListener('click', (e)=>{_handleEmbedClick(e);});
    page.itemDescription.addEventListener('input', (e)=>{_handleInput(e);});
    page.itemContents.addEventListener('input', (e)=>{_handleInput(e);});
  }
  
  //---------------------------------------
	// update
	//----------------------------------------
  function _makeEmbedCode() {
    var embedCode = '';
    var iconClass = 'class="expander"';
    var iconStyle = 'style="cursor: pointer; text-decoration: none; color: inherit;"';
    var iconTitle = 'title="expand"';
    var iconSymbol = '&#9658;';
    
    var handler = 
      'function (e) {' +
      '  const TOGGLE_DOWN_SYMBOL = \'&#9658;\';' +
      '  const TOGGLE_RIGHT_SYMBOL = \'&#9660;\';' +
      '  var elemContent = e.getElementsByTagName(\'div\')[0];' +
      '  var elemToggleSymbol = e.getElementsByTagName(\'span\')[0];' +
      '  ' +
      '  if (elemContent.style.display == \'none\') {' +
      '    elemContent.style.display = \'block\';' +
      '    elemToggleSymbol.innerHTML = TOGGLE_RIGHT_SYMBOL;' +
      '    elemToggleSymbol.title = \'collapse\';' +
      '    window.dispatchEvent(new Event(\'resize\'));' +
      '' +
      '  } else {' +
      '    elemContent.style.display = \'none\';' +
      '    elemToggleSymbol.innerHTML = TOGGLE_DOWN_SYMBOL;' +
      '    elemToggleSymbol.title = \'expand\';' +
      '  }' +
      '}';
      
    var iconOnClick = 'onclick="(' + handler + ')(this.parentNode);"';
    
    embedCode += '<div>';
    embedCode += '<span ' + 
        iconClass + ' ' +
        iconStyle + ' ' + 
        iconTitle + ' ' + 
        iconOnClick + 
      '> ' + 
      iconSymbol + '</span>';
    embedCode += page.itemDescription.value;
    embedCode += '<div style="display:none;">';
    embedCode +=   MarkdownToHTML.convert(page.itemContents.value);
    embedCode += '</div>';
    embedCode += '</div>';
    
    return embedCode;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleEmbedClick(e) {
    var embedCode = _makeEmbedCode();
    embedCode = '<div>&nbsp;</div>' +
      embedCode +
      '<hr>' +
      '<div>&nbsp;</div>';
    _copyToClipboard(embedCode);
    
    UtilityKTS.setClass(page.embedMessage, 'hide-me', false);
  }
  
  function _handleInput(e) {
    page.preview.innerHTML = _makeEmbedCode();
    UtilityKTS.setClass(page.embedMessage, 'hide-me', true);
    page.preview.getElementsByClassName('expander')[0].click();
    console.log(page.preview.getElementsByClassName('expander')[0]);
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
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
