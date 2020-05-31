define(function (require) {
  require('tipsmanager');
  require('tipsmanager_scheduling');
  require('tipsmanager_schedulingshare');
  require('tipsmanager_schedulingcontrol');
  require('tipsmanager_tipbrowse');
  require('tipsmanager_tipfilter');
  require('tipsmanager_manageshared');
  require('tipsmanager_settings');
  require('dbadmincontainer');
  require('dbadmintableedit');
  require('standard_notice');
  require('create_element');
  require('navbar');
  require('sqldbinterface');
  require('markdowntohtml');
  require('dbadmintableedit');
  require('dialogcontainer');
  
  document.addEventListener('DOMContentLoaded', app.init());
});