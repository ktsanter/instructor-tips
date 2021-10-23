//-------------------------------------------------------------------
// RecipesList
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class RecipesList {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.recipeSearch = new FilteredRecipeSearch({
      "db": this.config.db,
      "elemSearch": this.config.container.getElementsByClassName('input-recipesearch')[0],
      "elemTagContainer": this.config.container.getElementsByClassName('tagselect-container')[0],
      "elemMadeContainer": this.config.container.getElementsByClassName('madeselect-container')[0],
      "elemRatingContainer": this.config.container.getElementsByClassName('ratingselect-container')[0],
      "callbackChange": () => { this._searchChange(); }
    });
    this.recipeSearch.render();    
    
    this.config.container.getElementsByClassName('recipes-addrecipe')[0].addEventListener('click', (e) => { this._handleRecipeAdd(e); });
    
    this.recipeListBody = this.config.container.getElementsByClassName('recipelist-body')[0];
    this.recipeListTemplateRow = this.config.container.getElementsByClassName('recipelist-templaterow')[0];
    
    this.recipeDropdownContainer = this.config.container.getElementsByClassName('recipe-contextmenu')[0];
    this.recipeDropdownContents = this.recipeDropdownContainer.getElementsByClassName('recipe-dropdowncontent')[0];
    this.recipeDropdownContainer.getElementsByClassName('recipe-dropdownitem item-edit')[0].addEventListener('click', (e) => { this._handleRecipeEdit(e); });
    this.recipeDropdownContainer.getElementsByClassName('recipe-dropdownitem item-delete')[0].addEventListener('click', (e) => { this._handleRecipeDelete(e); });

    // to manage closing context menu
    document.onkeydown = (e) => { 
      if (e.key === 'Escape' || e.which === 27 || e.keyCode === 27) this._closeRecipeDropdown();
    };
    document.onmousedown = (e) => { this._closeRecipeDropdown(); };    
    this.recipeDropdownContainer.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    window.onblur = () => { this._closeRecipeDropdown(); };
  }
  
  async update() {
    this.recipeList = await this.config.db.getRecipeList();
    if (this.recipeList == null) return;
    
    await this.recipeSearch.update();
    
    await this._loadRecipeList();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  async _loadRecipeList() {
    var filteredList = this._sortAndFilterRecipes();
    var menuList = await this.config.db.getUserMenu();
    if (menuList == null) return;
    
    for (var i = 0; i < filteredList.length; i++) {
      var recipe = filteredList[i];
      var found = menuList.find((a) => { return a.recipeid == recipe.recipeid; });
      recipe.isOnMenu = (found != null);
    }
    
    UtilityKTS.removeChildren(this.recipeListBody);
    for (var i = 0; i < filteredList.length; i++) {
      var recipe = filteredList[i];

      var row = this.recipeListTemplateRow.cloneNode(true);
      row.setAttribute('recipe-info', JSON.stringify(recipe));
      UtilityKTS.setClass(row, 'recipelist-templaterow', false);
      UtilityKTS.setClass(row, 'single-recipe', true);
      
      var elemRecipeCheck = row.getElementsByClassName('recipe-check')[0];
      elemRecipeCheck.checked = recipe.isOnMenu;
      elemRecipeCheck.addEventListener('click', (e) => { this._handleRecipeCheck(e); });
      
      var cellRecipeName = row.getElementsByClassName('recipelist-recipename')[0];
      var elemRecipeName = cellRecipeName.getElementsByClassName('recipename-text')[0];
      elemRecipeName.innerHTML = recipe.recipename;
      UtilityKTS.setClass(elemRecipeName, 'is-on-menu', recipe.isOnMenu);

      elemRecipeName.addEventListener('click', (e) => { this._handleRecipeClick(e); });
      elemRecipeName.addEventListener('contextmenu', (e) => { this._handleRecipeContextMenu(e); });
      
      for (var star = 0; star < recipe.rating; star++) {
        var elemStar = cellRecipeName.getElementsByClassName('star' + (star + 1))[0];
        UtilityKTS.setClass(elemStar, 'highlight-star', true);
      }
      
      this.recipeListBody.appendChild(row);
    }
  }
  
  _sortAndFilterRecipes() {
    var filtered = this.recipeSearch.selectedRecipes();

    var sorted = filtered.sort(function(a, b) { 
      return a.recipename.toLowerCase().localeCompare(b.recipename.toLowerCase());
    });
    
    return sorted;
  }
  
  _openRecipeDropdown(target, targetX, targetY) {
    var targetRow = this._upsearchForRow(target);
    if (targetRow == null) return;
    
    this.recipeDropdownContainer.setAttribute('recipe-info', targetRow.getAttribute('recipe-info'));
    target.appendChild(this.recipeDropdownContainer);

    UtilityKTS.setClass(this.recipeDropdownContents, 'show', true);
  }
  
  _closeRecipeDropdown() {
    UtilityKTS.setClass(this.recipeDropdownContents, 'show', false);
  }
  
  async makeMenuChange(recipeInfo, changeMode) {
    var success = await this.config.callbackChangeMenu(recipeInfo, changeMode);
    return success;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleRecipeClick(e) {
    var targetRow = this._upsearchForRow(e.target);
    if (targetRow == null) return;
    
    var recipeInfo = JSON.parse(targetRow.getAttribute('recipe-info'));
    this.config.callbackShow(recipeInfo);
  }
  
  async _handleRecipeCheck(e) {
    var row = this._upsearchForRow(e.target);
    if (row == null) return;
    
    var recipeInfo = JSON.parse(row.getAttribute('recipe-info'));
    var changeMode = e.target.checked ? 'add': 'remove';
    var success = await this.makeMenuChange(recipeInfo, changeMode);
    if (!success) return;
    
    this.update();
  }
  
  _handleRecipeContextMenu(e) {
    if (!e.target.classList.contains('recipename-text')) return false;
    e.preventDefault();
    this._openRecipeDropdown(e.target, e.clientX, e.clientY);
  }
  
  _handleRecipeAdd(e) {
    this.config.callbackAdd();
  }
  
  _handleRecipeEdit(e) {
    var recipeInfo = JSON.parse(this.recipeDropdownContainer.getAttribute('recipe-info'));
    e.stopPropagation();
    this._closeRecipeDropdown();
    this.config.callbackEdit(recipeInfo);
  }
  
  _handleRecipeDelete(e) {
    var recipeInfo = JSON.parse(this.recipeDropdownContainer.getAttribute('recipe-info'));
    e.stopPropagation();
    this._closeRecipeDropdown();
    this.config.callbackDelete(recipeInfo);
  }
    
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------
  async _searchChange(params) {
    await this._loadRecipeList();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _upsearchForRow(origNode) {
    var elemRow = null;
    var node = origNode;

    for (var i = 0; i < 5 && elemRow == null; i++) {
      if (node.tagName == 'TD') {
        elemRow = node.parentNode;
      } else {
        node = node.parentNode;
      }
    }
    
    if (elemRow == null) console.log('Recipes._upsearchForRow failed for', origNode);
    return elemRow;
  }
}
