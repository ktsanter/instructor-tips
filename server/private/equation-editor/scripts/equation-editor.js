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
    blankImageSrc: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    downloadFileName: 'as-equation-image.png'
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.message = page.body.getElementsByClassName('message')[0];

    message('loading...');
    
    await renderContents();
    settings.mathMLFinder = new FindMathML();
        
    message();
  }
  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  async function renderContents() {    
    page.intermediateMathML = page.body.getElementsByClassName('area-mathml')[0];
    page.intermediateEncoded = page.body.getElementsByClassName('area-encoded')[0];
    
    page.resultContainer = page.body.getElementsByClassName('result-container')[0];
    page.resultImage = page.resultContainer.getElementsByClassName('result-image')[0];
    page.resultImage.src = settings.blankImageSrc;

    page.resultButtonsContainer = page.body.getElementsByClassName('result-buttons-container')[0];
    
    page.copyURL = page.body.getElementsByClassName('copy-url')[0];
    page.copyURL.addEventListener('click', () => { handleCopyURL(); });

    page.copyMathML = page.body.getElementsByClassName('copy-mathml')[0];
    page.copyMathML.addEventListener('click', () => { handleCopyMathML(); });    
    
    page.downloadLink = page.body.getElementsByClassName('download-link')[0];    
    
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

    setTimeout(function() {
      console.log('ready');
      var formulaDisplay = page.body.getElementsByClassName('wrs_formulaDisplay')[0];
      formulaDisplay.addEventListener('paste', (e) => { handlePaste(e); });
    }, 400);
  }
  
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  function fullConversion() {
    if (!prepForConversion(false)) return;
    
    doConversion();
    cleanupAfterConversion();
  }
  
  function loadMathML(mathML) {
    if (mathML == null) return;

    var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
    var acceptButton = composerDialog.getElementsByClassName('wrs_modal_button_accept')[0];

    prepForConversion(true);
    
    settings.tiny.composer.setContent(mathML);
    var ed = settings.tiny.composer.getObj();
    ed.selection.select(ed.getBody(), true);
    
    setTimeout(function() {
      settings.tiny.composer.triggerButton('math-formula');
      UtilityKTS.setClass(page.body, 'busy', false);
      UtilityKTS.setClass(acceptButton, 'busy', false);
      acceptButton.disabled = false;
    }, 200);
  }

  function prepForConversion(ignoreEmpty) {
    UtilityKTS.setClass(page.resultContainer, settings.hideClass, true);
    UtilityKTS.setClass(page.resultButtonsContainer, settings.hideClass, true);

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
    var imageURL = getBaseRenderURL() + encoded;
    page.intermediateEncoded.value = imageURL;
    
    page.resultImage.src = imageURL;
    page.downloadLink.href = imageURL;
    page.downloadLink.download = settings.downloadFileName;
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
  
      UtilityKTS.setClass(page.resultContainer, settings.hideClass, false);
      UtilityKTS.setClass(page.resultButtonsContainer, settings.hideClass, false);
    }, 200);
  }
  
  function firePasteEvent(sourceElement, mathML, postTriggerUndo) {
    console.log('***dispatching', mathML, postTriggerUndo);
    var dt = new DataTransfer();
    dt.setData('text/plain', mathML);
    dt.setData('text/html', mathML);

    var ev = new Event('paste', {bubbles: true});
    ev.clipboardData = dt;
    ev.asOneShot = true;
    ev.asPostTriggerUndo = postTriggerUndo;
    
    sourceElement.dispatchEvent(ev);    
  }

  function triggerUndo() {
    console.log('triggerUndo');
    var composerDialog = page.body.getElementsByClassName('wrs_modal_desktop')[0];
    var buttons = composerDialog.getElementsByTagName('button');
    var undoButton = null;

    var titles = [];
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].title == 'Undo') undoButton = buttons[i];
    }
    
    undoButton.click();
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  async function handlePaste(e) {
    console.log(e);
    e.preventDefault();
    e.stopPropagation();
    
    if (e.hasOwnProperty('asOneShot')) {
      console.log('***one shot - cancelling');
      if (e.asPostTriggerUndo) setTimeout(() => { triggerUndo(); }, 2000);
      return false;
    }

    var includesMathML = settings.mathMLFinder.includesMathML(e.clipboardData);
    if (includesMathML) {
      console.log('*** no dispatch');
      return true;
    }

    var mathML = await settings.mathMLFinder.find(e.clipboardData);
    if (mathML == null) {
      console.log('*** no MathML - bailing');
      return false;
    }
    
    firePasteEvent(e.target, mathML, e.clipboardData.types.includes('Files'));
    
    return false;
  }
  
  function handleEditorChange(e) {
    fullConversion();
  } 
  
  function handleCopyURL() {
    copyToClipboard(page.resultImage.src);
  }
  
  function handleCopyMathML() {
    copyToClipboard(page.intermediateMathML.value);
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
  
  function copyToClipboard(txt) {
    if (!settings.clipboard) settings.clipboard = new ClipboardCopy(page.body, 'plain');

    settings.clipboard.copyToClipboard(txt);
	}	    
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();