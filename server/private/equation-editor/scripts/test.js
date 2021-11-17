//-----------------------------------------------------------------------
// Equation test bed
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
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
    
    page.target.addEventListener('paste', (e) => { handlePaste(e); });
  }

  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  async function processFile(file, html) {
    var msg = 'file name: ' + file.name + ' type: ' + file.type;
    
    showResult(html);
    var imageFileURL = getImageFileURL(html);
    if (imageFileURL == null) {
      msg += ' - unable to find image ';
      message(msg);
      return;
    }
    
    var parsed = await parseImage(imageFileURL);
    console.log('parsed', parsed);
    if (!parsed.success) {
      msg += ' - fail: ' + parsed.details;
      message(msg);
      return;
    }
      
    message(msg);
  }
  
  async function processHTML(html) {
    var msg = 'text/html';
    console.log(html);
    showResult(html);
    var imageFileURL = getImageFileURL(html);
    if (imageFileURL == null) {
      msg += ' - no image found';
      
    } else {
      var parsed = await parseImage(imageFileURL);
      console.log('parsed', parsed);
      if (!parsed.success) {
        msg += ' - fail: ' + parsed.details;
        message(msg);
        return;
      }      
    }
    
    message(msg);
  }
  
  function processPlain(plainText) {
    message('text/plain');
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
    console.log(matchResults);
    
    if (matchResults == null || matchResults.length < 2) {
      console.log('no match for ' + html);
      return null;
    }
    var imgSrc = matchResults[1];
    console.log(imgSrc);
    
    return imgSrc;
  }
  
  async function parseImage(imageFileURL) {
    console.log('parseImage', imageFileURL);
    var result = {
      "success": false,
      "details": 'unspecified error in parseImage',
      "metadata": {}
    };

    var img = document.createElement('img');
    img.src = imageFileURL;
    console.log(img);
    page.body.appendChild(img);
    
    var httpResponse = await fetch(imageFileURL);
    if (!httpResponse.ok) throw new Error('no bueno');
    var buffer = await httpResponse.arrayBuffer();
    var bytes = new Uint8Array(buffer);

    try {
      var pngImage = new PngImage(bytes);
    } catch(err) {
      console.log(err);
      result.details = 'error in making PngImage: ' + err;
      return result;
    }
    
    if (!pngImage.parseData()) {
      result.details = 'error in parseData';
      return result;
    }

    result.success = true;
    result.details = 'image parsed';
    console.log('ihdr', pngImage.ihdr);
    console.log('phys', pngImage.phys);
    console.log('base', pngImage.base);
    console.log('idat', pngImage.idat);
    console.log('text', pngImage.text);
    console.log('iend', pngImage.iend);
    
    return result;
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