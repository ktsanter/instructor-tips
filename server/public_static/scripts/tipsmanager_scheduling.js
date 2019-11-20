//-----------------------------------------------------------------------------------
// TipScheduling class
//-----------------------------------------------------------------------------------
// TODO: add calendar info to week labels
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
    
    this._tipStatusClass = {
      null: 'far fa-square',
      scheduled: 'fas fa-exclamation-circle',
      completed: 'fas fa-check-circle'
    };
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'tipschedule ' + this._HIDE_CLASS);
    this._tipAddContainer = this._tipAddEditor.render();
    this._tipEditContainer = this._tipEditEditor.render();
    
    return this._container;
  }

  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }
  
  async update() {
    this._prepContainerForUpdate();
    this._container.appendChild(await this._tipFilter.render(this._notice));    

    var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipschedule', this._tipFilter.getFilter());
    console.log(tipsQuery);
    
    if (tipsQuery.success) {
      if (tipsQuery.usercourseexists) {
        var organizedTips = this._organizeByWeek(tipsQuery.data, tipsQuery.termlength);
        this._container.appendChild(this._showTips(organizedTips, tipsQuery.termlength));
      
      } else {
        this._container.appendChild(CreateElement.createDiv(null, null, 'There is no schedule for this user/course/termgroup combination'));
      }
    }    
  }
  
  async userchange() {
    await this._tipFilter.userchange();
    await this.update();
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
  
  _prepContainerForUpdate() {
    this._removeChildren(this._container);

    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    var titleContainer = CreateElement.createDiv(null, 'tipmanager-title');
    this._container.appendChild(titleContainer);
    titleContainer.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    titleContainer.appendChild(CreateElement.createIcon(null, 'tipmanager-icon fas fa-caret-down', 'show/hide filter', (e) => {return this._toggleFilterCollapse(e);}));
  }
  
  _showTips(tipsData, termLength) {
    var contentContainer = CreateElement.createDiv(null, 'tipschedule-content');

    contentContainer.appendChild(CreateElement.createIcon('collapseAll', 'tipschedule-icon far fa-minus-square', 'collapse all weeks', () => {return this._collapseAllWeeks();}));
    contentContainer.appendChild(CreateElement.createIcon('expandAll', 'tipschedule-icon far fa-plus-square', 'expand all weeks', () => {return this._expandAllWeeks();}));
    
    for (var i = 0; i <= termLength; i++) {
      contentContainer.appendChild(this._renderTipsForWeek(i, tipsData['week' + i]));
    }

    return contentContainer;
  }
  
  _renderTipsForWeek(weekNumber, tipsForWeek) {
    var container = CreateElement.createDiv(null, 'weeklytip');
    container.tipscheduleweek = weekNumber;
    
    var label = CreateElement.createDiv(null, 'weeklytip-label');
    container.appendChild(label);
    label.appendChild(CreateElement.createIcon(null, 'fas fa-caret-down weeklytip-collapse-icon', null, this._toggleWeeklyBoxCollapse));
    label.appendChild(CreateElement.createSpan(null, 'weeklytip-label-text', 'week ' + weekNumber));
    label.appendChild(CreateElement.createIcon(null, 'tipschedule-icon tipschedule-icon-add far fa-calendar-plus', 'add tip to week', (e) => {return this._startAddTipUI(e);}));
    
    var contents = CreateElement.createDiv(null, 'weeklytip-contents');
    container.appendChild(contents); 
    
    var tipIconHandler = (e) => {return this._tipStatusChange(e);}
    
    for (var i = 0; i < tipsForWeek.length; i++) {
      var tip = tipsForWeek[i];
      var allowEdit = (tip.tip_userid != null);
      var allowUnmap = (tip.tip_userid != null && tip.courseid != null);
      var renderedMarkdown = MarkdownToHTML.convert(tip.tiptext);
      
      var singleTipContainer = CreateElement.createDiv(null, null);
      contents.appendChild(singleTipContainer);
      var iconClassList = 'weeklytip-icon ' + this._tipStatusClass[tip.tipstatusname];
      singleTipContainer.appendChild(CreateElement.createIcon(null, iconClassList, null, tipIconHandler));
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
    var elemContents = e.target.parentNode.parentNode.getElementsByClassName('weeklytip-contents')[0];
    var elemIcon = e.target;

    elemContents.classList.toggle('hide-weeklytip-contents');
    elemIcon.classList.toggle('fa-caret-right');
    elemIcon.classList.toggle('fa-caret-down');
  }
  
  _collapseAllWeeks() {
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
    
    var classListArray = this._tipStatusClass[tipStatusName].split(' ');
    for (var i = 0; i < classListArray.length; i++) {
      elemIcon.classList.remove(classListArray[i]);
    }
    
    if (tipStatusName == null) {
      tipStatusName = 'scheduled';
    } else if (tipStatusName == 'scheduled') {
      tipStatusName = 'completed';
    } else {
      tipStatusName = null;
    }
    
    tipInformation.tipstatusname = tipStatusName;
    var queryResults = await this._doPostQuery('tipmanager/update', 'singletipstatus', tipInformation);
    if (queryResults.success) {
      this.update();
    }
  }
  
  //------------------------------------------------------------------------------------------------
  // add/edit/delete tip
  //------------------------------------------------------------------------------------------------
  async _startAddTipUI(e) {
    if (this._editInProgress) return;
    this._editInProgress = true;
    
    var weekContainer = e.target.parentNode.parentNode;
    var weekContents = weekContainer.getElementsByClassName('weeklytip-contents')[0];
    
    if (this._tipAddContainer.parentNode) {
      this._tipAddContainer.parentNode.removeChild(this._tipAddContainer);
    }
    weekContents.insertBefore(this._tipAddContainer, weekContents.firstChild);
    
    var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipschedule-tiplist', this._tipFilter.getFilter());
    if (tipsQuery.success) {
      this._tipAddEditor.update(tipsQuery.data);
      this._tipAddEditor.show(true);
    }
  }
  
  async _startEditTipUI(e) {
    if (this._editInProgress) return;
    this._editInProgress = true;
    
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
    
    var tipContainer = e.target.parentNode.parentNode;
    this._highlight(tipContainer, true);

    setTimeout( () => { return this._confirmUnmap(this, tipContainer); }, 1);
  }
  
  async _confirmUnmap(me, tipContainer) {
    if (confirm('Are you sure you want to remove this item from your schedule?')) {
      var tipInfo = tipContainer.tipInformation;
      var queryResults = await this._doPostQuery('tipmanager/delete', 'tipschedule-unmaptip', tipInfo);
      console.log(queryResults);
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
