define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/sqldbinterface');
  require('/scripts/tree.jquery');
  
  require('faq-composer');

  document.addEventListener('DOMContentLoaded', app.init());
});
