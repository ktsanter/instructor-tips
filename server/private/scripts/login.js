//-------------------------------------------------------------------
// landing page for Instructor Tips login
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------

const app = function () {
	const page = {};
  
  const appInfo = {
    appName: 'Instructor Tips'
  };
  
	const settings = {};
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    var queryResults = await SQLDBInterface.doGetQuery('usermanagement', 'passwordsalt');
    if (!queryResults.success) {
      console.log('failed to get password salt');
      return;
    } 
    
    settings.salt = queryResults.data.salt;
    
   	page.body = document.getElementsByTagName('body')[0];
    page.body.classList.add('instructortips-colorscheme');
    
    page.body.appendChild(_renderPage());
    
    setTimeout(function() {
      document.getElementsByName('userName')[0].focus();
    }, 0);
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _renderPage() {
    var container = CreateElement.createDiv(null, null);
    
    container.appendChild(_renderTitle());
    container.appendChild(_renderContents());
    checkForRetry();
    
    return container;
  }
  
  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'title-container');
    
    var titleLabel = CreateElement.createDiv(null, 'title', appInfo.appName);
    container.appendChild(titleLabel);
    
    return container;
  }

  
  function _renderContents() {
    var container = CreateElement.createDiv(null, 'contents-container');
    
    container.appendChild(_renderLoginForm());
    container.appendChild(_renderRetryArea());
    
    return container;    
  }
  
    function _renderLoginForm() {
    var elemForm = CreateElement._createElement('form', null, null);
    elemForm.action = '/login_attempt';
    elemForm.method = 'post';
        
    var userNameContainer = CreateElement.createDiv(null, null);
    elemForm.appendChild(userNameContainer);
    
    var elemUserName = CreateElement._createElement('input', 'userName', 'login-textfield');
    userNameContainer.appendChild(elemUserName);
    elemUserName.type = 'text';
    elemUserName.name = 'userName';
    elemUserName.placeholder = 'username';
    elemUserName.autocomplete = 'off';
    
    var passwordContainer = CreateElement.createDiv(null, null);
    elemForm.appendChild(passwordContainer);
    
    var elemPassword = CreateElement._createElement('input', 'userPassword', 'login-textfield');
    passwordContainer.appendChild(elemPassword);
    elemPassword.type = 'password';
    elemPassword.name = 'userPassword';
    elemPassword.placeholder = 'password';
    elemPassword.autocomplete = 'off';
    elemPassword.addEventListener('input', (e) => {return _handlePasswordChange(e, this._salt);});
    
    var elemHashedPassword = CreateElement.createTextInput(null, 'hashedPassword');
    passwordContainer.appendChild(elemHashedPassword);
    elemHashedPassword.style.display = 'none';
    
    var elemSubmit = CreateElement._createElement('input', null, 'login-submit');
    elemForm.appendChild(elemSubmit);
    elemSubmit.type = 'submit';
    elemSubmit.value = 'login';
    
    return elemForm;
  }
  
  function _renderRetryArea() {
    var container = CreateElement.createDiv(null, 'retryarea');
    
    this._retryArea = container;
    
    return container;
  }
  
  function checkForRetry() {
    var urlParams = new URLSearchParams(window.location.search);
    var retry = urlParams.has('retry') ? urlParams.get('retry') == 'true' : false;
    if (retry) {
      this._retryArea.innerHTML = 'login failed, please retry';
    }
  }    

  function _hashPassword(pwd) {
    return settings.salt + pwd;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function _handlePasswordChange(e) {
    var elemHashed = page.body.getElementsByClassName('hashedPassword')[0];
    elemHashed.value = _hashPassword(e.target.value);
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
