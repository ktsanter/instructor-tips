//-----------------------------------------------------------------------
// Slide deck sizer
//-----------------------------------------------------------------------
// TODO:
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const settings = {
    hideClass: 'hide-me'
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.contents = page.body.getElementsByClassName('contents')[0];    
    page.errorContainer = page.body.getElementsByClassName('error-container')[0];
    
    page.notice = new StandardNotice(page.errorContainer, page.errorContainer);
    page.notice.setNotice('loading...', true);
    
    renderContents();
    
    page.notice.setNotice('');
  }
  	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function renderContents() {
    page.embedControls = page.contents.getElementsByClassName('embed-controls')[0];
    page.embedControls.addEventListener('click', (e) => { handleEmbedCopy(e); });
    
    page.inputDeckLink = page.contents.getElementsByClassName('input-decklink')[0];
    page.inputPadding = page.contents.getElementsByClassName('input-padding')[0];
    page.inputNavigation = page.contents.getElementsByClassName('check-navigation')[0];
        
    page.inputDeckLink.addEventListener('input', (e) => { handlePreviewChange(e); });
    page.inputPadding.addEventListener('input', (e) => { handlePaddingChange(e); });
    page.inputNavigation.addEventListener('click', (e) => { handlePreviewChange(e); });
    
    page.preview = page.contents.getElementsByClassName('preview')[0];    
  }
    
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  async function showPreview() {
    var previewSettings = getSettings();
    
    UtilityKTS.removeChildren(page.preview);
    UtilityKTS.setClass(page.embedControls, settings.hideClass, true);

    var deckURL = previewSettings.decklink;
    if (deckURL == '') return;
    deckURL = deckURL.replace('pub?', 'embed?');
    if (!previewSettings.includenav) deckURL += '&rm=minimal';
    
    page.notice.setNotice('verifying link...', true);    
    var verification = await verifyLink(deckURL);
    if (!verification.success) {
      page.notice.setNotice('unable to load - ' + verification.details);
      return;
    }
    
    page.notice.setNotice('loading preview...', true);
    try {
      var innerContainer = CreateElement.createDiv('innerPreviewContainer', null);
      
      var previewDiv = CreateElement.createDiv('previewDiv', 'preview-padding-container');
      innerContainer.appendChild(previewDiv);
      previewDiv.style.paddingBottom = previewSettings.padding + '%';
      
      var previewIframe = CreateElement.createIframe('previewIframe', null, deckURL, '100%', '100%', true); 
      previewDiv.appendChild(previewIframe);
      
      page.preview.appendChild(innerContainer);

      UtilityKTS.setClass(page.preview, settings.hideClass, false);
      UtilityKTS.setClass(page.embedControls, settings.hideClass, false);
      
      page.notice.setNotice('');
      
    } catch (err) {
      page.notice.setNotice('failed to load preview');
      console.log(err);
    }
  }

  function getSettings() {    
    return {
      "decklink": page.inputDeckLink.value,
      "padding": page.inputPadding.value,
      "includenav": page.inputNavigation.checked
    };
  }
  
  function changePadding() {
    var previewDiv = page.preview.getElementsByClassName('preview-padding-container')[0];
    if (!previewDiv) return;
    
    var padding = getSettings().padding;
    previewDiv.style.paddingBottom = padding + '%';
  }
  
  function makeAndCopyEmbed() {
    var previewSettings = getSettings();
    var deckURL = previewSettings.deckurl;
    if (!previewSettings.includeNav) deckURL += '?rm=minimal';
    
    var embedCode = '';
    embedCode += '<div style="padding-bottom: ' + previewSettings.padding + '; position: relative; display: block; width: 100%;">';
    embedCode +=   '<iframe ';
    embedCode +=     'width="100%" ';
    embedCode +=     'height="100%" ';
    embedCode +=     'style="position: absolute; top: 0; left: 0;" ';
    embedCode +=     'src="' + deckURL + '" ';
    embedCode +=     'allowfullscreen="true" ';
    embedCode +=   '>';
    embedCode +=   '</iframe>';
    embedCode += '</div>';
    
    copyToClipboard(embedCode);
    page.notice.setNotice('copied embed code');
  }  
  
  async function verifyLink(url) {
    var result = {success: false, details: 'invalid link'};
    
    try {
      const resp = await fetch(url);

      if (resp.ok) {
        result.success = true;
        result.details = 'valid link';
        
      } else {
        result.details = '(' + resp.status + ') ' + resp.statusText;
      }
      
    } catch (err) {
      // do nothing else
    }
    
    return result;
  }
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  async function handlePreviewChange(e) {
    var padding = page.inputPadding.value;
    var minVal = page.inputPadding.min;
    var maxVal = page.inputPadding.max;
    
    padding = Math.max(minVal, padding);
    padding = Math.min(maxVal, padding);
    page.inputPadding.value = padding;
    
    page.notice.setNotice('');
    await showPreview();
  }
  
  function handlePaddingChange(e) {
    changePadding();
    page.notice.setNotice('');
  }
  
  function handleEmbedCopy(e) {
    makeAndCopyEmbed();
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  function copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
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