define(function (require) {
  require('treasurehunt');
  
  require('/scripts/create_element');
  require('/scripts/navbar');
  require('/scripts/standard_notice');
  require('/scripts/utilitykts');
  require('/scripts/markdowntohtml');
  require('/scripts/sqldbinterface');  
  
  require('treasurehunt_layout');
  require('treasurehunt_clues');
  require('treasurehunt_profile');
  require('treasurehunt_projectcontrol');
  require('treasurehunt_dialog');

  document.addEventListener('DOMContentLoaded', app.init());
});

