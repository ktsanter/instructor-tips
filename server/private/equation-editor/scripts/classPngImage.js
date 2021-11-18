//-------------------------------------------------------------------
// PngImage
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class PngImage {
  constructor(bytes) {
    this.content = bytes;
    this.error = 'PngImage: unspecified error';
    
    this.size = bytes.length;
    
    this.chunks = {
      "ihdr": {
        chunk: null,
        width: -1,
        height: -1,
        bitDepth: -1,
        colorType: -1,
        compressionMethod: -1,
        filterMethod:  -1,
        interlaceMethod: -1
      },
      
      "phys": [],
      "base": [],
      "idat": [],
      "text": [],
      
      "iend": {
        chunk: null
      },
      
      "other": []
    }


    this.valid = this._validate(bytes);
    if (!this.valid) {
      this.error = 'PngImage: not a valid PNG image';
      return;
    }
    
    this.valid = this._parseData();
    if (!this.valid) {
      this.error = 'PngImage: failed to parse image';
      return;
    }
  }
  
  //--------------------------------------------------------------
  // public methods
  //-------------------------------------------------------------- 
  static async fetchImageData(imageURL) {
    try {
      var httpResponse = await fetch(imageURL);
      if (!httpResponse.ok) {
        console.log('PngImage.fetchImageData error', 'failed to fetch');
        return null;
      }
      var buffer = await httpResponse.arrayBuffer();
      var bytes = new Uint8Array(buffer);
      
    } catch(err) {
      console.log('PngImage.fetchImageData error', err);
      return null;
    }
    
    return bytes;
  }
  
  getSize() {
    if (!this.valid) return -1;
    
    return this.size;
  }
  
  getChunks() {
    if (!this.valid) return null;
    
    return this.chunks;
  }
  
  getIhdr() {
    if (!this.valid) return null;
    
    var ihdrCopy = { ...this.chunks.ihdr };
    delete ihdrCopy.chunk;
    
    return ihdrCopy;
  }
  
  getText() {
    if (!this.valid) return null;
    
    var textArr = [];
    for (var i = 0; i < this.chunks.text.length; i++) {
      var textCopy = { ...this.chunks.text[i] };
      delete textCopy.chunk;
      textArr.push(textCopy);
    }
    
    return textArr;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------  
  _validate(bytes) {
    var magicNumberBytes = bytes.slice(0, 8);
    var magicNumber = this._toHex(magicNumberBytes);
    
    return magicNumber == '89504e470d0a1a0a';
  }
  
  _parseData() {
    var pos = 8;
    
    var success = true;
    
    while (pos < this.content.length && success) {
      var chunk = new PngChunk(this.content.slice(pos));

      if (chunk.type == 'IHDR') {
        success = this._processIhdrChunk(chunk);
        
      } else if (chunk.type == 'pHYs') {
        success = this._processPhysChunk(chunk);
        
      } else if (chunk.type == 'baSE') {
        success = this._processBaseChunk(chunk);
        
      } else if (chunk.type == 'IDAT') {
        success = this._processIdatChunk(chunk);

      } else if (chunk.type == 'tEXt') {
        success = this._processTextChunk(chunk);

      } else if (chunk.type == 'IEND') {
        success = this._processIendChunk(chunk);

      } else {
        success = this._processOtherChunk(chunk);
      }
      
      pos += chunk.totalLength;
    }
    
    return success;
  }

  _processIhdrChunk(chunk) {
    this.chunks.ihdr = {
      "chunk": chunk,
      "width": this._toNum(chunk.data.slice(0, 4)),
      "height": this._toNum(chunk.data.slice(4, 8)),
      "bitDepth": this._toNum(chunk.data.slice(8, 9)),
      "colorType": this._toNum(chunk.data.slice(9, 10)),
      "compressionMethod": this._toNum(chunk.data.slice(10, 11)),
      "filterMethod": this._toNum(chunk.data.slice(11, 12)),
      "interlaceMethod": this._toNum(chunk.data.slice(12, 13)),
    }
    
    return true;
  }
  
  _processPhysChunk(chunk) {
    this.chunks.phys.push({
      "chunk": chunk
    });
    
    return true;
  }
  
  _processBaseChunk(chunk) {
    this.chunks.base.push({
      "chunk": chunk
    });
    
    return true;
  }
  
  _processIdatChunk(chunk) {
    this.chunks.idat.push({
      "chunk": chunk
    });
    
    return true;
  }
  
  _processTextChunk(chunk) {
    var pos = 0;
    var delimIndex = chunk.data.indexOf(0x00, pos);
    var keyArr = chunk.data.slice(pos, delimIndex);
    var key = new TextDecoder().decode(keyArr);
    
    pos += keyArr.length + 1;
    var valueArr = chunk.data.slice(pos);
    var value = new TextDecoder().decode(valueArr);

    this.chunks.text.push({
      "chunk": chunk,
      "key": key,
      "value": value
    });
    
    return true;
  }
  
  _processIendChunk(chunk) {
    this.chunks.iend.chunk = chunk;
    
    return true;
  }
  
  _processOtherChunk(chunk) {
    this.chunks.other.push({
      "chunk": chunk
    });
    
    return true;
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _toNum(bytes) {
    var hexString = '0x' + this._toHex(bytes);
    return parseInt(Number(hexString), 10);
  }

  _toHex(bytes) {
    return Array.prototype.map.call(bytes, x => ('00' + x.toString(16)).slice(-2)).join('');
  }    
}
