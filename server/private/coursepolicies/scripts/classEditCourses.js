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
    EditUtilities._enableEditControls(this.config.container, 'edit-control-course-conditional', selectedIndex >= 0);    

    if (selectedIndex >= 0) EditUtilities._triggerChange(elemSelect);
  }
  
  _loadCourse(courseInfo) {
    EditUtilities._enableEditControls(this.config.container, 'edit-control-course-conditional', true);    
    let elemCourseName = this.config.courseContainer.getElementsByClassName('course-name')[0];
    elemCourseName.value = courseInfo.coursename;
    
    let elemAP = this.config.courseContainer.getElementsByClassName('course-isap')[0];
    elemAP.checked = (courseInfo.ap == 1);
    
    let elemAssessment = this.config.courseContainer.getElementsByClassName('course-assessments')[0];
    elemAssessment.value = courseInfo.assessments;
    
    this._renderKeypoints(courseInfo, this.settings.info.general.keypoints);    
    
    this.settings.selectedCourseId = courseInfo.courseid;
    let courseEditContainer = this.config.courseContainer.getElementsByClassName('course-edit-container')[0];
    courseEditContainer.setAttribute('course-info', JSON.stringify(courseInfo));
    UtilityKTS.setClass(courseEditContainer, this.settings.hideClass, false);
  }
  
  _renderKeypoints(courseInfo, fullKeypointList) {
    let containerSelected = this.config.courseContainer.getElementsByClassName('keypoint-container-selected')[0];
    let containerUnSelected = this.config.courseContainer.getElementsByClassName('keypoint-container-unselected')[0];
    UtilityKTS.removeChildren(containerSelected);
    UtilityKTS.removeChildren(containerUnSelected);
  
    const partitionedKeypoints = this._partitionKeypoints(fullKeypointList, courseInfo.keypoints);
    
    let elemTemplate = this.config.courseContainer.getElementsByClassName('item-template keypoint-item')[0];
    
    for (let i = 0; i < partitionedKeypoints.selected.length; i++) {
      const kp = partitionedKeypoints.selected[i];
      let elemItem = elemTemplate.cloneNode(true);
      containerSelected.appendChild(elemItem);
      
      UtilityKTS.setClass(elemItem, this.settings.hideClass, false);
      UtilityKTS.setClass(elemItem, 'item-template', false);
      
      elemItem.getElementsByClassName('keypoint-category')[0].value = kp.category;
      elemItem.getElementsByClassName('keypoint-text')[0].value = kp.keypointtext;
      
      this._addKeypointEventHandlers(elemItem);
      this._setKeypointIcons(elemItem, true, i != 0, false);
            
      elemItem.setAttribute('keypoint-info', JSON.stringify(kp));
    }

    for (let i = 0; i < partitionedKeypoints.unselected.length; i++) {
      const kp = partitionedKeypoints.unselected[i];
      let elemItem = elemTemplate.cloneNode(true);
      containerUnSelected.appendChild(elemItem);
      
      UtilityKTS.setClass(elemItem, this.settings.hideClass, false);
      UtilityKTS.setClass(elemItem, 'item-template', false);
      
      elemItem.getElementsByClassName('keypoint-category')[0].value = kp.category;
      elemItem.getElementsByClassName('keypoint-text')[0].value = kp.keypointtext;
      
      this._addKeypointEventHandlers(elemItem);
      this._setKeypointIcons(elemItem, false, false, true);
      
      elemItem.setAttribute('keypoint-info', JSON.stringify(kp));
    }
  }
  
  _partitionKeypoints(fullKeypointList, courseKeypoints) {
    let selectedKeypoints = [];
    let unselectedKeypoints = [];

    const selectedKeypointIds = this._makeSetFromCourseKeypoints(courseKeypoints);

    for (let i = 0; i < fullKeypointList.length; i++) {
      let kp = fullKeypointList[i];
      if (selectedKeypointIds.has(kp.keypointid)) {
        let ordering = -1;
        for (let j = 0; j < courseKeypoints.length && ordering < 0; j++) {
          if (courseKeypoints[j].keypointid == kp.keypointid) ordering = courseKeypoints[j].ordering;
        }
        const fullItem = {...kp, "ordering": ordering};
        selectedKeypoints.push(fullItem);
        
      } else {
        unselectedKeypoints.push(kp);
      }
    }
    
    selectedKeypoints = selectedKeypoints.sort(function(a, b) {
      let res = a.ordering - b.ordering;
      if (res == 0) {
        res = a.keypointtext.toLowerCase().localeCompare(b.keypointtext.toLowerCase());
      }
      
      return res;
    });
    
    return {
      "selected": selectedKeypoints,
      "unselected": unselectedKeypoints
    };
  }
  
  _makeSetFromCourseKeypoints(keypointList) {
    let keypointSet = new Set();
    
    for (let i = 0; i < keypointList.length; i++) {
      keypointSet.add(keypointList[i].keypointid);
    }

    return keypointSet;
  }
  
  _addKeypointEventHandlers(elem) {
    const handler = (e) => { this._handleKeypointAction(e); };
    elem.getElementsByClassName('deselect')[0].addEventListener('click', handler);
    elem.getElementsByClassName('moveup')[0].addEventListener('click', handler);
    elem.getElementsByClassName('select')[0].addEventListener('click', handler);
  }
  
  _setKeypointIcons(elem, showDeselect, showMoveup, showSelect) {
    UtilityKTS.setClass(elem.getElementsByClassName('deselect')[0], this.settings.hideClass, !showDeselect);
    UtilityKTS.setClass(elem.getElementsByClassName('moveup')[0], this.settings.hideClass, !showMoveup);
    UtilityKTS.setClass(elem.getElementsByClassName('select')[0], this.settings.hideClass, !showSelect);
  }
  
  _moveKeypointUp(target) {
    const infoContainer = EditUtilities._findNodeInfoContainer(target, 'keypoint-item', 'keypoint-info');
    const prev = infoContainer.previousSibling;

    prev.parentNode.insertBefore(infoContainer, prev);
    
    const elemList = infoContainer.parentNode.getElementsByClassName('keypoint-item');
    for (let i = 0; i < elemList.length; i++) {
      this._setKeypointIcons(elemList[i], true, i != 0, false);
      UtilityKTS.setClass(elemList[i].getElementsByClassName('moveup')[0], this.settings.hideClass, i == 0);
    }
  }
  
  _selectKeypoint(target) {
    const infoContainer = EditUtilities._findNodeInfoContainer(target, 'keypoint-item', 'keypoint-info');
    const containerSelected = this.config.courseContainer.getElementsByClassName('keypoint-container-selected')[0];

    containerSelected.appendChild(infoContainer);
    const numSelected = containerSelected.getElementsByClassName('keypoint-item').length;

    this._setKeypointIcons(infoContainer, true, numSelected > 1, false);    
  }
  
  _deselectKeypoint(target) {
    const infoContainer = EditUtilities._findNodeInfoContainer(target, 'keypoint-item', 'keypoint-info');
    const containerUnSelected = this.config.courseContainer.getElementsByClassName('keypoint-container-unselected')[0];
    
    containerUnSelected.appendChild(infoContainer);
    this._setKeypointIcons(infoContainer, false, false, true);
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
    
    const keypointContainer = container.getElementsByClassName('keypoint-container-selected')[0];
    const keypointElements = keypointContainer.getElementsByClassName('keypoint-item');
    let includedKeypoints = [];
    for (let i = 0; i < keypointElements.length; i++) {
      const elem = keypointElements[i];
      const keypointId = JSON.parse(elem.getAttribute('keypoint-info')).keypointid;
      
      includedKeypoints.push({"keypointid": keypointId, "ordering": i});
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
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleEditControl(e) {
    if (e.target.classList.contains('disabled')) return;
    if (!e.target.classList.contains('edit-control-course')) return;
    
    if (e.target.classList.contains('reload')) {
      this._reloadCourse();
    } else if (e.target.classList.contains('save')) {
      this._saveCourse();
    } else if (e.target.classList.contains('add')) {
      this._addCourse();
    } else if (e.target.classList.contains('delete')) {
      this._deleteCourse();
    }   
  }

  _handleCourseSelect(e) {
    const optionSelected = e.target[e.target.selectedIndex];
    const courseInfo = JSON.parse(optionSelected.getAttribute('course-info'));
    this._loadCourse(courseInfo);
  }
  
  _handleKeypointAction(e) {
    if (e.target.classList.contains('disabled')) return;
    
    if (e.target.classList.contains('moveup')) {
      this._moveKeypointUp(e.target);
    } else if (e.target.classList.contains('select')) {
      this._selectKeypoint(e.target);
    } else if (e.target.classList.contains('deselect')) {
      this._deselectKeypoint(e.target);
    }
  }
  
  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------
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
  _setDifference(setA, setB) {
    const diff = new Set(setA);

    for (const elem of setB) {
      diff.delete(elem);
    }

    return diff;
  }
}
