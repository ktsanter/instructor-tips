//-------------------------------------------------------------------
// RecipesDB
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class RecipesDB {
  constructor(config) {
    this.config = config;
    
    
    this.dummyRecipeList = [
      {
        "recipeid": 100, 
        "recipename": "scrambled eggs",
        "rating": 3,
        "taglist": ["eggs", "breakfast"],
        "ingredients": [
          {"ingredientid": 7,  "ingredientname": "3 large eggs"},
          {"ingredientid": 8,  "ingredientname": "1 Tbsp milk"},
          {"ingredientid": 9,  "ingredientname": "1/2 tsp butter"},
          {"ingredientid": 12, "ingredientname": "1/4 tsp salt"},
          {"ingredientid": 14,  "ingredientname": "1/4 tsp pepper"}
        ],
        "instructions": 
          "1) beat eggs and milk\n" +
          "2) melt butter in skillet over medium-high heat\n" +
          "3) cook eggs",
        "notes": "I am not good at this."
      },
      
      {
        "recipeid": 101, 
        "recipename": "another recipe",
        "rating": 1,
        "taglist": ["eggs"],
        "ingredients": [],
        "instructions": "",
        "notes": ""
      },
      
      {
        "recipeid": 102, 
        "recipename": "random recipe",
        "rating": 2,
        "taglist": ["breakfast"],
        "ingredients": [],
        "instructions": "",
        "notes": ""
      },
      
      {
        "recipeid": 103, 
        "recipename": "one more recipe",
        "rating": 4,
        "taglist": [],
        "ingredients": [],
        "instructions": "",
        "notes": ""
      }
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
  
  async saveRecipe(mode, recipe) {
    var success = false;

    console.log(recipe.recipeid);
    if (mode == 'add' || recipe.recipeid == null || recipe.recipeid == 'null') {
      console.log('RecipesDB.saveRecipe', 'add recipe', recipe);
    } else {
      console.log('RecipesDB.saveRecipe', 'update recipe', recipe);
    }
    
    success = true;
    
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
  