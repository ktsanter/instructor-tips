//-------------------------------------------------------------------
// MentorViewer
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class MentorViewer {
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
  update(currentInfo) {
    this.settings.currentInfo = currentInfo;
    
    this._updateUI();
  }
  
  exportToExcel(mentorData) {
    if (Object.keys(mentorData).length == 0) {
      alert('There is no mentor data available');
      return;
    }
    
    var exportForm = this.config.container.getElementsByClassName('export-form')[0];
    exportForm.getElementsByClassName('export-data')[0].value = JSON.stringify(mentorData);
    exportForm.submit();
  }  
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    this.statusMessage = this.config.container.getElementsByClassName('status-message')[0];
    
    this.settings.byTermAndSection = this.config.container.getElementsByClassName('mentors-by-term-and-section')[0];
  }

  _updateUI() {
    UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, true);
    
    var container = this.settings.byTermAndSection;
    UtilityKTS.removeChildren(container);
    
    if (!this.settings.currentInfo || this.settings.currentInfo.mentorList.length == 0) {
      this.statusMessage.innerHTML = 'no mentor data available';
      UtilityKTS.setClass(this.statusMessage, this.settings.hideClass, false);
      
    } else {
      var firstTerm = true;
      for (var term in this.settings.currentInfo.mentorsByTermAndSection) {
        this._renderTerm(term, this.settings.currentInfo.mentorsByTermAndSection[term], container, firstTerm);
        firstTerm = false;
      }
    }
  }
  
  _renderTerm(term, termItem, container, firstTerm) {
    var termClasses = 'term-label px-2 mb-2';
    if (!firstTerm) termClasses += ' mt-2';
    container.appendChild(CreateElement.createDiv(null, termClasses, term));
    
    for (var section in termItem) {
      this._renderSection(section, termItem[section], container);
    }
  }
  
  _renderSection(section, sectionItem, container) {
    var labelDiv = CreateElement.createDiv(null, 'section-label ms-2', section);
    container.appendChild(labelDiv);
    
    var headerNames = ['name', 'email', 'phone', 'affiliation', 'affiliationphone'];
    
    var tableClasses = 'table table-striped table-hover table-sm';
    var table = CreateElement._createElement('table', null, tableClasses);
    container.appendChild(table);

    var thead = CreateElement._createElement('thead', null, 'table-primary');
    table.appendChild(thead);
    var theadRow = CreateElement._createElement('tr');
    thead.appendChild(theadRow);
    
    var tbody = CreateElement._createElement('tbody');
    table.appendChild(tbody);

    for (var i = 0; i < headerNames.length; i++) {
      var th = CreateElement._createElement('th', null, 'colwidth-' + i);
      theadRow.appendChild(th);
      th.innerHTML = headerNames[i];
      
      if (headerNames[i] == 'email') {
        th.title = 'Copy all emails for this section to clipboard';
        th.classList.add('email-column');
        th.setAttribute('item', JSON.stringify(sectionItem));
        th.addEventListener('click', (e) => { this._handleSectionClick(e); });
      }
    }

    var sortedMentors = this._sortMentorsForSection(sectionItem);

    for (var m = 0; m < sortedMentors.length; m++) {
      var mentorItem = sortedMentors[m];
      
      var tbodyRow = CreateElement._createElement('tr');
      tbody.appendChild(tbodyRow);
      
      for (var i = 0; i < headerNames.length; i++) {
        var td = CreateElement._createElement('td');
        tbodyRow.appendChild(td);
        td.innerHTML = mentorItem[headerNames[i]];
        
        if (headerNames[i] == 'email') {
          td.title = 'copy to clipboard';
          td.classList.add('email-column');
          td.addEventListener('click', (e) => { this._handleEmailClick(e); });
        }
      }
    }
  }
  
  _sortMentorsForSection(sectionItem) {
    var mentorList = [];
    for (var mentor in sectionItem) {
      mentorList.push(sectionItem[mentor]);
    }
    
    mentorList = mentorList.sort(function(a,b) {
      return a.name.localeCompare(b.name);
    });
    
    return mentorList;
  }
  
  _copySectionEmailsToClipboard(sectionItem) {
    var emails = '';
    var first = true;
    for (var name in sectionItem) {
      if (!first) emails += ';'
      emails += sectionItem[name].email;
      first = false;
    }
    
    this._copyToClipboard(emails);
  }
  
  _copyEmailToClipboard(email) {
    this._copyToClipboard(email);
  }

  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleSectionClick(e) {
    this._copySectionEmailsToClipboard(JSON.parse(e.target.getAttribute('item')));
  }
  
  _handleEmailClick(e) {
    this._copyEmailToClipboard(e.target.innerHTML);
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  _copyToClipboard(txt) {
    if (!this.settings.clipboard) this.settings.clipboard = new ClipboardCopy(this.config.container, 'plain');

    this.settings.clipboard.copyToClipboard(txt);
	}	  
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _failResult(msg, methodName) {
    if (methodName) msg += ' in ' + methodName;
    
    return {
      success: false,
      details: msg,
      data: null
    };
  }
}
