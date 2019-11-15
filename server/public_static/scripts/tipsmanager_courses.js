//-----------------------------------------------------------------------------------
// TipCourseSelection class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipCourseSelection {
  constructor() {
    this._version = '0.01';
    this._title = 'Course selection';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'tipcourse ' + this._HIDE_CLASS);
        
    return this._container;;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update() {
    this._prepContainerForUpdate();
    
    // do DB stuff
  }
  
  _prepContainerForUpdate() {
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    this._container.appendChild(CreateElement.createDiv(null, 'tipmanager-title', this._title));
  }
  
  async show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
}
