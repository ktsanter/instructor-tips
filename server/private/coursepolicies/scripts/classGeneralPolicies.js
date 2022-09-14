//-------------------------------------------------------------------
// GeneralPolicies
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class GeneralPolicies {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      currentInfo: null
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(updatedInfo) {
    this.settings.currentInfo = updatedInfo;
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    this.config.expectedOfStudent = this.config.container.getElementsByClassName('expected-of-student')[0];
    this.config.expectedOfInstructor = this.config.container.getElementsByClassName('expected-of-instructor')[0];    
  }

  _updateUI() {
    this._renderExpectations(this.config.expectedOfStudent, this.settings.currentInfo.expectationsStudent);
    this._renderExpectations(this.config.expectedOfInstructor, this.settings.currentInfo.expectationsInstructor);
  }
  
  _renderExpectations(container, expectations) {
    const elemExpAll = container.getElementsByClassName('expected-all')[0];
    const elemExpAP = container.getElementsByClassName('expected-ap')[0];
    const elemExpNonAP = container.getElementsByClassName('expected-nonap')[0];
    
    UtilityKTS.removeChildren(elemExpAll);
    UtilityKTS.removeChildren(elemExpAP);
    UtilityKTS.removeChildren(elemExpNonAP);
    
    let elemListAll = CreateElement._createElement('ul', null, 'expectation-list');
    elemExpAll.appendChild(elemListAll);
    let elemListAP = CreateElement._createElement('ul', null, 'expectation-list');
    elemExpAP.appendChild(elemListAP);
    let elemListNonAP = CreateElement._createElement('ul', null, 'expectation-list');
    elemExpNonAP.appendChild(elemListNonAP);
  
    expectations = expectations.sort(function(a, b) {
      let res = a.ordering - b.ordering;
      if (res == 0) {
        res = a.expectationtext.toLowerCase().localeCompare(b.expectationtext.toLowerCase());
      }
      return res;
    });
    
    for (let i = 0; i < expectations.length; i++) {
      const exp = expectations[i];
      let elemItem = CreateElement._createElement('li', null, 'expectation-list-item');
      
      if (exp.restriction == 'none') {
        elemListAll.appendChild(elemItem);
      } else if (exp.restriction == 'ap') {
        elemListAP.appendChild(elemItem);
      } else {
        elemListNonAP.appendChild(elemItem);
      }

      const formattedText = this._formatExpectationText(expectations[i]);
      elemItem.appendChild(CreateElement.createSpan(null, 'expectation-text', formattedText));
    }
  }
  
  _formatExpectationText(expectation) {
    let txt = expectation.expectationtext;
    
    const regexItem = /[^{}]+(?=\})/g;
    const matches = expectation.expectationtext.match(regexItem);
    if (matches != null) {
      for (let i = 0; i < matches.length; i++) {
        const replacement = this._findResourceLink(matches[i])
        if (replacement != null) {
          const htmlReplacement = '<a href="' + replacement.linkurl + '" target="_blank">' + replacement.linktext + '</a>';
          txt = txt.replaceAll('{' + matches[i] + '}', htmlReplacement);
        }
      }
    }
    
    return txt;
  }
  
  _findResourceLink(templateitem) {
    let replacement = null;
    
    let resourceLinks = this.settings.currentInfo.resourcelink;
    for (let i = 0; i < resourceLinks.length && replacement == null; i++) {
      if (resourceLinks[i].templateitem == templateitem) replacement = resourceLinks[i];
    }
    
    return replacement;
  }    
    
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
