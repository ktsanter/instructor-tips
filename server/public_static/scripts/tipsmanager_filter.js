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
      'unspecified', 
      'scheduled', 
      'completed', 
      'coursename', 
      'termgroupname', 
      'user', 
      'username', 
      'searchtext', 
      'allcourse', 
      'usercourse',
      'usercoursename',
      'adm_allcourse', 
      'adm_usercourse',
      'adm_usercoursename',
      'adm_coursename',
      'adm_termgroupname'
    ];
    this._checkBoxes = new Set(['unmapped', 'general', 'coursespecific', 'shared', 'personal', 'unspecified', 'scheduled', 'completed', 'user']);
    this._radioButtons = new Set(['allcourse', 'usercourse', 'adm_allcourse', 'adm_usercourse']);
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
  
  async userchange() {
    await this.render();
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
        groupContainer.appendChild(this._buildFilterUIElement(groupName, group[j]));
      }       
    }
    
    return container;
  }
  
  _buildFilterUIElement(groupName, fieldName) {
    var elem = CreateElement.createDiv(null, null, 'not implemented: ' + fieldName);
    var className = 'tipfilter-item tipfilter-' + fieldName;
    var handler = () => {return this._updateFiltering();};
        
    if (fieldName == 'unmapped') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'unmapped', false, handler);
    } else if (fieldName == 'general') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'general', false, handler);
    } else if (fieldName == 'coursespecific') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, '', false, handler);
      
    } else if (fieldName == 'shared') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'public', false, handler);
    } else if (fieldName == 'personal') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'private', false, handler);
      
    } else if (fieldName == 'unspecified') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'unspecified', false, handler);
    } else if (fieldName == 'scheduled') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'scheduled', false, handler);
    } else if (fieldName == 'completed') {
      elem = CreateElement.createCheckbox(null, className, groupName, fieldName, 'completed', false, handler);
      
    } else if (fieldName == 'adm_allcourse') {
      elem = CreateElement.createRadio(null, className, 'usercourseGroup', fieldName, 'all courses', false, handler);
    } else if (fieldName == 'adm_usercourse') {
      elem = CreateElement.createRadio(null, className, 'usercourseGroup', fieldName, '', false, handler);
    } else if (fieldName == 'allcourse') {
      elem = CreateElement.createRadio(null, className, groupName, fieldName, 'all my courses', false, handler);
    } else if (fieldName == 'usercourse') {
      elem = CreateElement.createRadio(null, className, groupName, fieldName, '', false, handler);
    
    } else if (fieldName == 'usercoursename') {
      var valueList = [];
      var usercourses = this._filterQueryResults.usercourses;
      for (var i = 0; i < usercourses.length; i++) {
        var displayVal = usercourses[i].coursename + ' (' + usercourses[i].termgroupname + ')';
        var indexVal = i;
        valueList.push({id: i, value: i, textval: displayVal});
      }
      elem = CreateElement.createSelect(null, className, handler, valueList);
      
    } else if (fieldName == 'adm_usercoursename') {
      var valueList = [];
      var adm_usercourses = this._filterQueryResults.adm_usercourses;
      for (var i = 0; i < adm_usercourses.length; i++) {
        var displayVal = adm_usercourses[i].coursename + ' (' + adm_usercourses[i].termgroupname + ')';
        var indexVal = i;
        valueList.push({id: i, value: i, textval: displayVal});
      }
      elem = CreateElement.createSelect(null, className, handler, valueList);
      
    } else if (fieldName == 'coursename') {
      var valueList = [];
      var courses = this._filterQueryResults.courses;
      for (var i = 0; i < courses.length; i++) {
        valueList.push({id: i, value: courses[i].coursename, textval: courses[i].coursename});
      }
      elem = CreateElement.createSelect(null, className, handler, valueList);
      
    } else if (fieldName == 'termgroupname') {
      var valueList = [];
      var termgroups = this._filterQueryResults.termgroups;
      for (var i = 0; i < termgroups.length; i++) {
        valueList.push({id: i, value: termgroups[i].termgroupname, textval: termgroups[i].termgroupname});
      }
      elem = CreateElement.createSelect(null, className, handler, valueList);

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
          
        } else if (typeName == 'coursename') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          var courses = this._filterQueryResults.courses;
          for (var k = 0; k < courses.length; k++) {
            if (courses[k].coursename == this._tipFilter.coursename) elemSelect.selectedIndex = k;
          }
          if (this._tipFilter.hasOwnProperty('coursespecific')) elemSelect.disabled = !this._tipFilter['coursespecific'];
          if (this._tipFilter.hasOwnProperty('course_radio')) elemSelect.disabled = !this._tipFilter['course_radio'];
          
        } else if (typeName == 'usercoursename') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          var usercourses = this._filterQueryResults.usercourses;
          for (var k = 0; k < usercourses.length; k++) {
            var displayVal = usercourses[k].coursename + ' (' + usercourses[k].termgroupname + ')';
            if (displayVal == this._tipFilter.usercoursename) elemSelect.selectedIndex = k;
          }
          elemSelect.disabled = !this._tipFilter.usercourse;
          
        } else if (typeName == 'adm_usercoursename') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          var adm_usercourses = this._filterQueryResults.adm_usercourses;
          for (var k = 0; k < adm_usercourses.length; k++) {
            var displayVal = adm_usercourses[k].adm_coursename + ' (' + adm_usercourses[k].adm_termgroupname + ')';
            if (displayVal == this._tipFilter.adm_usercoursename) elemSelect.selectedIndex = k;
          }
          elemSelect.disabled = !this._tipFilter.adm_usercourse;
          
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
        }
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
          
        } else if (typeName == 'usercoursename') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] =  elemSelect[elemSelect.selectedIndex].text;
          
          var selectedUserCourseIndex = elemSelect[elemSelect.selectedIndex].index;
          var usercourse = this._filterQueryResults.usercourses[selectedUserCourseIndex];

          this._tipFilter.coursename = usercourse.coursename;
          this._tipFilter.termgroupname = usercourse.termgroupname;
          
        } else if (typeName == 'adm_usercoursename') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] =  elemSelect[elemSelect.selectedIndex].text;
          
          var selectedUserCourseIndex = elemSelect[elemSelect.selectedIndex].index;
          var adm_usercourse = this._filterQueryResults.usercourses[selectedUserCourseIndex];

          this._tipFilter.adm_coursename = adm_usercourse.adm_coursename;
          this._tipFilter.adm_termgroupname = adm_usercourse.adm_termgroupname;
          
        } else if (typeName == 'coursename') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'termgroupname') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'username') {
          var elemSelect = this._container.getElementsByClassName(className)[0];
          this._tipFilter[typeName] = elemSelect[elemSelect.selectedIndex].value;
          
        } else if (typeName == 'searchtext') {
          this._tipFilter[typeName] = filterElement.value;
        }
      }
    }
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
