//-------------------------------------------------------------------
// TipsEditingMain
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class TipsEditingMain {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.tipListBody = this.config.container.getElementsByClassName('tiplist-body')[0];
    this.tipListTemplateRow = this.config.container.getElementsByClassName('tiplist-templaterow')[0];
    
    this.tipSearch = new FilteredTipSearch({
      "db": this.config.db,
      "elemSearch": this.config.container.getElementsByClassName('input-search')[0],
      "elemTagContainer": this.config.container.getElementsByClassName('tagselect-container')[0],
      "callbackChange": () => { this._searchChange(); }
    });
    this.tipSearch.render();
  }
  
  async update() {
    await this.tipSearch.update();
    this._loadTipListTable();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------  
  _loadTipListTable() {
    UtilityKTS.removeChildren(this.tipListBody);
    var tipList = this.tipSearch.selectedTips();
    
    for (var i = 0; i < tipList.length; i++) {
      var tip = tipList[i];
      var tipRow = this.tipListTemplateRow.cloneNode(true);
      
      var editControl = tipRow.getElementsByClassName('tiplist-edit')[0];
      editControl.setAttribute('tip-info', JSON.stringify(tip));
      editControl.addEventListener('click', (e) => { this._handleTipEdit(e); });

      var deleteControl = tipRow.getElementsByClassName('tiplist-delete')[0];
      deleteControl.setAttribute('tip-info', JSON.stringify(tip));
      deleteControl.addEventListener('click', (e) => { this._handleTipDelete(e); });
      
      tipRow.getElementsByClassName('tiplist-content')[0].innerHTML = tip.tipcontent;
      tipRow.getElementsByClassName('tiplist-tags')[0].innerHTML = tip.taglist;
      tipRow.getElementsByClassName('tiplist-usage')[0].innerHTML = tip.usagecount;
      
      this.tipListBody.appendChild(tipRow);
    }
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _searchChange() {
    this._loadTipListTable();
  }
  
  _handleTipEdit(e) {
    this.config.callbackEditOption({
      "editType": 'edit',
      "tipInfo": JSON.parse(e.target.getAttribute('tip-info')),
      "callbackCompletion": this.update
    });
  }
  
  _handleTipDelete(e) {
    this.config.callbackEditOption({
      "editType": 'delete',
      "tipInfo": JSON.parse(e.target.getAttribute('tip-info')),
      "callbackCompletion": this.update
    });
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
