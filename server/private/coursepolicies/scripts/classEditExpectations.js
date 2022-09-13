//-------------------------------------------------------------------
// EditExpectations
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class EditExpectations {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      navItemClass: 'nav-item',
      
      info: null,
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(info) {
    this.settings.info = {
      "general": info.general
    };
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    EditUtilities._setEditControlHandlers(
      this.config.container, 
      'edit-control edit-control-expectation',
      (e) => { this._handleEditControl(e); }
    );
    
    this.config.expectationContainer = this.config.container.getElementsByClassName('navEditExpectations')[0];
  }
  
  _updateUI() {
    let expectationList = this._collateExpectations();
    this._loadExpectationList(expectationList);
  }
        
  _collateExpectations() {
    let expStudent = this.settings.info.general.expectationsStudent;
    let expInstructor = this.settings.info.general.expectationsInstructor;
    let expectationList = [];

    for (let i = 0; i < expStudent.length; i++) {
      expectationList.push({"target": "student", ...expStudent[i]});
    }
    for (let i = 0; i < expInstructor.length; i++) {
      expectationList.push({"target": "instructor", ...expInstructor[i]});
    }
    
    expectationList = expectationList.sort( function(a, b) {
      let res = -1 * a.target.localeCompare(b.target);

      if (res == 0) {
        res = a.ordering - b.ordering;
      }
      if (res == 0) {
        res = a.restriction.localeCompare(b.restriction);
      }
      if (res == 0) {
        res = a.expectationtext.toLowerCase().localeCompare(b.expectationtext.toLowerCase());
      }
      return res;
    });
    
    return expectationList;
  }
  
  _loadExpectationList(expectationList) {
    let container = this.config.expectationContainer.getElementsByClassName('expectation-container')[0];
    UtilityKTS.removeChildren(container);
    
    let elemTemplate = this.config.expectationContainer.getElementsByClassName('item-template')[0];
    for (let i = 0; i < expectationList.length; i++) {
      let exp = expectationList[i];
      let elemItem = elemTemplate.cloneNode(true);
      container.appendChild(elemItem);
      UtilityKTS.setClass(elemItem, this.settings.hideClass, false);
      UtilityKTS.setClass(elemItem, 'item-template', false);
      
      let elemTarget = elemItem.getElementsByClassName('select-target')[0];
      EditUtilities._selectByText(elemTarget, exp.target);
      
      let elemRestriction = elemItem.getElementsByClassName('select-restriction')[0]
      EditUtilities._selectByText(elemRestriction, exp.restriction);
      
      elemItem.getElementsByClassName('expectation-ordering')[0].value = exp.ordering;

      elemItem.getElementsByClassName('expectation-text')[0].value = exp.expectationtext;
      
      elemItem.setAttribute("expectation-info", JSON.stringify(exp));
      
      elemItem.getElementsByClassName('edit-control')[0].addEventListener('click', (e) => { this._handleEditControl(e); });
    }
  }
  
  async _addExpectation() {
    const msg = "Please enter the text for the new expectation";
    const expectationText = prompt(msg);
    
    if (!expectationText || expectationText.length == 0) return;

    const success = await this._addExpectationToDB(expectationText);
    if (!success) return;
    
    await this.config.callbackRefreshData();
  }
  
  async _reloadExpectations() {
    const msg = 'Any changes will be lost. Continue?';
    if (!confirm(msg)) return;
    
    this._updateUI();
  }

  async _saveExpectations() {
    let container = this.config.expectationContainer.getElementsByClassName('expectation-container')[0];
    let expectationList = [];
    
    let expectationItems = container.getElementsByClassName('expectation-item');
    for (let i = 0; i < expectationItems.length; i++) {
      let exp = expectationItems[i];
      let expectationId = JSON.parse(exp.getAttribute('expectation-info')).expectationid;

      let elemTarget = exp.getElementsByClassName('select-target')[0];
      let target = elemTarget[elemTarget.selectedIndex].text;

      let elemRestriction = exp.getElementsByClassName('select-restriction')[0];
      let restriction = elemRestriction[elemRestriction.selectedIndex].text;
      
      let ordering = exp.getElementsByClassName('expectation-ordering')[0].value;

      let expectationText = exp.getElementsByClassName('expectation-text')[0].value;
      
      expectationList.push({
        "expectationid": expectationId,
        "target": target,
        "restriction": restriction,
        "ordering": ordering,
        "expectationtext": expectationText
      });
    }
    
    const success = await this._saveExpectationsToDB(expectationList);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    EditUtilities._blipNotice(this.config.notice, 'expectation data saved');
  }

  async _deleteExpectation(expectationInfo) {
    const msg = 'This expectation \n' +
                '-----------------------------\n' +
                '  target: ' + expectationInfo.target + '\n' +
                '  restriction: ' +expectationInfo.restriction + '\n' +
                '  ' + expectationInfo.expectationtext + '\n' +
                '-----------------------------\n' +
                'will be deleted. Are you sure?';
    if (!confirm(msg)) return;
    
    const success = await this._deleteExpectationFromDB(expectationInfo.expectationid);
    if (!success) return;
    
    await this.config.callbackRefreshData();
  }
         
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleEditControl(e) {
    if (e.target.classList.contains('disabled')) return;
    if (!e.target.classList.contains('edit-control-expectation')) return;

    
    if (e.target.classList.contains('reload')) {
      this._reloadExpectations();
    } else if (e.target.classList.contains('save')) {
      this._saveExpectations();
    } else if (e.target.classList.contains('add')) {
      this._addExpectation();
    } else if (e.target.classList.contains('delete')) {
      this._deleteExpectation(EditUtilities._findNodeInfo(e.target, 'expectation-item', 'expectation-info'));
    }      
  }

  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------
  async _addExpectationToDB(expectationText) {
    let params = {
      "target": "student",
      "restriction": "none",
      "expectationtext": expectationText
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/insert', 'expectation', params, this.config.notice);
    
    return dbResult.success;
  }
 
  async _saveExpectationsToDB(expectationList) {
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/update', 'expectation', expectationList, this.config.notice);
    
    return dbResult.success;
  }
 
  async _deleteExpectationFromDB(expectationId) {
    let params = {
      "expectationid": expectationId
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/delete', 'expectation', params, this.config.notice);
    
    return dbResult.success;
  }

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------

}
