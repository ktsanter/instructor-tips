define(function (require) {
  require('index');
  
  require('create_element');
  require('lookupinput');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
