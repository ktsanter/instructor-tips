//-----------------------------------------------------------------------------------
// TipScheduling2 class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipScheduling2 {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Scheduling';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    this._HIGHLIGHT_CLASS = 'tipschedule-highlight';
    
    this._config = config;
    this._callback = config.callback;
    
    this._control = null;

    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipschedule ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderTitle());

    this._control = new TipManagerSchedulingControl(() => {return this.update();});
    this._container.appendChild(this._control.render(this._notice));

    this._container.appendChild(this._renderContents());
    
    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipschedule-contents');
    container.appendChild(CreateElement.createSpan(null, null, '[contents]'));
    
    return container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    this._showElement(this._container, makeVisible);
  }
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update(reRenderControls) {
    this._prepContainerForUpdate();
  }
 
  
  _prepContainerForUpdate() {
    var contents = this._container.getElementsByClassName('tipschedule-content')[0];
    if (contents) {
      this._container.removeChild(contents);
    }
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------  
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------     
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }

  _insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
  }

  _highlight(elem, makeHighlight) {
    if (!makeHighlight) {
        if (elem.classList.contains(this._HIGHLIGHT_CLASS)) {
          elem.classList.remove(this._HIGHLIGHT_CLASS);
        }
        
    } else {
      elem.classList.add(this._HIGHLIGHT_CLASS);
    }
  }  
  
  _removeAllHighlight() {
    var elemList = this._container.getElementsByClassName(this._HIGHLIGHT_CLASS);
    for (var i = 0; i < elemList.length; i++) {
      this._highlight(elemList[i], false);
    }
  }  

  _formatDate(theDate) {
    var formattedDate = theDate;
    
    if (this._isValidDate(theDate)) {
      formattedDate = '';
      if (theDate != null & theDate != '') {
        var objDate = new Date(theDate);
        var day = objDate.getDate();
        var month = objDate.getMonth() + 1;
        formattedDate = month + '/' + day;
      }
    }
    
    return formattedDate;
  }  

  _isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
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
    }
    
    return resultData;
  }  
}
