define(function (require) {
  require('/scripts/standard_notice');
  require('/scripts/google_webapp_interface');
  require('/scripts/create_element');
  
  require('support-tool-index');
  
  document.addEventListener('DOMContentLoaded', app.init());
});