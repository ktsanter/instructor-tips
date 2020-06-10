//-----------------------------------------------------------------------------------
// TipEditing class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TipEditing {
  constructor(config) {  
    this._version = '0.01';
    this._title = 'Tip editing';
    
    this._HIDE_CLASS = 'tipediting-hide';

    this._config = {};
    if (config) this._config = config;
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {   
    this._container = CreateElement.createDiv(null, 'tipediting ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    //this._container.appendChild(this._renderTitle());
    this._container.appendChild(await this._renderContents());
    
    var categoryList = await this._loadCategoryListFromDB();
    this._editTipDialog = new DialogContainer({
      dialogtype: 'edit-tip',
      confirmcallback: (arg) => {this._finishEditTip(arg)},
      cancelcallback: () => {this._cancelEditTip()},
      categorylist: categoryList,
      showUsageInfo: true
    });
    this._container.appendChild(this._editTipDialog.render());    
    
    this._deleteTipDialog = new DialogContainer({
      dialogtype: 'delete-tip',
      confirmcallback: (arg) => {this._finishDeleteTip(arg)},
      cancelcallback: () => {this._cancelDeleteTip()}
    });
    this._container.appendChild(this._deleteTipDialog.render());    

    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }

  async _renderContents() {
    var container = CreateElement.createDiv(null, 'tipediting-contents');
    
    this._browse = new TipBrowse({
      editing: true,
      allowEdit: true,
      allowDelete: true,
      editCallback: (params) => {this._handleEdit(params);}, 
      deleteCallback: (params) => {this._handleDelete(params);}, 
      dragstartCallback: (e) => {this._dragHandler(e);}, 
      dragendCallback: (e) => {this._dragHandler(e);}
    });
    container.appendChild(await this._browse.render(this._notice));

    return container;
  }
  
  async _loadCategoryListFromDB() {
    var categoryList = null;
    
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'categorylist', this._notice);
    if (queryResults.success) {
      var data = queryResults.categorylist;
      categoryList = [];
      for (var i = 0; i < data.length; i++) {
        categoryList.push(data[i].categorytext);
      }
    };
    
    return categoryList;
  }  
    
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    this._showElement(this._container, makeVisible);
    if (!makeVisible) {
      this._editTipDialog.show(false);
      this._deleteTipDialog.show(false);
    }
      this._showContents(makeVisible);
  }
  
  _showContents(makeVisible) {
    var contents = this._container.getElementsByClassName('tipediting-contents')[0];
    this._showElement(contents, makeVisible);
  }
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    this._browse.update();
  }
 
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  _handleEdit(tipInfo) {
    tipInfo.editable = true;  // as tip list is filtered this should always be true 
    this._showContents(false);
    this._editTipDialog.show(true);
    
    // should probably figure this out too
    if (tipInfo.category.length == 1 && tipInfo.category[0] == null) tipInfo.category = [];
    
    this._editTipDialog.update(tipInfo);
  }
  
  _handleDelete(tipInfo) {
    tipInfo.deletable = true;  // sort this out

    this._showContents(false);
    this._deleteTipDialog.show(true);
    this._deleteTipDialog.update(tipInfo);
  }
  
  async _finishEditTip(tipInfo) {
    var editParams = {
      tipid: tipInfo.params.tipid,
      tiptext: tipInfo.tiptext,
      origcategory: tipInfo.params.category,
      category: tipInfo.category
    }

    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/update', 'tiptextandcategory', editParams, this._notice);
    if (queryResults.success) {
      this._showContents(true);
      this.update();
    }
  }
  
  _cancelEditTip() {
    this._showContents(true);
  }    
  
  async _finishDeleteTip(tipInfo) {
    this._showContents(true);
    
    var deleteParams = {
      tipid: tipInfo.tipid
    };

    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/delete', 'tip', deleteParams, this._notice);
    if (queryResults.success) {
      this._showContents(true);
      this.update();
    }
  }
  
  _cancelDeleteTip() {
    this._showContents(true);
  }    
  
  _dragHandler(e) {
    e.preventDefault();
    return false;
  }

  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
 
}
