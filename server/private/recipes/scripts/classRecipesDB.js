//-------------------------------------------------------------------
// RecipesDB
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class RecipesDB {
  constructor(config) {
    this.config = config;
    
    
    this.dummyRecipeList = [
      {"recipeid": 100, "recipename": "some recipe with a name that is quite a bit longer"},
      {"recipeid": 101, "recipename": "another recipe"},
      {"recipeid": 102, "recipename": "random recipe"},
    ];    
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
    var recipeList = this.dummyRecipeList;
    
    var dbResult = {"success": true, "details": 'query succeeded', "data": recipeList};
    if (!dbResult.success) return null;
    
    return dbResult.data;    
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
  