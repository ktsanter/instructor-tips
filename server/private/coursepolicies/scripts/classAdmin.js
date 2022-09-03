//-------------------------------------------------------------------
// Admin
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class Admin {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      navItemClass: 'nav-item',
      
      selectedNavId: null,
      info: null,
      selectedNavId: 'navEditCourses',  // default selection
      
      selectedCourseId: null
    }
    
    this._initUI();
    console.log('add category and sorting to keypoints for course editing')
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(generalInfo, courseInfo) {
    this.settings.info = {
      "general": generalInfo,
      "course": courseInfo
    };
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    this.config.contentContainers = this.config.container.getElementsByClassName('admin-container');
    this._setNavbarHandlers();
    this._setEditControlHandlers();
    
    this.config.expectationContainer = this.config.container.getElementsByClassName('navEditExpectations')[0];
    
    this.config.keypointContainer = this.config.container.getElementsByClassName('navEditKeypoints')[0];

    this.config.contactSelect = this.config.container.getElementsByClassName('select-contact')[0];
    this.config.contactEditContainer = this.config.container.getElementsByClassName('contact-edit-container')[0];
    this.config.contactSelect.addEventListener('change', (e) => { this._handleContactSelect(e); });
    
    this.config.courseContainer = this.config.container.getElementsByClassName('navEditCourses')[0];
    this._setCourseEditHandlers();
  }

  _setNavbarHandlers() {
    const navList = this.config.container.getElementsByClassName(this.settings.navItemClass);
    const me = this;

    for (let i = 0; i < navList.length; i++) {
      navList[i].addEventListener('click', (e) => { this._handleNavbarClick(me, e); });
    }
  }
  
  _setEditControlHandlers() {
    const editControls = this.config.container.getElementsByClassName('edit-control');
    
    for (let i = 0; i < editControls.length; i++) {
      editControls[i].addEventListener('click', (e) => { this._handleEditControl(e); });
    }
  }
  
  _setCourseEditHandlers() {
    this.config.courseContainer.getElementsByClassName('select-course')[0].addEventListener('change', (e) => { this._handleCourseSelect(e); });
  }

  _updateUI() {
    this._dispatch(this, this.settings.selectedNavId);
  }
      
  _dispatch(me, dispatchTargetId) {
    if (this.settings.selectedNavId) this._activateMenuOption(this.settings.selectedNavId, false);
    this.settings.selectedNavId = dispatchTargetId;
    this._activateMenuOption(dispatchTargetId, true);

    me._showEditContainer()
    var dispatchMap = {
      "navEditExpectations": function() { me._showEditExpectations()},
      "navEditKeypoints": function() { me._showEditKeypoints()},
      "navEditContacts": function() { me._showEditContacts()},
      "navEditCourses": function() { me._showEditCourses()}
    }
    dispatchMap[dispatchTargetId]();    
  }
  
  _activateMenuOption(navId, setActive) {
    let navElements = this.config.container.getElementsByClassName('nav-link');

    let elemNav = null;
    for (let i = 0; i < navElements.length && !elemNav; i++) {
      if (navElements[i].id == navId) elemNav = navElements[i];
    }
    if (elemNav) UtilityKTS.setClass(elemNav, 'active', setActive);
  }
  
  _showEditContainer() {
    for (let i = 0; i < this.config.contentContainers.length; i++) {
      const container = this.config.contentContainers[i];
      UtilityKTS.setClass(container, this.settings.hideClass, !container.classList.contains(this.settings.selectedNavId));
    }
  }
  
  //--------------------------------------------------------------
  // edit expectations
  //--------------------------------------------------------------   
  _showEditExpectations() {
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
      this._selectByText(elemTarget, exp.target);
      
      let elemRestriction = elemItem.getElementsByClassName('select-restriction')[0]
      this._selectByText(elemRestriction, exp.restriction);
      
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
    
    this._showEditExpectations();
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

      let expectationText = exp.getElementsByClassName('expectation-text')[0].value;
      
      expectationList.push({
        "expectationid": expectationId,
        "target": target,
        "restriction": restriction,
        "expectationtext": expectationText
      });
    }
    
    const success = await this._saveExpectationsToDB(expectationList);
    if (!success) return;
    
    await this.config.callbackRefreshData();
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
  // edit keypoints
  //--------------------------------------------------------------   
  _showEditKeypoints() {
    let keypointList = this._collateKeypoints();
    this._loadKeypointList(keypointList);
  }
  
  _collateKeypoints() {
    let keypointList = this.settings.info.general.keypoints;
    
    keypointList = keypointList.sort(
      function(a,b) {
        let res = a.category.localeCompare(b.category);
        
        if (res == 0) {
          res = a.keypointtext.toLowerCase().localeCompare(b.keypointtext.toLowerCase());
        }
        
        return res;
      }
    );
    
    return keypointList;
  }
  
  _loadKeypointList(keypointList) {
    let container = this.config.keypointContainer.getElementsByClassName('keypoint-container')[0];
    UtilityKTS.removeChildren(container);
    
    let elemTemplate = this.config.keypointContainer.getElementsByClassName('item-template')[0];
    for (let i = 0; i < keypointList.length; i++) {
      let keypoint = keypointList[i];
      let elemItem = elemTemplate.cloneNode(true);
      container.appendChild(elemItem);
      UtilityKTS.setClass(elemItem, this.settings.hideClass, false);
      UtilityKTS.setClass(elemItem, 'item-template', false);
      
      let elemCategory = elemItem.getElementsByClassName('select-category')[0];
      this._selectByText(elemCategory, keypoint.category);
      
      elemItem.getElementsByClassName('keypoint-text')[0].value = keypoint.keypointtext;
      
      elemItem.setAttribute("keypoint-info", JSON.stringify(keypoint));
      
      elemItem.getElementsByClassName('edit-control')[0].addEventListener('click', (e) => { this._handleEditControl(e); });
    }    
  }
  
  async _addKeypoint() {
    const msg = "Please enter the text for the new keypoint";
    const keypointText = prompt(msg);
    
    if (!keypointText || keypointText.length == 0) return;

    const success = await this._addKeypointToDB(keypointText);
    if (!success) return;
    
    await this.config.callbackRefreshData();
  }
  
  async _reloadKeypoints() {
    const msg = 'Any changes will be lost. Continue?';
    if (!confirm(msg)) return;
    
    this._showEditKeypoints();
  }

  async _saveKeypoints() {
    let container = this.config.keypointContainer.getElementsByClassName('keypoint-container')[0];
    let keypointList = [];
    
    let keypointItems = container.getElementsByClassName('keypoint-item');
    for (let i = 0; i < keypointItems.length; i++) {
      let keypoint = keypointItems[i];
      let keypointId = JSON.parse(keypoint.getAttribute('keypoint-info')).keypointid;

      let elemCategory = keypoint.getElementsByClassName('select-category')[0];
      let category = elemCategory[elemCategory.selectedIndex].text;

      let keypointText = keypoint.getElementsByClassName('keypoint-text')[0].value;
      
      keypointList.push({
        "keypointid": keypointId,
        "category": category,
        "keypointtext": keypointText
      });
    }
    
    const success = await this._saveKeypointsToDB(keypointList);
    if (!success) return;
    
    await this.config.callbackRefreshData();
  }

  async _deleteKeypoint(keypointInfo) {
    const msg = 'This keypoint \n' +
                '-----------------------------\n' +
                '  category: ' + keypointInfo.category + '\n' +
                '  ' + keypointInfo.keypointtext + '\n' +
                '-----------------------------\n' +
                'will be deleted. Are you sure?';
    if (!confirm(msg)) return;
    
    const success = await this._deleteKeypointFromDB(keypointInfo.keypointid);
    if (!success) return;
    
    await this.config.callbackRefreshData();
  }
  
  //--------------------------------------------------------------
  // edit courses
  //--------------------------------------------------------------   
  _showEditCourses() {
    let courseList = this._collateCourseList();
    this._loadCourseList(courseList);
  }
  
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
  }
  
  _loadCourse(courseInfo) {
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
    this._forceSelection(this.config.courseContainer.getElementsByClassName('select-course')[0], courseName);
  }  

  async _saveCourse() {
    if (!this.settings.selectedCourseId) return;
    
    const container = this.config.courseContainer.getElementsByClassName('course-edit-container')[0];
    let courseInfo = {};
    courseInfo.courseid = JSON.parse(container.getAttribute('course-info')).courseid;
    courseInfo.coursename = this._getValueFromContainer(container, 'course-name');
    courseInfo.assessments = this._getValueFromContainer(container, 'course-assessments');
    courseInfo.ap = this._getValueFromContainer(container, 'course-isap');
    
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
    this._forceSelection(this.config.courseContainer.getElementsByClassName('select-course')[0], courseInfo.coursename);
    this._blipNotice('course info saved');
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
  // edit contacts
  //--------------------------------------------------------------     
  _showEditContacts() {
    const container = this.config.contactEditContainer;
    this._enableEditControls(this.config.container, 'edit-control-contact-conditional', false);
    this._clearFormValuesInContainer(container);

    this._loadContactSelect();
  }
  
  _loadContactSelect() {
    let contactList = this.settings.info.general.contact.sort( 
      function(a, b) {
        return a.contentdescriptor.toLowerCase().localeCompare(b.contentdescriptor.toLowerCase());
      }
    );
    
    UtilityKTS.removeChildren(this.config.contactSelect);
    for (let i = 0; i < contactList.length; i++) {
      let contact = contactList[i];
      let elemItem = CreateElement.createOption(null, 'select-contact-option', i, contact.contentdescriptor);
      this.config.contactSelect.appendChild(elemItem);
      elemItem.setAttribute("contactinfo", JSON.stringify(contact));
    }
    this.config.contactSelect.selectedIndex = -1;
  }
    
  _loadContact(contactInfo) {
    this._enableEditControls(this.config.container, 'edit-control-contact-conditional', true);
    const container = this.config.contactEditContainer;
    this._clearFormValuesInContainer(container);
    
    this._setValueInContainer(container, 'content-descriptor', contactInfo.contentdescriptor);
    this._setValueInContainer(container, 'first-name', contactInfo.firstname);
    this._setValueInContainer(container, 'last-name', contactInfo.lastname);
    this._setValueInContainer(container, 'phone', contactInfo.phone);
    this._setValueInContainer(container, 'email', contactInfo.email);
    this._setValueInContainer(container, 'template-base', contactInfo.templatebase);
    
    container.setAttribute('contactinfo-original', JSON.stringify(contactInfo));
  }
  
  async _reloadContact() {
    const msg = 'Any changes will be lost. Continue?';
    if (!confirm(msg)) return;
    
    const container = this.config.contactEditContainer;
    const infoOriginal = JSON.parse(container.getAttribute('contactinfo-original'));
    this._loadContact(infoOriginal);
  }
    
  async _saveContact() {
    const container = this.config.contactEditContainer;
    const infoOriginal = JSON.parse(container.getAttribute('contactinfo-original'));
    
    const infoNew = {
      "contentdescriptor": this._getValueFromContainer(container, 'content-descriptor'),
      "firstname": this._getValueFromContainer(container, 'first-name'),
      "lastname": this._getValueFromContainer(container, 'last-name'),
      "phone": this._getValueFromContainer(container, 'phone'),
      "email": this._getValueFromContainer(container, 'email'),
      "templatebase": this._getValueFromContainer(container, 'template-base')
    };

    const success = await this._saveContactToDB(infoOriginal, infoNew);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    this._forceSelection(this.config.contactSelect, infoNew.contentdescriptor);
    this._blipNotice('contact info saved');
  }
  
  async _addContact() {
    const msg = "Please enter the content descriptor for the new contact";
    const contentDescriptor = prompt(msg);
    
    if (!contentDescriptor || contentDescriptor.length == 0) return;

    const success = await this._addContactToDB(contentDescriptor);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    this._forceSelection(this.config.contactSelect, contentDescriptor);
  }
  
  async _deleteContact() {
    const container = this.config.contactEditContainer;
    const contactInfo = JSON.parse(container.getAttribute('contactinfo-original'));
    const contentDescriptor = contactInfo.contentdescriptor;
    
    const msg = 'This contact \n' +
                contentDescriptor + '\n ' +
                'will be deleted. Are you sure?';
    if (!confirm(msg)) return;

    const success = await this._deleteContactFromDB(contentDescriptor);
    if (!success) return;
    
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
    if (e.target.classList.contains('disabled')) return;
    
    if (e.target.classList.contains('edit-control-contact')) {
      if (e.target.classList.contains('reload')) {
        this._reloadContact();
      } else if (e.target.classList.contains('save')) {
        this._saveContact();
      } else if (e.target.classList.contains('add')) {
        this._addContact();
      } else if (e.target.classList.contains('delete')) {
        this._deleteContact();
      }
      
    } else if (e.target.classList.contains('edit-control-keypoint')) {
      if (e.target.classList.contains('reload')) {
        this._reloadKeypoints();
      } else if (e.target.classList.contains('save')) {
        this._saveKeypoints();
      } else if (e.target.classList.contains('add')) {
        this._addKeypoint();
      } else if (e.target.classList.contains('delete')) {
        this._deleteKeypoint(this._findNodeInfo(e.target, 'keypoint-item', 'keypoint-info'));
      }
      
    } else if (e.target.classList.contains('edit-control-expectation')) {
      if (e.target.classList.contains('reload')) {
        this._reloadExpectations();
      } else if (e.target.classList.contains('save')) {
        this._saveExpectations();
      } else if (e.target.classList.contains('add')) {
        this._addExpectation();
      } else if (e.target.classList.contains('delete')) {
        this._deleteExpectation(this._findNodeInfo(e.target, 'expectation-item', 'expectation-info'));
      }
      
    } else if (e.target.classList.contains('edit-control-course')) {
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
  
  _handleContactSelect(e) {
    const optionSelected = e.target[e.target.selectedIndex];
    const contactInfo = JSON.parse(optionSelected.getAttribute('contactinfo'));
    this._loadContact(contactInfo);
  }

  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------
  
  //--- expectations
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

  //--- keypoints
  async _addKeypointToDB(keypointText) {
    let params = {
      "category": "other",
      "keypointtext": keypointText
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/insert', 'keypoint', params, this.config.notice);
    
    return dbResult.success;
  }
 
  async _saveKeypointsToDB(keypointList) {
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/update', 'keypoint', keypointList, this.config.notice);
    
    return dbResult.success;
  }
 
  async _deleteKeypointFromDB(keypointId) {
    let params = {
      "keypointid": keypointId
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/delete', 'keypoint', params, this.config.notice);
    
    return dbResult.success;
  }

   //--- contacts
  async _addContactToDB(contentDescriptor) {
    let params = {
      "contentDescriptor": contentDescriptor
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/insert', 'contact', params, this.config.notice);
    
    return dbResult.success;
  }
 
  async _saveContactToDB(origContact, changedContact) {
    let params = {
      "original": origContact,
      "updated": changedContact
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/update', 'contact', params, this.config.notice);
    
    return dbResult.success;
  }
 
  async _deleteContactFromDB(contentDescriptor) {
    let params = {
      "contentDescriptor": contentDescriptor
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/delete', 'contact', params, this.config.notice);
    
    return dbResult.success;
  }
 
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
}
