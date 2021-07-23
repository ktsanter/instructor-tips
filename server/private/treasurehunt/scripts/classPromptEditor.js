//-------------------------------------------------------------------
// PromptEditor class (for Treasure Hunt configuration)
//-------------------------------------------------------------------
// TODO: styling
//-------------------------------------------------------------------
class PromptEditor {
  constructor(config) {
    this.config = config; 
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render() { 
    this.elemPromptSelect = this.config.container.getElementsByClassName('select-prompt')[0];
    this.elemPromptSelect.addEventListener('change', (e) => { this._handlePromptSelection(e); });
    
    this.elemPromptInnerContainer = this.config.container.getElementsByClassName('prompt-innercontainer')[0];
  }
    

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(params) {
    UtilityKTS.setClass(this.elemPromptInnerContainer, this.config.hideClass, true);
    
    this.clueList = params.clueList;
    this.bannerPicURL = params.bannerPicURL;
    this.shareURL = params.shareURL;
    
    UtilityKTS.removeChildren(this.elemPromptSelect);
    for (var i = 0; i < this.clueList.length; i++) {
      var clue = this.clueList[i];
      var elem = CreateElement.createOption(null, 'prompt-selectoption', i, clue.prompt);
      this.elemPromptSelect.appendChild(elem);
    }
    this.elemPromptSelect.selectedIndex = -1;
  }
  
  _loadPrompt(clue) {
    UtilityKTS.setClass(this.elemPromptInnerContainer, this.config.hideClass, false);
    
    var elemMessage = CreateElement.createDiv(null, null);

    var elemImage = null;
    if (this.bannerPicURL) {
      elemImage = CreateElement.createImage(null, null, this.bannerPicURL);
      elemImage.style.width = "20.0em";
      elemImage.style.height = "auto";
    }

    var elemPrompt1 = CreateElement.createDiv(null, null, clue.prompt);
    elemPrompt1.style.fontWeight = 'bold';
    
    var elemPrompt2 = CreateElement.createDiv(null, null, 'Enter your answer here: ');
    
    var elemLink = CreateElement.createLink(null, null, 'treasure hunt', null, this.shareURL);
    elemLink.target = '_blank';
    elemPrompt2.appendChild(elemLink);
    
    if (elemImage) elemMessage.appendChild(elemImage);
    elemMessage.appendChild(elemPrompt1);
    elemMessage.appendChild(elemPrompt2);    

    this.config.editElement.setContent(elemMessage.outerHTML);
  }

  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------  
  _handlePromptSelection(e) {
    this._loadPrompt(this.clueList[e.target.value]);
  }

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------        
}
