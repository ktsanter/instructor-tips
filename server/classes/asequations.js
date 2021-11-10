"use strict";
//---------------------------------------------------------------
// server-side for AS Equations
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.asEquations = class {
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
    
    console.log('_getRenderedEquation');
    console.log(params);

    //var mathML = '<p><math xmlns="http://www.w3.org/1998/Math/MathML"><mo>&#8734;</mo><mo>&#8709;</mo></math></p>';
    //var mathML = '<p><math xmlns="http://www.w3.org/1998/Math/MathML"><mi>d</mi><mo>=</mo><msqrt><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup></msqrt></math></p>';
    
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
