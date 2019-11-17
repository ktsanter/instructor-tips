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
    
    var msg = '';
    msg += '- display all possible course/termgroup combos <br>';
    msg += '- mark those the user has currently selected <br>';
    msg += '- provide UI to select any combo<br>';
    msg += 'e.g.<br>';
    msg += 'Java Programming A        X semester     X trimester    O summer';
    this._container.appendChild(CreateElement.createDiv(null, null, msg));
    
    // do DB stuff
  }
  
  _prepContainerForUpdate() {
    this._removeChildren(this._container);

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    this._container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    titleContainer.appendChild(CreateElement.createIcon(null, 'tipmanager-icon fas fa-caret-down', 'show/hide filter', (e) => {return this._toggleFilterCollapse(e);}));
  }
  
  async show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  _toggleFilterCollapse(e) {
    var elemIcon = e.target;
    var elemFilter = this._container.getElementsByClassName('tipfilter')[0];
    
    elemIcon.classList.toggle('fa-caret-right');
    elemIcon.classList.toggle('fa-caret-down');
    elemFilter.classList.toggle(this._HIDE_CLASS);
  }
  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }  
}
