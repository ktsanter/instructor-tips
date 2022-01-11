define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');

  require('binary-conversion');

  document.addEventListener('DOMContentLoaded', app.init());
});
