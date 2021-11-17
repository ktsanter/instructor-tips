//-------------------------------------------------------------------
// PngChunk
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class PngChunk {
  constructor(bytes) {
    this.dataLength = this.getLength(bytes);
    this.type = this.getType(bytes);
    this.data = this.getData(bytes);
    this.crc = this.getCRC(bytes);
    this.totalLength = this.dataLength + 12;
  }

  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  getLength(bytes) {
    return this._toNum(bytes.slice(0, 4));
  }

  getType(bytes) {
    const type_byte = bytes.slice(4, 8);
    return (new TextDecoder("ascii")).decode(type_byte);
  }

  getData(bytes) {
    return bytes.slice(8, 8 + this.dataLength);
  }

  getCRC(bytes) {
    return bytes.slice(8 + this.dataLength, 8 + this.dataLength + 4);
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