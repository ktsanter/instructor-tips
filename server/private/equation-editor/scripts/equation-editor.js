//-----------------------------------------------------------------------
// Equation editor
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    
    baseRenderURL: '/equations/render/',
    
    blankImageSrc: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.message = page.body.getElementsByClassName('message')[0];

    message('loading...');

    await renderContents();
    
    message();
  }
 
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  async function renderContents() {
    page.pasteURL = page.body.getElementsByClassName('input-imageurl')[0];
    page.pasteURL.disabled = true;
    page.pasteURL.addEventListener('input', (e) => { handlePasteURL(e); });
    
    page.intermediateMathML = page.body.getElementsByClassName('area-mathml')[0];
    page.intermediateEncoded = page.body.getElementsByClassName('area-encoded')[0];
    
    page.resultContainer = page.body.getElementsByClassName('result-container')[0];
    page.resultImage = page.resultContainer.getElementsByClassName('result-image')[0];
    page.resultImage.src = settings.blankImageSrc;
    
    settings.tiny = {};
    settings.tiny.composer = new MyTinyMCE({
      id: 'contenteditor-composer', 
      selector: '#contenteditor-composer', 
      changeCallback: handleEditorChange,
      height: 200,
      initializationParams: {wiris: true}
    });
    
    UtilityKTS.setClass(document.getElementById(settings.tiny.composer._id), settings.hideClass, true);

    await settings.tiny.composer.init();
    triggerComposer(page.body.getElementsByClassName('contenteditor-composer-container')[0]);
    
    page.pasteURL.disabled = false;
  }

  function triggerComposer(appendToContainer) {
    settings.tiny.composer.show(false);
    settings.tiny.composer.triggerButton('math-formula');
    
    var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
    UtilityKTS.setClass(composerDialog, 'wrs_modal_dialogContainer', false);
    appendToContainer.appendChild(composerDialog);
    
    var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];
    acceptButton.innerHTML = 'convert';
    acceptButton.style.fontSize = '90%';

    var cancelButton = composerDialog.getElementsByClassName('wrs_modal_button_cancel')[0];
    UtilityKTS.setClass(cancelButton, settings.hideClass, true);
  }
  
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  function fullConversion() {
    message();
    if (!prepForConversion(false)) return;
    
    doConversion();
    cleanupAfterConversion();
  }
  
  function parseAndShowURLContent() {
    var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
    var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];
    message();

    prepForConversion(true);

    var mathML = parseURL(page.pasteURL.value);
    if (mathML == null) {
      UtilityKTS.setClass(page.body, 'busy', false);
      UtilityKTS.setClass(acceptButton, 'busy', false);
      acceptButton.disabled = false;
      page.pasteURL.disabled = false;
      if (page.pasteURL.value.trim().length > 0) message('invalid image URL');
      return;
    }
    
    settings.tiny.composer.setContent(mathML);
    var ed = settings.tiny.composer.getObj();
    ed.selection.select(ed.getBody(), true);
    
    setTimeout(function() {
      settings.tiny.composer.triggerButton('math-formula');
      UtilityKTS.setClass(page.body, 'busy', false);
      UtilityKTS.setClass(acceptButton, 'busy', false);
      page.pasteURL.value = '';
      acceptButton.disabled = false;
      page.pasteURL.disabled = false;
    }, 200);
  }

  function prepForConversion(ignoreEmpty) {
    page.pasteURL.disabled = true;

    page.resultImage.src = settings.blankImageSrc;
    page.intermediateMathML.value = '';
    page.intermediateEncoded.value = '';
    
    var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
    var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];
    acceptButton.disabled = true;

    var mathML = settings.tiny.composer.getContent();
    if (mathML.trim().length == 0 && !ignoreEmpty) {
      settings.tiny.composer.setContent('');
      acceptButton.disabled = false;
      page.pasteURL.disabled = false;
      return false;
    }
    
    UtilityKTS.setClass(page.body, 'busy', true);
    UtilityKTS.setClass(acceptButton, 'busy', true);
    
    return true;
  }
  
  function doConversion(mathML) {
    var mathML = settings.tiny.composer.getContent();
    
    page.intermediateMathML.value = mathML;
    
    var encoded = encodeURIComponent(mathML);
    var imageURL = getBaseRenderURL() + encoded; //'http://localhost:8000/asequations/render/' + encoded;
    page.intermediateEncoded.value = imageURL;
    
    page.resultImage.src = imageURL;    
  }
  
  function cleanupAfterConversion() {
    var ed = settings.tiny.composer.getObj();
    ed.selection.select(ed.getBody(), true);
    
    setTimeout(function() {
      var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
      var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];

      settings.tiny.composer.triggerButton('math-formula');
      UtilityKTS.setClass(page.body, 'busy', false);
      UtilityKTS.setClass(acceptButton, 'busy', false);
      acceptButton.disabled = false;
      page.pasteURL.disabled = false;
    }, 200);
  }
  
  function parseURL(url) {
    if (url.trim().length == 0) return null;
    
    var searchFor = settings.baseRenderURL;
    var index = url.indexOf(searchFor);
    if (index < 0) return null;
    
    var encoded = url.slice(index + searchFor.length);
    return decodeURIComponent(encoded);
  }

  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function handlePasteURL() {
    parseAndShowURLContent();
  }
  
  function handleEditorChange(e) {
    fullConversion();
  } 

  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  
  function getBaseRenderURL() {
    return window.location.protocol + '//' + window.location.host + settings.baseRenderURL;
  }
  
  function message(msg) {
    if (msg != null) page.message.innerHTML = msg;
    UtilityKTS.setClass(page.message, settings.hideClass, msg == null || msg.trim().length == 0);
  }
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();