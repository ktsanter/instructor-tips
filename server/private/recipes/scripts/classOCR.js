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
    this.resultContainer = this.config.container.getElementsByClassName('ocr-result')[0];
    
    await this._imageOCRInit();
    
    await this._webcamInit();
    
    this._setView('video-view');
  }
  
  update() { }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  async _webcamInit() {
    this.webcamElement = this.config.container.getElementsByClassName('webcam-video')[0];
    this.mirrorVideo = false;
    this.canvasElement = this.config.container.getElementsByClassName('webcam-canvas')[0];
    this.snapSoundElement = this.config.container.getElementsByClassName('webcam-snap-audio')[0];

    this.webcam = new Webcam(this.webcamElement, /* 'user', */ this.canvasElement, this.snapSoundElement); 
    
    this.webcamStartStopControl = this.config.container.getElementsByClassName('webcam-control webcam-startstop')[0];
    this.webcamStartStopControl.addEventListener('click', (e) => { this._handleWebcamStartStop(e); });
    
    this.webcamMirrorControl = this.config.container.getElementsByClassName('webcam-control webcam-mirror')[0];
    this.webcamMirrorControl.addEventListener('click', (e) => { this._handleWebcamMirror(e); });
    this.webcamMirrorControl.disabled = true;

    this.webcamSnapControl = this.config.container.getElementsByClassName('webcam-control webcam-snap')[0];
    this.webcamSnapControl.addEventListener('click', (e) => { this._handleWebcamSnap(e); });
    this.webcamSnapControl.disabled = true;
    
    this.webcamSnapOCRControl = this.config.container.getElementsByClassName('webcam-control webcam-ocronsnap')[0];
    this.webcamSnapOCRControl.addEventListener('click', (e) => { this._handleWebcamSnapOCR(e); });
    
    this.webcamSnapDownloadControl = this.config.container.getElementsByClassName('webcam-control webcam-downloadsnap')[0];
    this.webcamSnapDownloadControl.addEventListener('click', (e) => { this._handleWebcamSnapDownload(e); });

    this.webcamDeviceList = this.config.container.getElementsByClassName('webcam-control webcam-devicelist')[0];
    this.webcamDeviceList.addEventListener('change', (e) => { this._handleDeviceChange(e); });
    await this._webcamLoadDeviceList();
  }
  
  async _webcamLoadDeviceList() {
    const info = await this.webcam.info();
    if (info.length == 0) {
      this.webcamStartStopControl.disabled = true;
      return;
    }
    
    UtilityKTS.removeChildren(this.webcamDeviceList);

    for (let i = 0; i < info.length; i++) { 
      let device = info[i];
      this.webcamDeviceList.appendChild(CreateElement.createOption(null, null, device.deviceId, device.label));
    }
  }
  
  _webcamStart() {
    const deviceId = this.webcamDeviceList.value;
    this.webcam.selectedDeviceId = deviceId;
    this._setView('video-view');
    this.webcamMirrorControl.disabled = true;
    this.webcamSnapControl.disabled = true;
    UtilityKTS.setClass(this.webcamStartStopControl, 'busy-cursor', true);
    
    this.webcam.start()
      .then(result =>{
        this.webcamMirrorControl.disabled = false;
        this.webcamSnapControl.disabled = false;
        UtilityKTS.setClass(this.webcamStartStopControl, 'busy-cursor', false);
      })
      .catch(err => {
        console.log(err);
        UtilityKTS.setClass(this.webcamStartStopControl, 'busy-cursor', false);
      });           
  }
  
  _webcamStop() {
    this.webcamMirrorControl.disabled = true;
    this.webcamSnapControl.disabled = true;
    this.webcam.stop();
  }
  
  _webcamTakeSnap() {
    this.webcam.snap();
    this.webcamStartStopControl.click();
    this._setView('snapshot-view');
  }
  
  async _webcamOCROnSnap() {
    this.webcamStartStopControl.disabled = true;
    this.webcamSnapOCRControl.disabled = true;
    this.webcamSnapDownloadControl.disabled = true;
    
    const dataURL = this.canvasElement.toDataURL("image/jpeg", 0.7); // get the data from canvas as 70% JPG (can be also PNG, etc.)
    
    this._setNotice('processing OCR...', true);
    
    var result = await this.imageOCR.doOCRonImage(dataURL);

    if (!result.success) return;
    this._setNotice('');
      
    var parsedText = result.data.ParsedResults[0].ParsedText;
    
    var elem = CreateElement.createDiv(null, null, parsedText.replace(/\r\n/g, '<br>'));
    this.resultContainer.appendChild(elem);

    this.webcamStartStopControl.disabled = false;
    this.webcamSnapOCRControl.disabled = false;
    this.webcamSnapDownloadControl.disabled = false;
  }
  
  _webcamDownloadSnap() {
    let url = this.canvasElement.toDataURL("image/jpeg", 0.7); // get the data from canvas as 70% JPG (can be also PNG, etc.)
    this._downloadURI(url, 'snapshot.jpg');
  }
  
  _webcamIsRunning() {
    return this.webcamStartStopControl.classList.contains('started');
  }
  
  async _imageOCRInit() {
    this.imageOCR = new ImageOCR({
      "db": this.config.db
    });

    await this.imageOCR.initialize();
  }
  
  _setView(viewname) {
    const videoViewElements = this.config.container.getElementsByClassName('video-view');
    const snapshotViewElements = this.config.container.getElementsByClassName('snapshot-view');
    
    for (let i = 0; i < videoViewElements.length; i++) {
      UtilityKTS.setClass(videoViewElements[i], this.config.hideClass, viewname != 'video-view');
    }

    for (let i = 0; i < snapshotViewElements.length; i++) {
      UtilityKTS.setClass(snapshotViewElements[i], this.config.hideClass, viewname != 'snapshot-view');
    }
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleWebcamStartStop(e) {
    let camIsStarted = this._webcamIsRunning();
    UtilityKTS.setClass(this.webcamStartStopControl, 'started', !camIsStarted);
    if (camIsStarted) {
      this._webcamStop();
    } else {
      this._webcamStart();
    }
  }
  
  _handleDeviceChange(e) {
    if (this._webcamIsRunning) {
      this._webcamStop();
      this._webcamStart();
    }
  }
  
  _handleWebcamMirror(e) {
    if (!this._webcamIsRunning()) return;
    
    this.webcam.mirror();
  }
  
  _handleWebcamSnap(e) {
    if (!this._webcamIsRunning()) return;
    
    this._webcamTakeSnap();
  }
  
  _handleWebcamSnapOCR(e) {
    this._webcamOCROnSnap();
  }
  
  _handleWebcamSnapDownload(e) {
    this._webcamDownloadSnap();
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
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
