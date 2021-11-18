//-----------------------------------------------------------------------
// Equation test bed
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    
    baseRenderURL: '/equations/render/'
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
		page.body = document.getElementsByTagName('body')[0]; 

    await renderContents();
  }
 
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  async function renderContents() {
    page.target = page.body.getElementsByClassName('target')[0];
    page.message = page.body.getElementsByClassName('message')[0];
    page.result = page.body.getElementsByClassName('result')[0];
    
    page.target.addEventListener('paste', (e) => { handlePaste(e); });
  }

  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  async function processFile(file, html) {
    message('file pasted');
    page.result.innerHTML = '';
    
    showResult(html);
    var imageFileURL = getImageFileURL(html);
    if (imageFileURL == null) {
      page.result.innerHTML = 'file pasted: unable to find image in html';
      return;
    }
    
    var parsed = await parseImage(imageFileURL);
    if (!parsed.success) {
      page.result.innerHTML = 'file pasted: parseImage failed - ' + parsed.details;
      return;
    }
    
    showImageInfo(parsed.metadata);
  }
  
  async function processHTML(html) {
    message('text/html pasted');
    page.result.innerHTML = '';
    
    showResult(html);

    var imageFileURL = getImageFileURL(html);
    if (imageFileURL != null) {
      var parsed = await parseImage(imageFileURL);
      if (!parsed.success) {
        message('text/html pasted: includes img');
        page.result.innerHTML = 'text/html pasted: parseImage failed - ' + parsed.details;
        return;
      }
      
      showImageInfo(parsed.metadata);
      
    } else {
      page.result.innerHTML = 'could not find MathML';
    }
  }
  
  function processPlain(plainText) {
    message('text/plain pasted');
    page.result.innerHTML = '';
    
    var mathML = _mathMLFromPlainText(plainText);
    if (mathML != null) {
      mathML = mathML.replace(/</g, '&lt;');
      mathML = mathML.replace(/>/g, '&gt;');
      page.result.innerHTML = mathML;
      
    } else {
      page.result.innerHTML = 'could not find MathML';
    }

    showResult(plainText);
  }
  
  function processOther(typeList) {
    console.log('no recognized types', typeList);
    message('not recognized ' + JSON.stringify(typeList));
  }
  
  function showResult(result) {
    page.target.innerHTML = result;
  }
  
  function getImageFileURL(html) {
    var regexSrc = /img .*src="([^\s]*)"/;
    var matchResults = html.match(regexSrc);
    
    if (matchResults == null || matchResults.length < 2) {
      return null;
    }
    var imgSrc = matchResults[1];
    
    return imgSrc;
  }
  
  async function parseImage(imageURL) {
    var result = {
      "success": false,
      "details": 'unspecified error in parseImage',
      "metadata": {}
    };
    
    var bytes = await PngImage.fetchImageData(imageURL);
    if (bytes == null) {
      result.details = 'failed to fetch';
      return result;
    }
    
    var pngImage = new PngImage(bytes);
    if (!pngImage.valid) {
      result.details = pngImage.error;
      return result;
    }

    result.success = true;
    result.details = 'image parsed';
    result.metadata = {
      "size": pngImage.getSize(),
      "header": pngImage.getIhdr(),
      "textinfo": pngImage.getText()
    };
    
    return result;
  }
  
  function showImageInfo(metadata) {
    var msg = '';
    var mathMLMsg = 'could not find mathML';
    
    msg += 'size: ' + metadata.size;
    msg += '<br>header';
    for (var key in metadata.header) {
      msg += '<br>&nbsp;&nbsp&nbsp;' + key + ': ' + metadata.header[key];
    }
    
    msg += '<br>text:';
    if (metadata.textinfo.length == 0) {
      msg += ' <em>none</em>';
    } else {
      for (var i = 0; i < metadata.textinfo.length; i++) {
        var item = metadata.textinfo[i];
        var valueString = item.value.replace(/</g, '&lt;');
        valueString = valueString.replace(/>/g, '&gt;');
        msg += '<br>&nbsp;&nbsp;&nbsp;"' + item.key + '": &nbsp;&nbsp;"' + valueString + '"';
        
        if (item.key == 'MathML') mathMLMsg = valueString;
      }
    }
    
    msg += '<br>' + mathMLMsg;
   
    page.result.innerHTML = msg;
  }
  
  function _mathMLFromPlainText(plainText) {
    if (plainText.trim().length == 0) return null;
    
    var searchFor = settings.baseRenderURL;
    var index = plainText.indexOf(searchFor);
    if (index >= 0) {
      var encoded = plainText.slice(index + searchFor.length);
      return decodeURIComponent(encoded);
    }
    
    var regexMathML = /<math .*>.+<\/math>/;
    var matchMathML = plainText.match(regexMathML);
    if (matchMathML != null) {
      return matchMathML[0];
    }
    
    return null;
  }  
  
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  async function handlePaste(e) {
    e.preventDefault();
    
    types = e.clipboardData.types;
    
    if (types.includes('Files')) {
      var file = e.clipboardData.files[0];
      var html = null;
      if (types.includes('text/html')) {
        var html = e.clipboardData.getData('text/html');
      }      
      await processFile(file, html);
      
    } else if (types.includes('text/html')) {
      var html =  e.clipboardData.getData('text/html');
      await processHTML(html);
      
    } else if (types.includes('text/plain')) {
      var txt = e.clipboardData.getData('text/plain')
      processPlain(txt);
      
    } else {
      processOther(types);
    }    
  }
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  
  function message(msg) {
    page.message.innerHTML = '';
    if (msg != null && msg.length > 0) page.message.innerHTML = msg;
  }
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();