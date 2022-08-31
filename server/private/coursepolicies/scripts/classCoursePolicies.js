//-------------------------------------------------------------------
// CoursePolicies
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class CoursePolicies {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      
      currentCourseInfo: null,

      selectedCourse: null
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(updatedCourseInfo) {
    this.settings.currentCourseInfo = this._collateCourseInfo(updatedCourseInfo);
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    this.settings.elemCourseList = this.config.container.getElementsByClassName('select-course')[0];
    this.settings.elemCourseList.addEventListener('change', (e) => { this._handleCourseSelection(e); });
    
    this.settings.elemAddCourseIcon = this.config.container.getElementsByClassName('add-course')[0];
    this.settings.elemEditCourseIcon = this.config.container.getElementsByClassName('edit-course-name')[0];
    this.settings.elemDeleteCourseIcon = this.config.container.getElementsByClassName('delete-course')[0];

    this.settings.elemAssessmentsOuter = this.config.container.getElementsByClassName('assessments-outer')[0];
    this.settings.elemAssessments = this.config.container.getElementsByClassName('assessment-container')[0];
    
    this.settings.elemKeypointsOuter = this.config.container.getElementsByClassName('keypoints-outer')[0];
    this.settings.elemKeypoints = this.config.container.getElementsByClassName('keypoints-container')[0];
    
    let adminElements = this.config.container.getElementsByClassName('admin-only');
    for (let i = 0; i < adminElements.length; i++) {
      let elem = adminElements[i];
      UtilityKTS.setClass(elem, this.settings.hideClass, !this.config.adminAllowed);
      if (elem.classList.contains('admin-icon')) {
        elem.addEventListener('click', (e) => { this._handleAdminIcon(e); });
      }
    }

    this.settings.elemMentorWelcome = this.config.container.getElementsByClassName('btn-mentor-welcome')[0];
    this.settings.elemMentorWelcome.addEventListener('click', (e) => { this._handleMentorWelcome(e); } );
  }

  _updateUI() {
    this._loadCourseList();
  }
  
  _collateCourseInfo(courseInfo) {
    let objCourseInfo = {};
    let keypointList = courseInfo.keypoints;
    let assessmentList = courseInfo.assessment;
    
    for (let i = 0; i < courseInfo.course.length; i++) {
      let singleCourse = {...courseInfo.course[i]};
      let key = singleCourse.coursename;
      delete singleCourse.coursename;
      
      singleCourse.keypoints = [];
      for (let j = 0; j < keypointList.length; j++) {
        const keypoint = keypointList[j];
        if (keypoint.coursename == key) singleCourse.keypoints.push(keypoint.keypointtext);
      }
      
      singleCourse.assessments = []
      for (let j = 0; j < assessmentList.length; j++) {
        const assessment = assessmentList[j];
        if (assessment.coursename == key) singleCourse.assessments.push(assessment.assessmentname);
      }
      
      objCourseInfo[key] = singleCourse;
    }
    
    return objCourseInfo;
  }
  
  _loadCourseList() {
    let courseList = [];
    for (let key in this.settings.currentCourseInfo) {
      courseList.push(key);
    }
    courseList = courseList.sort(function(a,b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    
    UtilityKTS.removeChildren(this.settings.elemCourseList);
    
    let indexToSelect = -1;
    for (let i = 0; i < courseList.length; i++) {
      let courseName = courseList[i];
      let elemItem = CreateElement.createOption(null, 'select-course-option', i, courseName);
      this.settings.elemCourseList.appendChild(elemItem);
      
      let singleCourseInfo = {"name": courseName, ...this.settings.currentCourseInfo[courseName]};
      
      elemItem.setAttribute("courseInfo", JSON.stringify(singleCourseInfo));
      if (this.settings.selectedCourse && courseName == this.settings.selectedCourse.name) {
        indexToSelect = i;
      }
    }
        
    this.settings.elemCourseList.selectedIndex = indexToSelect;
    if (indexToSelect >= 0) this._loadSelectedCourse();
  }
  
  _loadSelectedCourse() {
    let courseInfo = this.settings.selectedCourse;
    console.log('_loadSelectedCourse', courseInfo);
    
    this._showHideContent(false);
    UtilityKTS.removeChildren(this.settings.elemAssessments);
    
    if (!this.settings.selectedCourse) return;

    this._loadKeypoints(this.settings.elemKeypointsOuter, this.settings.elemKeypoints, courseInfo.keypoints);  
    this._loadAssessments(this.settings.elemAssessmentsOuter, this.settings.elemAssessments, courseInfo.assessments);  
    
    this._showHideContent(true);
  }
  
  _showHideContent(show) {
    UtilityKTS.setClass(this.settings.elemEditCourseIcon, 'disabled', !show);
    UtilityKTS.setClass(this.settings.elemDeleteCourseIcon, 'disabled', !show);
    UtilityKTS.setClass(this.settings.elemMentorWelcome, 'disabled', !show);
    
    UtilityKTS.setClass(this.settings.elemAssessmentsOuter, this.settings.hideClass, !show);
    UtilityKTS.setClass(this.settings.elemKeypointsOuter, this.settings.hideClass, !show);
  }
  
  _loadKeypoints(outerContainer, container, keypointList) {
    UtilityKTS.removeChildren(container);
    let elemTemplate = outerContainer.getElementsByClassName('template')[0];
    
    if (keypointList.length == 0) {
      let elem = elemTemplate.cloneNode(true);
      container.appendChild(elem);
      UtilityKTS.setClass(elem, 'template', false);
      UtilityKTS.setClass(elem, this.settings.hideClass, false);
      elem.innerHTML = '<em>none</em>';
    }
    
    for (let i = 0; i < keypointList.length; i++) {
      let elem = elemTemplate.cloneNode(true);
      container.appendChild(elem);
      UtilityKTS.setClass(elem, 'template', false);
      UtilityKTS.setClass(elem, this.settings.hideClass, false);
      elem.innerHTML = keypointList[i];
    }
  }
  
  _loadAssessments(outerContainer, container, assessmentList) {
    UtilityKTS.removeChildren(container);
    let elemTemplate = outerContainer.getElementsByClassName('template')[0];
    
    if (assessmentList.length == 0) {
      let elem = elemTemplate.cloneNode(true);
      container.appendChild(elem);
      UtilityKTS.setClass(elem, 'template', false);
      UtilityKTS.setClass(elem, this.settings.hideClass, false);
      elem.innerHTML = '<em>none</em>';
    }
    
    for (let i = 0; i < assessmentList.length; i++) {
      let elem = elemTemplate.cloneNode(true);
      container.appendChild(elem);
      UtilityKTS.setClass(elem, 'template', false);
      UtilityKTS.setClass(elem, this.settings.hideClass, false);
      elem.innerHTML = assessmentList[i];
    }
  }
  
  async _addCourse() {
    console.log('add course');
  }
  
  async _editCourseName() {
    console.log('edit course name', this.settings.selectedCourse.name);
  }
  
  async _deleteCourse() {
    console.log('delete course', this.settings.selectedCourse.name);
  }
  
  _downloadMentorWelcomeLetter(courseInfo) {
    let params = {
      "courseInfo": courseInfo,
    }
    
    let exportForm = document.getElementsByClassName('export-form')[0];
    exportForm.getElementsByClassName('export-data')[0].value = JSON.stringify(params);
    exportForm.submit();
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _handleAdminIcon(e) {
    if (e.target.classList.contains('disabled')) return;
    
    if (e.target.classList.contains('add-course')) {
      await this._addCourse();
    } else if (e.target.classList.contains('edit-course-name')) {
      await this._editCourseName();
    } else if (e.target.classList.contains('delete-course')) {
      this._deleteCourse();
    }
  }
  
  _handleCourseSelection(e) {
    this.settings.selectedCourse = JSON.parse(e.target[e.target.selectedIndex].getAttribute("courseInfo"));
    this._loadSelectedCourse();
  }
  
  _handleMentorWelcome(e) {
    this._downloadMentorWelcomeLetter(this.settings.selectedCourse);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
