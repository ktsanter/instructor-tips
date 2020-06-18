define(function (require) {
  require('login');
  require('create_element');
  require('sqldbinterface');  
 
  document.addEventListener('DOMContentLoaded', app.init());
});
