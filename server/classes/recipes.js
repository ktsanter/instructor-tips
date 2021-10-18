"use strict";
//---------------------------------------------------------------
// server-side for Recipes
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.Recipes = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;    
    this._tempFileManager = params.tempFileManager;  
  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
            
    } else if (params.queryName == 'recipe-list') {
      dbResult = await this._getRecipeList(params, postData, userInfo, funcCheckPrivilege);
            
    }else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'recipe') {
      dbResult = await this._insertRecipe(params, postData, userInfo, funcCheckPrivilege);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult = await this._dummy(params, postData, userInfo, funcCheckPrivilege);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'dummy') {
      dbResult = await this._dumyy(params, postData, userInfo, funcCheckPrivilege);

    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------      
  
//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------    
  async _getAdminAllowed(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {adminallowed: funcCheckPrivilege(userInfo, 'admin')};

    return result;
  }  

  async _getRecipeList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      recipes:
        'select ' + 
          'a.recipeid, a.recipename, a.reciperating as "rating", a.recipeinstructions as "instructions", a.recipenotes as "notes" ' + 
        'from recipe as a ' +
        'where a.userid = ' + userInfo.userId + ' ' +
        'order by a.recipename',
        
      ingredients:
        'select ' +
          'a.recipeid, b.ingredientid, b.ingredientname ' +
        'from recipe as a ' +
        'left join ingredient as b ' +
        'on a.recipeid = b.recipeid ',
        
      tags:
        'select ' +
          'a.recipeid, b.tagid, b.tagtext ' +
        'from recipe as a, tag as b, recipe_tag as c ' +
        'where a.recipeid = c.recipeid ' +
          'and b.tagid = c.tagid '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    var collated = this._collateRecipes(queryResults.data.recipes, queryResults.data.ingredients, queryResults.data.tags);
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = collated;
    
    return result;
  }
  
  async _insertRecipe(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var queryList, queryResults;
    queryList = {
      "recipe":       
        'call add_recipe(' + 
          userInfo.userId + ', ' +
          '"' + postData.recipename + '", ' +
              + postData.rating + ', ' +
          '"' + postData.instructions + '", ' +
          '"' + postData.notes + '" ' +
        ') '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;

      if (queryResults.details.code == 'ER_DUP_ENTRY' || 
          queryResults.details.indexOf('Duplicate entry') > 0) result.details = 'duplicate';
      return result;
    }
    
    var recipeId = queryResults.data.recipe[0][0].recipeid;
    queryResults = await this._updateIngredientsForRecipe(recipeId, postData.ingredients);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }    
      
    result.success = true;
    result.details = 'insert succeeded';

    return result;
  }  
  
  
  async _updateIngredientsForRecipe(recipeId, ingredientList) {
    console.log('_updateIngredientsForRecipe', recipeId, ingredientList);
    var result = this._dbManager.queryFailureResult();  

    var queryList, queryResults;
    queryList = {
      "delete":
        'delete from ingredient ' +
        'where recipeid = ' + recipeId,
    };
    
    for (var i = 0; i < ingredientList.length; i++) {
      console.log(ingredientList[i]);
      var ingredient = ingredientList[i];
      queryList['add' + i] = 
        'insert into ingredient (' +
          'recipeid, ingredientname ' +
        ') values (' +
          recipeId + ', ' +
          '"' + ingredient.ingredientname + '" ' +
        ')';
    }
    
    console.log(queryList);
    
    queryResults = await this._dbManager.dbQueries(queryList);
    console.log(queryResults);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = 'update succeeded';
    
    return result;
    
  }  

  async _dummy(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.details = 'dummy parameter used';
    
    return result;
  }
  
//----------------------------------------------------------------------
// support methods and queries
//----------------------------------------------------------------------  
  _collateRecipes(recipeData, ingredientData, tagData) {
    var collated = [];
    
    for (var i = 0; i < recipeData.length; i++) {
      var recipe = recipeData[i];
      
      var filteredIngredients = ingredientData.filter( function(a) {
        return (a.recipeid == recipe.recipeid) && (a.ingredientid != null);
      });
      recipe.ingredients = filteredIngredients;
      
      var filteredTags = tagData.filter( function(a) {
        return (a.recipeid == recipe.recipeid);
      });
      recipe.taglist = filteredTags.map(function (a) {
        return a.tagtext;
      });
      
      collated.push(recipe);
    }
    
    return collated;
  }
  
//----------------------------------------------------------------------
// utility
//----------------------------------------------------------------------  
  _sendFail(res, failMessage) {
    var result = {
      sucess: false,
      details: failMessage,
      data: null
    };
    
    res.send(result);
  }
  
  _sendSuccess(res, successMessage, dataValues) {
    if (!dataValues) dataValues = null;
    
    var result = {
      success: true,
      details: successMessage,
      data: dataValues
    };
    
    res.send(result);
  }  
}
