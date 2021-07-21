setNavbarTargets();
setAppLinkTargets();
document.getElementById('navOverview').click();

function setNavbarTargets() {
  var navbarElements = document.getElementsByClassName('use-handler');
  navMap = {
    "navOverview": "anchorOverview",
    "navSetup": "anchorSetup",
    "navStudents": "anchorStudents",
    "navMentors": "anchorMentors",
    "navOther": "anchorOther"
  };
  
  for (var i = 0; i < navbarElements.length; i++) {
    var elem = navbarElements[i];

    if (navMap.hasOwnProperty(elem.id)) {
      var anchorId = navMap[elem.id];
      elem.href = '#' + anchorId;
    }
  }
}

function setAppLinkTargets() {
  var appLinkElements = document.getElementsByClassName('rostermanager-link');
  for (var i = 0; i < appLinkElements.length; i++) {
    appLinkElements[i].href = window.location.origin + '/roster-manager';
  }

  var appLinkElements = document.getElementsByClassName('enddatemanager-link');
  for (var i = 0; i < appLinkElements.length; i++) {
    appLinkElements[i].href = window.location.origin + '/enddate-manager/manager';
  }
  
}