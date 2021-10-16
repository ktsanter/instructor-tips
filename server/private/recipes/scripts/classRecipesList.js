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
      "callbackChange": () => { this._searchChange(); }
    });
    this.recipeSearch.render();    
    
    this.recipeImport = new ImportRecipe({});
    
    this.config.container.getElementsByClassName('recipes-addrecipe')[0].addEventListener('click', (e) => { this._handleRecipeAdd(e); });
    
    this.recipeListBody = this.config.container.getElementsByClassName('recipelist-body')[0];
    this.recipeListTemplateRow = this.config.container.getElementsByClassName('recipelist-templaterow')[0];
    
    this.recipeDropdownContainer = this.config.container.getElementsByClassName('recipe-contextmenu')[0];
    this.recipeDropdownContents = this.recipeDropdownContainer.getElementsByClassName('recipe-dropdowncontent')[0];
    this.recipeDropdownContainer.getElementsByClassName('recipe-dropdownitem item-edit')[0].addEventListener('click', (e) => { this._handleRecipeEdit(e); });
    this.recipeDropdownContainer.getElementsByClassName('recipe-dropdownitem item-delete')[0].addEventListener('click', (e) => { this._handleRecipeDelete(e); });

    this.config.container.getElementsByClassName('importfile')[0].addEventListener('change', (e) => { this._handleImport(e); });
    
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
    await this.recipeSearch.update();

    this._loadRecipeList();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _loadRecipeList() {
    var filteredList = this._sortAndFilterRecipes();
    
    UtilityKTS.removeChildren(this.recipeListBody);
    for (var i = 0; i < filteredList.length; i++) {
      var recipe = filteredList[i];
      var row = this.recipeListTemplateRow.cloneNode(true);
      UtilityKTS.setClass(row, 'recipelist-templaterow', false);
      row.setAttribute('recipe-info', JSON.stringify(recipe));
      
      var elemRecipeName = row.getElementsByClassName('recipelist-recipename')[0];
      elemRecipeName.innerHTML = recipe.recipename;
      elemRecipeName.addEventListener('click', (e) => { this._handleRecipeClick(e); });
      elemRecipeName.addEventListener('contextmenu', (e) => { this._handleRecipeContextMenu(e); });
      
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
  
  async _doRecipeImport(params) {
    var recipeInfo = await this.recipeImport.importRecipe(params);
    if (recipeInfo != null) this.config.callbackEdit(recipeInfo);
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleImport(e) {
    if (e.target.files.length == 0) return;  

    var importParams = {
      importType: 'epicurious',
      importFile: e.target.files[0]
    }

    await this._doRecipeImport(importParams);

    e.target.value = null;    
  }
  
  _handleRecipeClick(e) {
    var targetRow = this._upsearchForRow(e.target);
    if (targetRow == null) return;
    
    var recipeInfo = JSON.parse(targetRow.getAttribute('recipe-info'));
    this.config.callbackShow(recipeInfo);
  }
  
  _handleRecipeContextMenu(e) {
    if (!e.target.classList.contains('recipelist-recipename')) return false;
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
  _searchChange(params) {
    this._loadRecipeList();
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
