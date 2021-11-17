define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  
  require('classPngImage');
  require('classPngChunk');
  require('test');

  document.addEventListener('DOMContentLoaded', app.init());
});
