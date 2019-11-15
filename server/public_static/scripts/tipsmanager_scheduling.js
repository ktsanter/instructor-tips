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
    
    this._container = null;

    this._tipFilter = new TipManagerFilter('scheduling', () => {return this.update();});
    
    this._tipStatusClass = {
      null: 'far fa-square',
      scheduled: 'fas fa-exclamation-circle',
      completed: 'fas fa-check-circle'
    }      
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'tipschedule ' + this._HIDE_CLASS);
    
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
      var organizedTips = this._organizeByWeek(tipsQuery.data, tipsQuery.termlength);
      this._container.appendChild(this._showTips(organizedTips, tipsQuery.termlength));
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
    
    var label = CreateElement.createDiv(null, 'weeklytip-label');
    container.appendChild(label);
    label.appendChild(CreateElement.createIcon(null, 'fas fa-caret-down weeklytip-collapse-icon', null, this._toggleWeeklyBoxCollapse));
    label.appendChild(CreateElement.createSpan(null, 'weeklytip-label-text', 'week ' + weekNumber));
    
    var contents = CreateElement.createDiv(null, 'weeklytip-contents');
    container.appendChild(contents); 
    
    var tipIconHandler = (e) => {return this._tipStatusChange(e);}
    
    for (var i = 0; i < tipsForWeek.length; i++) {
      var tip = tipsForWeek[i];
      var renderedMarkdown = MarkdownToHTML.convert(tip.tiptext);
      
      var singleTipContainer = CreateElement.createDiv(null, null);
      contents.appendChild(singleTipContainer);
      var iconClassList = 'weeklytip-icon ' + this._tipStatusClass[tip.tipstatusname];
      singleTipContainer.appendChild(CreateElement.createIcon(null, iconClassList, null, tipIconHandler));
      singleTipContainer.appendChild(CreateElement.createDiv(null, 'weeklytip-singletip', renderedMarkdown));
      singleTipContainer.lastChild.tipInformation = tip;
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
