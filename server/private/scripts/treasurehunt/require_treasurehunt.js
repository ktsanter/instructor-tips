define(function (require) {
  require('treasurehunt');
  
  require('../create_element');
  require('../navbar');
  require('../standard_notice');
  require('../utilitykts');
  require('../markdowntohtml');
  require('../sqldbinterface');  
  
  require('treasurehunt_layout');
  require('treasurehunt_clues');
  require('treasurehunt_profile');
  require('treasurehunt_projectcontrol');

  document.addEventListener('DOMContentLoaded', app.init());
});

