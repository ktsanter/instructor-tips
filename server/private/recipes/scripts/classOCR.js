//-------------------------------------------------------------------
// OCR
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class OCR {
  constructor(config) {
    this.config = config;    
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async render() {    
    this.fileInput = this.config.container.getElementsByClassName('ocr-inputfile')[0];
    this.fileInput.addEventListener('change', (e) => { this._handleFileInputChange(e); });
    
    this.previewContainer = this.config.container.getElementsByClassName('ocr-preview')[0];
    this.resultContainer = this.config.container.getElementsByClassName('ocr-result')[0];
    
    this.imageCompressor = new ImageCompressor({
      "container": this.config.container,
      "hideClass": this.config.hideClass,
      "maxWidth": this.fileInput.getAttribute('data-maxwidth'),
      "maxHeight": this.fileInput.getAttribute('data-maxheight'),
      "previewContainer": this.previewContainer,
      "callbackResized": (dataURL) => { this._callbackResized(dataURL); }
    });
    
    this.imageOCR = new ImageOCR({
      "db": this.config.db
    });

    await this.imageOCR.initialize();
  }
  
  update() {}
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleFileInputChange(e) {
    this._setNotice('processing image...', true); 
    UtilityKTS.removeChildren(this.resultContainer);
    
    this.imageCompressor.compressImageFiles(e.target.files);
    this.fileInput.value = "";
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  async _callbackResized(dataURL) {
    //this._downloadURI(dataURL, 'test.jpg');
    this._setNotice('processing OCR...', true);
    
    var result = await this.imageOCR.doOCRonImage(dataURL);

    if (!result.success) return;
    this._setNotice('');
      
    var parsedText = result.data.ParsedResults[0].ParsedText;
    
    var elem = CreateElement.createDiv(null, null, parsedText.replace(/\r\n/g, '<br>'));
    this.resultContainer.appendChild(elem);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _setNotice(msg, useSpinner) {
    var container = this.config.container.getElementsByClassName('ocr-message')[0];
    UtilityKTS.removeChildren(container);
    
    if (!msg || msg.trim().length == 0) msg = ' '
    
    container.appendChild(CreateElement.createSpan(null, null, msg));
    if (useSpinner) {
      container.appendChild(CreateElement.createIcon(null, 'fa fa-spinner, fa-pulse fa-3x fa-fw'));
    }
  }
  
  _downloadURI(uri, name) {
    var tempLink = document.createElement("a");
    tempLink.download = name;
    tempLink.href = uri;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
  }
}
