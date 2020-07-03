define(function (require) {
  require('landing');

  require('../create_element');
  require('../standard_notice');
  require('../utilitykts');
  require('../sqldbinterface');  

  /*
  require('../navbar');
  require('../markdowntohtml');
  
  require('treasurehunt_layout');
  require('treasurehunt_clues');
  require('treasurehunt_profile');
  require('treasurehunt_projectcontrol');
  require('treasurehunt_dialog');
  */
  document.addEventListener('DOMContentLoaded', app.init());
});

