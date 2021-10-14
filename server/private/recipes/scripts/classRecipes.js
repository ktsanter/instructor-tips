//-------------------------------------------------------------------
// Recipes
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Recipes {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.recipeListContainer = this.config.container.getElementsByClassName('recipes-list-container')[0];    
    this.recipesList = new RecipesList({
      "container": this.recipeListContainer,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackAdd": () => { this._beginRecipeAdd(); },
      "callbackEdit": (params) => { this._beginRecipeEdit(params); },
      "callbackDelete": (params) => { this._beginRecipeDelete(params); },
      "callbackShow": (params) => { this._showRecipe(params); }
    });
    this.recipesList.render();

    this.recipeEditContainer = this.config.container.getElementsByClassName('recipe-edit-container')[0];
    this.recipesEdit = new RecipesEdit({
      "container": this.recipeEditContainer,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackFinishEditing": (params) => { this._finishEditing(params); }
    });
    this.recipesEdit.render();
    
    this.recipeShowContainer = this.config.container.getElementsByClassName('recipe-show-container')[0];
    this.recipesShow = new RecipesShow({
      "container": this.recipeShowContainer,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackFinishShowing": (params) => { this._finishShowing(params); },
      "callbackAddToMenu": (params) => { this.config.callbackAddToMenu(params); }
    });
    this.recipesShow.render();
        
    this._setMode('list');
  }
  
  async update() {
    await this.recipesList.update();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _setMode(mode) {
    this.mode = mode;
    UtilityKTS.setClass(this.recipeListContainer, this.config.hideClass, this.mode != 'list');
    UtilityKTS.setClass(this.recipeEditContainer, this.config.hideClass, this.mode != 'edit');
    UtilityKTS.setClass(this.recipeShowContainer, this.config.hideClass, this.mode != 'show');
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  _beginRecipeAdd() {
    this.recipesEdit.beginAdd();
    this._setMode('edit');
  }
  
  _beginRecipeEdit(recipe) {
    this.recipesEdit.beginEdit(recipe);
    this._setMode('edit');
  }
  
  _beginRecipeDelete(recipe) {
    this.recipesEdit.beginDelete(recipe);
    this._setMode('edit');
  }
  
  async _finishEditing(params) {
    await this.update();
    this._setMode('list');
  }
  
  _showRecipe(recipe) {
    this.recipesShow.showRecipe(recipe);
    this._setMode('show');
  }
  
  _finishShowing() {
    this._setMode('list');
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
