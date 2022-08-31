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
      
      selectedNavId: null,
      currentInfo: null
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(updatedInfo) {
    if (!this.settings.selectedNavId) this.config.container.getElementsByClassName('nav-link')[0].click();
    
    this.settings.currentInfo = updatedInfo;
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    console.log('Admin._initUI');

    this.config.container.getElementsByClassName('btnToggleAdmin')[0].addEventListener('click', (e) => { this.config.toggleCallback(e); });
    this.config.contentContainers = this.config.container.getElementsByClassName('admin-container');
    this._setNavbarHandlers();
  }

  _setNavbarHandlers() {
    let navList = this.config.container.getElementsByClassName(this.settings.navItemClass);
    let me = this;
    for (let i = 0; i < navList.length; i++) {
      navList[i].addEventListener('click', (e) => { this._handleNavbarClick(me, e); });
    }
  }

  _updateUI() {
    console.log('Admin._updateUI, stubbed')
  }
      
  _setActiveNavbarItem(target, setOn) {
    if (!target) return;
    
    let currentActive = null;
    if (this.settings.selectedNavClass) currentActive = this.config.container.getElementsByClassName(this.settings.selectedNavClass)[0];
    
    let newActive = target;
    if (newActive.tagName != 'A') newActive = target.firstChild;
    
    console.log(currentActive, newActive);

    if (newActive.classList.contains('disabled')) return null;
    
    if (currentActive && currentActive.id == newActive.id) return null;
    
    if (currentActive) UtilityKTS.setClass(currentActive, 'active', false);
    if (newActive) UtilityKTS.setClass(newActive, 'active', true);
    
    return newActive.id;
  }
  
  _dispatch(me, dispatchTargetId) {
    if (this.settings.selectedNavId && this.settings.selectedNavId == dispatchTargetId) return;
    
    if (this.settings.selectedNavId) this._activateMenuOption(this.settings.selectedNavId, false);
    this.settings.selectedNavId = dispatchTargetId;
    this._activateMenuOption(dispatchTargetId, true);

    me._showEditContainer()
    var dispatchMap = {
      "navEdit0": function() { me._showEdit0()},
      "navEdit1": function() { me._showEdit1()},
      "navEdit2": function() { me._showEdit2()},
      "navEdit3": function() { me._showEdit3()},
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
  
  _showEdit0() {
    console.log('_showEdit0');
  }
  _showEdit1() {
    console.log('_showEdit1');
  }
  _showEdit2() {
    console.log('_showEdit2');
  }
  _showEdit3() {
    console.log('_showEdit3');
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
    
    this._dispatch(me, e.target.id);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}