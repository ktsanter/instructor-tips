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
  
  async getRecipe(recipeId) {
    var dbResult = await SQLDBInterface.doPostQuery('recipes/query', 'recipe', {"recipeid": recipeId}, this.config.notice);    
    if (!dbResult.success) return null;
    
    return dbResult.data;
  }

  async saveRecipe(mode, recipe) {
    var success = false;

    if (mode == 'add' || recipe.recipeid == null || recipe.recipeid == 'null') {
      var dbResult = await SQLDBInterface.doPostQuery('recipes/insert', 'recipe', recipe, this.config.notice);
      success = dbResult.success;

    } else {
      var dbResult = await SQLDBInterface.doPostQuery('recipes/update', 'recipe', recipe, this.config.notice);
      success = dbResult.success;
    }
    
    return success;
  }
  
  async deleteRecipe(recipe) {
    var success = false;
    
    var dbResult = await SQLDBInterface.doPostQuery('recipes/delete', 'recipe', recipe, this.config.notice);    
    success = dbResult.success;
    
    return success;
  }
  
  async getUserMenu() {
    var dbResult = await SQLDBInterface.doGetQuery('recipes/query', 'menu', this.config.notice);
    if (!dbResult.success) return null;
    
    return dbResult.data;
  }
  
  async addToMenu(recipe) {
    var dbResult = await SQLDBInterface.doPostQuery('recipes/insert', 'menu', {"recipeid": recipe.recipeid}, this.config.notice);
    return dbResult.success;
  }
  
  async removeFromMenu(recipe) {
    var dbResult = await SQLDBInterface.doPostQuery('recipes/delete', 'menu', {"recipeid": recipe.recipeid}, this.config.notice);
    return dbResult.success;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
  