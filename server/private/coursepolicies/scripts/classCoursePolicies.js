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
      
      currentInfo: null,
      selectedCourse: null
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
    this.settings.elemCourseList = this.config.container.getElementsByClassName('select-course')[0];
    this.settings.elemCourseList.addEventListener('change', (e) => { this._handleCourseSelection(e); });
    
    this.settings.elemAddCourseIcon = this.config.container.getElementsByClassName('add-course')[0];
    this.settings.elemEditCourseIcon = this.config.container.getElementsByClassName('edit-course-name')[0];
    this.settings.elemDeleteCourseIcon = this.config.container.getElementsByClassName('delete-course')[0];
    
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
  
  _loadCourseList() {
    let courseList = [];
    for (let key in this.settings.currentInfo) {
      courseList.push(key);
    }
    
    UtilityKTS.removeChildren(this.settings.elemCourseList);
    
    let indexToSelect = -1;
    for (let i = 0; i < courseList.length; i++) {
      let courseName = courseList[i];
      let elemItem = CreateElement.createOption(null, 'select-course-option', i, courseName);
      this.settings.elemCourseList.appendChild(elemItem);
      
      elemItem.setAttribute("courseInfo", JSON.stringify({"name": courseName}));
      if (this.settings.selectedCourse && courseName == this.settings.selectedCourse.name) {
        indexToSelect = i;
      }
    }
        
    this.settings.elemCourseList.selectedIndex = indexToSelect;
    if (indexToSelect >= 0) this._loadSelectedCourse();
  }
  
  _loadSelectedCourse() {
    let courseInfo = this.settings.selectedCourse;
    console.log('CoursePolicies._loadSelectedCourse', courseInfo);

    UtilityKTS.setClass(this.settings.elemEditCourseIcon, 'disabled', true);
    UtilityKTS.setClass(this.settings.elemDeleteCourseIcon, 'disabled', true);
    UtilityKTS.setClass(this.settings.elemMentorWelcome, 'disabled', true);

    if (!this.settings.selectedCourse) return;
    
    UtilityKTS.setClass(this.settings.elemEditCourseIcon, 'disabled', false);
    UtilityKTS.setClass(this.settings.elemDeleteCourseIcon, 'disabled', false);
    UtilityKTS.setClass(this.settings.elemMentorWelcome, 'disabled', false);
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
    console.log('CoursePolicies._downloadMentorWelcomeLetter', courseInfo);
    let params = {
      "courseInfo": courseInfo
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
