setNavbarTargets();
document.getElementById('navOverview').click();

function setNavbarTargets() {
  var navbarElements = document.getElementsByClassName('use-handler');
  navMap = {
    "navOverview": "anchorOverview",
    "navAuthorize": "anchorAuthorize",
    "navManage": "anchorManage",
    "navConfigure": "anchorConfigure",
    "navOther": "anchorOther",
    "navIntegration": "anchorIntegration"
  };
  
  for (var i = 0; i < navbarElements.length; i++) {
    var elem = navbarElements[i];

    if (navMap.hasOwnProperty(elem.id)) {
      var anchorId = navMap[elem.id];
      elem.href = '#' + anchorId;
    }
  }
}