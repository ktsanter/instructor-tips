//-----------------------------------------------------------------------------------
// TipEditing class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipEditing {
  constructor() {
    this._version = '0.01';
    this._title = 'Editing';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;

    this._tipFilter = new TipManagerFilter('editing', () => {return this.update();});   
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipschedule ' + this._HIDE_CLASS);

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    this._container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    titleContainer.appendChild(CreateElement.createIcon(null, 'tipmanager-icon fas fa-caret-down', 'show/hide filter', (e) => {return this._toggleFilterCollapse(e);}));
    
    this._container.appendChild(await this._tipFilter.render(this._notice));

    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  async update() {
    this._prepContainerForUpdate();    
    
    var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipedit', this._tipFilter.getFilter());

    if (tipsQuery.success) {
      this._container.appendChild(this._showTips(tipsQuery));
    }      
  }
  
  _prepContainerForUpdate() {
    var contents = this._container.getElementsByClassName('tipediting-content')[0];
    if (contents) {
      this._container.removeChild(contents);
    }
  }
  
  _showTips(tipsInfo) {
    var contentContainer = CreateElement.createDiv(null, 'tipediting-content');
    var colgroupInfo = [
      'width: 1%',
      'width: 1%',
      'width: 30%',
      'width: 15%',
      'width: *'
    ];
    this._tableEditor = new DBAdminTableEdit(tipsInfo, this._packageCallbacks(), colgroupInfo);
    contentContainer.appendChild(this._tableEditor.render());

    return contentContainer;
  }
  
  _packageCallbacks() {
    return {
      "requery": (dbData) => {return this._doRequery(dbData);},
      "insert": (dbData) => {return this._doInsert(dbData);},
      "update": (dbData) => {return this._doUpdate(dbData);},
      "delete": (dbData) => {return this._doDelete(dbData);}
    }
  }

  _toggleFilterCollapse(e) {
    var elemIcon = e.target;
    var elemFilter = this._container.getElementsByClassName('tipfilter')[0];
    
    elemIcon.classList.toggle('fa-caret-right');
    elemIcon.classList.toggle('fa-caret-down');
    elemFilter.classList.toggle(this._HIDE_CLASS);
  }
  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }
  
  async _doRequery() {
    var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipedit', this._tipFilter.getFilter());
    return tipsQuery;
  }
  
  async _doInsert(queryData) {
    await this._doPostQuery('tipmanager/insert', 'tip', queryData);
  }
  
  async _doUpdate(queryData) {
    await this._doPostQuery('tipmanager/update', 'tip', queryData);
  }
  
  async _doDelete(queryData) {
    await this._doPostQuery('tipmanager/delete', 'tip', queryData);
  }
    
  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async _doGetQuery(queryType, queryName) {
    var resultData = null;
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = null;
    
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
