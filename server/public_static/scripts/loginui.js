//-----------------------------------------------------------------------------------
// LoginUI class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class LoginUI {
  constructor(callbackLoginComplete) {
    this._version = '0.01';
    
    this._HIDE_CLASS = 'loginui-hide';
    
    this._callbackLoginComplete = callbackLoginComplete;
    this._container = null;
  }
 
  async render() {
    var elemContainer = CreateElement.createDiv(null, 'loginui ' + this._HIDE_CLASS);
    this._container = elemContainer;

    var elemTitle = CreateElement.createDiv(null, 'loginui-title', 'Login');
    elemContainer.appendChild(elemTitle);
    
    elemContainer.appendChild(CreateElement.createDiv(null, 'loginui-info'));
    elemContainer.appendChild(CreateElement.createDiv(null, 'loginui-info'));
    
    elemContainer.appendChild(CreateElement.createSelect(null, 'loginui-select', null));
    
    var elemConfirmContainer = CreateElement.createDiv(null, null);
    elemContainer.appendChild(elemConfirmContainer);
    elemConfirmContainer.appendChild(CreateElement.createIcon(null, 'loginui-icon far fa-check-square', 'complete login', (e) => {return this._completeLogin(e);}));
    elemConfirmContainer.appendChild(CreateElement.createIcon(null, 'loginui-icon far fa-window-close', 'cancel login', (e) => {return this._cancelLogin(e);}));
  
    elemContainer.appendChild(CreateElement.createDiv(null, 'loginui-error'));
    
    return elemContainer;
  }

  async show(makeVisible) { 
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (makeVisible) {
      var userInfo = await this._getUserInfo();
      
      var dbResult = await this._doGetQuery('usermanagement', 'getuserlist');
      var userData = dbResult.data;
      var optionList = [];
      if (dbResult.success) {
        for (var i = 0; i < userData.length; i++) {
          optionList.push({id: i, value: userData[i].usershortname, textval: userData[i].username});
        }
      }

      var elemSelectOrig = this._container.getElementsByClassName('loginui-select')[0];
      var elemSelectNew = CreateElement.createSelect(null, 'loginui-select', null, optionList);     
      elemSelectOrig.parentNode.replaceChild(elemSelectNew, elemSelectOrig);

      this._container.getElementsByClassName('loginui-info')[0].innerHTML = 'user id: ' + userInfo.usershortname;
      this._container.getElementsByClassName('loginui-info')[1].innerHTML = 'user name: ' + userInfo.username; 
      
    } else {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }

  async _completeLogin(e) {
    var elemSelect = this._container.getElementsByClassName('loginui-select')[0];
    var userShortName = elemSelect.options[elemSelect.selectedIndex].value;
    
    var dbResult = await this._doGetQuery('usermanagement/setuser', 'username/' + userShortName);
    if (dbResult.success) {
      this.show(false);
      this._callbackLoginComplete();
    }
  }  

  _cancelLogin(e) {
    this.show(false);
  }

  async _getUserInfo() {
    var userInfo = null;
    
    var dbResult = await this._doGetQuery('usermanagement', 'getuser');
    if (dbResult.success) {
      userInfo = dbResult.data;
    }
    return userInfo;
  }
  
  _showError(msg) {
    var elemErr = this._container.getElementsByClassName('loginui-error')[0];
    elemErr.innerHTML = msg;
  }    

  async _doGetQuery(queryType, queryName) {
    var resultData = null;
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._showError('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }
}
