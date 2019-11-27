//-----------------------------------------------------------------------------------
// TipSchedulingShare class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipSchedulingShare {
  constructor(config) {
    this._version = '0.01';
    this._title = 'SchedulingShare';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
    this._config = config;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'tipschedule-share', 'share UI');
    
    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  update() {
    console.log('update share');
  }
  

  //------------------------------------------------------------
  // handlers
  //------------------------------------------------------------  

  //------------------------------------------------------------
  // utility methods
  //------------------------------------------------------------  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }
}
