//-------------------------------------------------------------------
// FilterControl
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class FilterControl {
  constructor(config) {    
    this.config = config;
    
    this.settings = {
      hideClass: 'hide-me',
      controlIsOpen: false
    }
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------
  render() {
    var fieldName = this.config.fieldName;
    this.settings.valueSelected = {};

    var container = CreateElement.createDiv(null, 'filter-control filter-control-container filter-control-' + fieldName + ' ' + this.settings.hideClass);
    this.container = container;

    this.controlIcon = CreateElement.createIcon(null, 'icon-rosterfilter filter-off fas fa-filter');
    this.controlIcon.addEventListener('click', (e) => { this._handleMainIconClick(e); });
    
    this._buildSelections(this.container, fieldName, this.config.valueSet);
    
    return container;
  }
    
  attachTo(node, includeIcon) {
    if (includeIcon) node.appendChild(this.controlIcon);
    node.appendChild(this.container);
  }

  update(valueSet) {
    if (valueSet.has(true)) valueSet.add(false);
    if (valueSet.has(false)) valueSet.add(true);
    
    this.config.valueSet = valueSet;
    
    UtilityKTS.removeChildren(this.container);
    this._buildSelections(this.container, this.config.fieldName, valueSet);
  }
  
  openFilter() {
    UtilityKTS.setClass(this.container, this.settings.hideClass, false);
    this.settings.controlIsOpen = true;
  }

  closeFilter() {
    if (this.settings.controlIsOpen) {
      this._restoreSettings();
      UtilityKTS.setClass(this.container, this.settings.hideClass, true);
    }
    this.settings.controlIsOpen = false;
  }
  
  getFilterSettings() {
    var values = new Set();
    for (var key in this.settings.valueSelected) {
      var item = this.settings.valueSelected[key];
      if (item) values.add(key);
    }
    
    return Array.from(values);
  }
  
  clearFilter() {
    var itemNodes = this.container.getElementsByClassName('filter-check specific');
    for (var key in this.settings.valueSelected) {
      this.settings.valueSelected[key] = true;
      
      for (var i = 0; i < itemNodes.length; i++) {
        if (key == itemNodes[i].value) {
          itemNodes[i].checked = true;
        }
      }
    }

    this._setOverallControlState();
    this._setIconState(this.settings.valueSelected);
  }
  
  allChecked() {
    for (var key in this.settings.valueSelected) {
      if (!this.settings.valueSelected[key]) return false;
    }
    
    return true;
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _buildSelections(container, fieldName, valueSet) {
    var elemList = CreateElement._createElement('ul', null, 'filter-control filter-control-list');
    container.appendChild(elemList);
    
    this._buildOverallSelections(elemList, fieldName);
    this._buildSpecificSelection(elemList, fieldName, valueSet);
    this._buildOkayCancel(elemList, fieldName);    
  }
  
  _buildOverallSelections(elemList, fieldName) {
    var multiChecks = ['all'];
    var handler = (e) => { this._handleFilterOverallSelection(e, fieldName); };

    for (var i = 0; i < multiChecks.length; i++) {
      var elemListItem = CreateElement._createElement('li', null, 'form-check');
      elemList.appendChild(elemListItem);
      
      var checkName = multiChecks[i];
      var check = CreateElement.createCheckbox(null, 'filter-check overall', 'filter-check-' + checkName, checkName, checkName, i==0, handler);
      elemListItem.appendChild(check);
      check.getElementsByTagName('input')[0].classList.add('form-check-input');
    }

    var elemListItem = CreateElement._createElement('li', null, null);
    elemList.appendChild(elemListItem);
    elemListItem.appendChild(CreateElement._createElement('hr', null, 'divider'));    
  }
  
  _buildSpecificSelection(elemList, fieldName, valueSet) {
    var handler = (e) => { this._handleFilterSpecificSelection(e, fieldName); };
    
    var valueList = Array.from(valueSet).sort();
    for (var i = 0; i < valueList.length; i++) {
      var value = valueList[i];
      this.settings.valueSelected[value] = true;
      
      var elemListItem = CreateElement._createElement('li', null, 'form-check');
      elemList.appendChild(elemListItem);

      var check = CreateElement.createCheckbox(null, 'filter-check specific', 'filter-check-' + fieldName, value, value, true, handler);
      elemListItem.appendChild(check);
      check.getElementsByTagName('input')[0].setAttribute('fieldName', fieldName);
      check.getElementsByTagName('input')[0].classList.add('form-check-input');
    }
    
  }
  
  _buildOkayCancel(elemList, fieldName) {
    var elemListItem = CreateElement._createElement('li', null, 'filter-finalitem');
    elemList.appendChild(elemListItem);

    var handler = (e) => { this._handleFilterOkayCancel(e, fieldName, 'okay'); };
    var elemOkay = CreateElement.createIcon(null, 'filter-button okay far fa-thumbs-up', 'apply changes', handler);
    elemListItem.appendChild(elemOkay);

    var handler = (e) => { this._handleFilterOkayCancel(e, fieldName, 'cancel'); };
    var elemCancel = CreateElement.createIcon(null, 'filter-button cancel far fa-thumbs-down', 'discard changes', handler);
    elemListItem.appendChild(elemCancel);
  }
  
  _restoreSettings() {
    var checkboxes = this.container.getElementsByClassName('filter-check form-check-input specific');
    for (var i = 0; i < checkboxes.length; i++) {
      var checkboxValue = checkboxes[i].value;
      checkboxes[i].checked = this.settings.valueSelected[checkboxValue];
    }
    this._setOverallControlState();
  }
  
  _saveSettings() {
    var checkboxes = this.container.getElementsByClassName('filter-check form-check-input specific');
    for (var i = 0; i < checkboxes.length; i++) {
      var checkboxValue = checkboxes[i].value;
      this.settings.valueSelected[checkboxValue] = checkboxes[i].checked;
    }
    
    return this.settings.valueSelected;
  }
  
  _selectAllItems(doSelect) {
    var checkboxes = this.container.getElementsByClassName('filter-check form-check-input specific');
    for (var i = 0; i < checkboxes.length; i++) {
      checkboxes[i].checked = doSelect;
    }
    this._setOverallControlState();
  }
  
  _setOverallControlState() {
    var checkboxes = this.container.getElementsByClassName('filter-check form-check-input specific');
    var allChecked = true;
    var allUnchecked = true;
    
    for (var i = 0; i < checkboxes.length; i++) {
      if (!checkboxes[i].checked) allChecked = false;
      if (checkboxes[i].checked) allUnchecked = false;
    }
    
    var checkboxAll = this.container.getElementsByClassName('filter-check form-check-input overall')[0];
    checkboxAll.indeterminate = (!allChecked && !allUnchecked);
    checkboxAll.checked = allChecked;
  }
  
  _setIconState(settings) {
    var allChecked = true;
    
    for (var value in settings) {
      if (!settings[value]) allChecked = false; 
    }

    UtilityKTS.setClass(this.controlIcon, 'filter-off', allChecked);
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------  
  _handleMainIconClick(e) {
    if (this.settings.controlIsOpen) {
      this.closeFilter();
      
    } else {
      this.config.callbackIconClick(this); 
    }
  }
  
  _handleFilterOverallSelection(e, fieldName) {
    if (e.target.value == 'all') {
      this._selectAllItems(e.target.checked);
    }
  }

  _handleFilterSpecificSelection(e, fieldName) {
    this._setOverallControlState();
  }

  _handleFilterOkayCancel(e, fieldName, value) {
    if (value == 'okay') {
      var settings = this._saveSettings();
      var filterValues = [];
      for (var value in settings) {
        if (settings[value]) filterValues.push(value);
      }

      this._setIconState  (settings);
      this.config.callbackSelectChange({"fieldName": this.config.fieldName, "filterValues": filterValues});
    }
    
    this.closeFilter();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
