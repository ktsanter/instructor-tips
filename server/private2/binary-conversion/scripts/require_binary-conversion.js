define(function (require) {
  require('binary-conversion');
  
  require('/scripts/create_element');
  require('/scripts/utilitykts');

  document.addEventListener('DOMContentLoaded', app.init());
});

