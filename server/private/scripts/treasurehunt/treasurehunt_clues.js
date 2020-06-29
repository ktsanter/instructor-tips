//-----------------------------------------------------------------------------------
// TreasureHuntClues class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TreasureHuntClues {
  constructor(config) {
    this._version = '0.01';
    this._title = 'TreasureHuntClues';
    
    this._HIDE_CLASS = 'treasurehuntclues-hide';

    this._config = {};
    if (config) this._config = config;
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'treasurehuntclues ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderContents());

    return this._container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'treasurehuntclues-contents');
    
    container.innerHTML = 'TreasureHuntClues contents';
    
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
    console.log('TreasureHuntClues.update');
    return;
    /*
    var state = await this._loadStateFromDB();
   
    if (state) {
      //update particulars
    }
    */
  }
  
  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  _getStateFromControls() {
    console.log('TreasureHuntClues._getStateFromControls');
    return {};
    
    /*
    var elemDisplayName = this._container.getElementsByClassName('tipprofile-displaynameinput')[0];
    var elemEmail = this._container.getElementsByClassName('tipprofile-emailinput')[0];
    
    var state = {
      displayname: elemDisplayName.value,
      email: elemEmail.value
    };

    return state;
    */
  }
  
  async _loadStateFromDB() {
    console.log('TreasureHuntClues._loadStateFromDB');
    var state = null;
    
    /*
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'profile', this._notice);
    if (queryResults.success) {
      state = queryResults.data;
    };
    */
    
    return state;
  }
  
  async _saveStateToDB(state) {
    console.log('TreasureHuntClues._saveStateToDB');
    return;
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
