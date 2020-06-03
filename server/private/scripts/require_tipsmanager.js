define(function (require) {
  require('tipsmanager');
  require('tipsmanager_scheduling');
  require('tipsmanager_notification');
  require('tipsmanager_share');
  require('tipsmanager_schedulingcontrol');
  require('tipsmanager_tipbrowse');
  require('tipsmanager_tipfilter');
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
  require('lookupinput');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
