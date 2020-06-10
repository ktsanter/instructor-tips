define(function (require) {
  require('tipsmanager');
  require('tipsmanager_scheduling');
  require('tipsmanager_notification');
  require('tipsmanager_share');
  require('tipsmanager_editing');
  require('tipsmanager_profile');

  require('tipsmanager_schedulingcontrol');
  require('tipsmanager_tipbrowse');
  require('tipsmanager_tipfilter');
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
  require('utilitykts');
  
  document.addEventListener('DOMContentLoaded', app.init());
});
