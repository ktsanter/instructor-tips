setNavbarTargets();
document.getElementById('navOverview').click();

function setNavbarTargets() {
  var navbarElements = document.getElementsByClassName('use-handler');
  navMap = {
    "navOverview": "anchorOverview",
    "navManage": "anchorManage",
    "navConfigure": "anchorConfigure",
    "navOther": "anchorOther",
    "navError": "anchorError"
  };
  
  for (var i = 0; i < navbarElements.length; i++) {
    var elem = navbarElements[i];

    if (navMap.hasOwnProperty(elem.id)) {
      var anchorId = navMap[elem.id];
      elem.href = '#' + anchorId;
    }
  }
}