//-------------------------------------------------------------------
// Aardvark Studios Profile class
//-------------------------------------------------------------------

class ASProfile {
  constructor(config) {
    this._config = config; 
    
    this.baseClass = 'aardvark-profile';
    this.userInfo = null;
    this.invalidPic = 'https://res.cloudinary.com/ktsanter/image/upload/v1614959904/image%20flipper%20resources/invalid-profile-pic.png';
    this.dirtyBit = false;
    
    this.root = document.getElementById(this._config.id);
  }
  
  //--------------------------------------------------------------
  // initializinz
  //--------------------------------------------------------------
  async init() {
    this.userManagement = new UserManagement(this._config.sodium);
    await this.userManagement.init();

    this.elemDisplayName = this.root.getElementsByClassName('navProfile-displayname')[0];
    this.elemEmail = this.root.getElementsByClassName('navProfile-email')[0];
    this.elemPicIcon = this.root.getElementsByClassName('navProfile-icon')[0];
    this.elemPicImage = this.root.getElementsByClassName('navProfile-pic')[0];
    this.elemPasswordNew = this.root.getElementsByClassName('navProfile-passwordnew')[0];
    this.elemPasswordConfirm = this.root.getElementsByClassName('navProfile-passwordconfirm')[0];

    if (this._config.navbarElements) {
      this.elemSave = this._config.navbarElements.save;
      this.elemReload = this._config.navbarElements.reload;
      this.elemIcon = this._config.navbarElements.icon;
      this.elemPic = this._config.navbarElements.pic;
    }
    
    this._addHandlers();
    this._setElementConstraints();
    
    return (await this.reload());
  }
  
  _addHandlers() {
    this.elemDisplayName.addEventListener('input', (e) => { this._handleBaseProfileInput(e); } );    
    this.elemEmail.addEventListener('input', (e) => { this._handleBaseProfileInput(e); } );
    UtilityKTS.denyDoubleQuotes(this.elemDisplayName);  
    UtilityKTS.denyDoubleQuotes(this.elemEmail);  
    
    this.elemPasswordNew.addEventListener('input', (e) => { this._handleBaseProfileInput(e); } );  
    this.elemPasswordConfirm.addEventListener('input', (e) => { this._handleBaseProfileInput(e); } );  

    this.elemPicIcon.addEventListener('click', (e) => { this._handleProfilePic(e); });    
    this.elemPicImage.addEventListener('click', (e) => { this._handleProfilePic(e); });    
    
    if (this._config.navbarElements) {
      this._config.navbarElements.save.addEventListener('click', (e) => {this._handleSave(e);});
      this._config.navbarElements.reload.addEventListener('click', (e) => {this._handleReload(e);});
    }
  }
  
  _setElementConstraints() {
    this.elemDisplayName.maxLength = 40;
    this.elemEmail.maxLength = 50;
    this.elemPasswordNew.maxLength = 20;
    this.elemPasswordConfirm.maxLength = 20;
    
    this.elemPasswordNew.autocomplete = 'off';
    this.elemPasswordConfirm.autocomplete = 'off';
  }
      
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  async reload() {
    var result = await this._getUserInfo();
    if (!result.success) return;
    
    this.elemDisplayName.value = this.userInfo.displayname;
    this.elemEmail.value = this.userInfo.email;

    this._setProfilePic(this.userInfo.profilepic);    

    this.elemPasswordNew.value = '';
    this.elemPasswordNew.setAttribute('as-state', 'clean');
    this.elemPasswordNew.setAttribute('as-valid', true);
    
    this.elemPasswordConfirm.value = '';
    this.elemPasswordConfirm.setAttribute('as-state', 'clean');
    this.elemPasswordConfirm.setAttribute('as-valid', true);
    
    this._setDirty(false);

    return true;
  }
  
  _setProfilePic(picURL) {
    var hasPic = (picURL && picURL.length > 0);
    
    if (hasPic) {
      this.elemPicImage.style.backgroundImage = "url(" + picURL + "), url('" + this.invalidPic + "')";
      this.elemPicImage.setAttribute('as-current-background', picURL);

    } else {
      this.elemPicImage.style.backgroundImage = '';
      this.elemPicImage.setAttribute('as-current-background', '');
    }
    
    UtilityKTS.setClass(this.elemPicIcon, this._config.hideClass, hasPic);
    UtilityKTS.setClass(this.elemPicImage, this._config.hideClass, !hasPic);
  }
  
  isDirty() {
    return this.dirtyBit;
  }
  
  _setDirty(dirty) {
    this.dirtyBit = dirty;
    this._setNavbarProperties();
  }
    
  _setNavbarProperties() {
    if (this._config.navbarElements) {
      this._setNavbarProfilePic();
      this.elemSave.disabled = !this.dirtyBit;
      this.elemReload.disabled = !this.dirtyBit;
    }
  }
  
  _setNavbarProfilePic() {
    var usePic = (this.userInfo && this.userInfo.profilepic);
    if (usePic) this.elemPic.src = this.userInfo.profilepic;
    UtilityKTS.setClass(this.elemIcon, 'hide-me', usePic);
    UtilityKTS.setClass(this.elemPic, 'hide-me', !usePic);
  }
  
  _getEntryData() {
    var entryData = null;
    var valid = false;
    
    var displayName = this.elemDisplayName.value;
    var email = this.elemEmail.value;
    var picImageURL = this.elemPicImage.getAttribute('as-current-background');
    
    if (!this._validatePlainEntry()) return null;
    if (!this._validatePassword()) return null;
    
    var baseInfoChanged = (
      (displayName != this.userInfo.displayname) ||
      (email != this.userInfo.email) ||
      (picImageURL != this.userInfo.profilepic)
    );
    
    var entryData = {
      "displayName": this.elemDisplayName.value,
      "email": this.elemEmail.value,
      "picURL": this.elemPicImage.getAttribute('as-current-background'),
      "password": this.elemPasswordNew.value,
      "baseInfoChanged": baseInfoChanged,
      "passwordChanged": this._passwordChanged()
    }
    
    return entryData;
  }
  
  _validatePlainEntry() {
    var valid = false;
    
    /* thing else needed at this point */ valid = true;
    
    return valid;
  }
  
  _validatePassword() {
    if (!this._passwordChanged()) return true
    var valid = false;
    
    var validNew = this.elemPasswordNew.getAttribute('as-valid') == 'true';
    var validConfirm = this.elemPasswordConfirm.getAttribute('as-valid') == 'true';
    
    valid = validNew && validConfirm;
    
    return valid;
  }
  
  _passwordChanged() {
    var changed = 
      this.elemPasswordNew.getAttribute('as-state') == 'dirty' ||
      this.elemPasswordConfirm.getAttribute('as-state') == 'dirty';

    return changed;
  }
  
  _setPasswordError(passwordType, errorMsg) {
    var elemError;
    var elemInput;
    
    if (passwordType == 'new') {
      elemError = this.root.getElementsByClassName('err-passwordnew')[0];
      elemInput = this.elemPasswordNew;
      
    } else if (passwordType == 'confirm') {
      elemError = this.root.getElementsByClassName('err-passwordconfirm')[0];
      elemInput = this.elemPasswordConfirm;
    }
    if (!elemError) return;
    
    elemError.innerHTML = errorMsg;
    UtilityKTS.setClass(elemInput, 'as-warning', errorMsg.length > 0);
    elemInput.setAttribute('as-valid', errorMsg.length == 0);
  }
  
  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {
    UtilityKTS.setClass(this._container, this._config.hideClass, !makeVisible);
  }
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleBaseProfileInput(e) {
    if (e.target.id == 'navProfile-displayname' || e.target.id == 'navProfile-email') {

    
    } else if (e.target.id == 'navProfile-passwordnew' || e.target.id == 'navProfile-passwordconfirm') {
      var pwdNew = this.elemPasswordNew.value;
      var errMsg = '';
      if (pwdNew.length > 0 && pwdNew.length < 8) errMsg = 'passwords must be at least 8 characters long';
      this._setPasswordError('new', errMsg);
      
      var pwdConfirm = this.elemPasswordConfirm.value;
      errMsg = '';
      if (pwdNew != pwdConfirm) errMsg = 'passwords do not match';
      this._setPasswordError('confirm', errMsg);

      e.target.setAttribute('as-state', 'dirty');
    }
      
    this._setDirty(true);
  }  
  
  async _handleSave(e) {
    var entryData = this._getEntryData();
    if (!entryData) {
      alert('One or more fields is invalid.  Please try to correct them and resubmit');
      return;
    }
    
    var success = await this._saveUserInfo(entryData);
    if (success) {
      this._setDirty(false);
      this.reload();
    }
    
    return false; // to prevent propagation
  }
  
  async _handleReload(e) {
    var msg = 'Any changes will be lost.\nChoose "OK" to continue with reloading';
    if (!confirm(msg)) return;
    
    await this.reload();
  }
  
  _handleProfilePic(e) {
    var currentImageURL = this.elemPicImage.getAttribute('as-current-background');
    
    var imageURL = prompt('Please enter the URL for the profile picture', currentImageURL);
    if (imageURL == null) return;
    
    var imageURL = this._sanitizeURL(imageURL);    
    if (imageURL != currentImageURL) {
      this._setProfilePic(imageURL);
      this._setDirty(true);
    }
  }
  
    //---------------------------------------
	// DB interface
	//----------------------------------------
  async _getUserInfo() {
    this.userInfo = null;
    var dbResult = await SQLDBInterface.doGetQuery('tipmanager/query', 'profile');
    
    if (dbResult.success) {
      this.userInfo = dbResult.data;

    } else {
      console.log('failed to get user info');
    }
    
    return dbResult;
  }
  
  async _saveUserInfo(userInfo) {
    var success = false;
    
    success = await this._saveBaseProfile(userInfo);
    if (success) {
      var result = await this._savePassword(userInfo);
      if (result.success) {
        window.open(result.data.redirectURL, '_self'); 
      }        
    }
    
    return success;
  }
  
  async _saveBaseProfile(userInfo) {
    if (!userInfo.baseInfoChanged) return true;
    var success = false;

    var profileInfo = {
      "displayname": userInfo.displayName,
      "email": userInfo.email,
      "profilepic": userInfo.picURL.length > 0 ? userInfo.picURL : '**no pic**'
    };

    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/update', 'profile', profileInfo);

    return queryResults.success;
  }
  
  async _savePassword(userInfo) {
    if (!userInfo.passwordChanged) return {success: true};
    
    console.log('do _savePassword');

    var hashedPassword = '';
    var hashResult = this.userManagement.hashPassword(userInfo.password);
    if (hashResult.success) {
      hashedPassword = hashResult.hashedPassword;
    } else {
      return hashResult;
    }
    
    var params = {
      passwordHash: hashedPassword
    }
    
    var queryResults = await SQLDBInterface.doPostQuery('usermanagement/passwordchange', '', params, this._notice);

    return queryResults;
  }
  
/*---
  async _saveStateToDB(state) {
    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/update', 'profile', state, this._notice);
    
    return queryResults.success;
  }
  
  async _saveNewPassword() {
    var elemPassword = this._container.getElementsByClassName('password-new')[0];
 
    var hashedPassword = '';
    var hashResult = this._userManagement.hashPassword(elemPassword.value);
    if (hashResult.success) {
      hashedPassword = hashResult.hashedPassword;
    } else {
      return hashResult;
    }
    
    var params = {
      passwordHash: hashedPassword
    }
    
    var queryResults = await SQLDBInterface.doPostQuery('usermanagement/passwordchange', '', params, this._notice);
    
    return queryResults;
  }
---*/
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------    
  _sanitizeURL(url) {
    url = url.replace(/[\"]/g, '%22');
    url = url.replace(/[\']/g, '%22');
    return url;
  }
  
}
