define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/clipboard_copy');    
   
  require('slidedeck-sizer');

  document.addEventListener('DOMContentLoaded', app.init());
});
