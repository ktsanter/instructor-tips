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
    
    let adminElements = this.config.container.getElementsByClassName('admin-only');
    for (let i = 0; i < adminElements.length; i++) {
      let elem = adminElements[i];
      UtilityKTS.setClass(elem, this.settings.hideClass, !this.config.adminAllowed);
      if (elem.classList.contains('admin-icon')) {
        elem.addEventListener('click', (e) => { this._handleAdminIcon(e); });
      }
    }
  }

  _updateUI() {
    this._renderExpectations(this.config.expectedOfStudent, this.settings.currentInfo.expectedOfStudent);
    this._renderExpectations(this.config.expectedOfInstructor, this.settings.currentInfo.expectedOfInstructor);
  }
  
  _renderExpectations(container, expectations) {
    UtilityKTS.removeChildren(container);
    
    let elemList = CreateElement._createElement('ul', null, 'expectation-list');
    container.appendChild(elemList);
    
    for (let i = 0; i < expectations.length; i++) {
      let elemItem = CreateElement._createElement('li', null, 'expectation-list-item');
      elemList.appendChild(elemItem);
      
      if (expectations[i].context == 'AP') {
        elemItem.appendChild(CreateElement.createIcon(null, 'fas fa-info-circle expectation-info me-1', 'AP only'))
      } else if (expectations[i].context == 'non-AP') {
        elemItem.appendChild(CreateElement.createIcon(null, 'fas fa-info-circle expectation-info me-1', 'non-AP only'))
      }

      elemItem.appendChild(CreateElement.createSpan(null, 'expectation-text', expectations[i].text));
    }
  }
    
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleAdminIcon(e) {
    let msg = 'unrecognized target';
    
    if (e.target.classList.contains('edit-student-expectations')) {
      msg = 'edit student expectations';
    } else if (e.target.classList.contains('edit-instructor-expectations')) {
      msg = 'edit instructor expectations';
    }
    
    console.log('_handleAdminIcon', msg);;
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
