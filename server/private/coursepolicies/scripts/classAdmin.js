//-------------------------------------------------------------------
// Admin
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class Admin {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      navItemClass: 'nav-item',
      
      info: null,
      selectedNavId: 'navEditExpectations',  // default selection
    }
    
    this.editExpectations = new EditExpectations(this.config);
    this.editKeypoints = new EditKeypoints(this.config);
    this.editResourceLinks = new EditResourceLinks(this.config);
    this.editContacts = new EditContacts(this.config);
    this.editCourses = new EditCourses(this.config);

    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(generalInfo, courseInfo) {
    this.settings.info = {
      "general": generalInfo,
      "course": courseInfo
    };
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    this.config.contentContainers = this.config.container.getElementsByClassName('admin-container');
    this._setNavbarHandlers();
  }

  _setNavbarHandlers() {
    const navList = this.config.container.getElementsByClassName(this.settings.navItemClass);
    const me = this;

    for (let i = 0; i < navList.length; i++) {
      navList[i].addEventListener('click', (e) => { this._handleNavbarClick(me, e); });
    }
  }
  
  _updateUI() {
    this._dispatch(this, this.settings.selectedNavId);
  }
      
  _dispatch(me, dispatchTargetId) {
    if (this.settings.selectedNavId) this._activateMenuOption(this.settings.selectedNavId, false);
    this.settings.selectedNavId = dispatchTargetId;
    this._activateMenuOption(dispatchTargetId, true);

    me._showEditContainer()
    var dispatchMap = {
      "navEditExpectations": function() { me.editExpectations.update(me.settings.info); },
      "navEditKeypoints": function() { me.editKeypoints.update(me.settings.info); },
      "navEditResourceLinks": function() { me.editResourceLinks.update(me.settings.info); },
      "navEditContacts": function() { me.editContacts.update(me.settings.info); },
      "navEditCourses": function() { me.editCourses.update(me.settings.info); }
    }
    dispatchMap[dispatchTargetId]();    
  }
  
  _activateMenuOption(navId, setActive) {
    let navElements = this.config.container.getElementsByClassName('nav-link');

    let elemNav = null;
    for (let i = 0; i < navElements.length && !elemNav; i++) {
      if (navElements[i].id == navId) elemNav = navElements[i];
    }
    if (elemNav) UtilityKTS.setClass(elemNav, 'active', setActive);
  }
  
  _showEditContainer() {
    for (let i = 0; i < this.config.contentContainers.length; i++) {
      const container = this.config.contentContainers[i];
      UtilityKTS.setClass(container, this.settings.hideClass, !container.classList.contains(this.settings.selectedNavId));
    }
  }
   
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleNavbarClick(me, e) {
    let target = e.target;
    if (target.tagName != 'A') target = e.target.firstChild;
    if (target.classList.contains('disabled')) return;

    if (this.settings.selectedNavId && this.settings.selectedNavId == target.id) return;
    
    this._dispatch(me, target.id);
  }
  
  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------

}
