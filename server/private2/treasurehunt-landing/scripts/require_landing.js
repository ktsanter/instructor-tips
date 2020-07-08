define(function (require) {
  require('landing');
  require('effect');
  require('firework');
  require('particle');
  require('cannonball');

  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/utilitykts');
  require('/scripts/sqldbinterface');  

  document.addEventListener('DOMContentLoaded', app.init());
});

