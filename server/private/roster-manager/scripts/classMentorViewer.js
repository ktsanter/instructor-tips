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
      var termList = [];
      for (var term in this.settings.currentInfo.mentorsByTermAndSection) {
        termList.push(term);
      }
      termList = termList.sort();
      
      var firstTerm = true;
      for (var i = 0; i < termList.length; i++) {
        var term = termList[i];
        this._renderTerm(term, this.settings.currentInfo.mentorsByTermAndSection[term], container, firstTerm);
        firstTerm = false;
      }
    }
  }
  
  _renderTerm(term, termItem, container, firstTerm) {
    var sectionList = [];
    for (var section in termItem) {
      sectionList.push(section);
    }
    sectionList = sectionList.sort();
    
    var termClasses = 'term-label px-2 mb-2';
    if (!firstTerm) termClasses += ' mt-2';
    container.appendChild(CreateElement.createDiv(null, termClasses, term));
    
    for (var i = 0; i < sectionList.length; i++) {
      var section = sectionList[i];
      this._renderSection(term, section, termItem[section], container);
    }
  }
  
  _renderSection(term, section, sectionItem, container) {
    var labelDiv = CreateElement.createDiv(null, 'section-label ms-2', section);
    container.appendChild(labelDiv);
    
    var headerFields = ['name', 'email', 'phone', 'affiliation', 'affiliationphone', 'welcomelettersent'];
    var headerNames = ['name', 'email', 'phone', 'affiliation', 'aff phone', 'welcome'];
    
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
        
      } else if (headerNames[i] == 'welcome') {
        th.innerHTML = '';
        var span = CreateElement.createSpan(null, null, headerNames[i]);
        th.appendChild(span);
        var filterIcon = CreateElement.createIcon(null, 'fas fa-filter mentor-welcomefilter filter-off', 'filter checked', (e) => { this._handleWelcomeFilterClick(e); });
        th.appendChild(filterIcon);        
      }
    }

    var sortedMentors = this._sortMentorsForSection(sectionItem);

    for (var m = 0; m < sortedMentors.length; m++) {
      var mentorItem = sortedMentors[m];
      var mentorName = mentorItem['name'];
      
      var tbodyRow = CreateElement._createElement('tr');
      tbody.appendChild(tbodyRow);
      
      for (var i = 0; i < headerFields.length; i++) {
        var td = CreateElement._createElement('td');
        tbodyRow.appendChild(td);
        td.innerHTML = mentorItem[headerFields[i]];
        
        if (headerFields[i] == 'email') {
          td.title = 'copy to clipboard';
          td.classList.add('email-column');
          td.addEventListener('click', (e) => { this._handleEmailClick(e); });
          
        } else if (headerFields[i] == 'welcomelettersent') {
          td.classList.add('welcome-column');
          td.classList.add('form-check');
          td.innerHTML = '';

          var checkVal = JSON.stringify({"term": term, "section": section, "name": mentorName});
          var checked = mentorItem[headerFields[i]];
          var handler = (e) => { this._handleMentorWelcomeClick(e); };
          var check = CreateElement.createCheckbox(null, 'mentor-welcome-control', 'mentor-welcome', checkVal, '', checked, handler);
          check.getElementsByTagName('input')[0].classList.add('form-check-input');
          check.getElementsByTagName('input')[0].classList.add('ms-4');
          td.appendChild(check);
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
  
  _copySectionEmailsToClipboard(target, sectionItem) { 
    var filterOn = this._welcomeFilterIsOn(target);
    
    var emails = '';
    var first = true;
    for (var name in sectionItem) {
      if (!filterOn || !  sectionItem[name].welcomelettersent) {
        if (!first) emails += ';'
        emails += sectionItem[name].email;
        first = false;
      }
    }
    
    this._copyToClipboard(emails);
  }
  
  _copyEmailToClipboard(email) {
    this._copyToClipboard(email);
  }

  _toggleWelcomeFilter(target) {
    var filterOn = !target.classList.contains('filter-off');
    var turnFilterOn = !filterOn;
    
    var table = this._upsearchForTable(target);
    var rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var elemWelcomeControl = row.getElementsByClassName('mentor-welcome-control')[0];
      var hideRow = turnFilterOn && elemWelcomeControl.checked;
      UtilityKTS.setClass(row, this.settings.hideClass, hideRow);
    }
    
    UtilityKTS.setClass(target, 'filter-off', !turnFilterOn);
  }
  
  _welcomeFilterIsOn(target) {
    var table = this._upsearchForTable(target);;
    var thead = table.getElementsByTagName('thead')[0];
    var elemFilter = thead.getElementsByClassName('mentor-welcomefilter')[0];

    return !elemFilter.classList.contains('filter-off');
  }
  
  async _saveMentorWelcomeSetting(target) {
    var value = JSON.parse(target.value);

    var params = {
      "property": 'welcomelettersent',
      "term": value.term,
      "section": value.section,
      "name": value.name,
      "welcomelettersent": target.checked
    };
    
    var result = await this.config.callbackPropertyChange(params);
    if (result.success) {
      this.settings.currentInfo.mentorsByTermAndSection[value.term][value.section][value.name].welcomelettersent = target.checked;
      if (target.checked && this._welcomeFilterIsOn(target)) {
        var row = this._upsearchForRow(target);
        UtilityKTS.setClass(row, this.settings.hideClass, true);
      }
    }
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleSectionClick(e) {
    this._copySectionEmailsToClipboard(e.target, JSON.parse(e.target.getAttribute('item')));
  }
  
  _handleEmailClick(e) {
    this._copyEmailToClipboard(e.target.innerHTML);
  }
  
  _handleWelcomeFilterClick(e) {
    this._toggleWelcomeFilter(e.target);
  }
  
  async _handleMentorWelcomeClick(e) {
    await this._saveMentorWelcomeSetting(e.target);
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
  _upsearchForTable(target) {
    var table = null;
    var node = target;
    for (var node = target; !table; node = node.parentNode) {
      if (node.nodeName == 'TABLE') table = node;
    }
    
    return table;
  }

  _upsearchForRow(target) {
    var row = null;
    var node = target;
    for (var node = target; !row; node = node.parentNode) {
      if (node.nodeName == 'TR') row = node;
    }
    
    return row;
  }
}
