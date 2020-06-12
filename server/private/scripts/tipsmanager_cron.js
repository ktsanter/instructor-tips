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
    
    container.appendChild(CreateElement.createDiv(null, 'tipcron-statuslabel', 'push notification job'));
    var subcontainer = CreateElement.createDiv(null, 'tipcron-status');
    container.appendChild(subcontainer);
    
    var elemStatus = CreateElement.createSliderSwitch('enabled', 'disabled', 'tipcron-statuscontrol', null, false);
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
    console.log('TipCron.update');
    /*
    var state = await this._loadStateFromDB();
   
    if (state) {
    }
    */
  }
  
  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  _getStateFromControls() {
    /*
    var elemEmail = this._container.getElementsByClassName('tipprofile-emailinput')[0];
    
    var state = {
      email: elemEmail.value
    };

    return state;
    */
  }
  
  async _loadStateFromDB() {
    /*
    var state = null;
    
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'profile', this._notice);
    if (queryResults.success) {
      state = queryResults.data;
    };
    
    return state;
    */
  }
  
  async _saveStateToDB(state) {
    /*
    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/update', 'profile', state, this._notice);
    
    return queryResults.success;
    */
  }
 
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
    
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
  
}
