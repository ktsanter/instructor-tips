//-------------------------------------------------------------------
// RecipesShow
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class RecipesShow {
  constructor(config) {
    this.config = config;
    this.recipe = null;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.elemIconAdd = this.config.container.getElementsByClassName('icon-add')[0];
    this.elemName = this.config.container.getElementsByClassName('recipe-name')[0];  
    this.elemRating = this.config.container.getElementsByClassName('rating')[0];  
    this.elemYield = this.config.container.getElementsByClassName('yield-value')[0];
    this.elemIngredientContainer = this.config.container.getElementsByClassName('ingredient-container')[0];  
    this.elemInstructions = this.config.container.getElementsByClassName('instructions')[0];  
    this.elemNotes = this.config.container.getElementsByClassName('notes')[0];  

    var btn = this.config.container.getElementsByClassName('icon-close')[0];
    btn.addEventListener('click', (e) => { this.config.callbackFinishShowing(); });  

    this.elemIconAdd.addEventListener('click', (e) => { this._handleChangeMenu(e); });  
  }
  
  async update() {
  }
  
  async showRecipe(recipe) {
    var menu = await this.config.db.getUserMenu();
    if (menu == null) return;
    
    this.recipe = recipe;
    this._setAddToMenuControl(recipe, menu);
    
    this._renderRecipeName(recipe.recipename);
    this._renderRecipeRating(recipe.rating);
    this._renderRecipeYield(recipe.recipeyield);
    this._renderRecipeIngredients(recipe.ingredients);
    this._renderRecipeInstructions(recipe.instructions);
    this._renderRecipeNotes(recipe.notes);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _setAddToMenuControl(recipe, menu) {
    var filtered = menu.filter(function (a) {
      return a.recipeid == recipe.recipeid;
    });
    
    var isOnMenu = filtered.length > 0;
    UtilityKTS.setClass(this.elemIconAdd, 'is-on-menu', isOnMenu);
    if (isOnMenu) {
      this.elemIconAdd.title = 'remove from menu';
    } else {
      this.elemIconAdd.title = 'add to menu';
    }
  }
  
  _renderRecipeName(name) {
    UtilityKTS.removeChildren(this.elemName);
    this.elemName.innerHTML = name;
  }
  
  _renderRecipeRating(rating) {
    UtilityKTS.removeChildren(this.elemRating);
    for (var i = 0; i < 5; i++) {
      var elemStar = CreateElement.createIcon(null, 'fas fa-star');
      if (i >= rating) UtilityKTS.setClass(elemStar, 'dim-star', true);
      this.elemRating.appendChild(elemStar);
    }
  }
  
  _renderRecipeYield(recipeYield) {
    UtilityKTS.removeChildren(this.elemYield);
    this.elemYield.innerHTML = recipeYield;
  }
  
  _renderRecipeIngredients(ingredients) {
    UtilityKTS.removeChildren(this.elemIngredientContainer);
    for (var i = 0; i < ingredients.length; i++) {
      var item = ingredients[i];
      this.elemIngredientContainer.appendChild(CreateElement.createDiv(null, 'ingredient-name', item.ingredientname));
    }
  }

  _renderRecipeInstructions(instructions) {
    UtilityKTS.removeChildren(this.elemInstructions);
    this.elemInstructions.innerHTML = this._convertNewLines(instructions);
  }
  
  _renderRecipeNotes(notes) {
    UtilityKTS.removeChildren(this.elemNotes);
    this.elemNotes.innerHTML = notes;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleChangeMenu(e) {
    var success = false;
    
    if (this.elemIconAdd.classList.contains('is-on-menu')) {
      success = await this.config.callbackChangeMenu(this.recipe, 'remove');
    } else {
      success = await this.config.callbackChangeMenu(this.recipe, 'add');
    }
    
    await this.showRecipe(this.recipe);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _convertNewLines(str) {
    return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
  }
}
