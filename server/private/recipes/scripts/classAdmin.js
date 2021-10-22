//-------------------------------------------------------------------
// Admin
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Admin {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async render() {
    var btnToggle = this.config.container.getElementsByClassName('btnToggleAdmin')[0];
    var toggleHandler = this.config.callbackAdminToggle;
    btnToggle.addEventListener('click', (e) => { toggleHandler(e); });

    var btnTest = this.config.container.getElementsByClassName('btnTest')[0];
    btnTest.addEventListener('click', (e) => { this._test(e); });
    
    this.fileInput = this.config.container.getElementsByClassName('ocr-inputfile')[0];
    this.fileInput.addEventListener('change', (e) => { this._handleFileInputChange(e); });
    
    this.previewContainer = this.config.container.getElementsByClassName('ocr-preview')[0];
    
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
  async _test(e) {
    console.log('Admin._test: stubbed');
  }
  
  _handleFileInputChange(e) {
    this.imageCompressor.compressImageFiles(e.target.files);
    this.fileInput.value = "";
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  async _callbackResized(dataURL) {
    //this._downloadURI(dataURL, 'test.jpg');
    
    var result = await this.imageOCR.doOCRonImage(dataURL);
    if (!result.success) return;
    
    var parsedText = result.data.ParsedResults[0].ParsedText;
    
    var elem = CreateElement.createDiv(null, null, parsedText.replace(/\r\n/g, '<br>'));
    this.previewContainer.appendChild(elem);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _downloadURI(uri, name) {
    var tempLink = document.createElement("a");
    tempLink.download = name;
    tempLink.href = uri;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
  }
}
