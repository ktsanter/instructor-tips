define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('mathml');

  document.addEventListener('DOMContentLoaded', app.init());
});
