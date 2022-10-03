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
  update(updatedGeneralInfo, updatedCourseInfo) {
    this.settings.currentCourseInfo = this._collateCourseInfo(updatedCourseInfo);
    this.settings.generalInfo = updatedGeneralInfo;
    
    this._updateUI();
  }
  
  showSingleCourse(courseName) {
    UtilityKTS.setClass(this.settings.elemCourseSelectContainer, this.settings.hideClass, true);
    UtilityKTS.setClass(this.settings.singleCourseContainer, this.settings.hideClass, false);
    
    this._loadCourseList();
   
    let courseInfo = null;
    const courseOptions = this.settings.elemCourseList.getElementsByTagName('option');

    for (let i = 0; i < courseOptions.length && courseInfo == null; i++) {
      const optInfo = JSON.parse(courseOptions[i].getAttribute('courseinfo'));
      if (courseName == optInfo.name) courseInfo = optInfo;
    }
    
    if (courseInfo == null) {
      this.config.notice.setNotice('cannot find info for "' + courseName + '"');
      return;
    }
 
    this.settings.selectedCourse = courseInfo;
    this.settings.singleCourseName.value = courseName;
    this._loadSelectedCourse();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    this.settings.elemCourseSelectContainer = this.config.container.getElementsByClassName('course-select-container')[0];
    this.settings.elemCourseList = this.config.container.getElementsByClassName('select-course')[0];
    this.settings.elemCourseList.addEventListener('change', (e) => { this._handleCourseSelection(e); });
    
    this.settings.singleCourseContainer = this.config.container.getElementsByClassName('single-coursename-container')[0];
    this.settings.singleCourseName = this.settings.singleCourseContainer.getElementsByClassName('single-coursename')[0];
    this.settings.singleCourseContainer.getElementsByClassName('full-app')[0].addEventListener('click', (e) => { this._openFullApp(e); });
    
    this.settings.elemAssessmentsOuter = this.config.container.getElementsByClassName('assessments-outer')[0];
    this.settings.elemAssessments = this.config.container.getElementsByClassName('assessment-container')[0];
    
    this.settings.elemKeypointsOuter = this.config.container.getElementsByClassName('keypoints-outer')[0];
    this.settings.elemKeypoints = this.config.container.getElementsByClassName('keypoints-container')[0];
    
    this.settings.elemExpectationsOuter = this.config.container.getElementsByClassName('expectations-outer')[0];
    this.settings.elemStudentExpectations = this.config.container.getElementsByClassName('expectation-student-container')[0];
    this.settings.elemInstructorExpectations = this.config.container.getElementsByClassName('expectation-instructor-container')[0];
    
    this.settings.elemKeypointsOuter = this.config.container.getElementsByClassName('keypoints-outer')[0];
    this.settings.elemKeypoints = this.config.container.getElementsByClassName('keypoints-container')[0];
    
    this.settings.elemMentorWelcomeOuter = this.config.container.getElementsByClassName('welcome-outer')[0];
    this.settings.elemMentorWelcome = this.settings.elemMentorWelcomeOuter.getElementsByClassName('btn-mentor-welcome')[0];
    this.settings.elemMentorWelcome.addEventListener('click', (e) => { this._handleMentorWelcome(e); } );
  }

  _updateUI() {
    this._loadCourseList();
  }
  
  _collateCourseInfo(courseInfo) {
    let objCourseInfo = {};
    let keypointList = courseInfo.keypoints.sort(function(a, b) {
      let res = a.coursename.toLowerCase().localeCompare(b.coursename.toLowerCase());
      if (res == 0) {
        res = a.ordering - b.ordering;
      }
      return res;
    });
    
    for (let i = 0; i < courseInfo.course.length; i++) {
      let singleCourse = {...courseInfo.course[i]};
      let key = singleCourse.coursename;
      delete singleCourse.coursename;
      
      singleCourse.keypoints = [];
      for (let j = 0; j < keypointList.length; j++) {
        const keypoint = keypointList[j];
        if (keypoint.coursename == key) singleCourse.keypoints.push(keypoint.keypointtext);
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
        this.settings.selectedCourse = singleCourseInfo;
      }
    }
        
    this.settings.elemCourseList.selectedIndex = indexToSelect;
    if (indexToSelect >= 0) this._loadSelectedCourse();
  }
  
  _loadSelectedCourse() {
    let courseInfo = this.settings.selectedCourse;
    
    this._showHideContent(false);
    UtilityKTS.removeChildren(this.settings.elemAssessments);
    
    if (!this.settings.selectedCourse) return;

    this._loadKeypoints(this.settings.elemKeypointsOuter, this.settings.elemKeypoints, courseInfo.keypoints);  
    this._loadAssessments(this.settings.elemAssessmentsOuter, this.settings.elemAssessments, courseInfo.assessments);  
    this._loadExpectations(this.settings.elemExpectationsOuter, this.settings.elemStudentExpectations, this.settings.elemInstructorExpectations);
    
    this._showHideContent(true);
  }
  
  _showHideContent(show) {
    UtilityKTS.setClass(this.settings.elemAssessmentsOuter, this.settings.hideClass, !show);
    UtilityKTS.setClass(this.settings.elemKeypointsOuter, this.settings.hideClass, !show);
    UtilityKTS.setClass(this.settings.elemExpectationsOuter, this.settings.hideClass, !show);
    UtilityKTS.setClass(this.settings.elemMentorWelcomeOuter, this.settings.hideClass, !show);
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
      elem.innerHTML = this._formatInfoItem(keypointList[i]);
    }
  }
  
  _loadAssessments(outerContainer, container, unparsedAssessments) {
    UtilityKTS.removeChildren(container);
    let elemTemplate = outerContainer.getElementsByClassName('template')[0];
    
    let assessmentList = this._parseAssessments(unparsedAssessments);

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
  
  _parseAssessments(unparsedAssessments) {
    let s = unparsedAssessments.replaceAll("'", '"');

    return JSON.parse(s);
  }
  
  _loadExpectations(outerContainer, studentContainer, instructorContainer) {
    const courseInfo = this.settings.selectedCourse;
    const generalInfo = this.settings.generalInfo;
    const isAPCourse = (courseInfo.ap == 1);
    
    let expStudent = [];
    for (let i = 0; i < generalInfo.expectationsStudent.length; i++) {
      const item = generalInfo.expectationsStudent[i];
      const include = (
        (item.restriction == 'none') ||
        (isAPCourse && item.restriction == 'ap') ||
        (!isAPCourse && item.restriction == 'non-ap')
      );
      if (include) expStudent.push(item);
    }
    expStudent = expStudent.sort(function(a, b) {
      return a.ordering - b.ordering;
    });
    
    let expInstructor = [];
    for (let i = 0; i < generalInfo.expectationsInstructor.length; i++) {
      const item = generalInfo.expectationsInstructor[i];
      const include = (
        (item.restriction == 'none') ||
        (isAPCourse && item.restriction == 'ap') ||
        (!isAPCourse && item.restriction == 'non-ap')
      );
      if (include) expInstructor.push(item);
    }
    expInstructor = expInstructor.sort(function(a, b) {
      return a.ordering - b.ordering;
    });

    UtilityKTS.removeChildren(studentContainer);
    const elemTemplate = outerContainer.getElementsByClassName('template')[0];
    for (let i = 0; i < expStudent.length; i++) {
      let elem = elemTemplate.cloneNode(true);
      studentContainer.appendChild(elem);
      UtilityKTS.setClass(elem, 'template', false);
      UtilityKTS.setClass(elem, this.settings.hideClass, false);
      elem.innerHTML = this._formatInfoItem(expStudent[i].expectationtext);
    }
    
    UtilityKTS.removeChildren(instructorContainer);
    for (let i = 0; i < expInstructor.length; i++) {
      let elem = elemTemplate.cloneNode(true);
      instructorContainer.appendChild(elem);
      UtilityKTS.setClass(elem, 'template', false);
      UtilityKTS.setClass(elem, this.settings.hideClass, false);
      elem.innerHTML = this._formatInfoItem(expInstructor[i].expectationtext);
    }
  }
  
  _downloadMentorWelcomeLetter(courseInfo) {
    const format = document.querySelector('input[name="outputFormat"]:checked').value;

    let params = {
      "courseInfo": courseInfo,
      "format": format
    }

    let exportForm = document.getElementsByClassName('export-form')[0];
    exportForm.getElementsByClassName('export-data')[0].value = JSON.stringify(params);
    exportForm.submit();
  }
  
  _formatInfoItem(itemText) {
    let txt = itemText;
    
    const regexItem = /[^{}]+(?=\})/g;
    const matches = txt.match(regexItem);
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
    
    let resourceLinks = this.settings.generalInfo.resourcelink;
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
  _handleCourseSelection(e) {
    this.settings.selectedCourse = JSON.parse(e.target[e.target.selectedIndex].getAttribute("courseInfo"));
    this._loadSelectedCourse();
  }
  
  _handleMentorWelcome(e) {
    this._downloadMentorWelcomeLetter(this.settings.selectedCourse);
  }
  
  _openFullApp(e) {
    window.open(this.config.fullAppURL, '_blank');
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
