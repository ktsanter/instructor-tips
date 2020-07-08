define(function (require) {
  require('instructortips-help');
  require('/scripts/create_element');
  require('/scripts/navbar');
  require('/scripts/utilitykts');
 
  document.addEventListener('DOMContentLoaded', app.init());
});
