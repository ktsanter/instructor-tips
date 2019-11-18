//-----------------------------------------------------------------------------------
// TipScheduling class
//-----------------------------------------------------------------------------------
// TODO: add calendar info to week labels
// TODO: build UI to add tip to current schedule 
// TODO: disable other editing choices when one is in-progress
//-----------------------------------------------------------------------------------

class TipScheduling {
  constructor() {
    this._version = '0.01';
    this._title = 'Scheduling';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;
    this._tipAddContainer = null;

    this._tipFilter = new TipManagerFilter('scheduling', () => {return this.update();});
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
    
    this._tipUnmapEditor = new TipSchedulingEdit({
      editType: 'unmap tip',
      callbacks: {
        cancelChange: () => {return this._cancelEditChange();} ,
        finishDelete:  (dbData) => {return this._doFinishDelete(dbData);} ,
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
    this._tipUnmapContainer = this._tipUnmapEditor.render();
    
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
          controlContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-icon fas fa-edit', 'edit tip', (e) => {return this._startEditTipUI(e);}));
        }
        if (allowUnmap) {
          controlContainer.appendChild(CreateElement.createIcon(null, 'tipschedule-icon far fa-calendar-minus', 'remove tip from week', (e) => {return this._startUnmapTipUI(e);}));
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
    var elemIcon = e.target;
    var elemTip = elemIcon.parentNode.getElementsByClassName('weeklytip-singletip')[0];
    var tipInformation = elemTip.tipInformation;
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

    this.update();
  }
  
  //------------------------------------------------------------------------------------------------
  // add/edit/delete tip
  //------------------------------------------------------------------------------------------------
  async _startAddTipUI(e) {
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
    console.log('start edit');
    var tipContainer = e.target.parentNode.parentNode;
    var tipInfo = tipContainer.tipInformation;
    
    if (this._tipEditContainer.parentNode) {
      this._tipEditContainer.parentNode.removeChild(this._tipEditContainer);
    }
    
    this._insertAfter(this._tipEditContainer, tipContainer);
    //tipContainer.insertBefore(this._tipEditContainer, tipContainer.nextSibling);
    
    //var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipschedule-tiplist', this._tipFilter.getFilter());
    //if (tipsQuery.success) {
    //  this._tipAddEditor.update(tipsQuery.data);
      this._tipEditEditor.update('some stuff');
      this._tipEditEditor.show(true);
    //}
    
  }
  
  _insertAfter(el, referenceNode) {
    referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
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
  }

  async _doFinishEdit(dbData) {
    console.log('finish edit');
    console.log(dbData);
    this._tipEditContainer.parentNode.removeChild(this._tipEditContainer);
    this.update();
  }

  async _doFinishDelete(dbData) {
    console.log(dbData);
    this._tipUnmapContainer.parentNode.removeChild(this._tipUnmapContainer);
    this.update();
  }
  
  async _cancelEditChange() {
    console.log('cancel edit change');
    if (this._tipAddContainer.parentNode) this._tipAddContainer.parentNode.removeChild(this._tipAddContainer);
    if (this._tipEditContainer.parentNode) this._tipEditContainer.parentNode.removeChild(this._tipEditContainer);
    if (this._tipUnmapContainer.parentNode) this._tipUnmapContainer.parentNode.removeChild(this._tipUnmapContainer);
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
