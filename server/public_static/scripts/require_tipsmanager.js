define(function (require) {
  require('tipsmanager');
  require('tipsmanager_filter');
  require('tipsmanager_courses');
  require('tipsmanager_scheduling');
  require('tipsmanager_schedulingedit');
  require('tipsmanager_editing');
  require('dbadmincontainer');
  require('dbadmintableedit');
  require('standard_notice');
  require('create_element');
  require('navbar');
  require('aboutbox');
  require('sqldbinterface');
  require('loginui');
  require('calendarui');
  require('markdowntohtml');
  require('dbadmintableedit');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
