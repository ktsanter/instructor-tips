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
    this._apiKey = params.apiKey;
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
            
    } else if (params.queryName == 'recipe') {
      dbResult = await this._getRecipe(params, postData, userInfo, funcCheckPrivilege);
            
    } else if (params.queryName == 'menu') {
      dbResult = await this._getMenu(params, postData, userInfo, funcCheckPrivilege);
            
    } else if (params.queryName == 'shopping-list') {
      dbResult = await this._getShoppingList(params, postData, userInfo, funcCheckPrivilege);
            
    } else if (params.queryName == 'ocr-apikey') {
      dbResult = await this._getOCRAPIKey(params, postData, userInfo, funcCheckPrivilege);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'recipe') {
      dbResult = await this._insertRecipe(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'menu') {
      dbResult = await this._addToMenu(params, postData, userInfo, funcCheckPrivilege);
            
    } else if (params.queryName == 'shopping-recipe') {
      dbResult = await this._addRecipeToShopping(params, postData, userInfo, funcCheckPrivilege);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'recipe') {
      dbResult = await this._updateRecipe(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName = 'shopping-item-check') {
      dbResult = await this._updateShoppingItemCheck(params, postData, userInfo, funcCheckPrivilege);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'recipe') {
      dbResult = await this._deleteRecipe(params, postData, userInfo, funcCheckPrivilege);

    } else if (params.queryName == 'menu') {
      dbResult = await this._removeFromMenu(params, postData, userInfo, funcCheckPrivilege);
            
    } else if (params.queryName == 'shopping-recipe') {
      dbResult = await this._removeRecipeFromShopping(params, postData, userInfo, funcCheckPrivilege);
            
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

  async _getOCRAPIKey(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    if (!funcCheckPrivilege(userInfo, 'admin')) {
      result.details = 'denied';
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {apikey: this._apiKey};

    return result;
  }  

  async _getRecipeList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      recipes:
        'select ' + 
          'a.recipeid, a.recipename, a.reciperating as "rating", a.recipeyield, a.recipeinstructions as "instructions", a.recipenotes as "notes", a.recipemade ' + 
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
  
  async _getRecipe(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      recipe:
        'select ' + 
          'a.recipeid, a.recipename, a.reciperating as "rating", a.recipeyield, a.recipeinstructions as "instructions", a.recipenotes as "notes", a.recipemade ' + 
        'from recipe as a ' +
        'where a.userid = ' + userInfo.userId + ' ' +
          'and a.recipeid = ' + postData.recipeid,

      ingredients:
        'select ' +
          'a.ingredientname ' +
        'from ingredient as a ' +
        'where a.recipeid = ' + postData.recipeid,
        
      tags:
        'select ' +
          'b.tagtext ' +
        'from recipe_tag as a, tag as b ' +
        'where a.recipeid = ' + postData.recipeid + ' ' +
          'and a.tagid = b.tagid '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var recipe = queryResults.data.recipe[0];
    recipe.ingredients = queryResults.data.ingredients;
    recipe.taglist = queryResults.data.tags;
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = recipe;
    
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
          '"' + postData.recipeyield + '", ' +
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
    
    queryResults = await this._updateTagsForRecipe(recipeId, userInfo.userId, postData.taglist);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }    
      
    result.success = true;
    result.details = 'insert succeeded';

    return result;
  }  
  
  async _updateRecipe(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();

    var queryList, queryResults;
    queryList = {
      "recipe":       
        'update recipe set ' + 
          'recipename = "' + postData.recipename + '", ' +
          'reciperating = ' + postData.rating + ', ' +
          'recipeyield = "' + postData.recipeyield + '", ' +
          'recipeinstructions = "' + postData.instructions + '", ' +
          'recipenotes = "' + postData.notes + '", ' +
          'recipemade = ' + (postData.recipemade ? 1 : 0) + ' ' +
        'where recipeid = ' + postData.recipeid
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;

      if (queryResults.details.code == 'ER_DUP_ENTRY' || 
          queryResults.details.indexOf('Duplicate entry') > 0) result.details = 'duplicate';
      return result;
    }
    
    var recipeId = postData.recipeid;
    queryResults = await this._updateIngredientsForRecipe(recipeId, postData.ingredients, userInfo.userId);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    queryResults = await this._updateTagsForRecipe(recipeId, userInfo.userId, postData.taglist);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
      
    result.success = true;
    result.details = 'update succeeded';

    return result;
  }  
  
  async _updateIngredientsForRecipe(recipeId, ingredientList, userId) {
    var result = this._dbManager.queryFailureResult(); 

    var queryList, queryResults;
    
    var queryList = {
      originalIngredients: 
        'select a.ingredientid ' + 
        'from ingredient as a ' +
        'where recipeid = ' + recipeId
    };
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }


    var toAdd = ingredientList.filter( (a) => {return a.ingredientid == null;} );
    var toUpdate = ingredientList.filter( (a) => {return a.ingredientid != null;} );

    var originalIngredientIdSet = new Set(queryResults.data.originalIngredients.map( (a) => { return a.ingredientid; } ));
    var updateIdSet = new Set(toUpdate.map( (a) => {return a.ingredientid; } ));
    var toDelete = Array.from(new Set( [...originalIngredientIdSet].filter(x => !updateIdSet.has(x)) ));
    
    queryList = {};
    if (toDelete.length > 0) {
      queryList['delete'] = 
        'delete from ingredient ' +
        'where ingredientid in (' + toDelete.join(',') + ') ';
    }
    
    for (var i = 0; i < toUpdate.length; i++) {
      queryList['update' + i] = 
      'update ingredient ' + 
      'set ingredientname = "' + toUpdate[i].ingredientname + '" ' + 
      'where ingredientid = ' + toUpdate[i].ingredientid;
    }
    
    for (var i = 0; i < toAdd.length; i++) {
      queryList['insert' + i] =
        'call add_ingredient (' +
          recipeId + ', ' +
          '"' + toAdd[i].ingredientname + '" ' +
        ') ';
    }

    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var addedIngredientIds = [];
    for (var i = 0; i < toAdd.length; i++) {
      var key = 'insert' + i;
      addedIngredientIds.push(queryResults.data[key][0][0].ingredientid);
    }      
    
    if (toAdd.length > 0) {
      queryList = {"menucount": 'select count(menuid) as "count" from menu where recipeid = ' + recipeId};
      queryResults = await this._dbManager.dbQueries(queryList);
      if (!queryResults.success) {
        result.details = queryResults.details;
        return result;
      }
      
      var isOnMenu = queryResults.data.menucount[0].count > 0;
      if (isOnMenu) {
        queryList = {
          insertshopping: 
            'insert into shopping ( ' +
              'userid, ingredientid, ingredientchecked ' +
            ') select ' +
                 userId + ', ' +
                 'a.ingredientid, ' +
                 '0 ' + 
               'from ingredient as a ' +
               'where a.recipeid = ' + recipeId + ' ' +
                 'and ingredientid in (' + addedIngredientIds.join(',') + ') '               
        }

        queryResults = await this._dbManager.dbQueries(queryList);

        if (!queryResults.success) {
          result.details = queryResults.details;
          return result;
        }        
      }
    }

    result.success = true;
    result.details = 'update succeeded';
    
    return result;
  }  
  
  async _updateTagsForRecipe(recipeId, userId, tagList) {
    var result = this._dbManager.queryFailureResult();  

    var queryResults = await this._updateTagsForUser(tagList, userId);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    queryResults = await this._setTagsForRecipe(recipeId, tagList, userId);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'tag update succeeded';
    
    return result;    
  }
  
  async _deleteRecipe(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult();  

    var queryList, queryResults;
    queryList = {
      "recipe":       
        'delete from recipe ' +
        'where recipeid = ' + postData.recipeid
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }    
      
    result.success = true;
    result.details = 'delete succeeded';

    return result;
  }    

  async _getMenu(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      menu:
        'select ' + 
          'a.menuid, a.recipeid, ' +
          'b.recipename ' +
        'from menu as a, recipe as b ' +
        'where a.userid = ' + userInfo.userId + ' ' +
          'and a.recipeid = b.recipeid ' +
        'order by a.menuid'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = queryResults.data.menu;
    
    return result;
  }

  async _addToMenu(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      menu:
        'insert ' + 
        'into menu(userid, recipeid) values (' +
          userInfo.userId + ', ' +
          postData.recipeid + 
        ') on duplicate key update userid = ' + userInfo.userId
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'query succeeded';
    
    return result;
  }

  async _removeFromMenu(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      menu:
        'delete ' + 
        'from menu ' +
        'where recipeid = ' + postData.recipeid + ' ' +
          'and userid = ' + userInfo.userId
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'delete succeeded';
    
    return result;
  }

  async _getShoppingList(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      shopping:
        'select ' + 
          'a.shoppingid, a.ingredientid, a.ingredientchecked, ' +
          'b.ingredientname ' +
        'from shopping as a, ingredient as b ' +
        'where a.userid = ' + userInfo.userId + ' ' +
          'and a.ingredientid = b.ingredientid ' +
        'order by a.shoppingid'
    };
       
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = queryResults.data.shopping;
    
    return result;
  }

  async _addRecipeToShopping(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      shopping: 
        'insert into shopping (' +
          'userid, ingredientid, ingredientchecked ' +
          ') ' +
          'select ' + 
            userInfo.userId + ',' +
            'a.ingredientid, ' +
            '0 ' +
            'from ingredient as a ' +
            'where a.recipeid = ' + postData.recipeid + ' ' +
            'on duplicate key update userid = ' + userInfo.userId
    };

    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'delete succeeded';
    
    return result;
  }

  async _removeRecipeFromShopping(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      shopping:
        'delete ' + 
        'from shopping ' +
        'where userid = ' + userInfo.userId + ' ' +
          'and ingredientid in (' +
            'select ingredientid ' +
            'from ingredient ' +
            'where recipeid = ' + postData.recipeid + ' ' +
          ')'
    };
  
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'delete succeeded';
    
    return result;
  }
  
  async _updateShoppingItemCheck(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = {
      shopping_item:
        'update shopping ' + 
        'set ingredientchecked = ' + postData.ingredientchecked + ' ' +
        'where shoppingid = ' + postData.shoppingid
    };
  
    queryResults = await this._dbManager.dbQueries(queryList);
    
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
  
  async _updateTagsForUser(tagList, userId) {
    var result = this._dbManager.queryFailureResult();  

    var queryList, queryResults;
    
    queryList = {};
    for (var i = 0; i < tagList.length; i++) {
      var tagText = tagList[i];
      
      queryList['tagindex_' + i] = 
        'insert into tag (userid, tagtext) ' +
        'values (' +
          userId + ', ' +
          '"' + tagText + '"' +
        ') on duplicate key update tagtext = "' + tagText + '"';
    }
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'update tags succeeded';
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
  async _setTagsForRecipe(recipeId, tagList, userId) {
    var result = this._dbManager.queryFailureResult();  

    var queryList, queryResults;
    
    var inClause = '';
    for (var i = 0; i < tagList.length; i++) {
      if (i > 0) inClause += ', ';
      inClause += '"' + tagList[i] + '"';
    }
    
    queryList = {
      removetags:
        'delete from recipe_tag ' +
        'where recipeid = ' + recipeId,
    }
    
    if (tagList.length > 0) {
      queryList.addtags = 
        'insert into recipe_tag (recipeid, tagid) ' +
        'select a.recipeid, b.tagid ' +
        'from recipe as a, tag as b ' +
        'where a.recipeid = ' + recipeId + ' ' +
          'and a.userid = ' + userId + ' ' +
          'and b.userid = ' + userId + ' ' +
          'and b.tagtext in (' + inClause + ')'
    }
        
    queryResults = await this._dbManager.dbQueries(queryList);

    if (!queryResults.success) {
      result = queryResults.details;
      return result;
    }
        
    result.success = true;
    result.details = 'tag setting for recipe succeeded';

    return result;
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
