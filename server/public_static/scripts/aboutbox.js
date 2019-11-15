//-----------------------------------------------------------------------------------
// AboutBox class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class AboutBox {
  constructor(config) {
    this._version = '0.01';
    this._HIDE_CLASS = 'about-hide';
    
    this._config = config;
    this._container = null;
  }
 
  render() {
    var elemContainer = CreateElement.createDiv(null, 'about ' + this._HIDE_CLASS);
    this._container = elemContainer;

    var elemTitle = CreateElement.createDiv(null, 'about-title');
    elemContainer.appendChild(elemTitle);
    
    elemTitle.appendChild(CreateElement.createSpan(null, 'about-product', this._config.appname));
    
    elemContainer.appendChild(CreateElement.createDiv(null, 'about-item', 'version: ' + this._config.appversion));
    elemContainer.appendChild(CreateElement.createDiv(null, 'about-item', 'author: ' + this._config.appauthor));
    elemContainer.appendChild(CreateElement.createDiv(null, 'about-item', 'contact: ' + this._config.appcontact));
    
    var elemConfirmContainer = CreateElement.createDiv(null, null);
    elemContainer.appendChild(elemConfirmContainer);    
    elemConfirmContainer.appendChild(CreateElement.createIcon(null, 'about-icon far fa-window-close', null, (e) => {return this._closeAbout(e);}));

    return elemContainer;
  }
  
  _closeAbout(e) {
    this.show(false);
  }

  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
}
