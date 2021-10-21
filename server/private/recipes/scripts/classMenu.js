//-------------------------------------------------------------------
// Menu
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Menu {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.menuMainContainer = this.config.container.getElementsByClassName('menu-main-container')[0];
    this.menuTableBody = this.config.container.getElementsByClassName('menulist-body')[0];
    this.menuTemplateRow = this.config.container.getElementsByClassName('menulist-templaterow')[0];
    this.recipeShowContainer = this.config.container.getElementsByClassName('menu-show-container')[0];
    
    UtilityKTS.setClass(this.menuMainContainer, this.config.hideClass, false);
    UtilityKTS.setClass(this.recipeShowContainer, this.config.hideClass, true);    
    
    this.recipeShow = new RecipesShow({
      "container": this.recipeShowContainer,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackFinishShowing": () => { this._finishShowing(); },
      "callbackChangeMenu": (recipe, changeMode) => { return this.config.callbackChangeMenu(recipe, changeMode); }
    });
    this.recipeShow.render();    
  }
  
  async update() {
    var recipeList = await this.config.db.getUserMenu();
    if (recipeList == null) return;
    
    this._finishShowing();
    this._loadMenu(recipeList);
  }
  
  async addToMenu(recipe) {
    var success = await this.config.db.addToMenu(recipe);
    if (success) success = await this.config.db.addRecipeToShopping(recipe.recipeid);
    return success;
  }
  
  async removeFromMenu(recipe) {
    var success = await this.config.db.removeFromMenu(recipe);
    if (success) success = await this.config.db.removeRecipeFromShopping(recipe.recipeid);
    return success;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _loadMenu(recipeList) {
    UtilityKTS.removeChildren(this.menuTableBody);
    for (var i = 0; i < recipeList.length; i++) {
      this._addRecipeRow(recipeList[i]);
    }
  }
  
  _addRecipeRow(recipe) {
    var row = this.menuTemplateRow.cloneNode(true);
    
    UtilityKTS.setClass(row, this.config.hideClass, false);
    UtilityKTS.setClass(row, 'menulist-templaterow', false);
    UtilityKTS.setClass(row, 'single-recipe', true);
    
    var controlCell = row.getElementsByClassName('controls')[0];
    var deleteIcon = controlCell.getElementsByClassName('delete-icon')[0];
    deleteIcon.addEventListener('click', (e) => { this._handleDelete(e); });
    deleteIcon.setAttribute('recipe-info', JSON.stringify(recipe));
    
    var nameCell = row.getElementsByClassName('recipename')[0];
    nameCell.innerHTML = recipe.recipename;
    nameCell.setAttribute('recipe-info', JSON.stringify(recipe));    
    nameCell.addEventListener('click', (e) => { this._handleRecipeClick(e); });
    
    this.menuTableBody.appendChild(row);
  }
  
  async _showRecipe(recipeInfo) {
    var recipe = await this.config.db.getRecipe(recipeInfo.recipeid);
    if (recipe == null) return;
    
    await this.recipeShow.showRecipe(recipe)
    UtilityKTS.setClass(this.menuMainContainer, this.config.hideClass, true);
    UtilityKTS.setClass(this.recipeShowContainer, this.config.hideClass, false);
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleDelete(e) {
    var recipeInfo = JSON.parse(e.target.getAttribute('recipe-info'));

    var success = this.removeFromMenu(recipeInfo);
    if (!success) return;
    
    this.update();
  }
  
  async _handleRecipeClick(e) {
    var recipeInfo = JSON.parse(e.target.getAttribute('recipe-info'));
    await this._showRecipe(recipeInfo);
  }
  
  _finishShowing() {
    UtilityKTS.setClass(this.menuMainContainer, this.config.hideClass, false);
    UtilityKTS.setClass(this.recipeShowContainer, this.config.hideClass, true);   
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
