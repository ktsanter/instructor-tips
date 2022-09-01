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
      info: null,
      selectedNavId: 'navEditContacts'  // default selection
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(generalInfo, courseInfo) {
    console.log('Admin.update');
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
    this.config.container.getElementsByClassName('btnToggleAdmin')[0].addEventListener('click', (e) => { this.config.toggleCallback(e); });
    this.config.contentContainers = this.config.container.getElementsByClassName('admin-container');
    this._setNavbarHandlers();
    this._setEditControlHandlers();
    
    this.config.contactSelect = this.config.container.getElementsByClassName('select-contact')[0];
    this.config.contactEditContainer = this.config.container.getElementsByClassName('contact-edit-container')[0];
    this.config.contactSelect.addEventListener('change', (e) => { this._handleContactSelect(e); });
  }

  _setNavbarHandlers() {
    const navList = this.config.container.getElementsByClassName(this.settings.navItemClass);
    const me = this;

    for (let i = 0; i < navList.length; i++) {
      navList[i].addEventListener('click', (e) => { this._handleNavbarClick(me, e); });
    }
  }
  
  _setEditControlHandlers() {
    const editControls = this.config.container.getElementsByClassName('edit-control');
    
    for (let i = 0; i < editControls.length; i++) {
      editControls[i].addEventListener('click', (e) => { this._handleEditControl(e); });
    }
  }

  _updateUI() {
    this._dispatch(this, this.settings.selectedNavId);
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
    if (this.settings.selectedNavId) this._activateMenuOption(this.settings.selectedNavId, false);
    this.settings.selectedNavId = dispatchTargetId;
    this._activateMenuOption(dispatchTargetId, true);

    me._showEditContainer()
    var dispatchMap = {
      "navEditExpectations": function() { me._showEditExpectations()},
      "navEditCourses": function() { me._showEditCourses()},
      "navEditContacts": function() { me._showEditContacts()},
      "navEditOther": function() { me._showEditOther()},
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
  // edit expecations
  //--------------------------------------------------------------   
  _showEditExpectations() {
    console.log('_showEditExpectations');
  }

  //--------------------------------------------------------------
  // edit courses
  //--------------------------------------------------------------   
  _showEditCourses() {
    console.log('_showEditCourses');
  }
  
  //--------------------------------------------------------------
  // edit contacts
  //--------------------------------------------------------------     
  _showEditContacts() {
    const container = this.config.contactEditContainer;
    this._enableEditControls(this.config.container, 'edit-control-contact-conditional', false);
    this._clearFormValuesInContainer(container);

    this._loadContactSelect();
  }
  
  _loadContactSelect() {
    let contactList = this.settings.info.general.contact.sort( 
      function(a, b) {
        return a.contentdescriptor.toLowerCase().localeCompare(b.contentdescriptor.toLowerCase());
      }
    );
    
    UtilityKTS.removeChildren(this.config.contactSelect);
    for (let i = 0; i < contactList.length; i++) {
      let contact = contactList[i];
      let elemItem = CreateElement.createOption(null, 'select-contact-option', i, contact.contentdescriptor);
      this.config.contactSelect.appendChild(elemItem);
      elemItem.setAttribute("contactinfo", JSON.stringify(contact));
    }
    this.config.contactSelect.selectedIndex = -1;
  }
    
  _loadContact(contactInfo) {
    this._enableEditControls(this.config.container, 'edit-control-contact-conditional', true);
    const container = this.config.contactEditContainer;
    this._clearFormValuesInContainer(container);
    
    this._setValueInContainer(container, 'content-descriptor', contactInfo.contentdescriptor);
    this._setValueInContainer(container, 'first-name', contactInfo.firstname);
    this._setValueInContainer(container, 'last-name', contactInfo.lastname);
    this._setValueInContainer(container, 'phone', contactInfo.phone);
    this._setValueInContainer(container, 'email', contactInfo.email);
    this._setValueInContainer(container, 'template-base', contactInfo.templatebase);
    
    container.setAttribute('contactinfo-original', JSON.stringify(contactInfo));
  }
  
  async _reloadContact() {
    const msg = 'Any changes will be lost. Continue?';
    if (!confirm(msg)) return;
    
    const container = this.config.contactEditContainer;
    const infoOriginal = JSON.parse(container.getAttribute('contactinfo-original'));
    this._loadContact(infoOriginal);
  }
    
  async _saveContact() {
    const container = this.config.contactEditContainer;
    const infoOriginal = JSON.parse(container.getAttribute('contactinfo-original'));
    
    const infoNew = {
      "contentdescriptor": this._getValueFromContainer(container, 'content-descriptor'),
      "firstname": this._getValueFromContainer(container, 'first-name'),
      "lastname": this._getValueFromContainer(container, 'last-name'),
      "phone": this._getValueFromContainer(container, 'phone'),
      "email": this._getValueFromContainer(container, 'email'),
      "templatebase": this._getValueFromContainer(container, 'template-base')
    };

    const success = await this._saveContactToDB(infoOriginal, infoNew);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    this._forceSelection(this.config.contactSelect, infoNew.contentdescriptor);
  }
  
  async _addContact() {
    const msg = "Please enter the content descriptor for the new contact";
    const contentDescriptor = prompt(msg);
    
    if (!contentDescriptor || contentDescriptor.length == 0) return;

    const success = await this._addContactToDB(contentDescriptor);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    this._forceSelection(this.config.contactSelect, contentDescriptor);
  }
  
  async _deleteContact() {
    const container = this.config.contactEditContainer;
    const contactInfo = JSON.parse(container.getAttribute('contactinfo-original'));
    const contentDescriptor = contactInfo.contentdescriptor;
    
    const msg = 'This contact \n' +
                contentDescriptor + '\n ' +
                'will be deleted. Are you sure?';
    if (!confirm(msg)) return;

    const success = await this._deleteContactFromDB(contentDescriptor);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    //this._forceSelection(this.config.contactSelect, contentDescriptor);
    
  }
  
  //--------------------------------------------------------------
  // edit other
  //--------------------------------------------------------------   
  _showEditOther() {
    console.log('_showEditOther');
  }
  
  //--------------------------------------------------------------
  // edit utilities
  //--------------------------------------------------------------   
  _clearFormValuesInContainer(container) {
    const elementList = container.getElementsByClassName('form-control');
    for (let i = 0; i < elementList.length; i++) {
      const elem = elementList[i];
      if (elem.tagName == 'INPUT') {
        if (elem.type == 'text') elem.value = '';
      }
    }
  }
  
  _setValueInContainer(container, classList, value) {
    container.getElementsByClassName(classList)[0].value = value;
  }
  
  _getValueFromContainer(container, classList) {
    return container.getElementsByClassName(classList)[0].value;
  }
  
  _enableEditControls(container, classList, enable) {
    const editControls = container.getElementsByClassName(classList);

    for (let i = 0; i < editControls.length; i++) {
      UtilityKTS.setClass(editControls[i], 'disabled', !enable);
    }
  }

  _forceSelection(elemSelect, optionText) {
    let selectedIndex = -1;
    const options = elemSelect.getElementsByTagName('OPTION');
    for (let i = 0; i < options.length && selectedIndex < 0; i++) {
      if (options[i].text == optionText) selectedIndex = i;
    }
    elemSelect.selectedIndex = selectedIndex;
    elemSelect.dispatchEvent(new Event('change'));
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
  
  _handleEditControl(e) {
    if (e.target.classList.contains('disabled')) return;
    
    if (e.target.classList.contains('edit-control-contact')) {
      console.log('edit-control-contact');
      if (e.target.classList.contains('reload')) {
        this._reloadContact();
      } else if (e.target.classList.contains('save')) {
        this._saveContact();
      } else if (e.target.classList.contains('add')) {
        this._addContact();
      } else if (e.target.classList.contains('delete')) {
        this._deleteContact();
      }
    }
  }

  _handleContactSelect(e) {
    const optionSelected = e.target[e.target.selectedIndex];
    const contactInfo = JSON.parse(optionSelected.getAttribute('contactinfo'));
    this._loadContact(contactInfo);
  }

  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------
  async _addContactToDB(contentDescriptor) {
    let params = {
      "contentDescriptor": contentDescriptor
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/insert', 'contact', params, this.config.notice);
    console.log(dbResult);
    
    return dbResult.success;
  }
 
  async _saveContactToDB(origContact, changedContact) {
    let params = {
      "original": origContact,
      "updated": changedContact
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/update', 'contact', params, this.config.notice);
    
    return dbResult.success;
  }
 
  async _deleteContactFromDB(contentDescriptor) {
    let params = {
      "contentDescriptor": contentDescriptor
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/delete', 'contact', params, this.config.notice);
    console.log(dbResult);
    
    return dbResult.success;
  }
 
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
