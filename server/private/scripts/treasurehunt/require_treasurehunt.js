define(function (require) {
  require('treasurehunt');
  
  require('../create_element');
  require('../navbar');
  require('../utilitykts');

  document.addEventListener('DOMContentLoaded', app.init());
});

