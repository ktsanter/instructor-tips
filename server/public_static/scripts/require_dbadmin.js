define(function (require) {
  require('dbadmin');
  require('dbadmincontainer');
  require('dbadmintableedit');
  require('standard_notice');
  require('create_element');
  require('navbar');
  require('aboutbox');
  require('sqldbinterface');
  require('loginui');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
