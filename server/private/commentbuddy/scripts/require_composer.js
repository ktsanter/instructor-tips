define(function (require) {
  require('/scripts/utilitykts'); 
  require('/scripts/create_element');
  require('/scripts/standard_notice');
  require('/scripts/google_webapp_interface');
  require('/scripts/mytinymce');

  require('classCommentBuddyDB');
  require('composer');

  document.addEventListener('DOMContentLoaded', app.init());
});
