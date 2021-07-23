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
    
    this.elemPromptInnerContainer1 = this.config.container.getElementsByClassName('prompt-innercontainer')[0];
    this.elemPromptInnerContainer2 = this.config.container.getElementsByClassName('prompt-innercontainer')[1];
    
    this.config.container.getElementsByClassName('copy-promptcontent')[0].addEventListener('click', (e) => { this._copyPromptContent(e); });
  }
    
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(params) {
    UtilityKTS.setClass(this.elemPromptInnerContainer1, this.config.hideClass, true);
    UtilityKTS.setClass(this.elemPromptInnerContainer2, this.config.hideClass, true);
    
    this.clueList = params.clueList;
    this.bannerPicURL = params.bannerPicURL;
    this.shareURL = params.shareURL;
    
    for (var i = 0; i < this.clueList.length; i++) {
      var clue = this.clueList[i];
      for (var key in clue) {
        if (typeof clue[key] == 'string') {
          this.clueList[i][key] = this.clueList[i][key].replace(/singlequotereplacement/g, '\'');
        }
      }
    }
  
    UtilityKTS.removeChildren(this.elemPromptSelect);
    for (var i = 0; i < this.clueList.length; i++) {
      var clue = this.clueList[i];
      var elem = CreateElement.createOption(null, 'prompt-selectoption', i, clue.prompt);
      this.elemPromptSelect.appendChild(elem);
    }
    
    this.elemPromptSelect.selectedIndex = -1;
    if (this.clueList.length > 0) {
      this.elemPromptSelect.selectedIndex = 0;
      this._loadPrompt(this.clueList[0]);
    }    
  }
  
  _loadPrompt(clue) {
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

    UtilityKTS.setClass(this.elemPromptInnerContainer1, this.config.hideClass, false);
    UtilityKTS.setClass(this.elemPromptInnerContainer2, this.config.hideClass, false);
  }

  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------  
  _handlePromptSelection(e) {
    this._loadPrompt(this.clueList[e.target.value]);
  }

  _copyPromptContent() {
    var promptContent = this.config.editElement.getContent();
    promptContent = promptContent.replace(/\.\.\/\.\.\//g, window.origin + '/');
    promptContent = promptContent.replace(/&quot;/g, '\'');
    promptContent = promptContent.replace(/\\"/g, '"');
    promptContent = promptContent.replace(/\\\'/g, '\'');
    
    this.config.copyToClipboard(promptContent);
  }

  //--------------------------------------------------------------
  // utility
  //-------------------------------------------------------------- 
 
}
