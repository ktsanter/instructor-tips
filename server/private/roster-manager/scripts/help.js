setNavbarTargets();
document.getElementById('navOverview').click();

function setNavbarTargets() {
  var navbarElements = document.getElementsByClassName('use-handler');
  navMap = {
    "navOverview": "anchorOverview",
    "navSLP": "anchorSLP",
    "navRosterManager": "anchorRosterManager",
    "navInterpret": "anchorInterpret",
    "navError": "anchorError"
  };
  
  for (var i = 0; i < navbarElements.length; i++) {
    var elem = navbarElements[i];
    console.log(elem.id);
    if (navMap.hasOwnProperty(elem.id)) {
      var anchorId = navMap[elem.id];
      elem.href = '#' + anchorId;
    }
  }
}