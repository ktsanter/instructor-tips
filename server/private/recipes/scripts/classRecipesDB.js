//-------------------------------------------------------------------
// RecipesDB
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class RecipesDB {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //-------------------------------------------------------------- 
  async isAdminAllowedForUser() {
    var dbResult = await SQLDBInterface.doGetQuery('recipes/query', 'admin-allowed', this.config.notice);
    if (!dbResult.success) return false;
    
    return dbResult.data.adminallowed;
  }
  
  async getRecipeList() {
    var dbResult = await SQLDBInterface.doGetQuery('recipes/query', 'recipe-list', this.config.notice);
    if (!dbResult.success) return null;
    
    return dbResult.data;
  }
  
  async saveRecipe(mode, recipe) {
    var success = false;

    if (mode == 'add' || recipe.recipeid == null || recipe.recipeid == 'null') {
      console.log('RecipesDB.saveRecipe', 'add recipe', recipe);
      var dbResult = await SQLDBInterface.doPostQuery('recipes/insert', 'recipe', recipe, this.config.notice);
      success = dbResult.success;

    } else {
      console.log('RecipesDB.saveRecipe', 'update recipe', recipe);
    }
    
    return success;
  }
  
  async deleteRecipe(recipe) {
    console.log('RecipesDB.deleteRecipe', recipe.recipeid);
    var success = false;
    
    success = true;
    
    return success;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
  