define(function (require) {
  require('landing');
  require('effect');
  require('firework');
  require('particle');
  require('cannonball');

  require('../create_element');
  require('../standard_notice');
  require('../utilitykts');
  require('../sqldbinterface');  

  document.addEventListener('DOMContentLoaded', app.init());
});

