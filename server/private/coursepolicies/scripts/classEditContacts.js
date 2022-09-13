//-------------------------------------------------------------------
// EditContacts
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class EditContacts {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      
      info: null,

      selectedContactId: null,
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(info) {
    this.settings.info = {
      "general": info.general,
      "course": info.course
    };
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    EditUtilities._setEditControlHandlers(
      this.config.container, 
      'edit-control edit-control-contact',
      (e) => { this._handleEditControl(e); }
    );    
    
    this.config.contactSelect = this.config.container.getElementsByClassName('select-contact')[0];
    this.config.contactEditContainer = this.config.container.getElementsByClassName('contact-edit-container')[0];
    this.config.contactSelect.addEventListener('change', (e) => { this._handleContactSelect(e); });
  }

  _updateUI() {
    const container = this.config.contactEditContainer;
    EditUtilities._enableEditControls(this.config.container, 'edit-control-contact-conditional', false);
    EditUtilities._clearFormValuesInContainer(container);

    this._loadContactSelect();
  }        
  
  _loadContactSelect() {
    let contactList = this.settings.info.general.contact.sort( 
      function(a, b) {
        return a.contentdescriptor.toLowerCase().localeCompare(b.contentdescriptor.toLowerCase());
      }
    );
    
    UtilityKTS.removeChildren(this.config.contactSelect);
    let selectedIndex = -1;
    for (let i = 0; i < contactList.length; i++) {
      let contact = contactList[i];
      let elemItem = CreateElement.createOption(null, 'select-contact-option', i, contact.contentdescriptor);
      this.config.contactSelect.appendChild(elemItem);
      elemItem.setAttribute("contactinfo", JSON.stringify(contact));
      
      if (contact.contactid == this.settings.selectedContactId) selectedIndex = i;
    }
    
    this.config.contactSelect.selectedIndex = selectedIndex;
    UtilityKTS.setClass(this.config.contactEditContainer, this.settings.hideClass, selectedIndex < 0);
    EditUtilities._enableEditControls(this.config.container, 'edit-control-contact-conditional', selectedIndex >= 0);
    
    if (selectedIndex >= 0) EditUtilities._triggerChange(this.config.contactSelect);
  }
    
  _loadContact(contactInfo) {
    EditUtilities._enableEditControls(this.config.container, 'edit-control-contact-conditional', true);
    const container = this.config.contactEditContainer;
    EditUtilities._clearFormValuesInContainer(container);
    
    EditUtilities._setValueInContainer(container, 'content-descriptor', contactInfo.contentdescriptor);
    EditUtilities._setValueInContainer(container, 'first-name', contactInfo.firstname);
    EditUtilities._setValueInContainer(container, 'last-name', contactInfo.lastname);
    EditUtilities._setValueInContainer(container, 'phone', contactInfo.phone);
    EditUtilities._setValueInContainer(container, 'email', contactInfo.email);
    EditUtilities._setValueInContainer(container, 'template-base', contactInfo.templatebase);
    
    container.setAttribute('contactinfo-original', JSON.stringify(contactInfo));
    this.settings.selectedContactId = contactInfo.contactid;
    UtilityKTS.setClass(this.config.contactEditContainer, this.settings.hideClass, false);
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
      "contentdescriptor": EditUtilities._getValueFromContainer(container, 'content-descriptor'),
      "firstname": EditUtilities._getValueFromContainer(container, 'first-name'),
      "lastname": EditUtilities._getValueFromContainer(container, 'last-name'),
      "phone": EditUtilities._getValueFromContainer(container, 'phone'),
      "email": EditUtilities._getValueFromContainer(container, 'email'),
      "templatebase": EditUtilities._getValueFromContainer(container, 'template-base')
    };

    const success = await this._saveContactToDB(infoOriginal, infoNew);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    EditUtilities._forceSelection(this.config.contactSelect, infoNew.contentdescriptor);
    EditUtilities._blipNotice(this.config.notice, 'contact info saved');
  }
  
  async _addContact() {
    const msg = "Please enter the content descriptor for the new contact";
    const contentDescriptor = prompt(msg);
    
    if (!contentDescriptor || contentDescriptor.length == 0) return;

    const success = await this._addContactToDB(contentDescriptor);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    EditUtilities._forceSelection(this.config.contactSelect, contentDescriptor);
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
  }
      
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleEditControl(e) {
    if (e.target.classList.contains('disabled')) return;
    if (!e.target.classList.contains('edit-control-contact')) return;
    
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
  
  _handleContactSelect(e) {
    const optionSelected = e.target[e.target.selectedIndex];
    const info = JSON.parse(optionSelected.getAttribute('contactinfo'));
    this._loadContact(info);
  }

  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------
  async _addContactToDB(contentDescriptor) {
    let params = {
      "contentDescriptor": contentDescriptor
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/insert', 'contact', params, this.config.notice);
    
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
    
    return dbResult.success;
  }

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------

}
