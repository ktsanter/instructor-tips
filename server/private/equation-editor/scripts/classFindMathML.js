//-----------------------------------------------------------------------
// FindMathML
//-----------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------
class FindMathML {
  constructor() {
    this.baseRenderURL = '/equations/render/';
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------
  includesMathML(clipboardData) {
    if (!clipboardData.types.includes('text/plain')) return false;
    
    var plainText = clipboardData.getData('text/plain');
    var regexMathML = /<math[\s]+xmlns=.*>.+<\/math>/;
    var matchMathML = plainText.match(regexMathML);
    
    return matchMathML != null;
  }
  
  async find(clipboardData) {
    var mathML = null;
    
    var types = clipboardData.types;
    
    if (types.includes('text/html')) {
      var html =  clipboardData.getData('text/html');
      mathML = await this._processHTML(html);
      
    } else if (types.includes('text/plain')) {
      var txt = clipboardData.getData('text/plain')
      mathML = this._processPlain(txt);
    }

    return mathML;    
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------
  async _processHTML(html) {
    var imageURL = this._getImageURL(html);
    if (imageURL == null) return null;    

/*
    var parsed = await this._parseImage(imageURL);
    if (!parsed.success) return null;
    
    var mathML = null;
    var textInfo = parsed.metadata.textinfo;

    for (var i = 0; i < textInfo.length && mathML == null; i++) {
      var item = textInfo[i];
      if (item.key == 'MathML') mathML = item.value
    }      
*/  
    var mathML = this._mathMLFromPlainText(imageURL);

    return mathML;
  }
  
  _processPlain(plainText) {
    return this._mathMLFromPlainText(plainText);
  }
  
  _getImageURL(html) {
    var regexSrc = /img .*src="([^\s]*)"/;
    var matchResults = html.match(regexSrc);
    
    if (matchResults == null || matchResults.length < 2) return null;
    var imgSrc = matchResults[1];
    
    return imgSrc;
  }

  async _parseImage(imageURL) {
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

  _mathMLFromPlainText(plainText) {
    if (plainText.trim().length == 0) return null;
    
    var searchFor = this.baseRenderURL.replace(/\//g, '\/');
    var regexSearchFor = new RegExp(searchFor);
    var matchSearchFor = plainText.match(regexSearchFor);
    if (matchSearchFor != null) {                                                                     
      plainText = decodeURIComponent(plainText);
    }
    
    var regexMathML = /<math .*>.+<\/math>/;
    var matchMathML = plainText.match(regexMathML);
    if (matchMathML != null) {
      return matchMathML[0];
    }
    
    return null;
  }  

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------  
}
