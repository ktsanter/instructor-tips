define(function (require) {
  require('weekly_calendar');
  require('standard_notice');
  require('create_element');
  require('sqldbinterface');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
