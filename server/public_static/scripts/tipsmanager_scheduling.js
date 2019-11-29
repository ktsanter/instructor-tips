//-----------------------------------------------------------------------------------
// TipScheduling class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipScheduling {
  constructor() {
    this._version = '0.01';
    this._title = 'Scheduling';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    this._HIGHLIGHT_CLASS = 'tipschedule-highlight';
    
    this._container = null;
    this._tipAddContainer = null;

    this._tipFilter = new TipManagerFilter('scheduling', () => {return this.update();});
    
    this._editInProgress = false;
    
    this._tipAddEditor = new TipSchedulingEdit({
      editType: 'add tip',
      callbacks: {
        cancelChange: () => {return this._cancelEditChange();} ,
        finishAdd:  (dbData) => {return this._doFinishAdd(dbData);}
      }
    });

    this._tipEditEditor = new TipSchedulingEdit({
      editType: 'edit tip',
      callbacks: {
        cancelChange: () => {return this._cancelEditChange();} ,
        finishEdit:  (dbData) => {return this._doFinishEdit(dbData);}
      }
    });
    
    this._tipScheduleShare = new TipSchedulingShare({
      editType: 'edit tip',
      callbacks: {
        cancelChange: () => {return this._cancelEditChange();} ,
        finishEdit:  (dbData) => {return this._doFinishEdit(dbData);}
      }
    });
    
    this._tipStatusClass = {
      null: 'far fa-square',
      scheduled: 'fas fa-exclamation-circle',
      completed: 'fas fa-check-circle'
    };
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipschedule ' + this._HIDE_CLASS);
    
    this._tipAddContainer = this._tipAddEditor.render();
    this._tipEditContainer = this._tipEditEditor.render();
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._tipScheduleShareContainer = this._tipScheduleShare.render(this._notice);
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    this._container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createIcon(null, 'tipmanager-icon fas fa-caret-down', 'show/hide filter', (e) => {return this._toggleFilterCollapse(e);}));
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    titleContainer.appendChild(CreateElement.createIcon(null, 'tipmanager-icon tipmanager-shareicon far fa-share-square', 'share this schedule', (e) => {return this._handleShare(e);}));

    this._container.appendChild(await this._tipFilter.render(this._notice));    

    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    this._showElement(this._container, makeVisible);
  }
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update(reRenderFilter) {
    if (reRenderFilter) {
      await this._tipFilter.render(this._notice);
    }
    this._tipScheduleShare.show(false);
    
    var filter = this._tipFilter.getFilter();
    
    var elemShareIcon = this._container.getElementsByClassName('tipmanager-shareicon')[0];
    this._showElement(elemShareIcon, !(filter.adm_allcourse || filter.adm_course || filter.allcourse));
    
    var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipschedule', filter);

    this._prepContainerForUpdate();
 
    if (tipsQuery.success) {
      if (tipsQuery.usercourseexists) {
        var organizedTips = this._organizeByWeek(tipsQuery.tipschedule, tipsQuery.termlength);
        var organizedCalendar = this._organizeCalendar(tipsQuery.calendar, tipsQuery.termlength, filter.calendar, filter.termgroupname, tipsQuery.isapcourse);

        this._container.appendChild(this._showTips(organizedTips, organizedCalendar, tipsQuery.termlength, tipsQuery.isapcourse));
      
      } else {
        var contentContainer = CreateElement.createDiv(null, 'tipschedule-content');
        this._container.appendChild(contentContainer);
        contentContainer.appendChild(CreateElement.createDiv(null, null, 'There is no schedule for this user/course/termgroup combination'));
      }
    }
  }
 
  _organizeByWeek(tipsData, termLength) {
    var weeklyData = {};
    for (var i = 0; i <= termLength; i++) {
      weeklyData['week' + i] = [];
    }
    
    for (var i = 0; i < tipsData.length; i++) {
      var tip = tipsData[i];
      weeklyData['week' + tip.week].push(tip);
    }

    return weeklyData;
  }
  
  _organizeCalendar(calendar, termLength, calendarSettings, termgroupName, isAPCourse) {
    var organizedCalendar = [];
    var termName = calendarSettings[termgroupName];
        
    for (var i = 0; i <= termLength; i++) {
      organizedCalendar.push({ap: null, start1: null, start2: null});
    }
    
    for (var i = 0; i < calendar.length; i++) {
      var cRow = calendar[i];
      if (cRow.termname == termName) {
        organizedCalendar[cRow.week][cRow.starttype] = cRow.firstday;
      }
    }
    
    return organizedCalendar;
  }
  
  _prepContainerForUpdate() {
    var contents = this._container.getElementsByClassName('tipschedule-content')[0];
    if (contents) {
      this._container.removeChild(contents);
    }
  }
  
  _showTips(tipsData, calendarData, termLength, isAPCourse) {
    var contentContainer = CreateElement.createDiv(null, 'tipschedule-content');

    contentContainer.appendChild(CreateElement.createIcon('collapseAll', 'tipschedule-icon collapse-icon far fa-minus-square', 'collapse all weeks', () => {return this._collapseAllWeeks();}));
    contentContainer.appendChild(CreateElement.createIcon('expandAll', 'tipschedule-icon collapse-icon far fa-plus-square', 'expand all weeks', () => {return this._expandAllWeeks();}));
    
    for (var i = 0; i <= termLength; i++) {
      contentContainer.appendChild(this._renderTipsForWeek(i, tipsData['week' + i], calendarData[i], isAPCourse));
    }

    return contentContainer;
  }
  
  _renderTipsForWeek(weekNumber, tipsForWeek, calendarForWeek, isAPCourse) {
    var container = CreateElement.createDiv(null, 'weeklytip');
    container.tipscheduleweek = weekNumber;
    
    var filter = this._tipFilter.getFilter();
    var weekLabel = 'week ' + weekNumber;
    if (filter.course && !filter.adm_allcourse && !filter.adm_course) {
      if (weekNumber == 0) {
        weekLabel += ' &nbsp;&nbsp;&nbsp;(before the term starts)';
      } else {
        if (isAPCourse) {
          weekLabel += ' &nbsp;&nbsp;&nbsp;(' + this._formatDate(calendarForWeek.ap) + ')';
        } else {
          weekLabel += ' &nbsp;&nbsp;&nbsp;(' + this._formatDate(calendarForWeek.start1);
          if (calendarForWeek.start2) {
            weekLabel += ' or ' + this._formatDate(calendarForWeek.start2) + ')';
          } else {
            weekLabel += ')';
          }
        }
      }
    }
    
    var label = CreateElement.createDiv(null, 'weeklytip-label');
    container.appendChild(label);
    label.appendChild(CreateElement.createIcon(null, 'fas fa-caret-down weeklytip-collapse-icon', 'expand/collapse week', (e) => {return this._toggleWeeklyBoxCollapse(e);}));
    label.appendChild(CreateElement.createSpan(null, 'weeklytip-label-text', weekLabel));
    label.appendChild(CreateElement.createIcon(null, 'tipschedule-icon tipschedule-icon-add far fa-calendar-plus', 'add tip to week', (e) => {return this._startAddTipUI(e);}));
    
    var contents = CreateElement.createDiv(null, 'weeklytip-contents');
    container.appendChild(contents); 
    
    var tipIconHandler = (e) => {return this._tipStatusChange(e);}
    var filter = this._tipFilter.getFilter();
    
    for (var i = 0; i < tipsForWeek.length; i++) {
      var tip = tipsForWeek[i];
      
      var allowEdit = this._canEditTip(filter, tip);
      var allowUnmap = this._canUnmapTip(filter, tip);
      var renderedMarkdown = MarkdownToHTML.convert(tip.tiptext);
      
      var singleTipContainer = CreateElement.createDiv(null, 'weeklytip-singletipcontainer');
      contents.appendChild(singleTipContainer);
      var iconClassList = 'weeklytip-icon ' + this._tipStatusClass[tip.tipstatusname];
      singleTipContainer.appendChild(CreateElement.createIcon(null, iconClassList, 'change tip status', tipIconHandler));
      singleTipContainer.appendChild(CreateElement.createDiv(null, 'weeklytip-singletip', renderedMarkdown));
      
      if (allowEdit || allowUnmap) {
        var controlContainer = CreateElement.createDiv(null, 'tipschedule-controls');
        singleTipContainer.appendChild(controlContainer);
        if (allowEdit) {
          controlContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-icon tipschedule-icon-edit fas fa-pencil-alt', 'edit tip', (e) => {return this._startEditTipUI(e);}));
        }
        if (allowUnmap) {
          controlContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-icon tipschedule-icon-edit far fa-calendar-minus', 'remove tip from week', (e) => {return this._startUnmapTipUI(e);}));
        }
      }

      singleTipContainer.tipInformation = tip;
    }
    
    return container;
  }
  
  _canEditTip(filter, tip) {
    var editable = false;
    
    editable = (tip.userid != null);
    if (filter.adm_allcourse) {
      editable = true;
    } else if (filter.adm_course) {
      editable = true;
    } else if (filter.allcourse) {
      editable = true;
    }
    
    return editable;
  }
  
  _canUnmapTip(filter, tip) {
    var unmappable = false;
    
    unmappable = (tip.userid != null && tip.courseid != null);
    if (filter.adm_allcourse) {
      unmappable = true;
    } else if (filter.adm_course) {
      unmappable = true;
    } else if (filter.allcourse) {
      unmappable = true;
    }
    
    return unmappable;
  }

  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _toggleFilterCollapse(e) {
    var elemIcon = e.target;
    var elemFilter = this._container.getElementsByClassName('tipfilter')[0];
    
    elemIcon.classList.toggle('fa-caret-right');
    elemIcon.classList.toggle('fa-caret-down');
    elemFilter.classList.toggle(this._HIDE_CLASS);
  }
  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }
  
  _toggleWeeklyBoxCollapse(e) {
    if (this._editInProgress) return;
    
    var elemContents = e.target.parentNode.parentNode.getElementsByClassName('weeklytip-contents')[0];
    var elemIcon = e.target;

    elemContents.classList.toggle('hide-weeklytip-contents');
    elemIcon.classList.toggle('fa-caret-right');
    elemIcon.classList.toggle('fa-caret-down');
  }
  
  _collapseAllWeeks() {
    if (this._editInProgress) return;
    
    var elemWeeklyTips = this._container.getElementsByClassName('weeklytip');
    for (var i = 0; i < elemWeeklyTips.length; i++) {
      var tipContainer = elemWeeklyTips[i];
      var elemIcon = tipContainer.getElementsByClassName('weeklytip-collapse-icon')[0];
      var elemContents = tipContainer.getElementsByClassName('weeklytip-contents')[0];
      if (!elemContents.classList.contains('hide-weeklytip-contents')) {
        elemIcon.click();
      }
    }
  }
  
  _expandAllWeeks() {
    if (this._editInProgress) return;
    
    var elemWeeklyTips = this._container.getElementsByClassName('weeklytip');
    for (var i = 0; i < elemWeeklyTips.length; i++) {
      var tipContainer = elemWeeklyTips[i];
      var elemIcon = tipContainer.getElementsByClassName('weeklytip-collapse-icon')[0];
      var elemContents = tipContainer.getElementsByClassName('weeklytip-contents')[0];
      if (elemContents.classList.contains('hide-weeklytip-contents')) {
        elemIcon.click();
      }
    }
  }
  
  async _tipStatusChange(e) {
    if (this._editInProgress) return;
    
    var elemIcon = e.target;
    var tipInformation = elemIcon.parentNode.tipInformation;
    var tipStatusName = tipInformation.tipstatusname;

    if (tipStatusName == null) {
      tipStatusName = 'scheduled';
    } else if (tipStatusName == 'scheduled') {
      tipStatusName = 'completed';
    } else {
      tipStatusName = null;
    }
    
    tipInformation.tipstatusname = tipStatusName;
    tipInformation.for_coursename = this._tipFilter.getFilter().coursename;
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'singletipstatus', tipInformation);
    if (queryResults.success) {
      this.update();
    }
  }
  
  async _handleShare(e) {
    if (this._editInProgress) return;
    if (this._tipScheduleShare.isVisible()) {
      this._tipScheduleShare.show(false);
      return;
    }
    
    var elemTitle = this._container.getElementsByClassName('tipmanager-title')[0];
    if (this._tipScheduleShareContainer.parentNode) {
      this._tipScheduleShareContainer.parentNode.removeChild(this._tipScheduleShareContainer);
    }
    elemTitle.appendChild(this._tipScheduleShareContainer);

    var filter = this._tipFilter.getFilter();
    await this._tipScheduleShare.update({coursename: filter.coursename, termgroupname: filter.termgroupname});
  }
  
  //------------------------------------------------------------------------------------------------
  // add/edit/delete tip
  //------------------------------------------------------------------------------------------------
  async _startAddTipUI(e) {
    if (this._editInProgress) return;
    this._editInProgress = true;
    
    this._tipScheduleShare.show(false);
    
    var weekContainer = e.target.parentNode.parentNode;
    var weekContents = weekContainer.getElementsByClassName('weeklytip-contents')[0];
    
    if (this._tipAddContainer.parentNode) {
      this._tipAddContainer.parentNode.removeChild(this._tipAddContainer);
    }
    weekContents.insertBefore(this._tipAddContainer, weekContents.firstChild);
    
    var filter = this._tipFilter.getFilter();
    filter.week = this._tipAddContainer.parentNode.parentNode.tipscheduleweek;
    
    var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipschedule-tiplist', this._tipFilter.getFilter());
    
    if (tipsQuery.success) {
      this._tipAddEditor.update(tipsQuery.data);
      this._tipAddEditor.show(true);
    }
  }
  
  async _startEditTipUI(e) {
    if (this._editInProgress) return;
    this._editInProgress = true;
    
    this._tipScheduleShare.show(false);

    var tipContainer = e.target.parentNode.parentNode;
    var tipInfo = tipContainer.tipInformation;
    
    this._highlight(tipContainer, true);
    
    if (this._tipEditContainer.parentNode) {
      this._tipEditContainer.parentNode.removeChild(this._tipEditContainer);
    }
    
    this._insertAfter(this._tipEditContainer, tipContainer);
    
    this._tipEditEditor.update(tipInfo);
    this._tipEditEditor.show(true);    
  }

  async _startUnmapTipUI(e) {
    if (this._editInProgress) return;
    this._editInProgress = true;
    
    this._tipScheduleShare.show(false);
    
    var tipContainer = e.target.parentNode.parentNode;
    this._highlight(tipContainer, true);

    setTimeout( () => { return this._confirmUnmap(this, tipContainer); }, 1);
  }
  
  async _confirmUnmap(me, tipContainer) {
    if (confirm('Are you sure you want to remove this item from your schedule?')) {
      var tipInfo = tipContainer.tipInformation;
      var queryResults = await this._doPostQuery('tipmanager/delete', 'tipschedule-unmaptip', tipInfo);

      if (queryResults.success) {
        this.update();
      }
      
    } else {
      this._highlight(tipContainer, false);
    }
    
    this._editInProgress = false;
  }
  
  async _doFinishAdd(dbData) {
    var postData = {
      filter: this._tipFilter.getFilter(),
      addData: dbData,
      week: this._tipAddContainer.parentNode.parentNode.tipscheduleweek
    };
    
    var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipschedule-addtip', postData);
    if (tipsQuery.success) {
      this._tipAddContainer.parentNode.removeChild(this._tipAddContainer);
      this.update();
    }
    
    this._editInProgress = false;
  }

  async _doFinishEdit(dbData) {
    this._tipEditContainer.parentNode.removeChild(this._tipEditContainer);
    var tipsQuery = await this._doPostQuery('tipmanager/update', 'tipschedule-updatetiptext', dbData);
    if (tipsQuery.success) {
      this.update();
    }
    
    this._editInProgress = false;
  }

  async _cancelEditChange() {
    if (this._tipAddContainer.parentNode) this._tipAddContainer.parentNode.removeChild(this._tipAddContainer);
    if (this._tipEditContainer.parentNode) this._tipEditContainer.parentNode.removeChild(this._tipEditContainer);
    this._removeAllHighlight();
    
    this._editInProgress = false;
  }

  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------     
  _insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
  }

  _highlight(elem, makeHighlight) {
    if (!makeHighlight) {
        if (elem.classList.contains(this._HIGHLIGHT_CLASS)) {
          elem.classList.remove(this._HIGHLIGHT_CLASS);
        }
        
    } else {
      elem.classList.add(this._HIGHLIGHT_CLASS);
    }
  }  
  
  _removeAllHighlight() {
    var elemList = this._container.getElementsByClassName(this._HIGHLIGHT_CLASS);
    for (var i = 0; i < elemList.length; i++) {
      this._highlight(elemList[i], false);
    }
  }  

  _formatDate(theDate) {
    var formattedDate = theDate;
    
    if (this._isValidDate(theDate)) {
      formattedDate = '';
      if (theDate != null & theDate != '') {
        var objDate = new Date(theDate);
        var day = objDate.getDate();
        var month = objDate.getMonth() + 1;
        formattedDate = month + '/' + day;
      }
    }
    
    return formattedDate;
  }  

  _isValidDate(str) {
    var d = new Date(str);
    return !isNaN(d);
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
