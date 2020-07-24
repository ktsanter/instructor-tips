define(function (require) {
  require('/scripts/utilitykts'); 
  
  require('welcomeletter');

  document.addEventListener('DOMContentLoaded', app.init());
});
