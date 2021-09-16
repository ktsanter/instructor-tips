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
      "elemTags": this.config.container.getElementsByClassName('tag-select')[0],
      "elemSelectedTags": this.config.container.getElementsByClassName('selected-tag-container')[0],
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
    var tipInfo = JSON.parse(e.target.getAttribute('tip-info'));
    console.log('_handleTipEdit', tipInfo);
  }
  
  _handleTipDelete(e) {
    var tipInfo = JSON.parse(e.target.getAttribute('tip-info'));
    console.log('_handleTipDelete', tipInfo);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
