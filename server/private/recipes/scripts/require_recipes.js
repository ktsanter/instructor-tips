define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/sqldbinterface');
  require('/scripts/classProfile');
  require('/scripts/usermanagement');
  require('/scripts/mytinymce');
  
  require('libsodium');
  const libsodiumWrappers = require('libsodium-wrappers');
  
  require('classRecipesDB');
  
  require('classRecipes');
  require('classRecipesList');
  require('classRecipesEdit');
  require('classRecipesShow');
  
  require('classMenu');
  
  require('classShopping');
  
  require('classAdmin');
  
  require('recipes');

  document.addEventListener('DOMContentLoaded', app.init(libsodiumWrappers));
});
