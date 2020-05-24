//-----------------------------------------------------------------------------------
// TipScheduling class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipScheduling {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Scheduling';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    this._HIGHLIGHT_CLASS = 'tipschedule-highlight';
    
    this._tipStateIconClass = [
      'weeklytip-icon far fa-square',
      'weeklytip-icon fas fa-check-circle'
    ];
    
    this._config = config;
    this._callback = config.callback;
    
    this._control = null;

    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'tipschedule ' + this._HIDE_CLASS);
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderTitle());

    this._control = new TipManagerSchedulingControl({
      disableCallback: (params) => {return this._disableContents(params);},
      updateCallback: (params) => {return this.update(params);}
    });
    this._container.appendChild(await this._control.render(this._notice));

    this._container.appendChild(this._renderContents());

    this._browse = new TipBrowse((params) => {return this.update(params);});
    this._container.appendChild(await this._browse.render(this._notice));
    
    return this._container;
  }
  
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipmanager-title');
    container.appendChild(CreateElement.createSpan(null, 'tipmanager-titletext', this._title));
    
    return container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'tipschedule-contents');
    
    return container;
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

  async update(reRenderControls) {
    if (reRenderControls) await this._control.update();
    
    var controlState = this._control.state();;
    this._browse.show(this._control.state().showbrowse);
    this._prepContainerForUpdate();
    
    if (controlState.scheduleid > 0) {
      await this._loadScheduleContents(controlState.scheduleid);
    }
  }
 
  _prepContainerForUpdate() {
    var contents = this._container.getElementsByClassName('tipschedule-contents')[0];
    if (contents) {
      this._removeChildren(contents);
    }
  }
  
  async _loadScheduleContents(scheduleId) {
    var queryResults = await this._doPostQuery('tipmanager/query', 'schedule-details', {scheduleid: scheduleId});
    if (!queryResults.success) return;
    
    var scheduleOverview = queryResults.data.schedule;
    var scheduleDetails = queryResults.data.scheduledetails;
    
    var contents = this._container.getElementsByClassName('tipschedule-contents')[0];
    contents.appendChild(CreateElement.createIcon(
      'collapseAll', 
      'tipschedule-icon collapse-icon far fa-minus-square', 
      'collapse all weeks', 
      (e) => {return this._collapseAllWeeks(e);}
    ));
    contents.appendChild(CreateElement.createIcon(
      'expandAll', 
      'tipschedule-icon collapse-icon far fa-plus-square', 
      'expand all weeks', 
      (e) => {return this._expandAllWeeks(e);}
    ));
    
    for (var i = 0; i <= scheduleOverview.schedulelength; i++) {
      contents.appendChild(this._renderScheduleWeek(scheduleOverview, scheduleDetails, i));
    }
  }
  
  _renderScheduleWeek(overview, details, weeknum) {
    var container = CreateElement.createDiv(null, 'weeklytip');
    container.weeknum = weeknum;
    
    container.appendChild(this._renderScheduleWeekHeader(overview, details, weeknum));
    container.appendChild(this._renderScheduleWeekItems(overview, details, weeknum));
    
    container.addEventListener('dragover', (e) => {this._allowTipDrop(e);});
    container.addEventListener('drop', (e) => {this._finishTipDrop(e);});

    return container;
  }
  
  _renderScheduleWeekHeader(overview, details, weeknum) {
    var container = CreateElement.createDiv(null, 'weeklytip-label');
    
    var label = 'week ' + weeknum;
    if (weeknum == 0) {
      label += ' (before term starts)';
    } else {
      var dateForWeek = this._addDays(overview.schedulestartdate, (weeknum - 1) * 7);
      label +=  ' (' + this._formatDate(dateForWeek) + ')';
    }
    
    var elemLabel = CreateElement.createSpan(null, null, label)
    container.appendChild(elemLabel);
    elemLabel.appendChild(CreateElement.createIcon(null, 'fas fa-caret-down weeklytip-collapse-icon', 'expand/collapse week', (e) => {return this._toggleWeeklyBoxCollapse(e);}));
    
    return container;
  }
  
  _renderScheduleWeekItems(overview, details, weeknum) {
    var container = CreateElement.createDiv(null, 'weeklytip-contents');
    
    var tipIconHandler = (e) => {return this._tipStateChange(e);}
    
    var itemsForWeek = this._orderItemsForWeek(details, weeknum);
    
    for (var i = 0; i < itemsForWeek.length; i++) {      
      var item = itemsForWeek[i];
      
      var subcontainer = CreateElement.createDiv(null, 'weeklytip-container');
      container.appendChild(subcontainer);
      subcontainer.draggable = true;
      subcontainer.addEventListener('dragstart', (e) => {this._startTipDrag(e)});
      
      subcontainer.itemInfo = item;
      subcontainer.appendChild(CreateElement.createIcon(null, this._tipStateIconClass[item.tipstate], 'change tip status', tipIconHandler));
      subcontainer.appendChild(CreateElement.createDiv(null, 'weeklytip-singletip', MarkdownToHTML.convert(item.tiptext)));
    }
    
    return container;
  }
  
  _orderItemsForWeek(details, weeknum) {
    var itemsForWeek = [];
    for (var i = 0; i < details.length; i++) {
      var item = details[i];
      if (item.schedulelocation == weeknum) itemsForWeek.push(item);
    }
    
    var sortedItems = itemsForWeek.sort(function(a, b) {
      if (a.schedulesublocation < b.schedulesublocation) {
        return -1;
      } else if (a.schedulesublocation > b.schedulesublocation) {
        return 1;
      }
      
      return 0;
    });
    
    return sortedItems;
  }

  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  _collapseAllWeeks(e) {
    if (e.target.disabled) return;
    
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
  
  _expandAllWeeks(e) {
    if (e.target.disabled) return;
    
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
  
  _toggleWeeklyBoxCollapse(e) {
    if (e.target.disabled) return;
    
    var elemContents = e.target.parentNode.parentNode.parentNode.getElementsByClassName('weeklytip-contents')[0];
    var elemIcon = e.target;

    elemContents.classList.toggle('hide-weeklytip-contents');
    elemIcon.classList.toggle('fa-caret-right');
    elemIcon.classList.toggle('fa-caret-down');
  }
  
  _disableContents(disable) {
    var contents = this._container.getElementsByClassName('tipschedule-contents')[0];
    contents.style.opacity = disable ? 0.5 : 1.0;
    this._disableElement(contents, disable, true);
  }
  
  async _tipStateChange(e) {
    if (e.target.disabled) return;
    
    var itemInfo = e.target.parentNode.itemInfo;
    
    var newTipState = 1;
    if (itemInfo.tipstate == 1) newTipState = 0;
    var queryResults = await this._doPostQuery('tipmanager/update', 'tipstate', {scheduletipid: itemInfo.scheduletipid, tipstate: newTipState});
    if (queryResults.success) {
      this.update(false);
    }
  }
  
  async _moveTip(itemInfo, scheduleLocation) {
    var queryResults = await this._doPostQuery('tipmanager/update', 'tiplocation', {scheduletipid: itemInfo.scheduletipid, schedulelocation: scheduleLocation});
    if (queryResults.success) {
      this.update(false);
    }
  }
  
  //--------------------------------------------------------------
  // drag and drop for tips
  //--------------------------------------------------------------  
  _startTipDrag(e) {
    var itemInfo = e.target.itemInfo;
    if (!itemInfo) {
      e.preventDefault();
    } else {
      e.dataTransfer.setData('text', JSON.stringify(itemInfo));
    }
  }
  
  _allowTipDrop(e) {
    e.preventDefault();
  }
  
  async _finishTipDrop(e) {
    e.preventDefault();
    var data = e.dataTransfer.getData('text');
    if (!data) return;
    
    var itemInfo = JSON.parse(data);
    
    this._getDropLocation(e.target);
    /*
    var node = e.target;
    var destNode = null;
    for (var limit = 0; limit < 20 && (destNode == null); limit++) {
      if (node.classList.contains('weeklytip')) {
        destNode = node;
      } else {
        node = node.parentNode;
      }
    }
    
    if (destNode  && (destNode.weeknum != itemInfo.schedulelocation)) {
      await this._moveTip(itemInfo, destNode.weeknum);
    }
    */
  }  
  
  _getDropLocation(elem) {
    var node = elem;
    var droppedOnWeek = false;
    var droppedOnTip = false;
    var scheduleLocation, scheduleSubLocation;
    
    for (var limit = 0; limit < 20 && !(droppedOnWeek || droppedOnTip); limit++) {
      droppedOnWeek = node.classList.contains('weeklytip');
      droppedOnTip = node.classList.contains('weeklytip-container');
      if (!(droppedOnWeek || droppedOnTip)) node = node.parentNode;
    }
    
    if (droppedOnWeek) {
      scheduleLocation = node.weeknum;
      scheduleSubLocation = 0;
    } else if (droppedOnTip) {
      scheduleLocation = node.itemInfo.schedulelocation;
      scheduleSubLocation = node.itemInfo.schedulesublocation + 1;
    }
      
    console.log(droppedOnWeek + ' ' + droppedOnTip);
    console.log(node);
    console.log(scheduleLocation + ' ' + scheduleSubLocation);
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
  _disableElement(elem, disable, disableChildren) {
    elem.disabled = disable;

    if (disableChildren) {
      var childNodes = elem.getElementsByTagName('*');
      var elemNamesToDisable = new Set(['I', 'A']);
      
      for (var i = 0; i < childNodes.length; i++) {
        var node = childNodes[i];
        if (elemNamesToDisable.has(node.nodeName)) {
          node.disabled = disable;
        }
      }
    }
  }
  
  _removeChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }

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

  _addDays(theDate, days) {
    var d = new Date(theDate);
    d.setDate(d.getDate()  + days);
    return d;
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
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }

  async _doPostQuery(queryType, queryName, postData) {
    var resultData = {success: false};
    
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
