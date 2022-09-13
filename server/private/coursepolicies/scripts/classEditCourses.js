//-------------------------------------------------------------------
// EditCourses
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class EditCourses {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      
      info: null,

      selectedCourseId: null
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(info) {
    this.settings.info = {
      "general": info.general,
      "course": info.course
    };
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    EditUtilities._setEditControlHandlers(
      this.config.container, 
      'edit-control edit-control-course',
      (e) => { this._handleEditControl(e); }
    );    
    
    this.config.courseContainer = this.config.container.getElementsByClassName('navEditCourses')[0];
    this._setCourseEditHandlers();
  }

  _setCourseEditHandlers() {
    this.config.courseContainer.getElementsByClassName('select-course')[0].addEventListener('change', (e) => { this._handleCourseSelect(e); });
  }
  
  _updateUI() {
    let courseList = this._collateCourseList();
    this._loadCourseList(courseList);
  }
  
  //--------------------------------------------------------------
  // edit courses
  //--------------------------------------------------------------   
  _collateCourseList() {
    let courseList = this.settings.info.course.course.sort( function(a, b) {
        return a.coursename.toLowerCase().localeCompare(b.coursename.toLowerCase());
    });

    let keypointList = this.settings.info.course.keypoints;

    for (let i = 0; i < courseList.length; i++) {
      const courseInfo = courseList[i];
      const courseName = courseInfo.coursename;

      let courseKeypoints = [];
      for (let j = 0; j < keypointList.length; j++) {
        const keypointInfo = {...keypointList[j]};
        if (courseName == keypointInfo.coursename) {
          delete keypointInfo.coursename;
          courseKeypoints.push(keypointInfo);
        }
      }
      courseList[i].keypoints = courseKeypoints;
    }

    return courseList;
  }
  
  _loadCourseList(courseList) {
    let elemSelect = this.config.courseContainer.getElementsByClassName('select-course')[0];
    UtilityKTS.removeChildren(elemSelect);
    
    let selectedIndex = -1;
    for (let i = 0; i < courseList.length; i++) {
      let courseInfo = courseList[i];
      let elemOption = CreateElement.createOption(null, 'select-course-option', i, courseInfo.coursename);
      elemSelect.appendChild(elemOption);
      
      elemOption.setAttribute('course-info', JSON.stringify(courseInfo));
      if (courseInfo.courseid == this.settings.selectedCourseId) selectedIndex = i;
    }
    
    elemSelect.selectedIndex = selectedIndex;

    let courseEditContainer = this.config.courseContainer.getElementsByClassName('course-edit-container')[0];
    UtilityKTS.setClass(courseEditContainer, this.settings.hideClass, selectedIndex < 0);
    this._enableEditControls(this.config.container, 'edit-control-course-conditional', selectedIndex >= 0);    

    if (selectedIndex >= 0) this._triggerChange(elemSelect);
  }
  
  _loadCourse(courseInfo) {
    this._enableEditControls(this.config.container, 'edit-control-course-conditional', true);    
    let elemCourseName = this.config.courseContainer.getElementsByClassName('course-name')[0];
    elemCourseName.value = courseInfo.coursename;
    
    let elemAP = this.config.courseContainer.getElementsByClassName('course-isap')[0];
    elemAP.checked = (courseInfo.ap == 1);
    
    let elemAssessment = this.config.courseContainer.getElementsByClassName('course-assessments')[0];
    elemAssessment.value = courseInfo.assessments;
    
    let container = this.config.courseContainer.getElementsByClassName('keypoint-container')[0];
    UtilityKTS.removeChildren(container);

    let elemTemplate = this.config.courseContainer.getElementsByClassName('item-template')[0];

    let fullKeypointList = this.settings.info.general.keypoints;   
    fullKeypointList = fullKeypointList.sort(function(a, b) {
      let res = a.category.localeCompare(b.category);
      if (res == 0) {
        res = a.keypointtext.toLowerCase().localeCompare(b.keypointtext.toLowerCase());
      }
      return res;
    });
    const courseKeypointIds = this._setFromCourseKeypoints(courseInfo.keypoints);
    
    for (let i = 0; i < fullKeypointList.length; i++) {
      let keypoint = fullKeypointList[i];
      let elemItem = elemTemplate.cloneNode(true);
      container.appendChild(elemItem);
      
      UtilityKTS.setClass(elemItem, this.settings.hideClass, false);
      UtilityKTS.setClass(elemItem, 'item-template', false);
      
      const keypointIncluded = courseKeypointIds.has(keypoint.keypointid);      
      let elemInclude = elemItem.getElementsByClassName('include')[0];
      let elemExclude = elemItem.getElementsByClassName('exclude')[0];
      elemInclude.addEventListener('click', (e) => { this._handleEditControl(e); });
      elemExclude.addEventListener('click', (e) => { this._handleEditControl(e); });
      UtilityKTS.setClass(elemInclude, this.settings.hideClass, !keypointIncluded);
      UtilityKTS.setClass(elemExclude, this.settings.hideClass, keypointIncluded);

      elemItem.getElementsByClassName('keypoint-category')[0].value = keypoint.category;
      elemItem.getElementsByClassName('keypoint-text')[0].value = keypoint.keypointtext;

      elemItem.setAttribute("keypoint-info", JSON.stringify(keypoint));
    }            
    
    this.settings.selectedCourseId = courseInfo.courseid;
    let courseEditContainer = this.config.courseContainer.getElementsByClassName('course-edit-container')[0];
    courseEditContainer.setAttribute('course-info', JSON.stringify(courseInfo));
    UtilityKTS.setClass(courseEditContainer, this.settings.hideClass, false);
  }
  
  _setFromCourseKeypoints(keypointList) {
    let keypointSet = new Set();
    
    for (let i = 0; i < keypointList.length; i++) {
      keypointSet.add(keypointList[i].keypointid);
    }
    
    return keypointSet;
  }
  
  _includeCourseKeypoint(elemControl, include) {
    const controlContainer = elemControl.parentNode;

    const elemInclude = controlContainer.getElementsByClassName('include')[0];
    const elemExclude = controlContainer.getElementsByClassName('exclude')[0];
    
    UtilityKTS.setClass(elemInclude, this.settings.hideClass, !include);
    UtilityKTS.setClass(elemExclude, this.settings.hideClass, include);    
  }
  
  async _reloadCourse() {
    const msg = 'Any changes will be lost. Continue?';
    if (!confirm(msg)) return;
    
    const container = this.config.courseContainer.getElementsByClassName('course-edit-container')[0];
    const infoOriginal = JSON.parse(container.getAttribute('course-info'));
    this._loadCourse(infoOriginal);
  }
  
  async _addCourse() {
    const msg = "Please enter the name of the new coures";
    const courseName = prompt(msg);
    
    if (!courseName || courseName.length == 0) return;

    const success = await this._addCourseToDB(courseName);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    EditUtilities._forceSelection(this.config.courseContainer.getElementsByClassName('select-course')[0], courseName);
  }  

  async _saveCourse() {
    if (!this.settings.selectedCourseId) return;
    
    const container = this.config.courseContainer.getElementsByClassName('course-edit-container')[0];
    let courseInfo = {};
    courseInfo.courseid = JSON.parse(container.getAttribute('course-info')).courseid;
    courseInfo.coursename = EditUtilities._getValueFromContainer(container, 'course-name');
    courseInfo.assessments = EditUtilities._getValueFromContainer(container, 'course-assessments');
    courseInfo.ap = EditUtilities._getValueFromContainer(container, 'course-isap');
    
    const keypointContainer = container.getElementsByClassName('keypoint-container')[0];
    const keypointElements = keypointContainer.getElementsByClassName('keypoint-item');
    let includedKeypoints = [];
    for (let i = 0; i < keypointElements.length; i++) {
      const keypoint = keypointElements[i];
      const keypointId = JSON.parse(keypoint.getAttribute('keypoint-info')).keypointid;
      
      const elemIncluded = keypoint.getElementsByClassName('include')[0];
      if (!elemIncluded.classList.contains(this.settings.hideClass)) includedKeypoints.push(keypointId);
    }
    courseInfo.keypointlist = includedKeypoints;
    
    const success = await this._saveCourseToDB(courseInfo);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    EditUtilities._forceSelection(this.config.courseContainer.getElementsByClassName('select-course')[0], courseInfo.coursename);
    EditUtilities._blipNotice(this.config.notice, 'course info saved');
  }
  
  async _deleteCourse() {
    if (!this.settings.selectedCourseId) return;
    
    const courseEditContainer = this.config.courseContainer.getElementsByClassName('course-edit-container')[0];
    const courseInfo = JSON.parse(courseEditContainer.getAttribute('course-info'));
    
    const msg = 'This course \n' +
                '-----------------------------\n' +
                '  ' + courseInfo.coursename + '\n' +
                '-----------------------------\n' +
                'will be deleted. Are you sure?';
    if (!confirm(msg)) return;
    
    const success = await this._deleteCourseFromDB(courseInfo.courseid);
    if (!success) return;
    
    this.settings.selectedCourseId = null;
    await this.config.callbackRefreshData();
  }
      
  //--------------------------------------------------------------
  // edit utilities
  //--------------------------------------------------------------   
  _clearFormValuesInContainer(container) {
    const elementList = container.getElementsByClassName('form-control');
    for (let i = 0; i < elementList.length; i++) {
      const elem = elementList[i];
      if (elem.tagName == 'INPUT') {
        if (elem.type == 'text') elem.value = '';
      }
    }
  }
  
  _setValueInContainer(container, classList, value) {
    container.getElementsByClassName(classList)[0].value = value;
  }
  
  _getValueFromContainer(container, classList) {
    let val = null;
    const elem = container.getElementsByClassName(classList)[0];
    if (elem.tagName == 'INPUT') {
      const elemType = elem.getAttribute('type');
      if (elemType == 'text') {
        val = elem.value;
      } else if (elemType == 'checkbox') {
        val = elem.checked;
      }
      
    } else if (elem.tagName == 'SELECT') {
      val = elem[elem.selectedIndex].value;
    }
    
    if (!val) console.log('unhandled element in _getValueFromContainer', elem);
    
    return val;
  }
  
  _enableEditControls(container, classList, enable) {
    const editControls = container.getElementsByClassName(classList);

    for (let i = 0; i < editControls.length; i++) {
      UtilityKTS.setClass(editControls[i], 'disabled', !enable);
    }
  }

  _selectByText(elemSelect, optionText) {
    let selectedIndex = -1;
    const options = elemSelect.getElementsByTagName('OPTION');
    for (let i = 0; i < options.length && selectedIndex < 0; i++) {
      if (options[i].text == optionText) selectedIndex = i;
    }
    elemSelect.selectedIndex = selectedIndex;
  }
    
  _forceSelection(elemSelect, optionText) {
    let selectedIndex = -1;
    const options = elemSelect.getElementsByTagName('OPTION');
    for (let i = 0; i < options.length && selectedIndex < 0; i++) {
      if (options[i].text == optionText) selectedIndex = i;
    }
    elemSelect.selectedIndex = selectedIndex;
    elemSelect.dispatchEvent(new Event('change'));
  }
    
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleNavbarClick(me, e) {
    let target = e.target;
    if (target.tagName != 'A') target = e.target.firstChild;
    if (target.classList.contains('disabled')) return;

    if (this.settings.selectedNavId && this.settings.selectedNavId == target.id) return;
    
    this._dispatch(me, target.id);
  }
  
  _handleEditControl(e) {
    console.log('Admin._handleEditControl');
    if (e.target.classList.contains('disabled')) return;
    
    if (e.target.classList.contains('edit-control-course')) {
      if (e.target.classList.contains('reload')) {
        this._reloadCourse();
      } else if (e.target.classList.contains('save')) {
        this._saveCourse();
      } else if (e.target.classList.contains('add')) {
        this._addCourse();
      } else if (e.target.classList.contains('delete')) {
        this._deleteCourse();
      } else if (e.target.classList.contains('include')) {
        this._includeCourseKeypoint(e.target, false);
      }  else if (e.target.classList.contains('exclude')) {
        this._includeCourseKeypoint(e.target, true);
      }   
    }
  }

  _findNodeInfo(elem, itemClass, infoClass) {
    let node = elem;
    while (!node.classList.contains(itemClass) && node.tagName != 'BODY') {
      node = node.parentNode;
    }
    
    let nodeInfo = null;
    if (node.hasAttributes(infoClass)) nodeInfo = JSON.parse(node.getAttribute(infoClass));

    return nodeInfo;
  }

  _handleCourseSelect(e) {
    const optionSelected = e.target[e.target.selectedIndex];
    const courseInfo = JSON.parse(optionSelected.getAttribute('course-info'));
    this._loadCourse(courseInfo);
  }
  
  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------
     
   //--- courses
  async _addCourseToDB(courseName) {
    let params = {
      "coursename": courseName
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/insert', 'course', params, this.config.notice);
    
    return dbResult.success;
  }
 
  async _saveCourseToDB(courseInfo) {
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/update', 'course', courseInfo, this.config.notice);
    
    return dbResult.success;
  }
  
  async _deleteCourseFromDB(courseId) {
    let params = {
      "courseid": courseId
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/delete', 'course', params, this.config.notice);
    
    return dbResult.success;
  }

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _blipNotice(msg) {
    this.config.notice.setNotice(msg);
    const me = this;
    setTimeout(function() {
      me.config.notice.setNotice('');
    }, 500);
  }
  
  _triggerChange(element) {
    let changeEvent = new Event('change');
    element.dispatchEvent(changeEvent);
  }  
}
