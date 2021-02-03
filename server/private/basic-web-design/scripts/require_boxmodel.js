define(function (require) {
  require('/scripts/create_element');
  
  require('boxmodel');
  
  document.addEventListener('DOMContentLoaded', app.init());
});