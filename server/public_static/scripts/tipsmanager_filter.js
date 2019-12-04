//-----------------------------------------------------------------------------------
// TipManagerFilter class
//-----------------------------------------------------------------------------------
// TODO: 
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
    await this._doPostQuery('tipmanager/filter/update', this._filterType, {tipfilter: this._tipFilter, tipfiltertype: this._filterType});
    this._updateCallback();
  }
  
  _buildFilterUI() {
    var container = CreateElement.createDiv(null, null);
    this._elemTermgroup = null;
    this._elemCalendarDetails = null;
    
    var uiConfig = this._filterQueryResults.uiconfig;
    var configOrder = uiConfig.groupOrder;
    for (var i = 0; i < configOrder.length; i++) {
      var groupName = configOrder[i];
      var group = uiConfig[groupName];

      var groupContainer = CreateElement.createDiv(null, 'tipfiltergroup-' + groupName);
      container.appendChild(groupContainer);
      
      for (var j = 0; j < group.length; j++) {
        var fieldName = group[j];
        groupContainer.appendChild(this._buildFilterUIElement(groupName, fieldName));
        if (fieldName == 'adm_coursename') groupContainer.appendChild(CreateElement._createElement('br', null, null));
      }       
    }
    
    // this handles moving the calendar setting details after the other components are built
    if (this._elemTermgroup && this._elemCalendarDetails) {    
      this._elemCalendarUI.parentNode.appendChild(this._elemCalendarDetails);
      this._buildCalendarDetails();
    }
    
    return container;
  }
  
  _buildFilterUIElement(groupName, fieldName) {
    var elem = CreateElement.createDiv(null, null, 'not implemented: ' + fieldName);
    var className = 'tipfilter-item tipfilter-' + fieldName;
    var handler = () => {return this._updateFiltering();};
    
    if (fieldName == 'use_adm') {
      elem = this._createSliderSwitch('public', 'private', className, handler, true);
      this._showElement(elem, this._tipFilter.allow_adm, true);
      
    } else if (fieldName == 'unmapped') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'unmapped', false, handler);
    } else if (fieldName == 'general') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'general', false, handler);
    } else if (fieldName == 'coursespecific') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, '', false, handler);
      
    } else if (fieldName == 'shared') {
      elem = this._createSliderSwitch('public', 'public', className, handler);
    } else if (fieldName == 'personal') {
      elem = this._createSliderSwitch('own private', 'own private', className, handler); 
    } else if (fieldName == 'personal_notowned') {
      elem = this._createSliderSwitch('other\'s private', 'other\'s private', className, handler);
      
    } else if (fieldName == 'unspecified') {
      elem = this._createSliderSwitch('unspecified', 'unspecified', className + ' tipStatusGroup', handler);
    } else if (fieldName == 'scheduled') {
      elem = this._createSliderSwitch('scheduled', 'scheduled', className + ' tipStatusGroup', handler);
    } else if (fieldName == 'completed') {
      elem = this._createSliderSwitch('completed', 'completed', className + ' tipStatusGroup', handler);

    } else if (fieldName == 'adm_coursetoggle') {
      elem = CreateElement.createSpan(null, null);
      elem.appendChild(this._createSliderSwitch('course', 'all courses', className, handler, true));

      var valueList = [];
      var adm_courses = this._filterQueryResults.adm_courses;
      for (var i = 0; i < adm_courses.length; i++) {
        valueList.push({id: i, value: adm_courses[i].coursename, textval: adm_courses[i].coursename});
      }
      elem.appendChild(CreateElement.createSelect(null, className + ' select-css', handler, valueList));
      
    } else if (fieldName == 'coursetoggle') {
      elem = CreateElement.createSpan(null, null);
      elem.appendChild(this._createSliderSwitch('course', 'all courses', className, handler, true));

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
      this._elemTermgroup = elem;

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
      
    } else if (fieldName == 'calendarui') {
      elem = CreateElement.createDiv(null, className);
      elem.appendChild(CreateElement.createIcon(null, 'tipfilter-calendaricon fas fa-caret-up', 'show/hide calendar settings', (e) => {return this._toggleCalendarSettings(e);}));
      elem.appendChild(CreateElement.createSpan(null, 'tipfilter-calendarlabel'));
      
      // this element gets moved and filled later
      this._elemCalendarDetails = CreateElement.createDiv(null, 'tipfilter-calendarui-details ' + this._HIDE_CLASS);
      this._elemCalendarDetails.style.display = 'none';
      this._elemCalendarUI = elem;
    }
    
    return elem;
  }

  async _setFilterUIValues() {
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
          
        } else if (typeName == 'shared' || typeName == 'personal' || typeName == 'personal_notowned') {
          this._setSliderValue(filterElement, this._tipFilter[typeName]);
          
        } else if (typeName == 'use_adm') {
          this._setSliderValue(filterElement, this._tipFilter[typeName]);
          
        } else if (typeName == 'adm_coursetoggle') {
          this._setSliderValue(filterElement, this._tipFilter.adm_course);

          var elemSelect = this._container.getElementsByClassName(className)[1];
          var adm_courses = this._filterQueryResults.adm_courses;
          for (var k = 0; k < adm_courses.length; k++) {
            if (adm_courses[k].coursename == this._tipFilter.adm_coursename) elemSelect.selectedIndex = k;
          }
          this._showElement(elemSelect, this._tipFilter.adm_course);          
          
        } else if (typeName == 'coursetoggle') {
          this._setSliderValue(filterElement, this._tipFilter.course);

          var elemSelect = this._container.getElementsByClassName(className)[1];
          var courses = this._filterQueryResults.courses;
          
          var noMatch = true;
          for (var k = 0; k < courses.length; k++) {
            if (courses[k].coursename == this._tipFilter.coursename) {
              elemSelect.selectedIndex = k;
              noMatch = false;
            }
          }
          if (noMatch  && courses.length > 0) {
            this._tipFilter.coursename = courses[0].coursename;
            elemSelect.selectedIndex = 0;
          }
          this._showElement(elemSelect, this._tipFilter.course); 

        } else if (this._tipstatusGroup.has(typeName)) {
          this._setSliderValue(filterElement, this._tipFilter[typeName]);          
          
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
          
        } else if (typeName == 'calendarui') {
          var calendarSettings = this._tipFilter.calendar;
          var calSettingsMsg = calendarSettings.schoolyear;
          calSettingsMsg += ' ' + calendarSettings[this._tipFilter.termgroupname];
          var calendarLabel = filterElement.getElementsByClassName('tipfilter-calendarlabel')[0];
          calendarLabel.innerHTML = calSettingsMsg;
          
          var showMe = (this._tipFilter.course && !(this._tipFilter.adm_allcourse || this._tipFilter.adm_course));
          filterElement.style.display = showMe ? 'inline-block' : 'none';
          
          await this._setCalendarUIDetails();

        } else {
          console.log('failed to set: ' + typeName);
        }
      }
    }

     var elemUseAdminChoices = this._container.getElementsByClassName('tipfilter-use_adm')[0];
     if (elemUseAdminChoices) {
       this._showElement(elemUseAdminChoices, this._tipFilter.allow_adm, true);
       
       var useAdminChoices = this._getSliderValue(elemUseAdminChoices);
       
       var elemAdmCourseToggle = this._container.getElementsByClassName('tipfilter-adm_coursetoggle');
       var elemCourseToggle = this._container.getElementsByClassName('tipfilter-coursetoggle');
       
       var elemAdmSlider = elemAdmCourseToggle[0];
       var elemAdmSelect = elemAdmCourseToggle[1];
       var elemSlider = elemCourseToggle[0];
       var elemSelect = elemCourseToggle[1];
       
       var admCourseSpecific = this._getSliderValue(elemAdmSlider);
       var courseSpecific = this._getSliderValue(elemSlider);
       
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
          
        } else if (typeName == 'shared' || typeName == 'personal' || typeName == 'personal_notowned') {
          this._tipFilter[typeName] = this._getSliderValue(filterElement);
          
        } else if (typeName == 'use_adm') {
          this._tipFilter[typeName] = this._getSliderValue(filterElement);
          
        } else if (typeName == 'adm_coursetoggle') {
          var elementList = this._container.getElementsByClassName(className);
          var elemInput = elementList[0];
          var elemSelect = elementList[1];
          
          var elemUseAdminChoices = this._container.getElementsByClassName('tipfilter-use_adm')[0];
          var useAdminChoices = this._getSliderValue(elemUseAdminChoices);
          this._tipFilter.adm_allcourse = (!this._getSliderValue(filterElement) && useAdminChoices);
          this._tipFilter.adm_course = (this._getSliderValue(filterElement) && useAdminChoices);
          this._tipFilter.adm_coursename = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'coursetoggle') {
          var elementList = this._container.getElementsByClassName(className);
          var elemInput = elementList[0];
          var elemSelect = elementList[1];

          this._tipFilter.allcourse = !this._getSliderValue(filterElement);
          this._tipFilter.course = this._getSliderValue(filterElement);
          if (elemSelect.selectedIndex >= 0) {
            this._tipFilter.coursename = elemSelect[elemSelect.selectedIndex].value;
          } else {
            this._tipFilter.coursename = '';
          }
          
        } else if (this._tipstatusGroup.has(typeName)) {
          this._tipFilter[typeName] = this._getSliderValue(filterElement);
          
        }else if (typeName == 'termgroupname') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'username') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'searchtext') {
          this._tipFilter[typeName] = this._sanitizeText(filterElement.value);
          
        } else if (typeName == 'calendarui') {
          var elemYear = this._container.getElementsByClassName('tipfilter-calendarui-year')[0];
          this._tipFilter.calendar.schoolyear = elemYear[elemYear.selectedIndex].value;
         
          var elemTerms = this._container.getElementsByClassName('tipfilter-calendarui-term');
          for (var j = 0; j < elemTerms.length; j++) {
            var elemTerm = elemTerms[j];
            if (this._getSliderValue(elemTerm)) {
              this._tipFilter.calendar[elemTerm.termgroupName] = elemTerm.termName;
            }
          }

        } else {
          console.log('failed to get: ' + typeName);
        }
      }
    }
  }
  
  //--------------------------------------------------------------
  // calendar UI methods
  //--------------------------------------------------------------  
  _buildCalendarDetails() {
    var calendarOptions = this._filterQueryResults.calendaroptions;  
    var organizedOptions = this._organizeOptions(calendarOptions);
    var handler = () => {return this._updateFiltering();};
    
    var container = this._elemCalendarDetails;
    //while (container.firstChild) container.removeChild(container.firstChild);
    
    var years = [];
    for (var i = 0; i < organizedOptions.schoolyears.length; i++) {
      var year = organizedOptions.schoolyears[i].schoolyear;
      years.push({id: i, value: year, textval: year});
    }
    container.appendChild(CreateElement.createSelect(null, 'tipfilter-calendarui-year select-css', handler, years));
    
    var className = 'tipfilter-calendarui-term';
    var termGroups = organizedOptions.termgroups;
    for (var termgroupName in termGroups) {
      var termNames = termGroups[termgroupName];

      for (var j = 0; j < termNames.length; j++) {
        var termName = termNames[j];
        var elemSlider = this._createSliderRadio('termname', termName, termName, className, handler);
        container.appendChild(elemSlider);
        elemSlider.termgroupName = termgroupName;
        elemSlider.termName = termName;
        elemSlider.style.display = 'none';
      }
    }
  }
  
  _setCalendarUIDetails() {
    var calendarOptions = this._filterQueryResults.calendaroptions;  
    var organizedOptions = this._organizeOptions(calendarOptions);

    var container = this._container.getElementsByClassName('tipfilter-calendarui-details')[0];
    var elemSelect = container.getElementsByClassName('tipfilter-calendarui-year')[0];
    var elemTermList = container.getElementsByClassName('tipfilter-calendarui-term');
    
    for (var i = 0; i < organizedOptions.schoolyears.length; i++) {
      var year = organizedOptions.schoolyears[i].schoolyear;
      if (year == this._tipFilter.calendar.schoolyear) elemSelect.selectedIndex = i;
    }
    
    for (var i = 0; i < elemTermList.length; i++) {
      elemTermList[i].display = 'none';
    }
    
    var termgroupSettings = organizedOptions.termgroups[this._tipFilter.termgroupname];
    var showTerms = new Set(termgroupSettings);
    var selectedTermgroupName = this._tipFilter.termgroupname;
    var selectedTermName = this._tipFilter.calendar[selectedTermgroupName];

    for (var i = 0; i < elemTermList.length; i++) {
      var elemTerm = elemTermList[i];
      
      elemTerm.style.display = 'none';
      if (showTerms.has(elemTerm.termName)  && termgroupSettings.length > 1) {
        elemTerm.style.display = 'inline-block';
      }
      var selected = (elemTerm.termgroupName == selectedTermgroupName && elemTerm.termName == selectedTermName);
      this._setSliderValue(elemTerm, selected);
    }
  }
  
  _organizeOptions(calendarOptions) {
    var organizedOptions = {};
    var schoolyears = calendarOptions.schoolyears;
    var terms = calendarOptions.terms;
    var termgroupSet = new Set();

    organizedOptions.schoolyears = schoolyears;
    organizedOptions.termgroups = {};
    
    for (var i = 0; i < terms.length; i++) {
      termgroupSet.add(terms[i].termgroupname);
    }
    
    var termgroups = Array.from(termgroupSet);
    for (var i = 0; i < termgroups.length; i++) {
      organizedOptions.termgroups[termgroups[i]] = [];
    }
    
    for (var i = 0; i < terms.length; i++) {
      var tgname = terms[i].termgroupname;
      var tname = terms[i].termname;
      organizedOptions.termgroups[tgname].push(tname);
    }
    
    return organizedOptions;
  }
    
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------
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
  
  _sanitizeText(str) {
    var cleaned = str; //str.replace(/"/g, '\\"');;
    
    // consider other cleaning e.g. <script> tags
    
    return cleaned;
  }  
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _toggleCalendarSettings(e) {
    var elemIcon = e.target;
    var elemCalendarDetails = this._container.getElementsByClassName('tipfilter-calendarui-details')[0];
    var elemCalendarLabel = this._container.getElementsByClassName('tipfilter-calendarlabel')[0];
  
    if (elemCalendarDetails.classList.contains(this._HIDE_CLASS)) {
      this._showElement(elemCalendarDetails, true, true);
      this._showElement(elemCalendarLabel, false);
      elemCalendarDetails.style.display = 'inline-block';
      elemIcon.classList.remove('fa-caret-up');
      elemIcon.classList.add('fa-caret-right');
      
    } else {
      this._showElement(elemCalendarDetails, false, true);
      this._showElement(elemCalendarLabel, true);
      elemCalendarDetails.style.display == 'none';
      elemIcon.classList.remove('fa-caret-right');
      elemIcon.classList.add('fa-caret-up');
    }
  }
  
  //--------------------------------------------------------------
  // slider switch
  //--------------------------------------------------------------
  _createSliderSwitch(dataOnLabel, dataOffLabel, addedClassList, handler, useTwoChoice) {
    var classList = 'switch';
    if (useTwoChoice) {
      classList += ' switch-two-choice';
    } else {
      classList += ' switch-yes-no';
    }
    if (addedClassList && addedClassList != '') classList += ' ' + addedClassList;
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

  _createSliderRadio(groupName, dataOnLabel, dataOffLabel, addedClassList, handler) {
    var classList = 'switch switch-yes-no';
    if (addedClassList && addedClassList != '') classList += ' ' + addedClassList;
    var container = CreateElement._createElement('label', null, classList);
    
    
    var elemRadio = CreateElement._createElement('input', null, 'switch-input');
    elemRadio.type = 'radio';
    elemRadio.name = groupName;
    container.appendChild(elemRadio);
    if (handler) elemRadio.addEventListener('click', e => handler(e));
    
    var elemDataSpan = CreateElement.createSpan(null, 'switch-label');
    container.appendChild(elemDataSpan);
    elemDataSpan.setAttribute('data-on', dataOnLabel);
    elemDataSpan.setAttribute('data-off', dataOffLabel);
    
    container.appendChild(CreateElement.createSpan(null, 'switch-handle'));
    return container;
  }

  _getSliderValue(elem) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];    
    return elemInput.checked;
  }

  _setSliderValue(elem, checked) {
    var elemInput = elem.getElementsByClassName('switch-input')[0];
    elemInput.checked = checked;
  }
  
  //--------------------------------------------------------------
  // db functions
  //--------------------------------------------------------------     
  async _doGetQuery(queryType, queryName) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
      console.log('queryType: ' + queryType + ' queryName: ' + queryName);
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbPost(queryType, queryName, postData);
    if (requestResult.success) {
      resultData = requestResult;
      this._notice.setNotice('');
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
      console.log('queryType: ' + queryType + ' queryName: ' + queryName);
      console.log(postData);
    }
    
    return resultData;
  }    
}
