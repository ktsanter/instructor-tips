define(function (require) {
  require('login');
  require('create_element');
  require('sqldbinterface');  
  require('utilitykts');
  require('usermanagement');
 
  document.addEventListener('DOMContentLoaded', app.init());
});
