//-------------------------------------------------------------------
// TipsEditingMain
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class TipsEditingMain {
  constructor(config) {
    this.config = config;
    this.sorting = {
      sortBy: 'tipcontent',
      direction: 1
    }
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

    var tipListHead = this.config.container.getElementsByClassName('tiplist-head')[0];
    tipListHead.getElementsByClassName('tips-addtip')[0].addEventListener('click', (e) => { this._handleTipAdd(e); });
    tipListHead.getElementsByClassName('label-tip')[0].addEventListener('click', (e) => { this._handleHeaderClick(e); });
    tipListHead.getElementsByClassName('label-tags')[0].addEventListener('click', (e) => { this._handleHeaderClick(e); });
    tipListHead.getElementsByClassName('label-usage')[0].addEventListener('click', (e) => { this._handleHeaderClick(e); });
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
    var tipList = this._sortTipList(this.tipSearch.selectedTips());
    
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
  
  _sortTipList(tipList) {
    var sortBy = this.sorting.sortBy;
    var direction = this.sorting.direction;
    console.log(this.sorting);
    
    var sorted = tipList.sort(function(a, b) {
      var aval = a[sortBy];
      var bval = b[sortBy];
      
      var result;
      if (typeof aval == 'string') {
        result = direction * aval.toLowerCase().localeCompare(bval.toLowerCase()); 
      } else if (typeof aval == 'number') {
        result = direction * (aval - bval); 
      } else {
        aval = aval.toString().toLowerCase();
        bval = bval.toString().toLowerCase();
        result = direction * aval.localeCompare(bval);
      }
      
      return result;
    });

    return sorted;
  }
  
  _setSortingParameters(sortBy) {
    if (sortBy == this.sorting.sortBy) {
      this.sorting.direction *= -1;
      
    } else {
      this.sorting.sortBy = sortBy;
      this.sorting.direction = 1;
    }
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleHeaderClick(e) {
    var sortBy = null;
    if (e.target.classList.contains('label-tip')) {
      sortBy = 'tipcontent';
    } else if (e.target.classList.contains('label-tags')) {
      sortBy = 'taglist';
    } else if (e.target.classList.contains('label-usage')) {
      sortBy = 'usagecount';
    }
    if (!sortBy) return;
    
    this._setSortingParameters(sortBy);
    this._loadTipListTable();
  }
  
  _searchChange() {
    this._loadTipListTable();
  }
  
  _handleTipAdd(e) {
    this.config.callbackEditOption({
      "editType": 'add',
      "tipInfo": null,
      "callbackCompletion": this.update
    });
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
