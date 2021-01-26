define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/clipboard.min.js');
  require('/scripts/clipboard_copy.js');
  require('/scripts/create_element.js');  
  
  require('accordion-wrapper');

  document.addEventListener('DOMContentLoaded', app.init());
});
