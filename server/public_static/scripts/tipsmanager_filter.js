//-----------------------------------------------------------------------------------
// TipManagerFilter class
//-----------------------------------------------------------------------------------
// TODO: drive filter from DB user privileges
//-----------------------------------------------------------------------------------

class TipManagerFilter {
  constructor(filterType, updateCallback) {
    this._version = '0.01';
    
    this._HIDE_CLASS = 'tipmanagerfilter-hide';
    
    this._filterType = filterType;
    this._updateCallback = updateCallback;

    this._container = CreateElement.createDiv(null, 'tipfilter');

    this._tipFilter = null;
    this._filterQueryResults = null;
    
    this._filterUITypes = [
      'unmapped', 
      'general', 
      'coursespecific', 
      'shared', 
      'personal', 
      'user', 
      'username', 
      'searchtext', 
      'termgroupname', 
      'use_adm',
      'adm_coursetoggle',
      'coursetoggle',
      'unspecified', 
      'scheduled', 
      'completed'
    ];
    this._checkBoxes = new Set(['unmapped', 'general', 'coursespecific', 'user']);
    this._radioButtons = new Set([]);
    this._tipstatusGroup = new Set(['unspecified', 'scheduled', 'completed']);
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  async render(notice) {
    this._notice = notice;
    
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
    
    await this._loadUserTipFilter();
    this._courseTermData = null;
    this._userData = null;
    
    this._container.appendChild(this._buildFilterUI());
    this._setFilterUIValues();
    
    return this._container;
  }

  show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  getFilter() {
    return this._tipFilter;
  }
  
  async _loadUserTipFilter() {
    var filterQuery = await this._doGetQuery('tipmanager/filter/query', this._filterType);
    
    if (filterQuery.success) {
      this._filterQueryResults = filterQuery;
      this._tipFilter = filterQuery.tipfilter;
    }
  }
  
  async _updateFiltering() {
    this._getFilterUIValues();
    this._setFilterUIValues();
    await this._doPostQuery('tipmanager/filter/update', this._filtertype, {tipfilter: this._tipFilter, tipfiltertype: this._filterType});
    this._updateCallback();
  }
  
  _buildFilterUI() {
    var container = CreateElement.createDiv(null, null);
    
    var uiConfig = this._filterQueryResults.uiconfig;
    var configOrder = uiConfig.groupOrder;
    for (var i = 0; i < configOrder.length; i++) {
      var groupContainer = CreateElement.createDiv(null, null);
      container.appendChild(groupContainer);
      
      var groupName = configOrder[i];
      var group = uiConfig[groupName];;
      
      for (var j = 0; j < group.length; j++) {
        var fieldName = group[j];
        groupContainer.appendChild(this._buildFilterUIElement(groupName, fieldName));
        if (fieldName == 'adm_coursename') groupContainer.appendChild(CreateElement._createElement('br', null, null));
      }       
    }
    
    return container;
  }
  
  _buildFilterUIElement(groupName, fieldName) {
    var elem = CreateElement.createDiv(null, null, 'not implemented: ' + fieldName);
    var className = 'tipfilter-item tipfilter-' + fieldName;
    var handler = () => {return this._updateFiltering();};
    
    if (fieldName == 'use_adm') {
      elem = this._createSliderSwitch('public', 'private', className, handler);
      this._showElement(elem, this._tipFilter.allow_adm, true);
      
    } else if (fieldName == 'unmapped') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'unmapped', false, handler);
    } else if (fieldName == 'general') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'general', false, handler);
    } else if (fieldName == 'coursespecific') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, '', false, handler);
      
    } else if (fieldName == 'shared') {
      elem = this._createSliderSwitch('exclude public', 'include public', className, handler);
    } else if (fieldName == 'personal') {
      elem = this._createSliderSwitch('exclude private', 'include private', className, handler);
      
    } else if (fieldName == 'unspecified') {
      elem = this._createSliderSwitch('unspecified', 'unspecified', className + ' tipStatusGroup', handler);
    } else if (fieldName == 'scheduled') {
      elem = this._createSliderSwitch('scheduled', 'scheduled', className + ' tipStatusGroup', handler);
    } else if (fieldName == 'completed') {
      elem = this._createSliderSwitch('completed', 'completed', className + ' tipStatusGroup', handler);

    } else if (fieldName == 'adm_coursetoggle') {
      elem = CreateElement.createSpan(null, null);
      elem.appendChild(this._createSliderSwitch('course', 'all courses', className, handler));

      var valueList = [];
      var adm_courses = this._filterQueryResults.adm_courses;
      for (var i = 0; i < adm_courses.length; i++) {
        valueList.push({id: i, value: adm_courses[i].coursename, textval: adm_courses[i].coursename});
      }
      elem.appendChild(CreateElement.createSelect(null, className + ' select-css', handler, valueList));
      
    } else if (fieldName == 'coursetoggle') {
      elem = CreateElement.createSpan(null, null);
      elem.appendChild(this._createSliderSwitch('course', 'all courses', className, handler));

      var valueList = [];
      var courses = this._filterQueryResults.courses;
      for (var i = 0; i < courses.length; i++) {
        valueList.push({id: i, value: courses[i].coursename, textval: courses[i].coursename});
      }
      elem.appendChild(CreateElement.createSelect(null, className + ' select-css', handler, valueList));
      elem.appendChild(CreateElement._createElement('br'));
      
    } else if (fieldName == 'termgroupname') {
      var valueList = [];
      var termgroups = this._filterQueryResults.termgroups;
      for (var i = 0; i < termgroups.length; i++) {
        valueList.push({id: i, value: termgroups[i].termgroupname, textval: termgroups[i].termgroupname});
      }
      elem = CreateElement.createSelect(null, className + ' select-css', handler, valueList);

    } else if (fieldName == 'user') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, '', false, handler);

    } else if (fieldName == 'username') {
      var valueList = [];
      var users = this._filterQueryResults.users;
      for (var i = 0; i < users.length; i++) {
        valueList.push({id: i, value: users[i].username, textval: users[i].username});
      }
      elem = CreateElement.createSelect(null, className, handler, valueList);

    } else if (fieldName == 'searchtext') {
      elem = CreateElement.createTextInput(null, className, '');
      elem.placeholder = 'search text';
      elem.addEventListener('change', handler);      
    }
    
    return elem;
  }

  _setFilterUIValues() {
    var uiConfig = this._filterQueryResults.uiconfig;

    var configOrder = uiConfig.groupOrder;
    for (var i = 0; i < configOrder.length; i++) {
      var group = uiConfig[configOrder[i]];

      for (var j = 0; j < group.length; j++) {
        var typeName = group[j];
        var className = 'tipfilter-' + typeName;
        var filterElement = this._container.getElementsByClassName(className)[0];
        
        if (this._checkBoxes.has(typeName)) {
          filterElement.checked = this._tipFilter[typeName];
          
        } else if (this._radioButtons.has(typeName)) {
          filterElement.checked = this._tipFilter[typeName];
          
        } else if (typeName == 'shared' || typeName == 'personal') {
          this._setSliderSwitchValue(filterElement, this._tipFilter[typeName]);
          
        } else if (typeName == 'use_adm') {
          this._setSliderSwitchValue(filterElement, this._tipFilter[typeName]);
          
        } else if (typeName == 'adm_coursetoggle') {
          this._setSliderSwitchValue(filterElement, this._tipFilter.adm_course);

          var elemSelect = this._container.getElementsByClassName(className)[1];
          var adm_courses = this._filterQueryResults.adm_courses;
          for (var k = 0; k < adm_courses.length; k++) {
            if (adm_courses[k].coursename == this._tipFilter.adm_coursename) elemSelect.selectedIndex = k;
          }
          this._showElement(elemSelect, this._tipFilter.adm_course);          
          
        } else if (typeName == 'coursetoggle') {
          this._setSliderSwitchValue(filterElement, this._tipFilter.course);

          var elemSelect = this._container.getElementsByClassName(className)[1];
          var courses = this._filterQueryResults.courses;
          for (var k = 0; k < courses.length; k++) {
            if (courses[k].coursename == this._tipFilter.coursename) elemSelect.selectedIndex = k;
          }
          this._showElement(elemSelect, this._tipFilter.course); 

        } else if (this._tipstatusGroup.has(typeName)) {
          this._setSliderSwitchValue(filterElement, this._tipFilter[typeName]);          
          
        } else if (typeName == 'termgroupname') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          var termgroups = this._filterQueryResults.termgroups;
          for (var k = 0; k < termgroups.length; k++) {
            if (termgroups[k].termgroupname == this._tipFilter.termgroupname) elemSelect.selectedIndex = k;
          }
          
        } else if (typeName == 'username') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          var users = this._filterQueryResults.users;
          for (var k = 0; k < users.length; k++) {
            if (users[k].username == this._tipFilter.username) elemSelect.selectedIndex = k;
          }
          elemSelect.disabled = !this._tipFilter['user'];
          
        } else if (typeName == 'searchtext') {
          filterElement.value = this._tipFilter[typeName];
          
        } else {
          console.log('failed to set: ' + typeName);
        }
      }
    }

     var elemUseAdminChoices = this._container.getElementsByClassName('tipfilter-use_adm')[0];
     if (elemUseAdminChoices) {
       this._showElement(elemUseAdminChoices, this._tipFilter.allow_adm, true);
       
       var useAdminChoices = this._getSliderSwitchValue(elemUseAdminChoices);
       
       var elemAdmCourseToggle = this._container.getElementsByClassName('tipfilter-adm_coursetoggle');
       var elemCourseToggle = this._container.getElementsByClassName('tipfilter-coursetoggle');
       
       var elemAdmSlider = elemAdmCourseToggle[0];
       var elemAdmSelect = elemAdmCourseToggle[1];
       var elemSlider = elemCourseToggle[0];
       var elemSelect = elemCourseToggle[1];
       
       var admCourseSpecific = this._getSliderSwitchValue(elemAdmSlider);
       var courseSpecific = this._getSliderSwitchValue(elemSlider);
       
       this._showElement(elemAdmSlider, useAdminChoices, true);
       this._showElement(elemAdmSelect, useAdminChoices && admCourseSpecific, true);
       this._showElement(elemSlider, !useAdminChoices, true);
       this._showElement(elemSelect, !useAdminChoices && courseSpecific, true);
       
       var elemTipStatusGroup = this._container.getElementsByClassName('tipStatusGroup');

       var showTipStatus = (!useAdminChoices && courseSpecific);
       for (var i = 0; i < elemTipStatusGroup.length; i++) {
         this._showElement(elemTipStatusGroup[i], showTipStatus, true);
       }
     }
  }
 
  _getFilterUIValues() {    
    var uiConfig = this._filterQueryResults.uiconfig;
    var configOrder = uiConfig.groupOrder;
    
    for (var i = 0; i < configOrder.length; i++) {
      var group = uiConfig[configOrder[i]];
      
      for (var j = 0; j < group.length; j++) {
        var typeName = group[j];
        var className = 'tipfilter-' + typeName;
        var filterElement = this._container.getElementsByClassName(className)[0];
        
        if (this._checkBoxes.has(typeName)) {
          this._tipFilter[typeName] = filterElement.checked;
          
        } else if (this._radioButtons.has(typeName)) {
          this._tipFilter[typeName] = filterElement.checked;
          
        } else if (typeName == 'shared' || typeName == 'personal') {
          this._tipFilter[typeName] = this._getSliderSwitchValue(filterElement);
          
        } else if (typeName == 'use_adm') {
          this._tipFilter[typeName] = this._getSliderSwitchValue(filterElement);
          
        } else if (typeName == 'adm_coursetoggle') {
          var elementList = this._container.getElementsByClassName(className);
          var elemInput = elementList[0];
          var elemSelect = elementList[1];
          
          var elemUseAdminChoices = this._container.getElementsByClassName('tipfilter-use_adm')[0];
          var useAdminChoices = this._getSliderSwitchValue(elemUseAdminChoices);
          this._tipFilter.adm_allcourse = (!this._getSliderSwitchValue(filterElement) && useAdminChoices);
          this._tipFilter.adm_course = (this._getSliderSwitchValue(filterElement) && useAdminChoices);
          this._tipFilter.adm_coursename = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'coursetoggle') {
          var elementList = this._container.getElementsByClassName(className);
          var elemInput = elementList[0];
          var elemSelect = elementList[1];

          this._tipFilter.allcourse = !this._getSliderSwitchValue(filterElement);
          this._tipFilter.course = this._getSliderSwitchValue(filterElement);
          if (elemSelect.selectedIndex >= 0) {
            this._tipFilter.coursename = elemSelect[elemSelect.selectedIndex].value;
          } else {
            this._tipFilter.coursename = '';
          }
          
        } else if (this._tipstatusGroup.has(typeName)) {
          this._tipFilter[typeName] = this._getSliderSwitchValue(filterElement);
          
        }else if (typeName == 'termgroupname') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'username') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'searchtext') {
          this._tipFilter[typeName] = filterElement.value;
          
        } else {
          console.log('failed to get: ' + typeName);
        }
      }
    }
  }
  
  _showElement(elem, makeVisible, override) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
    
    if (override) {
      if (makeVisible) {
        elem.style.display = 'inline-block';
      } else {
        elem.style.display = 'none';
      }
    }
  }
  
  //--------------------------------------------------------------
  // slider switch
  //--------------------------------------------------------------
  _createSliderSwitch(dataOnLabel, dataOffLabel, addedClassList, handler) {
    var classList = 'switch switch-yes-no';
    if (addedClassList != '') classList += ' ' + addedClassList;
    var container = CreateElement._createElement('label', null, classList);
    
    
    var elemCheckbox = CreateElement._createElement('input', null, 'switch-input');
    elemCheckbox.type = 'checkbox';
    container.appendChild(elemCheckbox);
    if (handler) elemCheckbox.addEventListener('click', e => handler(e));
    
    var elemDataSpan = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemDataSpan);
    elemDataSpan.setAttribute('data-on', dataOnLabel);
    elemDataSpan.setAttribute('data-off', dataOffLabel);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));
    return container;
  }

  _getSliderSwitchValue(elem) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];    
    return elemInput.checked;
  }

  _setSliderSwitchValue(elem, checked) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];
    elemInput.checked = checked;
  }

  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async _doGetQuery(queryType, queryName) {
    var resultData = null;
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = null;
    
    var requestResult = await SQLDBInterface.dbPost(queryType, queryName, postData);
    if (requestResult.success) {
      resultData = requestResult;
      this._notice.setNotice('');
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }    
}
