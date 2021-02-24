define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/sqldbinterface');
  require('/scripts/tree.jquery');
  require('/scripts/classTreeManager');
  require('/scripts/markdowntohtml');
  
  require('faq-composer');

  document.addEventListener('DOMContentLoaded', app.init());
});
