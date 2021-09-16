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
    
    var tagDropdownLabel = CreateElement.createDiv(null, 'tagselect-dropdown-label', 'tags');
    tagDropdownLabel.addEventListener('click', (e) => { this._handleTagDropdown(e); });
    this.config.elemTagContainer.appendChild(tagDropdownLabel);
    
    this.tagDropdown = CreateElement.createDiv(null, 'tagselect-dropdown dd-closed');
    this.config.elemTagContainer.appendChild(this.tagDropdown);
    
    this.selectedTagsContainer = CreateElement.createDiv(null, 'tagselect-selected-container', 'selected tags container');
    this.config.elemTagContainer.appendChild(this.selectedTagsContainer);
  }
  
  async update() {
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
    
    UtilityKTS.removeChildren(this.tagDropdown);
    for (var i = 0; i < fullTagList.length; i++) {
      var tag = fullTagList[i];
      var elem = CreateElement.createDiv(null, 'tagselect-item', tag);
      elem.setAttribute('tag-value', tag);
      elem.addEventListener('click', (e) => { this._handleTagsChange(e); });
      this.tagDropdown.appendChild(elem);
    }
    
    UtilityKTS.removeChildren(this.selectedTagsContainer); 
    this._setSelectedTags([]);    
  }
  
  _applyFiltering(tipList) {
    var searchValue = this.config.elemSearch.value.toLowerCase();
    var searchTagSet = new Set(this._getSelectedTags());
    console.log('_applyFiltering', searchValue, searchTagSet);
    
    var filteredTips = tipList.filter(function(a) {
      var include = a.tipcontent.toLowerCase().includes(searchValue);

      var tipTagSet = new Set(a.taglist);
      var diff = UtilityKTS.setDifference(searchTagSet, tipTagSet);
      include = include && diff.size == 0;

      return include;
    });
    
    return filteredTips;
  }
  
  _getSelectedTags() {
    return JSON.parse(this.selectedTagsContainer.getAttribute('selected-tag-list'));
  }
  
  _setSelectedTags(tagList) {
    this.selectedTagsContainer.setAttribute('selected-tag-list', JSON.stringify(tagList));
  }
  
  _displaySelectedTags() {
    var selectedTags = this._getSelectedTags().sort();
    UtilityKTS.removeChildren(this.selectedTagsContainer);
    for (var i = 0; i < selectedTags.length; i++) {
      var itemContainer = CreateElement.createDiv(null, 'tagitem');
      this.selectedTagsContainer.appendChild(itemContainer);
      
      var elemValue = CreateElement.createDiv(null, 'tagitem-value', selectedTags[i]);
      itemContainer.appendChild(elemValue);
      elemValue.addEventListener('mouseover', (e) => { this._handleTagItemHover(e, true); });
      elemValue.addEventListener('mouseleave', (e) => { this._handleTagItemHover(e, false); });
      
      var elemControlContainer = CreateElement.createDiv(null, 'tagitem-control');
      itemContainer.appendChild(elemControlContainer);
      
      var elemControl = CreateElement._createElement('i', null, 'far fa-times-circle');
      elemControlContainer.appendChild(elemControl);
      elemControl.setAttribute('tag-value', JSON.stringify(selectedTags[i]));
      elemControl.addEventListener('click', (e) => { this._handleTagRemove(e); });
      
    }
  }
    
  _updateSelectedTags(updateType, tagValue) {
    var currentTagList = this._getSelectedTags();

    var currentTagSet = new Set(currentTagList);
    if (updateType == 'add') {
      currentTagSet.add(tagValue);
    } else {
      currentTagSet.delete(tagValue);
    }
    currentTagList = Array.from(currentTagSet);
    this._setSelectedTags(currentTagList);
    
    this._displaySelectedTags();
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleSearchInput(e) {
    this.config.callbackChange();
  }
  
  _handleTagDropdown(e) {
    UtilityKTS.toggleClass(this.tagDropdown, 'dd-closed');
  }
  
  _handleTagsChange(e) {
    UtilityKTS.setClass(this.tagDropdown, 'dd-closed', true);    
    var tagValue = e.target.getAttribute('tag-value');
    this._updateSelectedTags('add', tagValue);
    this.config.callbackChange();
  }
  
  _handleTagRemove(e) {
    var tagValue = JSON.parse(e.target.getAttribute('tag-value'));
    this._updateSelectedTags('remove', tagValue);
    this.config.callbackChange();
  }
  
  _handleTagItemHover(e, enter) {
    var controlContainer = e.target.nextSibling;
    UtilityKTS.setClass(controlContainer, 'hovering', enter);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
