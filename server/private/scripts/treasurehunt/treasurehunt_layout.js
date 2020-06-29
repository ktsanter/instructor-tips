//-----------------------------------------------------------------------------------
// TreasureHuntLayout class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TreasureHuntLayout {
  constructor(config) {
    this._version = '0.01';
    this._title = 'TreasureHuntLayout';
    
    this._HIDE_CLASS = 'layout-hide';

    this._config = {};
    if (config) this._config = config;
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'treasurehuntlayout ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(await this._renderContents());

    return this._container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'layout-contents');
    
    container.appendChild(this._renderImageSection());
    container.appendChild(this._renderMessageSection());
    container.appendChild(this._renderResponseSection());
    container.appendChild(this._renderSaveSection());
    
    return container;
  }
            
  _renderImageSection() {
    var container = CreateElement.createDiv(null, 'imagesection section');
    
    container.appendChild(this._renderSectionHeader('image'));
    
    var elem = CreateElement.createTextInput(null, 'image-name treasurehunt-input');
    container.appendChild(elem);
    elem.placeholder = 'image URL';
    elem.maxLength = 200;
    elem.addEventListener('input', (e) => {this._handleImageName(e);});
    UtilityKTS.denyDoubleQuotes(elem);
    
    var handler = null;
    var elem = CreateElement.createSliderSwitch('full page', 'full page', 'image-fullpage', handler);
    container.appendChild(elem);
    
    return container;
  }

  _renderMessageSection() {
    var container = CreateElement.createDiv(null, 'messagesection section');
    
    container.appendChild(this._renderSectionHeader('message'));

    var elem = CreateElement.createTextArea(null, 'message treasurehunt-input');
    container.appendChild(elem);
    elem.placeholder = 'message';
    elem.maxLength = 800;
    elem.addEventListener('input', (e) => {this._handleMessageChange(e);});
    UtilityKTS.denyDoubleQuotes(elem); 

    container.appendChild(CreateElement.createDiv(null, 'message-preview inputpreview previewdefault', 'preview of message'));        

    return container;
  }

  _renderResponseSection() {
    var container = CreateElement.createDiv(null, 'responsesection section');
    
    container.appendChild(this._renderSectionHeader('responses'));
    
    var subcontainer = CreateElement.createDiv(null, 'subcontainer');
    container.appendChild(subcontainer);

    var elem = CreateElement.createTextArea(null, 'response positiveresponse treasurehunt-input');
    subcontainer.appendChild(elem);
    elem.placeholder = 'positive response';
    elem.maxLength = 800;
    elem.addEventListener('input', (e) => {this._handleMessageChange(e);});
    UtilityKTS.denyDoubleQuotes(elem); 

    subcontainer.appendChild(CreateElement.createDiv(null, 'response-preview positiveresponse-preview inputpreview previewdefault', 'preview of positive response'));

    subcontainer = CreateElement.createDiv(null, 'subcontainer');
    container.appendChild(subcontainer);

    var elem = CreateElement.createTextArea(null, 'response negativeresponse treasurehunt-input');
    subcontainer.appendChild(elem);
    elem.placeholder = 'negative response';
    elem.maxLength = 800;
    elem.addEventListener('input', (e) => {this._handleMessageChange(e);});
    UtilityKTS.denyDoubleQuotes(elem); 

    subcontainer.appendChild(CreateElement.createDiv(null, 'response-preview negativeresponse-preview inputpreview previewdefault', 'preview of positive response'));    

    return container;
  }
            
  _renderSaveSection() {
    var container = CreateElement.createDiv(null, 'savesection section');
    
    var handler = (e) => {return this._handleSave(e);};
    var elem = CreateElement.createButton(null, 'save treasurehunt-button', 'save', 'save these settings for the project', handler);
    container.appendChild(elem);
    elem.disabled = true;
    
    var handler = (e) => {return this._handleCancel(e);};
    elem = CreateElement.createButton(null, 'cancel treasurehunt-button', 'cancel', 'discard these settings for the project', handler);
    container.appendChild(elem);
    elem.disabled = true;
    
    return container;
  }
  
  _renderSectionHeader(sectionTitle) {
    var container = CreateElement.createDiv(null, 'sectionheader');
    
    var subcontainer = CreateElement.createDiv(null, 'sectionheader-text', sectionTitle)
    container.appendChild(subcontainer);
    
    var handler = (e) => {return this._handleSuggest(e, sectionTitle);};
    subcontainer.appendChild(CreateElement.createIcon(null, 'suggestion far fa-lightbulb', 'use suggested value', handler));
    
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

  async update(params) {
    console.log('TreasureHuntLayout.update');
    console.log(params);
    
    var state = await this._loadStateFromDB();
   
    if (state) {
      this._setControlsFromState(state);
    }
  }

  _updatePreviewText(elemMessage, elemPreview) {
    var msg = elemMessage.value.trim();

    var cleanText = MarkdownToHTML.convert(this._sanitizeText(msg));
    elemPreview.innerHTML = cleanText;
    if (msg.length == 0) elemPreview.innerHTML = 'preview of message';
    UtilityKTS.setClass(elemPreview, 'previewdefault', msg.length == 0);
  }
  
  _updateSaveCancel() {
    var state = this._getStateFromControls();
    var changed = 
      (state.imageName != this._originalState.imageName) || 
      (state.imageFullPage != this._originalState.imageFullPage) || 
      (state.message != this._originalState.message) || 
      (state.positiveResponse != this._originalState.positiveResponse) || 
      (state.negativeResponse != this._originalState.negativeResponse);
      
    var valid = 
      (state.imageName != '') &&
      (state.message != '') && 
      (state.positiveResponse != '') && 
      (state.negativeResponse != '');
      
    var elemSave = this._container.getElementsByClassName('save')[0];
    var elemCancel = this._container.getElementsByClassName('cancel')[0];
    
    elemSave.disabled = !changed; // (!(valid && changed));  - further validation needed?
    elemCancel.disabled = !changed;
  }
    
  _useSuggestedValue(sectionName) {    
    if (sectionName == 'image') {      
      var elemImageName = this._container.getElementsByClassName('image-name')[0];
      elemImageName.value = this._config.suggestedValue.imageName;

    } else if (sectionName == 'message') {
      var elemMessage = this._container.getElementsByClassName('message')[0];
      elemMessage.value = this._config.suggestedValue.message;

    } else if (sectionName == 'responses') {
      var elemPositiveResponse = this._container.getElementsByClassName('positiveresponse')[0];
      var elemNegativeResponse = this._container.getElementsByClassName('negativeresponse')[0];
      elemPositiveResponse.value = this._config.suggestedValue.positiveResponse;
      elemNegativeResponse.value = this._config.suggestedValue.negativeResponse;
    }
  }

  //--------------------------------------------------------------
  // process state
  //--------------------------------------------------------------
  _getStateFromControls() {
    var elemImageName = this._container.getElementsByClassName('image-name')[0];
    var elemImageFullPage = this._container.getElementsByClassName('image-fullpage')[0];
    var elemMessage = this._container.getElementsByClassName('message')[0];
    var elemPositiveResponse = this._container.getElementsByClassName('positiveresponse')[0];
    var elemNegativeResponse = this._container.getElementsByClassName('negativeresponse')[0];
    
    var state = {  // sanitize 
      imageName: elemImageName.value,
      imageFullPage: CreateElement.getSliderValue(elemImageFullPage),
      message: elemMessage.value,
      positiveResponse: elemPositiveResponse.value,
      negativeResponse: elemNegativeResponse.value
    };
    
    return state;
  }
  
  _setControlsFromState(state) {
    var elemImageName = this._container.getElementsByClassName('image-name')[0];
    var elemImageFullPage = this._container.getElementsByClassName('image-fullpage')[0];
    var elemMessage = this._container.getElementsByClassName('message')[0];
    var elemPositiveResponse = this._container.getElementsByClassName('positiveresponse')[0];
    var elemNegativeResponse = this._container.getElementsByClassName('negativeresponse')[0];
    
    // de-sanitize if necessary
    elemImageName.value = state.imageName;
    CreateElement.setSliderValue(elemImageFullPage, state.imageFullPage);
    elemMessage.value = state.message;
    elemPositiveResponse.value = state.positiveResponse;
    elemNegativeResponse.value = state.negativeResponse;
  }
    
  async _loadStateFromDB() {
    console.log('TreasureHuntLayout._loadStateFromDB');
    var state = {
      imageName: '',
      imageFullPage: false,
      message: 'test message',
      positiveResponse: '',
      negativeResponse: ''
    };
    
    /*
    var queryResults = await SQLDBInterface.doGetQuery('tipmanager/query', 'profile', this._notice);
    if (queryResults.success) {
      state = queryResults.data;
    };
    */
    
    this._originalState = state;  // only do this on success
    console.log(state);

    return state;
  }
  
  async _saveStateToDB(state) {
    console.log('TreasureHuntLayout._saveStateToDB');
    console.log(state);
    /*
    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/update', 'profile', state, this._notice);
    
    return queryResults.success;
    */
    this._originalState = state;  // only do this on success;
  }
   
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleSuggest(e, sectionName) {
    this._useSuggestedValue(sectionName);
    this._updateSaveCancel();
  }
  
  _handleImageName(e) {
    this._updateSaveCancel();       
  }
  
  _handleMessageChange(e) {
    var elemMessage = this._container.getElementsByClassName('message')[0];
    var elemPreview = this._container.getElementsByClassName('message-preview')[0];
    
    this._updatePreviewText(elemMessage, elemPreview);
    this._updateSaveCancel();
  }
  
  _handleSave(e) {
    this._saveStateToDB(this._getStateFromControls());
    this._updateSaveCancel();
  }
  
  _handleCancel(e) {
    this._setControlsFromState(this._originalState);
    this._updateSaveCancel();
  }
      
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
  _sanitizeText(str) {
    var cleaned = str.replace(/"/g, '\\"');  // escape double quotes
    cleaned = cleaned.replace(/<(.*?)>/g, '');  // remove HTML tags
    //cleaned = cleaned.replace(/&(.*?);/g, '$1');  // replace ampersand characters
    
    return cleaned;
  }  
}
