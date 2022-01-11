define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');

  require('apcsp');

  document.addEventListener('DOMContentLoaded', app.init());
});
