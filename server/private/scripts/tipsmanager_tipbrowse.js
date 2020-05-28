//-----------------------------------------------------------------------------------
// TipBrowse class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipBrowse {
  constructor(updateCallback, dragstartCallback, dragendCallback) {
    this._version = '0.01';
    this._title = 'Browse tips';
    
    this._HIDE_CLASS = 'tipbrowse-hide';
    
    this._updateCallback = updateCallback;
    this._dragstartCallback = dragstartCallback;
    this._dragendCallback = dragendCallback

    this._container = CreateElement.createDiv(null, 'tipbrowse');
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  async render(notice) {
    // this object has its own notice to avoid conflicts with that of "parent"
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    this._container.appendChild(this._renderTitle());
    
    var filterConfig = {updateCallback: (params) => {this._updateFromFilter(params);}};
    this._tipFilter = new TipFilter(filterConfig);
    
    this._container.appendChild(await this._renderContents());
        
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
    
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipbrowse-title');
    container.appendChild(CreateElement.createSpan(null, 'tipbrowse-titletext', this._title));
    
    return container;
  }
  
  async _renderContents() {
    var container = CreateElement.createDiv(null, 'tipbrowse-contents');
    
    container.appendChild(this._tipFilter.render(this._notice));
    container.appendChild(CreateElement.createDiv(null, 'tipbrowse-results', '[browse results]'));
    
    return container;
  }
  
  async update(skipTipFilterUpdate) {
    console.log('TipBrowse -> update: ' + skipTipFilterUpdate);
    
    var resultContainer = this._container.getElementsByClassName('tipbrowse-results')[0];
    
    if (!skipTipFilterUpdate) await this._tipFilter.update();

    var tipList = await this._getTipList();
    if (!tipList) return;
    
    this._renderTipList(resultContainer, tipList);
  }
  
  _renderTipList(container, tipList) {
    this._removeAllChildren(container);
    container.tipList = tipList;
    
    for (var i = 0; i < tipList.length; i++) {
      var elemTip = CreateElement.createDiv(null, 'tip', MarkdownToHTML.convert(tipList[i].tiptext));
      elemTip.tipId = tipList[i].tipid;
      elemTip.draggable = true;
      elemTip.addEventListener('dragstart', (e) => {this._dragstartHandler(e)});
      elemTip.addEventListener('dragend', (e) => {this._dragendHandler(e)});
      container.appendChild(elemTip);
    }
  }
  
  async _getTipList() {
    var result = null;
    
    var filterSettings = this._tipFilter.getFilterState();
    console.log('_getTipList');
    console.log(filterSettings);
    
    var queryResults = await this._doPostQuery('tipmanager/query', 'tiplist', filterSettings);
    if (queryResults.success) {
      result = queryResults.data;
      result = result.sort(function(a, b) {
        if (a.tiptext.toLowerCase() > b.tiptext.toLowerCase()) {
          return 1;
        } else if (a.tiptext.toLowerCase() < b.tiptext.toLowerCase()) {
          return -1;
        }
        return 0;
      });
    }
    
    console.log(result);
    
    return result;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _updateFromFilter(params) {
    this.update(true);
  }
  
  _dragstartHandler(e) {
    if (!e.target.classList.contains('tip')) {
      e.preventDefault();
      return false;
    }

    var itemInfo = {
      dragtype: 'add',
      tipId: e.target.tipId,
      tipstate: 0,
      tiptext: null,
      nextitem: null,
      previousitem: null,
      scheduletipid: null,
    };
    
    e.target.itemInfo = itemInfo;

    return this._dragstartCallback(e);
  }
  
  _dragendHandler(e) {
    if (!e.target.classList.contains('tip')) return false;
    return this._dragendCallback(e);
  }
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
  
  _removeAllChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
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
