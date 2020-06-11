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
    this._container = CreateElement.createDiv(null, 'tipprofile ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    //this._container.appendChild(this._renderTitle());

    this._container.appendChild(this._renderContents());
    
    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipprofile-contents');
    
    container.appendChild(this._renderEmail());
    container.appendChild(this._renderPassword());
    container.appendChild(this._renderConfirm());
    
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
    
    var elem = CreateElement.createTextInput(null, 'tipprofile-emailinput');
    container.appendChild(elem);
    elem.type = 'email';
    elem.placeholder = 'email for notifications';
    elem.maxLength = 80;
    elem.addEventListener('input', (e) => {this._handleEmailChange(e);});
    elem.addEventListener('keyup', (e) => {this._handleEmailKeyup(e)});
    UtilityKTS.denyDoubleQuotes(elem);
    
    return container;
  }
  
  _renderPassword() {
    var container = CreateElement.createDiv(null, 'tipprofile-section tipprofile-password');
    
    container.appendChild(this._renderSectionTitle('change password'));
    
    var elem = CreateElement.createTextInput(null, 'tipprofile-passwordinput password-new');
    container.appendChild(elem);
    //elem.type = 'password';
    elem.placeholder = 'new password';
    elem.maxLength = 16;
    //elem.autocomplete = 'off';
    elem.addEventListener('input', (e) => {this._handlePasswordChange(e);});
    elem.disabled = true;

    elem = CreateElement.createTextInput(null, 'tipprofile-passwordinput password-confirm');
    container.appendChild(elem);
    //elem.type = 'password';
    elem.placeholder = 'confirm new password';
    elem.maxLength = 16;
    //elem.autocomplete = 'off';
    elem.addEventListener('input', (e) => {this._handlePasswordChange(e);});
    elem.disabled = true;

    return container;
  }
    
  _renderConfirm() {
    var container = CreateElement.createDiv(null, 'tipprofile-section tipprofile-confirm');
    
    var handler = (e) => {this._handleConfirm();};
    var elem = CreateElement.createButton(null, 'tipprofile-confirmsave', 'save', 'save profile changes', handler);
    container.appendChild(elem);       

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
      this._updateConfirm();
    }
  }
  
  _updateEmail(email) {
    var elem = this._container.getElementsByClassName('tipprofile-emailinput')[0];
    elem.value = email;
    elem.origEmailValue = email;
  }

  _updateConfirm() {
    var elem = this._container.getElementsByClassName('tipprofile-emailinput')[0];
    var enableConfirm = (elem.value != elem.origEmailValue);
    
    elem = this._container.getElementsByClassName('tipprofile-confirmsave')[0];
    elem.disabled = !enableConfirm;
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
 
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  _handleConfirm(e) {
    if (this._saveStateToDB(this._getStateFromControls())) {
      this.update();
    }
  }
  
  _handleCancel(e) {
    this.update();
  }

  _handleEmailChange(e) {
    this._updateConfirm();
  }
  
  _handleEmailKeyup(e) {
    if (e.code == 'Escape') {
      e.target.value = e.target.origEmailValue;
      this._updateConfirm();
    }
  }  
  
  _handlePasswordChange(e) {}
    
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
  
}
