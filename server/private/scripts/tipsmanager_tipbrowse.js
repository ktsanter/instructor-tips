//-----------------------------------------------------------------------------------
// TipBrowse class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipBrowse {
  constructor(updateCallback) {
    this._version = '0.01';
    
    this._HIDE_CLASS = 'tipbrowse-hide';
    
    this._updateCallback = updateCallback;

    this._container = CreateElement.createDiv(null, 'tipbrowse');
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  async render(notice) {
    this._notice = notice;
    
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
    
    this._container.appendChild(await this._buildUI());
        
    return this._container;
  }

  show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
    
  async _buildUI() {
    var container = CreateElement.createDiv(null, null, '[browse]');
    
    return container;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------
  _showElement(elem, makeVisible, override) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
    
    if (override) {
      if (makeVisible) {
        elem.style.display = 'inline-block';
      } else {
        elem.style.display = 'none';
      }
    }
  }
    
  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async _doGetQuery(queryType, queryName) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
      console.log('queryType: ' + queryType + ' queryName: ' + queryName);
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbPost(queryType, queryName, postData);
    if (requestResult.success) {
      resultData = requestResult;
      this._notice.setNotice('');
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
      console.log('queryType: ' + queryType + ' queryName: ' + queryName);
      console.log(postData);
    }
    
    return resultData;
  }    
}
