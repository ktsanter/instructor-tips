//-------------------------------------------------------------------
// ImageOCR
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ImageOCR {
  constructor(config) {
    this.config = config;
    this.apiKey = null;
    this.initialized = false;
    this.notice = this.config.db.config.notice;
  }
  
  //--------------------------------------------------------------
  // public methods
  //-------------------------------------------------------------- 
  async initialize() {
    this.initialized = false;
    this.apiKey = null;
    
    var result = await this.config.db.getOCRAPIKey();
    if (result == null) return;
    
    this.apiKey = result;
    this.initialized = true;
  }
  
  async doOCRonImage(dataURL) {
    var result = {success: false};
    
    if (!this.initialized) {
      result.details = 'not initialized';
      return result;
    }
    var postResult = await this._ocrPost(dataURL);
    
    if (postResult.success) {
      result = postResult;
      if (this.notice) this.notice.setNotice('');
      
    } else {
      result.details = postResult.details;
      if (this.notice) this.notice.setNotice('error: ' + JSON.stringify(postResult.details));
    }    
    return result;
  }
    
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  async _ocrPost(imageDataURL) {
    const METHOD_TITLE = '_ocrPost';
    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE};

    var url = 'https://api.ocr.space/parse/image';

    var myHeaders = new Headers();
    myHeaders.append("apikey", this.apiKey);
    
    var formData = new FormData();
    formData.append("language", "eng");
    formData.append("OCREngine", "1");
    formData.append("scale", "true");
    formData.append("base64Image", imageDataURL);
    
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow'
    };
    
    try {
      const resp = await fetch(url, requestOptions);
      
      const resultText = await resp.text();
      result.success = true;
      result.details = 'OCR succeeded';
      result.data = JSON.parse(resultText);
      
    } catch(error) {
      var errmsg = '**ERROR: in ' + METHOD_TITLE + ', ' + error;
      console.log(errmsg);
      result.details = errmsg;      
    }
    
    return result;
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
  