define(function (require) {
  require('tipsmanager');
  require('tipsmanager_filter');
  require('tipsmanager_courses');
  require('tipsmanager_scheduling');
  require('tipsmanager_scheduling2');
  require('tipsmanager_schedulingedit');
  require('tipsmanager_schedulingshare');
  require('tipsmanager_schedulingcontrol');
  require('tipsmanager_manageshared');
  require('tipsmanager_settings');
  require('tipsmanager_calendar');
  require('tipsmanager_editing');
  require('dbadmincontainer');
  require('dbadmintableedit');
  require('standard_notice');
  require('create_element');
  require('navbar');
  require('sqldbinterface');
  //require('loginui');
  require('markdowntohtml');
  require('dbadmintableedit');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
