//-----------------------------------------------------------------------------------
// TipProfile class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TipProfile {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Profile';
    
    this._HIDE_CLASS = 'tipprofile-hide';

    this._config = {};
    if (config) this._config = config;
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._userManagement = new UserManagement();
    await this._userManagement.init();
    
    this._container = CreateElement.createDiv(null, 'tipprofile ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderContents());

    return this._container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipprofile-contents');
    
    container.appendChild(this._renderEmail());
    container.appendChild(CreateElement.createDiv(null, 'tipprofile-spacer'));
    container.appendChild(this._renderPassword());
    
    return container;
  }
  
  _renderSectionTitle(title) {
    var container = CreateElement.createDiv(null, 'tipprofile-sectiontitle');
    
    container.appendChild(CreateElement.createDiv(null, 'tipprofile-sectiontitletext', title));
    
    return container;
  }
  
  _renderEmail() {
    var container = CreateElement.createDiv(null, 'tipprofile-section tipprofile-email');
    
    container.appendChild(this._renderSectionTitle('email for notification'));
    
    var subcontainer = CreateElement.createDiv('tipprofile-subsection');
    container.appendChild(subcontainer);
    
    var elem = CreateElement.createTextInput(null, 'tipprofile-input tipprofile-emailinput');
    subcontainer.appendChild(elem);
    elem.type = 'email';
    elem.placeholder = 'email for notifications';
    elem.maxLength = 40;
    elem.addEventListener('input', (e) => {this._handleEmailChange(e);});
    elem.addEventListener('keyup', (e) => {this._handleEmailKeyup(e)});
    UtilityKTS.denyDoubleQuotes(elem);
    
    
    subcontainer = CreateElement.createDiv('tipprofile-subsection');
    container.appendChild(subcontainer);
    
    var handler = (e) => {this._handleEmailConfirm();};
    var elem = CreateElement.createButton(null, 'tipprofile-button tipprofile-confirmemail', 'save', 'save new email address', handler);
    subcontainer.appendChild(elem);
    
    return container;
  }
  
  _renderPassword() {
    var container = CreateElement._createElement('form', null, 'tipprofile-section tipprofile-password');
    container.action = '/change_password';
    container.method = 'post';
    container.addEventListener('submit', (e) => {this._handlePasswordSubmit(e)});
    
    container.appendChild(this._renderSectionTitle('change password'));

    var subcontainer = CreateElement.createDiv(null, 'tipprofile-subsection');
    container.appendChild(subcontainer);
    
    var pwdChangeHandler = (e) => {this._handlePasswordChange(e); }

    var elem = CreateElement.createTextInput(null, 'tipprofile-input tipprofile-passwordinput password-new');
    subcontainer.appendChild(elem);
    elem.type = 'password';
    elem.placeholder = 'new password';
    elem.maxLength = 20;
    elem.autocomplete = 'off';
      
    elem.addEventListener('input', pwdChangeHandler);
    
    subcontainer.appendChild(CreateElement.createDiv(null, 'tipprofile-comment password-new-comment'));

    subcontainer = CreateElement.createDiv(null, 'tipprofile-subsection');
    container.appendChild(subcontainer);
    
    elem = CreateElement.createTextInput(null, 'tipprofile-input tipprofile-passwordinput password-confirm');
    subcontainer.appendChild(elem);
    elem.type = 'password';
    elem.placeholder = 'confirm new password';
    elem.maxLength = 20;
    elem.autocomplete = 'off';
    elem.addEventListener('input', pwdChangeHandler);

    subcontainer.appendChild(CreateElement.createDiv(null, 'tipprofile-comment password-confirm-comment'));
    
    subcontainer = CreateElement.createDiv(null, 'tipprofile-subsection');
    container.appendChild(subcontainer);
    
    var elem = CreateElement._createElement('input', null, 'tipprofile-button tipprofile-submit');
    subcontainer.appendChild(elem);
    elem.type = 'submit';
    elem.value = 'save';
    elem.title = 'save new password';
    elem.disabled = true;
    
    return container;
  }
        
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    this._showElement(this._container, makeVisible);
  }
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    var state = await this._loadStateFromDB();
   
    if (state) {
      this._updateEmail(state.email);
      this._updateEmailConfirm();
      this._updatePassword();
      this._updatePasswordConfirm();
    }
  }
  
  _updateEmail(email) {
    var elem = this._container.getElementsByClassName('tipprofile-emailinput')[0];
    elem.value = email;
    elem.origEmailValue = email;
  }

  _updateEmailConfirm() {
    var elem = this._container.getElementsByClassName('tipprofile-emailinput')[0];
    var enableConfirm = (elem.value != elem.origEmailValue);
    
    elem = this._container.getElementsByClassName('tipprofile-confirmemail')[0];
    elem.disabled = !enableConfirm;
  }
  
  _updatePassword() {
    var elemCommentNew = this._container.getElementsByClassName('password-new-comment')[0];
    var elemCommentConfirm = this._container.getElementsByClassName('password-confirm-comment')[0];
    elemCommentNew.innerHTML = '';
    elemCommentConfirm.innerHTML = '';
    
    var elemSubmit = this._container.getElementsByClassName('tipprofile-submit')[0];
    elemSubmit.disabled = true;
    
    var elemPwdInputs = this._container.getElementsByClassName('tipprofile-passwordinput');
    var elemPwdNew = null, elemPwdConfirm = null;
    
    for (var i = 0; i < elemPwdInputs.length; i++) {
      var elem = elemPwdInputs[i];
      if (elem.classList.contains('password-new')) elemPwdNew = elem;
      else if (elem.classList.contains('password-confirm')) elemPwdConfirm = elem;
    }
    
    elemPwdNew.value = '';
    elemPwdConfirm.value = '';
    UtilityKTS.setClass(elemPwdNew, 'password-invalid', false);
    UtilityKTS.setClass(elemPwdConfirm, 'password-invalid', false);
  }

  _updatePasswordConfirm() {
    var elemSubmit = this._container.getElementsByClassName('tipprofile-submit')[0];
    var elemCommentNew = this._container.getElementsByClassName('password-new-comment')[0];
    var elemCommentConfirm = this._container.getElementsByClassName('password-confirm-comment')[0];

    var elemPwdNew = null, elemPwdConfirm = null;
    var elemPwdInputs = this._container.getElementsByClassName('tipprofile-passwordinput');    
    for (var i = 0; i < elemPwdInputs.length; i++) {
      var elem = elemPwdInputs[i];
      if (elem.classList.contains('password-new')) elemPwdNew = elem;
      else if (elem.classList.contains('password-confirm')) elemPwdConfirm = elem;
    }
    
    var pwdNew = elemPwdNew.value;
    var pwdConfirm = elemPwdConfirm.value;

    var newValid = (pwdNew.length >= 8 && pwdNew.length <= 20); 
    // no further validity checks for now
    //newValid = newValid && (pwdNew.match(/[A-Z]/) != null);
    //newValid = newValid && (pwdNew.match(/[a-z]/) != null);
    //newValid = newValid && (pwdNew.match(/[0-9]/) != null);
    newValid = newValid || (pwdNew.length == 0);
   
   var confirmValid = (pwdNew == pwdConfirm);
    
    elemCommentNew.innerHTML = '';
    elemCommentConfirm.innerHTML = '';
    if (!newValid) {
      elemCommentNew.innerHTML = 'Passwords must be at least 8 characters long and no more than 20.';
    }
    if (!confirmValid) {
      elemCommentConfirm.innerHTML = 'passwords do not match';
    }
    
    UtilityKTS.setClass(elemPwdNew, 'password-invalid', !newValid);
    UtilityKTS.setClass(elemPwdConfirm, 'password-invalid', !confirmValid);
    
    var submitValid = (newValid && confirmValid && pwdNew.length > 0);
    elemSubmit.disabled = !submitValid;
  }
  
  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  _getStateFromControls() {
    var elemEmail = this._container.getElementsByClassName('tipprofile-emailinput')[0];
    
    var state = {
      email: elemEmail.value
    };

    return state;
  }
  
  async _loadStateFromDB() {
    var state = null;
    
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'profile', this._notice);
    if (queryResults.success) {
      state = queryResults.data;
    };
    
    return state;
  }
  
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
   
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  _handleEmailConfirm(e) {
    if (this._saveStateToDB(this._getStateFromControls())) {
      this.update();
    }
  }

  _handleEmailChange(e) {
    this._updateEmailConfirm();
  }
  
  _handleEmailKeyup(e) {
    if (e.code == 'Escape') {
      e.target.value = e.target.origEmailValue;
      this._updateEmailConfirm();
    }
  }  
  
  _handlePasswordChange() {
    this._updatePasswordConfirm();
  }
  
  async _handlePasswordSubmit(e) {
    e.preventDefault();
    
    var elemForm = e.target;
    var elemPassword = elemForm.getElementsByClassName('password-new')[0];    

    var result = await this._saveNewPassword(this._hashPassword(elemPassword.value));
    if (result.success) {
      window.open(result.data.redirectURL, '_self'); 
    }
    
    // alert('password update failed');
    // always... to prevent propagation
    return false;
  }
    
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
  _hashPassword(pwd) {
    return pwd;
  }
  
}
