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
    this.elemYield = this.config.container.getElementsByClassName('yield-value')[0];
    this.elemIngredientContainer = this.config.container.getElementsByClassName('ingredient-container')[0];  
    this.elemInstructions = this.config.container.getElementsByClassName('instructions')[0];  
    this.elemNotes = this.config.container.getElementsByClassName('notes')[0];
    this.elemImageContainer = this.config.container.getElementsByClassName('image-container')[0];

    var btn = this.config.container.getElementsByClassName('icon-close')[0];
    btn.addEventListener('click', (e) => { this.config.callbackFinishShowing(); });  
  }
  
  async update() {}
  
  async showRecipe(recipe) {
    var menu = await this.config.db.getUserMenu();
    if (menu == null) return;
    
    this.recipe = recipe;
    
    this._renderRecipeName(recipe.recipename);
    this._renderRecipeRating(recipe.rating);
    this._renderRecipeYield(recipe.recipeyield);
    this._renderRecipeIngredients(recipe.ingredients);
    this._renderRecipeInstructions(recipe.instructions);
    this._renderRecipeNotes(recipe.notes);
    this._renderRecipeImage(recipe.recipeimage);
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
  
  _renderRecipeImage(imageURL) {
    console.log(this.elemImageContainer);
    console.log(imageURL);
    UtilityKTS.removeChildren(this.elemImageContainer);

    if (imageURL.trim().length > 0) {
      var elemImage = CreateElement.createImage(null, 'recipe-image', imageURL);
      elemImage.alt = 'recipe image';
      this.elemImageContainer.appendChild(elemImage);
    }
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
