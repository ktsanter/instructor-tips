define(function (require) {
  require('/scripts/utilitykts'); 
  
  require('pacingguide-viewer');

  document.addEventListener('DOMContentLoaded', app.init());
});
