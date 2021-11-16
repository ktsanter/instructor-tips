"use strict";
//---------------------------------------------------------------
// server-side for Equation editor
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.EquationEditor = class {
  constructor(params) {
    this.axios = params.axios;
    this.fs = params.fs;
    this.tempFileMaker = params.tempFileMaker;

    this.tempDir = 'temp';
    this.conversionBaseURL = 'https://www.wiris.net/demo/editor/render';
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData) {
    var dbResult = this._queryFailureResult();

    if (params.queryName == 'render') {
      dbResult = this._getRenderedEquation(params);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------      
  
//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------    
  _getRenderedEquation(params) {
    var result = this._queryFailureResult();
    
    var mathML = params.info;
    var imageFileName = this.tempFileMaker.tmpNameSync({tmpdir: this.tempDir}) + '.png'; 
    this._convertMathMLToImage2(mathML, 'png', imageFileName, params.callback);
  }  
  
//----------------------------------------------------------------------
// support methods and queries
//----------------------------------------------------------------------  
  async _convertMathMLToImage2(mathML, format, targetFile, callback) {
    const METHOD_TITLE = '_convertMathMLToImage';
    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE, data: null};
    
    mathML = mathML.replace(/\+/g, '%2B');
    mathML = mathML.replace(/&/g, '%26');
    mathML = mathML.replace(/#/g, '%23');
    
    var paramFormat = 'format=' + format;
    var paramMML = 'mml=' + mathML;
    var url = this.conversionBaseURL + '?' + paramFormat + '&' + paramMML;

    try {
      const response = await this.axios({
        "method": 'GET',
        "url": url,
        "responseType": 'stream',
      });      
      
      const w = response.data.pipe(this.fs.createWriteStream(targetFile));
      w.on('finish', () => {
        callback({"success": true, "details": 'conversion succeeded', "data": targetFile});
      });    

    
    } catch(err) {
      var errmsg = '**ERROR: in ' + METHOD_TITLE + ', ' + err;      
      console.log(errmsg);
      callback({"success": false, "details": errmsg, "data": targetFile});
    }
  }    
  
//----------------------------------------------------------------------
// utility
//----------------------------------------------------------------------  
  _queryFailureResult() {
    return {success: false, details: 'db query failed', data: null};
  }
}
