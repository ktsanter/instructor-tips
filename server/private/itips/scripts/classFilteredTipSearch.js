//-------------------------------------------------------------------
// FilteredTipSearch
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class FilteredTipSearch {
  constructor(config) {
    this.config = config;
    this.fullTipList = [];
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.config.elemSearch.addEventListener('input', (e) => { this._handleSearchInput(e); });
    this.config.elemTags.addEventListener('change', (e) => { this._handleTagsChange(e); });
  }
  
  async update() {
    console.log('FilteredTipSearch.update');
    this.fullTipList = [];
    var tipList = await this.config.db.getTipList();
    if (!tipList) return;
    
    this.fullTipList = tipList;
    this.config.elemSearch.value = '';
    this._loadTagFilter(tipList);
  }
  
  selectedTips() {
    return this._applyFiltering(this.fullTipList);
  }
    
  //--------------------------------------------------------------
  // private methods
  //-------------------------------------------------------------- 
  _loadTagFilter(tipList) {
    var tagSet = new Set([]);
    for (var i = 0; i < tipList.length; i++) {
      var tip = tipList[i];
      for (var j = 0; j < tip.taglist.length; j++) {
        tagSet.add(tip.taglist[j]);
      }
    }
    
    var fullTagList = Array.from(tagSet).sort();
    var elemTagSelect = this.config.elemTags;
    var elemSelectedTagsContainer = this.config.elemSelectedTags;
    
    UtilityKTS.removeChildren(elemTagSelect);
    UtilityKTS.removeChildren(elemSelectedTagsContainer);
    
    elemTagSelect.appendChild(CreateElement.createOption(null, null, '', ''));
    for (var i = 0; i < fullTagList.length; i++) {
      var tag = fullTagList[i];
      var elemOption = CreateElement.createOption(null, null, tag, tag);
      elemTagSelect.appendChild(elemOption);
    }
  }
  
  _getSelectedTags() {
    var selectedTags = [];
    var elemTagSelect = this.config.elemTags;
    if (elemTagSelect.selectedIndex > 0) selectedTags.push(elemTagSelect[elemTagSelect.selectedIndex].value);
    
    return selectedTags;
  }
    
  _applyFiltering(tipList) {
    console.log('TipsEditingMain._applyFiltering', tipList);
    
    var searchValue = this.config.elemSearch.value.toLowerCase();
    var searchTagSet = new Set(this._getSelectedTags());
    
    var filteredTips = tipList.filter(function(a) {
      var include = a.tipcontent.toLowerCase().includes(searchValue);

      var tipTagSet = new Set(a.taglist);
      var diff = UtilityKTS.setDifference(searchTagSet, tipTagSet);
      include = include && diff.size == 0;

      return include;
    });
    
    return filteredTips;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleSearchInput(e) {
    this.config.callbackChange();
  }
  
  _handleTagsChange(e) {
    console.log('FilteredTipSearch._handleTagsChange', e.target[e.target.selectedIndex].value);
    this.config.callbackChange();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
