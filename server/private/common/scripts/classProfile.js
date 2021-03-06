//-------------------------------------------------------------------
// Aardvark Studios Profile class
// TODO: set element constraints - lengths, etc.
// TODO: validity checks for passwords
// TODO: actual DB connections
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
    this.elemUserName = this.root.getElementsByClassName('navProfile-username')[0];
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
    this.elemUserName.addEventListener('input', (e) => { this._handleBaseProfileInput(e); } );    
    this.elemEmail.addEventListener('input', (e) => { this._handleBaseProfileInput(e); } );  
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
    this.elemUserName.maxLength = 40;
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
    
    this.elemUserName.value = this.userInfo.userName;
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
    
    var userName = this.elemUserName.value;
    var email = this.elemEmail.value;
    var picImageURL = this.elemPicImage.getAttribute('as-current-background');
    if (picImageURL.length == 0) picImageURL = null;
    
    if (!this._validatePlainEntry()) return null;
    if (!this._validatePassword()) return null;
    
    var baseInfoChanged = (
      (userName != this.userInfo.userName) ||
      (email != this.userInfo.email) ||
      (picImageURL != this.userInfo.profilepic)
    );
    
    var entryData = {
      "userName": this.elemUserName.value,
      "email": this.elemEmail.value,
      "picURL": this.elemPicImage.getAttribute('as-current-background'),
      "baseInfoChanged": baseInfoChanged,
      "passwordChanged": this._passwordChanged()
    }
    
    return entryData;
  }
  
  _validatePlainEntry() {
    var valid = false;
    
    /* debug */ valid = true;
    console.log('_validatePlainEntry: ' + valid);
    
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
    console.log('filter username and email fields to eliminate \' and "');
    // filter characters for username
    
    if (e.target.id == 'navProfile-passwordnew' || e.target.id == 'navProfile-passwordconfirm') {
      var pwdNew = this.elemPasswordNew.value;
      var errMsg = '';
      if (pwdNew.length < 8) errMsg = 'passwords must be at least 8 characters long';
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
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'getuser');
    
    if (dbResult.success) {
      this.userInfo = dbResult.userInfo;
      /* for testing */ //this.userInfo.profilepic = 'https://res.cloudinary.com/ktsanter/image/upload/v1613234395/welcome%20letter/instructor.jpg';

    } else {
      console.log('failed to get user info');
    }
    
    return dbResult;
  }
  
  async _saveUserInfo(userInfo) {
    var success = false;
    
    success = await this._saveBaseProfile(userInfo);
    if (success) success = await this._savePassword(userInfo);
    
    return success;
  }
  
  async _saveBaseProfile(userInfo) {
    if (!userInfo.baseInfoChanged) return true;
    var success = false;

    console.log('do _saveBaseProfile');

    /* for debug */ success = true;
    
    return success;
  }
  
  async _savePassword(userInfo) {
    if (!userInfo.passwordChanged) return true;
    var success = false;
    
    console.log('do _savePassword');

    /* for debug */ success = true;

    return success;
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
