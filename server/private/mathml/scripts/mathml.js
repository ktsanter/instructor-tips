//-----------------------------------------------------------------------
// MathML to image conversion
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  const settings = {
    hideClass: 'hide-me',
    
    conversionBaseURL: 'https://www.wiris.net/demo/editor/render'
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0]; 
    page.errorResult = page.body.getElementsByClassName('error-result')[0];
    
    page.result = page.body.getElementsByClassName('result')[0];
    page.resultImage = page.result.getElementsByClassName('result-image')[0];
    page.resultSVGContainer = page.result.getElementsByClassName('result-svg-container')[0];
    page.resultSVG = page.result.getElementsByClassName('result-svg')[0];
    page.downloadLink = page.result.getElementsByClassName('download-link')[0];
    
    _renderContents();
    console.log('okay so far');    
    return;
  }
 
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function _renderContents() {
    var elems = document.getElementsByName('imageType');
    for (var i = 0; i < elems.length; i++) {
      elems[i].addEventListener('click', (e) => { _handleImageTypeChange(); });
    }

    page.body.getElementsByClassName('button-convert')[0].addEventListener('click', (e) => { _handleConvert(e); });
    page.body.getElementsByClassName('area-mathml')[0].addEventListener('input', (e) => { _handleTextAreaChange(e); });
  }

  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  async function _showResult(result) {
    UtilityKTS.setClass(page.errorResult, 'hide-me', result.success);
    UtilityKTS.setClass(page.result, 'hide-me', !result.success);
    
    if (!result.success) {
      page.errorResult.innerHTML = result.details;
      return;
    }
    
    const urlCreator = window.URL || window.webkitURL;
    if (page.resultImage.src != '') {
      urlCreator.revokeObjectURL(page.resultImage.src); 
    }
    var imageURL = urlCreator.createObjectURL(result.data);
    page.resultImage.src = imageURL;
    
    page.downloadLink.href = imageURL;
    page.downloadLink.download = 'image-from-mathml.' + _getImageType();
    
    var imageType = _getImageType();
    UtilityKTS.setClass(page.resultSVGContainer, 'hide-me', imageType != 'svg');
    if (imageType == 'svg') page.resultSVG.innerHTML = await result.data.text();
  }
  
  function _getImageType() {
    var imageType = null;
    var elems = document.getElementsByName('imageType');
    
    for (var i = 0; i < elems.length && !imageType; i++) {
      if (elems[i].checked) imageType = elems[i].value;
    }
    
    return imageType;
  }   

  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  async function _handleConvert(e) {
    var format = 'png';
    
    var mml = document.getElementById('areaMathML').value;
    
    var result = await _convertMathMLToImage(mml, _getImageType());
    ;
    await _showResult(result);
  }
  
  function _handleImageTypeChange(e) {
    _showResult({success: false, details:'', data: null});
  } 
  
  function _handleTextAreaChange(e) {
    _showResult({success: false, details:'', data: null});
  }
  
  //--------------------------------------------------------------------------
  // service calls
	//--------------------------------------------------------------------------  
  async function _convertMathMLToImage(mathML, format) {
    const METHOD_TITLE = 'dbGet';
    
    mathML = mathML.replace(/\+/g, '%2B');
    mathML = mathML.replace(/&/g, '%26');
    mathML = mathML.replace(/#/g, '%23');
    
    var paramFormat = 'format=' + format;
    var paramMML = '&mml=' + mathML;
  ;
    var url = settings.conversionBaseURL + '?' + paramFormat + '&' + paramMML;

    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE, data: null};

    try {
      var myHeaders = new Headers();
      myHeaders.append("Cookie", "JSESSIONID=BFE999C5D299AA600335E3927132EA27");

      var requestOptions = {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
      };
      
      const resp = await fetch(url, requestOptions);

      if (!resp.ok) {
        var errmsg = 'error: status=' + resp.status;
        result.details = errmsg;
        
      } else {
        var blobData = await resp.blob();
;
        if (blobData.type.indexOf('image') < 0) {
          console.log('fail');
          result.details = 'error: unexpected data type - ' + blobData.type;
          
        } else {
          result.success = true;
          result.details = 'conversion succeeded';
          result.data = blobData;
        }
      }
      
    } catch (error) {
      var errmsg = '**ERROR: in ' + METHOD_TITLE + ', ' + error;
      result.details = errmsg;
    }
    
    return result;
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