//-----------------------------------------------------------------------
// Equation test bed
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    
    conversionBaseURL: 'https://www.wiris.net/demo/editor/render',
    imageFormat: 'PNG',
    blankImageSrc: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorResult = page.body.getElementsByClassName('error-result')[0];
    
    page.result = page.body.getElementsByClassName('result')[0];
    page.resultImage = page.result.getElementsByClassName('result-image')[0];
    
    page.pasteURL = page.body.getElementsByClassName('paste-url')[0];
    page.pasteURL.addEventListener('input', (e) => { _handlePasteURL(e); });
    
    await _renderContents();
  }
 
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  async function _renderContents() {
    var elems = document.getElementsByName('imageType');
    for (var i = 0; i < elems.length; i++) {
      elems[i].addEventListener('click', (e) => { _handleImageTypeChange(); });
    }
    
    settings.tiny = {};
    settings.tiny.composer = new MyTinyMCE({
      id: 'contenteditor-composer', 
      selector: '#contenteditor-composer', 
      changeCallback: _handleEditorChange,
      height: 200,
      initializationParams: {wiris: true}
    });
    
    UtilityKTS.setClass(document.getElementById(settings.tiny.composer._id), settings.hideClass, true);

    await settings.tiny.composer.init();
    _triggerComposer(page.body.getElementsByClassName('contenteditor-composer-container')[0]);
  }

  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------

  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _triggerComposer(appendToContainer) {
    settings.tiny.composer.show(false);
    settings.tiny.composer.triggerButton('math-formula');
    
    var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
    UtilityKTS.setClass(composerDialog, 'wrs_modal_dialogContainer', false);
    appendToContainer.appendChild(composerDialog);
    
    var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];
    acceptButton.innerHTML = 'convert';

    var cancelButton = composerDialog.getElementsByClassName('wrs_modal_button_cancel')[0];
    UtilityKTS.setClass(cancelButton, settings.hideClass, true);
  }
  
  function _handlePasteURL() {
    var url = page.pasteURL.value;
    settings.tiny.composer.setContent(url);
    var ed = settings.tiny.composer.getObj();
    ed.selection.select(ed.getBody(), true);
    
    setTimeout(function() {
      var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
      var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];

      settings.tiny.composer.triggerButton('math-formula');
      UtilityKTS.setClass(page.body, 'busy', false);
      UtilityKTS.setClass(acceptButton, 'busy', false);
      acceptButton.disabled = false;
    }, 200);
  }
  
  function _handleEditorChange(e) {
    if (!_prepForConversion()) return;
    
    _doConversion();
    _cleanupAfterConversion();
  } 
  
  function _prepForConversion() {
    page.resultImage.src = settings.blankImageSrc;
    document.getElementById('areaMathML').value = '';
    document.getElementById('areaEncoded').value = '';
    
    var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
    var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];
    acceptButton.disabled = true;

    var mathML = settings.tiny.composer.getContent();
    if (mathML.trim().length == 0) {
      settings.tiny.composer.setContent('');
      acceptButton.disabled = false;
      return false;
    }
    
    UtilityKTS.setClass(page.body, 'busy', true);
    UtilityKTS.setClass(acceptButton, 'busy', true);
    
    return true;
  }
  
  function _doConversion(mathML) {
    var mathML = settings.tiny.composer.getContent();
    
    document.getElementById('areaMathML').value = mathML;
    
    var encoded = encodeURIComponent(mathML);
    var imageURL = 'http://localhost:8000/asequations/render/' + encoded;
    document.getElementById('areaEncoded').value = imageURL;
    
    page.resultImage.src = imageURL;    
  }
  
  function _cleanupAfterConversion() {
    var ed = settings.tiny.composer.getObj();
    ed.selection.select(ed.getBody(), true);
    
    setTimeout(function() {
      var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
      var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];

      settings.tiny.composer.triggerButton('math-formula');
      UtilityKTS.setClass(page.body, 'busy', false);
      UtilityKTS.setClass(acceptButton, 'busy', false);
      acceptButton.disabled = false;
    }, 200);
  }

  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  

	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();