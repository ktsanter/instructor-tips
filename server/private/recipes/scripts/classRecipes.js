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
    console.log('Recipes.render');
    this.recipeListContainer = this.config.container.getElementsByClassName('recipes-list-container')[0];
    this.recipeEditContainer = this.config.container.getElementsByClassName('recipe-edit-container')[0];
    
    this.recipesList = new RecipesList({
      "container": this.recipeListContainer,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackAdd": () => { this._beginRecipeAdd(); },
      "callbackEdit": (params) => { this._beginRecipeEdit(params); },
      "callbackDelete": (params) => { this._beginRecipeDelete(params); }
    });
    this.recipesList.render();

    this.recipesEdit = new RecipesEdit({
      "container": this.recipeEditContainer,
      "hideClass": this.config.hideClass,
      "db": this.config.db,
      "callbackFinishEditing": (params) => { this._finishEditing(params); }
    });
    this.recipesEdit.render();
    
    this._setMode('list');
  }
  
  async update() {
    console.log('Recipes.update:', this.mode);
    await this.recipesList.update();
    await this.recipesEdit.update();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _setMode(mode) {
    this.mode = mode;
    UtilityKTS.setClass(this.recipeListContainer, this.config.hideClass, this.mode != 'list');
    UtilityKTS.setClass(this.recipeEditContainer, this.config.hideClass, this.mode == 'list');
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  _beginRecipeAdd() {
    this.recipesEdit.beginAdd();
    this._setMode('add');
  }
  
  _beginRecipeEdit(params) {
    this.recipesEdit.beginEdit(params);
    this._setMode('edit');
  }
  
  _beginRecipeDelete(params) {
    this.recipesEdit.beginDelete(params);
    this._setMode('delete');
  }
  
  async _finishEditing(params) {
    await this.update();
    this._setMode('list');
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
