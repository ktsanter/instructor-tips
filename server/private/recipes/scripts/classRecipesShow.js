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
    this.elemName = this.config.container.getElementsByClassName('recipe-name')[0];  
    this.elemRating = this.config.container.getElementsByClassName('rating')[0];  
    this.elemIngredientContainer = this.config.container.getElementsByClassName('ingredient-container')[0];  
    this.elemInstructions = this.config.container.getElementsByClassName('instructions')[0];  
    this.elemNotes = this.config.container.getElementsByClassName('notes')[0];  

    var btn = this.config.container.getElementsByClassName('icon-close')[0];
    btn.addEventListener('click', (e) => { this.config.callbackFinishShowing(); });  

    var btn = this.config.container.getElementsByClassName('icon-add')[0];
    btn.addEventListener('click', (e) => { this.config.callbackAddToMenu(this.recipe); });  
  }
  
  async update() {
  }
  
  async showRecipe(recipe) {
    this.recipe = recipe;
    this._renderRecipeName(recipe.recipename);
    this._renderRecipeRating(recipe.rating);
    this._renderRecipeIngredients(recipe.ingredients);
    this._renderRecipeInstructions(recipe.instructions);
    this._renderRecipeNotes(recipe.notes);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _renderRecipeName(name) {
    UtilityKTS.removeChildren(this.elemName);
    this.elemName.innerHTML = name;
  }
  
  _renderRecipeRating(rating) {
    UtilityKTS.removeChildren(this.elemRating);
    for (var i = 0; i < rating; i++) {
      var elemStar = CreateElement.createIcon(null, 'fas fa-star');
      this.elemRating.appendChild(elemStar);
    }
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

  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _convertNewLines(str) {
    return str.replace(/(?:\r\n|\r|\n)/g, '<br>');
  }
}
