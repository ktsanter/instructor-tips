//-------------------------------------------------------------------
// PngImage
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class PngImage {
  constructor(bytes) {
    this.content = bytes;

    this.ihdr = {
      chunk: null,
      width: -1,
      height: -1,
      bitDepth: -1,
      colorType: -1,
      compressionMethod: -1,
      filterMethod:  -1,
      interlaceMethod: -1
    };
    
    this.phys = {
      chunk: null,
      pixelsPerUnitX: -1,
      pixelsPerUnitY: -1,
      unitSpecified: -1
    };
    
    this.base = {
      chunk: null
    };
    
    this.idat = {
      chunk: null
    };
    
    this.text = {
      chunk: null,
      keyValuePairs: []
    };
    
    this.iend = {
      chunk: null
    }
    
    var magicNumberBytes = bytes.slice(0, 8);
    var magicNumber = this._toHex(magicNumberBytes);
    
    if (magicNumber != '89504e470d0a1a0a') {
      throw new Error('not a png file');
    }
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  parseData() {
    var pos = 8;
    console.log('size', this.content.length);
    
    var success = true;
    
    while (pos < this.content.length && success) {
      var chunk = new PngChunk(this.content.slice(pos));
      
      if (chunk.type == 'IHDR') {
        success = this.processIhdrChunk(chunk);
        
      } else if (chunk.type == 'pHYs') {
        success = this.processPhysChunk(chunk);
        
      } else if (chunk.type == 'baSE') {
        success = this.processBaseChunk(chunk);
        
      } else if (chunk.type == 'IDAT') {
        success = this.processIdatChunk(chunk);

      } else if (chunk.type == 'tEXt') {
        success = this.processTextChunk(chunk);

      } else if (chunk.type == 'IEND') {
        success = this.processIendChunk(chunk);

      } else {
        console.log('unprocessed chunk, type=' + chunk.type);
      }
      
      pos += chunk.totalLength;
    }
    
    return success;
  }

  processIhdrChunk(chunk) {
    this.ihdr.chunk = chunk;
    
    this.ihdr.width = this._toNum(chunk.data.slice(0, 4));
    this.ihdr.height = this._toNum(chunk.data.slice(4, 8));
    this.ihdr.bitDepth = this._toNum(chunk.data.slice(8, 9));
    this.ihdr.colorType = this._toNum(chunk.data.slice(9, 10));
    this.ihdr.compressionMethod = this._toNum(chunk.data.slice(10, 11));
    this.ihdr.filterMethod = this._toNum(chunk.data.slice(11, 12));
    this.ihdr.interlaceMethod = this._toNum(chunk.data.slice(12, 13));
    
    return true;
  }
  
  processPhysChunk(chunk) {
    this.phys.chunk = chunk;
    
    this.phys.pixelsPerUnitX = this._toNum(chunk.data.slice(0, 4));
    this.phys.pixelsPerUnitY = this._toNum(chunk.data.slice(4, 8));
    this.phys.unitSpecified = this._toNum(chunk.data.slice(8, 9));
    
    return true;
  }
  
  processBaseChunk(chunk) {
    this.base.chunk = chunk;
    
    return true;
  }
  
  processIdatChunk(chunk) {
    this.idat.chunk = chunk;
    
    return true;
  }
  
  processTextChunk(chunk) {
    this.text.chunk = chunk;
    
    var pairs = [];
    var pos = 0;
    var delimIndex = chunk.data.indexOf(0x00, pos);
    var keyArr = chunk.data.slice(pos, delimIndex);
    var key = new TextDecoder().decode(keyArr);
    
    pos += keyArr.length + 1;
    var valueArr = chunk.data.slice(pos);
    var value = new TextDecoder().decode(valueArr);
    
    this.text.keyValuePairs.push([key, value]);    
    
    return true;
  }
  
  processIendChunk(chunk) {
    this.iend.chunk = chunk;
    
    return true;
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _failResult(msg, methodName) {
    if (methodName) msg += ' in ' + methodName;
    
    return {
      success: false,
      details: msg,
      data: null
    };
  }
  
  _toNum(bytes) {
    var hexString = '0x' + this._toHex(bytes);
    return parseInt(Number(hexString), 10);
  }

  _toHex(bytes) {
    return Array.prototype.map.call(bytes, x => ('00' + x.toString(16)).slice(-2)).join('');
  }    
}
