//-------------------------------------------------------------------
// AssignmentViewer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class AssignmentViewer {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      currentInfo: null
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(updatedInfo) {
    this.settings.currentInfo = this._orderAssignmentInfo(updatedInfo);
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    this.config.assignmentAccordion = this.config.container.getElementsByClassName('assignments-accordion')[0];
  }

  _updateUI() {
    UtilityKTS.removeChildren(this.config.assignmentAccordion);
    
    if (!this.settings.currentInfo || this.settings.currentInfo.length == 0) {
      this.config.assignmentAccordion.appendChild(CreateElement.createDiv(null, null, 'no assignment info available'));
      return;
    }
    
    let accordionItem = this.config.container.getElementsByClassName('item-template')[0];
    
    for (var i = 0; i < this.settings.currentInfo.length; i++) {
      let courseAssignment = this.settings.currentInfo[i];
      let course = courseAssignment[0];
      let instructors = courseAssignment[1];
      
      let item = accordionItem.cloneNode(true);
      let paddedIndex = i.toString().padStart(4, '0');
      let header = item.getElementsByClassName('accordion-header')[0];
      header.id = 'heading' + paddedIndex
      
      let headerButton = item.getElementsByClassName('accordion-button')[0];
      headerButton.setAttribute('data-bs-target', '#collapse' + paddedIndex);
      headerButton.setAttribute('aria-controls', 'collapse' + paddedIndex);
      headerButton.innerHTML = course;
      
      let bodyDiv = item.getElementsByClassName('accordion-collapse')[0];
      bodyDiv.id = 'collapse' + paddedIndex;
      bodyDiv.setAttribute('aria-labelledby', 'heading' + paddedIndex);
      
      let bodyContents = item.getElementsByClassName('accordion-body')[0];
      this._renderInstructors(instructors, bodyContents);
            
      UtilityKTS.setClass(item, this.settings.hideClass, false);
      this.config.assignmentAccordion.appendChild(item);
      
    }
  }
  
  _orderAssignmentInfo(info) {
    if (!info) return info;
    
    var courses = Object.keys(info).sort();
    var orderedInfo = [];
    for (var i = 0; i < courses.length; i++) {
      let course = courses[i];
      let instructors = this._formatInstructorsNames(info[courses[i]]);
      instructors = instructors.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      });

      orderedInfo.push([course, instructors]);
    }
    
    return orderedInfo;
  }
  
  _formatInstructorsNames(instructorList) {
    for (let i = 0; i < instructorList.length; i++) {
      let name = instructorList[i].name;
      let indexOfBlank = name.indexOf(' ');

      if (indexOfBlank >= 0) {
        instructorList[i].name = name.slice(indexOfBlank + 1) + ', ' + name.slice(0, indexOfBlank);
      }
    }
    
    return instructorList;
  }
  
  _renderInstructors(instructors, container) {
    let tbody = container.getElementsByTagName('tbody')[0];
    let checkedHTML = CreateElement.createIcon(null, 'icon far fa-check-square').outerHTML;
    let uncheckedHTML = CreateElement.createIcon(null, 'far fa-square').outerHTML;
    
    for (let i = 0; i < instructors.length; i++) {
      let info = instructors[i];
      let tr = CreateElement._createElement('tr', null);
      tbody.appendChild(tr);
      
      CreateElement.createTableCell(null, null, info.name, false, tr);
      CreateElement.createTableCell(null, 'center', this._getCheckedHTML('S1', info.terms, checkedHTML, uncheckedHTML), false, tr);
      CreateElement.createTableCell(null, 'center', this._getCheckedHTML('S2', info.terms, checkedHTML, uncheckedHTML), false, tr);
      CreateElement.createTableCell(null, 'center', this._getCheckedHTML('T1', info.terms, checkedHTML, uncheckedHTML), false, tr);
      CreateElement.createTableCell(null, 'center', this._getCheckedHTML('T2', info.terms, checkedHTML, uncheckedHTML), false, tr);
      CreateElement.createTableCell(null, 'center', this._getCheckedHTML('T3', info.terms, checkedHTML, uncheckedHTML), false, tr); 
    }
  }
  
  _getCheckedHTML(searchTerm, termList, checkedHTML, uncheckedHTML) {
    if (termList.includes(searchTerm)) {
      return checkedHTML;
    } else {
      return uncheckedHTML;
    }
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
