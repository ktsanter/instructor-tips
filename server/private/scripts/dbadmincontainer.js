//-------------------------------------------------------------------
// DBAdminContainer class
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

class DBAdminContainer {
  constructor(adminType) {
    this._version = '0.01';
    this._HIDE_CLASS = 'dbadmin-container-hide';

    this._adminType = adminType;
    this._container = null;
    this._dbData = null;
    
    this._dbCallbacks = {
      'requery': () => {return this._doRequery();},
      'insert': (dbData) => {return this._doInsert(dbData);},
      'update': (dbData) => {return this._doUpdate(dbData);},
      'delete': (dbData) => {return this._doDelete(dbData);}
    }
  }
  
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'dbadmin-container' + ' ' + this._HIDE_CLASS);
    
    return this._container;
  }
  
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  async update() {
    this._prepContainerForUpdate();

    this._dbData = await this._doGetQuery('admin/query', this._adminType);
    if (this._dbData) {
      this._tableEditor = new DBAdminTableEdit(this._dbData, this._dbCallbacks);
      this._container.appendChild(this._tableEditor.render());
    }
  }
  
  _prepContainerForUpdate() {
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    var capitalizedType = this._adminType[0].toUpperCase() +  this._adminType.slice(1)
    this._container.appendChild(CreateElement.createDiv(null, 'dbadmin-container-title', capitalizedType));
  }

  //--------------------------------------------------------------
  // callback functions
  //--------------------------------------------------------------   
  async _doRequery() {
    this._dbData = await this._doGetQuery('admin/query', this._adminType);
    return this._dbData;
  }

  async _doInsert(queryData) {
    await this._doPostQuery('admin/insert', this._adminType, queryData);
  }
  
  async _doUpdate(queryData) {
    await this._doPostQuery('admin/update', this._adminType, queryData);
  }
  
  async _doDelete(queryData) {
    await this._doPostQuery('admin/delete', this._adminType, queryData);
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

  //--------------------------------------------------------------
  // utility functions
  //--------------------------------------------------------------
  toggleDisplay() {
    this._container.classList.toggle(this._HIDE_CLASS);
  }
  
  show(makeVisible) {
    if (makeVisible) {
        if (this._container.classList.contains(this._HIDE_CLASS)) {
          this._container.classList.remove(this._HIDE_CLASS);
        }
        
    } else {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
}
