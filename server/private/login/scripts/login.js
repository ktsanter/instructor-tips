//-------------------------------------------------------------------
// landing page for Instructor Tips login
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
	const page = {};
  
  const appInfo = {
    appName: '[unknown]'
  };
  
	const settings = {
    urlLogin: '/login',
    urlLoginAttempt: '/usermanagement/login_attempt',
    
    urlCreateAccount: '/usermanagement/createaccount',
    urlCreateAccountAttempt: '/usermanagement/createaccount_attempt',
    
    urlResetAccount: '/usermanagement/resetaccount',
    urlResetAccountAttempt: '/usermanagement/resetaccount_attempt',
    
    urlPendingResetAttempt: '/usermanagement/pendingaccount_attempt'
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init (sodium) {
    checkQueryParams();
    
    settings.userManagement = new UserManagement(sodium);
    var initSuccessful = await settings.userManagement.init();
    
   	page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    if (!initSuccessful) {
      page.body.appendChild(CreateElement.createDiv(null, null, 'failed to initialize UserManagement'));
      return false;
    }
    
    page.body.appendChild(_renderPage());
    
    setTimeout(function() {
      document.getElementsByName('userName')[0].focus();
    }, 0);
    
    return true;
	}
	  
  function checkQueryParams() {
    var urlParams = new URLSearchParams(window.location.search);
    var retryLogin = urlParams.has('retry') ? urlParams.get('retry') == 'true' : false;
    var createAccount = urlParams.has('createaccount') ? urlParams.get('createaccount') == 'true' : false;
    var resetAccount = urlParams.has('resetaccount') ? urlParams.get('resetaccount') == 'true' : false;
    var invalidUser = urlParams.has('invaliduser') ? urlParams.get('invaliduser') == 'true' : false;
    var pendingResetAccount = urlParams.has('pending') ? urlParams.get('pending') == 'true' : false;
    var resetId = urlParams.has('id') ? urlParams.get('id') : null;
    var invalidPending = urlParams.has('invalidpending') ? urlParams.get('invalidpending') == 'true' : false;
    
    settings.retryLogin = retryLogin;
    settings.createAccount = createAccount;
    settings.resetAccount = resetAccount;
    settings.invalidUser = invalidUser;
    settings.pendingResetAccount = pendingResetAccount;
    settings.resetId = resetId;
    settings.invalidPending = invalidPending;
  } 
  
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    var container = CreateElement.createDiv(null, null);
    
    container.appendChild(_renderTitle());
    container.appendChild(_renderContents());
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'title-container');
    
    var elem = CreateElement.createLink(null, 'titlelink', settings.userManagement.sessionAppName(), null, settings.urlLogin);
    container.appendChild(elem);
    
    var elem = CreateElement.createDiv(null, 'titlelabel');
    container.appendChild(elem);
    settings._titleLabel = elem;
    
    return container;
  }
  
  function _updateTitle(title) {
    settings._titleLabel.innerHTML = title;
  }

  
  function _renderContents() {
    var container = CreateElement.createDiv(null, 'contents-container');
    
    container.appendChild(_renderErrorMessageArea());
    if (settings.retryLogin) this._errorMessage.innerHTML = 'login failed, please try again';
    
    if (settings.createAccount) {
      _updateTitle( 'create account');
      container.appendChild(_renderCreateAccountForm());
      container.appendChild(_renderLinkArea());
      
    } else if (settings.resetAccount) {
      _updateTitle( 'request account reset');
      container.appendChild(_renderResetAccountForm());
      container.appendChild(_renderLinkArea());
      
    } else if (settings.pendingResetAccount) {
      _updateTitle( 'pending account reset');
      container.appendChild(_renderPendingResetAccountForm());
      container.appendChild(_renderLinkArea());
      
    } else if (settings.invalidPending) {
      _updateTitle( '');
      container.appendChild(_renderInvalidPending());
      container.appendChild(_renderLinkArea());
      
    } else {
      _updateTitle('sign in');
      container.appendChild(_renderLoginForm());
      container.appendChild(_renderLinkArea());
    }
    
    return container;    
  }
  
    function _renderLoginForm() {
    var elemForm = CreateElement._createElement('form', null, 'userform loginform');
    elemForm.action = settings.urlLoginAttempt;
    elemForm.method = 'post';
        
    elemForm.appendChild(_renderUserNameField());
    elemForm.appendChild(_renderPasswordField(false));  
    elemForm.appendChild(_renderSubmit('sign in'));    
        
    return elemForm;
  }
  
  function _renderCreateAccountForm() {
    var elemForm = CreateElement._createElement('form', null, 'userform createaccountform');
    elemForm.action = settings.urlCreateAccountAttempt;
    elemForm.method = 'post';
        
    elemForm.appendChild(_renderUserNameField());
    elemForm.appendChild(_renderPasswordField(true));
    elemForm.appendChild(_renderSubmit('create account'));    
    
    return elemForm;
  }
  
  function _renderResetAccountForm() {
    var elemForm = CreateElement._createElement('form', null, 'userform resetaccountform');
    elemForm.action = settings.urlResetAccountAttempt;
    elemForm.method = 'post';
        
    elemForm.appendChild(_renderUserNameField());
    elemForm.appendChild(_renderSubmit('submit request'));    
    
    return elemForm;
  }
  
  function _renderPendingResetAccountForm() {
    var elemForm = CreateElement._createElement('form', null, 'userform pendingresetform');
    elemForm.action = settings.urlPendingResetAttempt;
    elemForm.method = 'post';
        
    elemForm.appendChild(_renderUserNameField());
    elemForm.appendChild(_renderPasswordField(true));
    elemForm.appendChild(_renderIdField());
    elemForm.appendChild(_renderSubmit('submit new password'));    
    
    return elemForm;
  }  
  
  function _renderInvalidPending() {
    var container = CreateElement.createDiv(null, 'invalidpending');
        
    var msgContainer = CreateElement.createDiv(null, 'invalidpending-contents');
    container.appendChild(msgContainer);
    msgContainer.innerHTML = 'Unable to reset account. The account reset request is expired or invalid.';
    
    return container;
  }
  
  function _renderUserNameField() {
    var container = CreateElement.createDiv(null, null);
    var subcontainer = CreateElement.createDiv(null, 'subcontainer');
    container.appendChild(subcontainer);
    
    var elem = CreateElement._createElement('input', 'userName', 'username login-textfield');
    subcontainer.appendChild(elem);
    
    elem.type = 'text';
    elem.name = 'userName';
    elem.placeholder = 'username';
    elem.autocomplete = 'off';
    elem.addEventListener('input', (e) => {return _handleUserNameChange(e);}); 
    UtilityKTS.denyDoubleQuotes(elem);    

    elem = CreateElement.createSpan(null, 'form-comment username-message');
    subcontainer.appendChild(elem);
    if (settings.invalidUser) {
      if (settings.createAccount) {
        elem.innerHTML = 'an account for this user already exists, please try again';
      } else if (settings.resetAccount || settings.pendingResetAccount) {
        elem.innerHTML = 'an account for this user was not found, please try again';
      }
    }
    
    return container;    
  }
  
  function _renderPasswordField(includeConfirm) {
    var container = CreateElement.createDiv(null, null);

    // password    
    var subcontainer = CreateElement.createDiv(null, 'subcontainer');
    container.appendChild(subcontainer);

    var elem = CreateElement._createElement('input', 'userPassword', 'userpassword login-textfield');
    subcontainer.appendChild(elem);    

    elem.type = 'password';
    elem.name = ''; // no name => not included in form submission
    if (settings.pendingResetAccount) {
      elem.placeholder = 'new password';
    } else {
      elem.placeholder = 'password';
    }
    elem.autocomplete = 'off';
    elem.addEventListener('input', (e) => {return _handlePasswordChange(e, this._salt);});
    
    elem = CreateElement._createElement('input', 'hashedPassword', 'hashedPassword');
    subcontainer.appendChild(elem);
    elem.type = 'hidden';
    elem.name = 'hashedPassword';
    elem.hasConfirm = includeConfirm;

    elem = CreateElement.createSpan(null, 'form-comment userpassword-message');
    subcontainer.appendChild(elem);    
    
    // confirm password
    subcontainer = CreateElement.createDiv(null, 'subcontainer');
    container.appendChild(subcontainer);

    elem = CreateElement._createElement('input', 'userPasswordConfirm', 'userpasswordconfirm login-textfield');
    subcontainer.appendChild(elem);
    
    if (!includeConfirm) elem.style.display = 'none';
    elem.type = 'password';
    elem.name = ''; // no name => not included in form submission
    elem.placeholder = 'confirm password';
    elem.autocomplete = 'off';
    elem.addEventListener('input', (e) => {return _handlePasswordChange(e, this._salt);});

    elem = CreateElement.createSpan(null, 'form-comment userpasswordconfirm-message');
    subcontainer.appendChild(elem);    
    
    return container;
  }
  
  function _renderIdField() {
    var container = CreateElement.createDiv(null, null);

    var subcontainer = CreateElement.createDiv(null, 'subcontainer');
    container.appendChild(subcontainer);
    
    elem = CreateElement._createElement('input', 'identifier', 'identifier');
    subcontainer.appendChild(elem);
    elem.type = 'hidden';
    elem.name = 'identifier';
    elem.value = settings.resetId;
    
    return container;
  }
  
  function _renderSubmit(value) {
    var elem = CreateElement._createElement('input', null, 'form-submit submit-disabled');
    elem.type = 'submit';
    elem.value = value;
    elem.disabled = true;

    return elem;    
  }

  function _renderErrorMessageArea() {
    var container = CreateElement.createDiv(null, 'errorarea');
    
    this._errorMessage = container;
    
    return container;
  }
  
  function _renderLinkArea() {
    var container = CreateElement.createDiv(null, 'resetarea');
    
    if (settings.createAccount) {
      // no links
      
    } else if (settings.resetAccount) {
      var elem = CreateElement.createDiv(null, 'resetaccount-message');
      container.appendChild(elem);
      elem.innerHTML = 'An email will be sent to the address specified for your account, providing a link to reset your password.';
      
    } else if (settings.pendingResetAccount) {
      // no links
      
    } else {
      container.appendChild(CreateElement.createLink(null, 'newaccount', 'Create a new account?', null, settings.urlCreateAccount)); 
      //container.appendChild(CreateElement.createLink(null, 'resetaccount', 'Forgot your password?', null, settings.urlResetAccount)); 
    }
    
    return container;
  }   

  function _updateSubmitEnable() {
    var elemUserName = page.body.getElementsByClassName('username')[0];
    var elemPassword = page.body.getElementsByClassName('userpassword')[0];
    var elemConfirm = page.body.getElementsByClassName('userpasswordconfirm')[0];
    var elemNameMessage = page.body.getElementsByClassName('username-message')[0];
    var elemPwdMessage = page.body.getElementsByClassName('userpassword-message')[0];
    var elemConfirmMessage = page.body.getElementsByClassName('userpasswordconfirm-message')[0];
    var elemSubmit = page.body.getElementsByClassName('form-submit')[0];
    
    if (elemUserName) {
      UtilityKTS.setClass(elemUserName, 'invalid', false);
      elemNameMessage.innerHTML = '';
    }
    if (elemPassword) {
      UtilityKTS.setClass(elemPassword, 'invalid', false);
      elemPwdMessage.innerHTML = ''
    }
    if (elemConfirm) {
      UtilityKTS.setClass(elemConfirm, 'invalid', false);
      elemConfirmMessage.innerHTML = '';
    }
      
    var disableSubmit = true;

    if (settings.createAccount || settings.pendingResetAccount) {
      var name = elemUserName.value;
      var pwd = elemPassword.value;
      var pwdConfirm = elemConfirm.value;
      
      var nameValid = (name.length >= 6);
      var pwdValid = (pwd.length >= 8 && pwd.length <= 20);
      var confirmValid = (pwd == pwdConfirm);
      
      if (!nameValid && name.length > 0 && settings.createAccount) {
        elemNameMessage.innerHTML = 'user name length must be at least 6 and no more than 20';
        UtilityKTS.setClass(elemUserName, 'invalid', true);        
      }
      if (!pwdValid && pwd.length > 0) {
        elemPwdMessage.innerHTML = 'password length must be at least 8 and no more than 20';
        UtilityKTS.setClass(elemPassword, 'invalid', true);        
      }
      if (!confirmValid && pwd.length > 0) {
        elemConfirmMessage.innerHTML = 'passwords don\'t match';
        UtilityKTS.setClass(elemConfirm, 'invalid', true);
      }
      
      disableSubmit = !(nameValid && pwdValid && confirmValid);

    } else if (settings.resetAccount) {
      disableSubmit = (elemUserName.value.length == 0);

    } else {        
      var name = elemUserName.value;
      var pwd = elemPassword.value;
      var disableSubmit = (name.length == 0 || pwd.length == 0);
    }
      
    UtilityKTS.setClass(elemSubmit, 'submit-disabled', disableSubmit);
    elemSubmit.disabled = disableSubmit;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handleUserNameChange(e) {
    _updateSubmitEnable();
  }
  
  function _handlePasswordChange(e) {
    var elemHashed = page.body.getElementsByClassName('hashedPassword')[0];
    
    elemHashed.value = '';
    var hashResult = settings.userManagement.hashPassword(e.target.value);
    if (hashResult.success) elemHashed.value = hashResult.hashedPassword;

    _updateSubmitEnable();
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
