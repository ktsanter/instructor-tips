//-----------------------------------------------------------------------------------
// TipCron class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TipCron {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Cron status';
    
    this._HIDE_CLASS = 'tipcron-hide';

    this._config = {};
    if (config) this._config = config;
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipcron ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderTitle());
    this._container.appendChild(this._renderContents());
    
    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }
  
  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipcron-contents');

    container.appendChild(this._renderItem('schedulepush', 'push notification job', 'enabled', 'disabled'));
    container.appendChild(this._renderItem('maildebug', 'mailer debug mode', 'on', 'off'));
    
    return container;
  }
  
  _renderItem(addedClass, msgLabel, msgControlOn, msgControlOff) {
    var container = CreateElement.createDiv(null, 'tipcron-item');
    
    var subcontainer = CreateElement.createDiv(null, 'tipcron-statuslabel');
    container.appendChild(subcontainer);
    subcontainer.appendChild(CreateElement.createDiv(null, 'tipcron-statuslabeltext', msgLabel));
    
    subcontainer = CreateElement.createDiv(null, 'tipcron-status');
    container.appendChild(subcontainer);
    
    var handler = (e) => {this._handleSwitchChange(e);};
    var className = 'tipcron-statuscontrol ' + addedClass;
    var elemStatus = CreateElement.createSliderSwitch(msgControlOn, msgControlOff, className, handler, false);
    subcontainer.appendChild(elemStatus);    
    
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
    console.log('update');
    var state = await this._loadStateFromServer();
   
    if (state) this._setUIState(state);
  }
  
  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  async _loadStateFromServer() {
    var state = null;
    
    var queryResults = await SQLDBInterface.doGetQuery('admin/query', 'cronstatus', this._notice);
    if (queryResults.success) {
      console.log(queryResults);
      state = queryResults.data;
    };
    console.log('_loadStateFromServer: ' + JSON.stringify(state));
    
    return state;
  }
 
  async _setServerState() {
    console.log('_setServerState');
    var  elemSchedulePush = this._container.getElementsByClassName('schedulepush')[0];
    var  elemMailDebugMode = this._container.getElementsByClassName('maildebug')[0];

    var queryData = {
      enablePushNotifications: CreateElement.getSliderValue(elemSchedulePush),
      setMailerDebugMode: CreateElement.getSliderValue(elemMailDebugMode)
    };

    var queryResults = await SQLDBInterface.doPostQuery('admin/update', 'cronstatus', queryData, this._notice);
  }

  _setUIState(newState) {
    console.log('_setUIState');
    var  elemSchedulePush = this._container.getElementsByClassName('schedulepush')[0];
    var  elemMailDebugMode = this._container.getElementsByClassName('maildebug')[0];
    CreateElement.setSliderValue(elemSchedulePush, newState.scheduleNotificationsRunning);
    CreateElement.setSliderValue(elemMailDebugMode, newState.mailerDebugMode);
  }
     
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  async _handleSwitchChange(e) {
    await this._setServerState();
    await this.update();
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
  
}
