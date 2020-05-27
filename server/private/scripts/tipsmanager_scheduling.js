//-----------------------------------------------------------------------------------
// TipScheduling class
//-----------------------------------------------------------------------------------
// TODO: debug drag/drop disable - is it an inheritance thing?
// TODO: consider drag handle for scheduleip items
// TODO: consider add/delete week option
// TODO: create new tip from scheduler
//-----------------------------------------------------------------------------------

class TipScheduling {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Scheduling';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._tipStateIconClass = [
      'weeklytip-icon far fa-square',
      'weeklytip-icon fas fa-check-square'
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

    var updateCallback = (params) => {return this.update(params);};
    var dragstartCallback = (e) => {return this._startTipDrag(e)};
    var dragendCallback =   (e) => {return this._handleDragEnd(e)};
    this._browse = new TipBrowse(updateCallback, dragstartCallback, dragendCallback);
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
    
    var controlState = this._control.state();
    
    this._configureBrowseDisplay(controlState.showbrowse);
    
    this._prepContainerForUpdate();
    
    if (controlState.scheduleid > 0) {
      await this._loadScheduleContents(controlState.scheduleid);
    }
  }
  
  async _configureBrowseDisplay(showbrowse) { 
    var container = this._container.getElementsByClassName('tipschedule-contents')[0];  
    if (showbrowse) {
      container.classList.add('browse');
    } else {
      if (container.classList.contains('browse')) container.classList.remove('browse');
    }
    
    this._browse.show(showbrowse);
    if (showbrowse) await this._browse.update();
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
    container.itemList = details[weeknum];
    
    container.appendChild(this._renderScheduleWeekHeader(overview, details, weeknum));
    container.appendChild(this._renderScheduleWeekItems(overview, details, weeknum));
    
    container.addEventListener('dragenter', (e) => {this._handleDragEnter(e);});
    container.addEventListener('dragover', (e) => {this._handleDragOver(e);});
    container.addEventListener('drop', (e) => {this._finishTipDrop(e);});

    return container;
  }
  
  _renderScheduleWeekHeader(overview, details, weeknum) {
    var container = CreateElement.createDiv(null, 'weeklytip-label');
    
    var label = 'week ' + weeknum;
    if (weeknum == 0) {
      label += ' (before term starts)';
    } else {
      var dateForWeek = this._addDays(overview.schedulestartdate, (weeknum - 1) * 7 + 1);
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
    
    var itemsForWeek = details[weeknum]
    
    for (var i = 0; i < itemsForWeek.length; i++) {      
      var item = itemsForWeek[i];
      
      var subcontainer = CreateElement.createDiv(null, 'weeklytip-container');
      container.appendChild(subcontainer);
      subcontainer.draggable = true;
      subcontainer.addEventListener('dragstart', (e) => {this._startTipDrag(e)});
      subcontainer.addEventListener('dragend', (e) => {this._handleDragEnd(e);});
      
      var itemInfo = item;
      item['dragtype'] = 'move',
      subcontainer.itemInfo = item;
      subcontainer.appendChild(CreateElement.createIcon(null, this._tipStateIconClass[item.tipstate], 'change tip status', tipIconHandler));
      subcontainer.appendChild(CreateElement.createDiv(null, 'weeklytip-singletip', MarkdownToHTML.convert(item.tiptext)));
    }
    
    return container;
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
    contents.style.opacity = disable ? 0.3 : 1.0;
    this._disableElement(contents, disable, true);
    this._disableTipScheduleDragging(disable);    
  }
  
  _disableTipScheduleDragging(disable) {
    var scheduleTipContainers = this._container.getElementsByClassName('weeklytip-container');
    for (var i = 0; i < scheduleTipContainers.length; i++) {
      var container = scheduleTipContainers[i];
      container.draggable = !disable;
    }
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
  
  async _addTip(tipId, destinationInfo) {
    var addParams = {
      tipid: tipId,
      scheduleid: this._control.state().scheduleid,
      schedulelocation: destinationInfo.schedulelocation,
      moveafterid: destinationInfo.moveafterid,
      movebeforeid: destinationInfo.movebeforeid
    };
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'addscheduletip', addParams);
    if (queryResults.success) {
      this.update(false);
    }
  }
  
  async _moveTip(scheduleTipId, destinationInfo) {
    if (scheduleTipId == destinationInfo.moveafterid || scheduleTipId == destinationInfo.movebeforeid) return;
    
    var moveParams = {
      scheduletipid: scheduleTipId,
      schedulelocation: destinationInfo.schedulelocation,
      moveafterid: destinationInfo.moveafterid,
      movebeforeid: destinationInfo.movebeforeid
    };
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'movescheduletip', moveParams);
    if (queryResults.success || queryResult.details == 'tip is already assigned to week') {
      this.update(false);
    }
  }
    
  async _removeTip(id) {  
    var queryResults = await this._doPostQuery('tipmanager/delete', 'scheduletip', {scheduletipid: id});
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
      this._dragTarget = null;
      return false;
      
    } else {
      e.dataTransfer.setData('text', JSON.stringify(itemInfo));
      var elem = CreateElement.createDiv(null, 'weeklytip-dragtarget', '&nbsp; ');
      elem.border = '1px solid red';
      this._dragTarget = elem;
      
      if (itemInfo.dragtype == 'move') {
        this._trashTarget = CreateElement.createDiv(null, 'weeklytip-trashcontainer');
        this._trashTarget.appendChild(CreateElement.createIcon(null, 'weeklytip-trashicon far fa-trash-alt trash', 'add new schedule', null));
        this._container.appendChild(this._trashTarget);
        this._trashTarget.addEventListener('dragenter', (e) => {this._handleDragEnter(e);});
        this._trashTarget.addEventListener('dragover', (e) => {this._handleDragOver(e);});
        this._trashTarget.addEventListener('drop', (e) => {this._finishTipDrop(e);});
      }
    }
    
    return true;
  }
  
  _handleDragEnd(e) {
    if (this._dragTarget) {
      this._dragTarget.parentNode.removeChild(this._dragTarget);
      this._dragTarget = null;
    }
    
    if (this._trashTarget) {
      this._trashTarget.parentNode.removeChild(this._trashTarget);
      this._trashTarget = null;
    }
  }
  
  _handleDragEnter(e) {
    e.preventDefault();
    
    var destContainer= this._getDropLocation(e.target).dropcontainer;

    if (destContainer.classList.contains('weeklytip-trashcontainer')) {
      this._dragTarget.style.display = 'none';
      
    } else if (destContainer.classList.contains('weeklytip')) {
      var elemLabel = destContainer.getElementsByClassName('weeklytip-contents')[0];
      destContainer.insertBefore(this._dragTarget, elemLabel);
      this._dragTarget.targetNode = destContainer;
      
    } else if (destContainer.classList.contains('weeklytip-container')) {
      destContainer.appendChild(this._dragTarget);
      this._dragTarget.targetNode = destContainer;

    } else {
      this._dragTarget.targetNode = null;
    }
    
    return false;
  }
  
  _handleDragOver(e) {
    e.preventDefault();
    var destContainer = this._getDropLocation(e.target).dropcontainer;
    if (this._dragTarget && destContainer.classList.contains('weeklytip-trashcontainer')) {
      this._highlightTipTrash(true);
      
    } else {
      this._dragTarget.style.display = 'block';
      this._highlightTipTrash(false);
    }
  }
  
  async _finishTipDrop(e) {
    e.preventDefault();

    var data = e.dataTransfer.getData('text');
    if (!data) return;
    
    var itemInfo = JSON.parse(data);
    
    if (this._getDropLocation(e.target).dropcontainer.classList.contains('weeklytip-trashcontainer')) {
      await this._removeTip(itemInfo.scheduletipid);

    } else if (itemInfo.dragtype == 'move') {
      var destinationInfo = this._getDropLocation(this._dragTarget.targetNode);
      await this._moveTip(itemInfo.scheduletipid, destinationInfo);

    } else if (itemInfo.dragtype == 'add') {
      var destinationInfo = this._getDropLocation(this._dragTarget.targetNode);
      await this._addTip(itemInfo.tipId, destinationInfo);
    }
  }  
  
  _getDropLocation(elem) {
    var node = elem;
    var droppedOnWeek = false;
    var droppedOnTip = false;
    var scheduleLocation, idOfPrevious, idOfNext;
    
    if (elem.classList.contains('weeklytip-trashcontainer')) {
      return {dropcontainer: this._trashTarget};
    } else if (elem.classList.contains('weeklytip-trashicon')) {
      return {dropcontainer: this._trashTarget};
    }
    
    for (var limit = 0; limit < 20 && !(droppedOnWeek || droppedOnTip); limit++) {
      droppedOnWeek = node.classList.contains('weeklytip');
      droppedOnTip = node.classList.contains('weeklytip-container');
      if (!(droppedOnWeek || droppedOnTip)) node = node.parentNode;
    }
    
    if (droppedOnWeek) {
      scheduleLocation = node.weeknum;
      idOfPrevious = -1;
      if (node.itemList.length == 0) {
        idOfNext = -1;
      } else {
        idOfNext = node.itemList[0].scheduletipid;
      }
      
    } else if (droppedOnTip) {
      scheduleLocation = node.itemInfo.schedulelocation;
      idOfPrevious = node.itemInfo.scheduletipid;
      var itemList = node.parentNode.parentNode.itemList;
      var itemIndex = -1;
      for (var i = 0; i < itemList.length && itemIndex < 0; i++) {
        if (itemList[i].scheduletipid == idOfPrevious) itemIndex = i;
      }

      if (itemIndex >= (itemList.length - 1)) {
        idOfNext = -1;
      } else {
        idOfNext = itemList[itemIndex + 1].scheduletipid;
      }
    }
    
    return {schedulelocation: scheduleLocation, moveafterid: idOfPrevious, movebeforeid: idOfNext, dropcontainer: node};
  }
  
  _highlightTipTrash(highlight) {
    var elem = this._trashTarget;
    if (!elem) return;
    
    if (!highlight) {
        if (elem.classList.contains('highlight')) {
          elem.classList.remove('highlight');
        }
        
    } else {
      elem.classList.add('highlight');
    }
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
