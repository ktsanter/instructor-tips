//-------------------------------------------------------------------
// FilteredRecipeSearch
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class FilteredRecipeSearch {
  constructor(config) {
    this.config = config;
    
    this.fullRecipeList = [];
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.config.elemSearch.addEventListener('input', (e) => { this._handleSearchInput(e); });
    
    this.tagDropdownLabel = CreateElement.createDiv(null, 'tagselect-dropdown-label p-2', 'tags');
    this.tagDropdownLabel.addEventListener('click', (e) => { this._handleTagDropdown(e); });
    this.config.elemTagContainer.appendChild(this.tagDropdownLabel);
    this.tagDropdownLabel.appendChild(CreateElement.createIcon(null, 'icon-open dd-closed fas fa-caret-down'));
    this.tagDropdownLabel.appendChild(CreateElement.createIcon(null, 'icon-closed fas fa-caret-right'));
    
    this.tagDropdown = CreateElement.createDiv(null, 'tagselect-dropdown dd-closed');
    this.config.elemTagContainer.appendChild(this.tagDropdown);
    
    this.selectedTagsContainer = CreateElement.createDiv(null, 'tagselect-selected-container', '[selected tags container]');
    this.config.elemTagContainer.appendChild(this.selectedTagsContainer);
    
    this.madeInputs = this.config.elemMadeContainer.getElementsByTagName('input');
    for (var i = 0; i < this.madeInputs.length; i++) {
      this.madeInputs[i].addEventListener('change', (e) => { this._handleMadeInput(e); });
    }
    
    this.ratingInputs = this.config.elemRatingContainer.getElementsByTagName('input');
    for (var i = 0; i < this.ratingInputs.length; i++) {
      this.ratingInputs[i].addEventListener('change', (e) => { this._handleRatingInput(e); });
    }
  }
  
  async update() {
    this.fullRecipeList = [];
    var recipeList = await this.config.db.getRecipeList();
    if (!recipeList) return;
    
    this.fullRecipeList = recipeList;
    this._loadTagFilter(recipeList);
  }
  
  selectedRecipes() {
    return this._applyFiltering(this.fullRecipeList);
  }
    
  //--------------------------------------------------------------
  // private methods
  //-------------------------------------------------------------- 
  _loadTagFilter(recipeList) {
    var selectedTagSetOld = new Set(this._getSelectedTags());
    
    var tagSet = new Set([]);
    for (var i = 0; i < recipeList.length; i++) {
      var recipe = recipeList[i];
      for (var j = 0; j < recipe.taglist.length; j++) {
        tagSet.add(recipe.taglist[j]);
      }
    }
    
    var fullRecipeList = Array.from(tagSet).sort();
    
    var selectedTagSetNew = new Set([]);
    
    UtilityKTS.removeChildren(this.tagDropdown);
    for (var i = 0; i < fullRecipeList.length; i++) {
      var tag = fullRecipeList[i];
      var elem = CreateElement.createDiv(null, 'tagselect-item', tag);
      elem.setAttribute('tag-value', tag);
      elem.addEventListener('click', (e) => { this._handleTagsChange(e); });
      this.tagDropdown.appendChild(elem);
      
      if (selectedTagSetOld.has(tag)) selectedTagSetNew.add(tag);
    }
    
    UtilityKTS.removeChildren(this.selectedTagsContainer); 
    
    this._setSelectedTags(Array.from(selectedTagSetNew));  
    this._displaySelectedTags();    
  }
  
  _applyFiltering(recipeList) {
    var searchValue = this.config.elemSearch.value.toLowerCase();
    var searchTagSet = new Set(this._getSelectedTags());
    var searchMadeValue = this._getSelectedMadeValue();
    var searchRatingSet = new Set(this._getSelectedRatings());
    
    console.log('searchMadeValue', searchMadeValue);
    
    var filtered = recipeList.filter(function(a) {
      var include = a.recipename.toLowerCase().includes(searchValue);

      var tagSet = new Set(a.taglist);
      var diff = UtilityKTS.setDifference(searchTagSet, tagSet);
      include = include && diff.size == 0;
      
      include = include && searchRatingSet.has(a.rating);

      return include;
    });

    return filtered;
  }
  
  _getSelectedTags() {
    return JSON.parse(this.selectedTagsContainer.getAttribute('selected-tag-list'));
  }
  
  _getSelectedMadeValue() {
    var madeValue;
    for (var i = 0; i < this.madeInputs.length && madeValue == null; i++) {
      var elem = this.madeInputs[i];
      if (elem.checked) madeValue = elem.value;
    }
    
    return madeValue;
  }
  
  _getSelectedRatings() {
    var ratings = [];
    for (var i = 0; i < this.ratingInputs.length; i++) {
      var elem = this.ratingInputs[i];
      if (elem.checked) ratings.push(parseInt(elem.value));
    }
    
    return ratings;
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
    var isClosed = this.tagDropdown.classList.contains('dd-closed');
    UtilityKTS.setClass(this.tagDropdownLabel.getElementsByClassName('icon-open')[0], 'dd-closed', isClosed);
    UtilityKTS.setClass(this.tagDropdownLabel.getElementsByClassName('icon-closed')[0], 'dd-closed', !isClosed);
  }
  
  _handleTagsChange(e) {
    UtilityKTS.setClass(this.tagDropdown, 'dd-closed', true);    
    UtilityKTS.setClass(this.tagDropdownLabel.getElementsByClassName('icon-open')[0], 'dd-closed', true);
    UtilityKTS.setClass(this.tagDropdownLabel.getElementsByClassName('icon-closed')[0], 'dd-closed', false);

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
  
  _handleMadeInput(e) {
    this.config.callbackChange();
  }
  
  _handleRatingInput(e) {
    this.config.callbackChange();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
