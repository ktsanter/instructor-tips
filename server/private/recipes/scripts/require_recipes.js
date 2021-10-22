define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');
  require('/scripts/clipboard_copy');    
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
  
  require('classRecipesDB');
  
  require('classRecipes');
  require('classRecipesList');
  require('classRecipesEdit');
  require('classRecipesShow');
  require('classFilteredRecipeSearch');
  require('classImportRecipe');
  
  require('classMenu');
  
  require('classShopping');

  require('classOCR');
  require('classImageOCR');
  require('classImageCompressor');
  
  require('recipes');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
