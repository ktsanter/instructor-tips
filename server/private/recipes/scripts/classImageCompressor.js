//-------------------------------------------------------------------
// ImageCompressor
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ImageCompressor {
  constructor(config) {
    this.config = config;
    this.showPreview = (this.config.previewContainer != null);
    
    if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
      console.log ('ImageCompressor: the File APIs are not fully supported in this browser.');
    }
  }
  
  //--------------------------------------------------------------
  // public methods
  //-------------------------------------------------------------- 
  compressImageFiles(files) {
    this._readfiles(files);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _readfiles(files) {
    if (this.showPreview) UtilityKTS.removeChildren(this.config.previewContainer);
      
    for (var i = 0; i < files.length; i++) {
      this._processfile(files[i]); // process each file at once
    }
  }

  _processfile(file) {
    if (!(/image/i).test(file.type)) {
      alert("File " + file.name + " is not an image.");
      return false;
    }

    var me = this;
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = function(event) {
      var blob = new Blob([event.target.result]); // create blob...
      window.URL = window.URL || window.webkitURL;
      var blobURL = window.URL.createObjectURL(blob); // and get it's URL

      var image = new Image();
      image.src = blobURL;
      image.onload = function() {
        me.config.callbackResized(me._resizeMe(image, me));
      }
    };
  }

  _resizeMe(img, me) {
    var canvas = document.createElement('canvas');

    var width = img.width;
    var height = img.height;

    if (width > height) {
      if (width > me.config.maxWidth) {
        height = Math.round(height *= me.config.maxWidth / width);
        width = me.config.maxWidth;
      }
    } else {
      if (height > me.config.maxHeight) {
        width = Math.round(width *= me.config.maxHeight / height);
        height = me.config.maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    if (me.showPreview) me.config.previewContainer.appendChild(canvas);
    
    return canvas.toDataURL("image/jpeg", 0.7); // get the data from canvas as 70% JPG (can be also PNG, etc.)
  }

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
  