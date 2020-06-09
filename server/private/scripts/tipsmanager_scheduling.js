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
    
    this._tipStateIconClass = [
      'weeklytip-icon far fa-square',
      'weeklytip-icon fas fa-check-square'
    ];
    
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
    this._browse = new TipBrowse({
      "updateCallback": updateCallback, 
      "dragstartCallback": dragstartCallback, 
      "dragendCallback": dragendCallback
    });
    this._container.appendChild(await this._browse.render(this._notice));
    
    var categoryList = await this._loadCategoryListFromDB();
    this._addTipDialog = new DialogContainer({
      dialogtype: 'add-tip',
      confirmcallback: (arg) => {this._finishAddTip(arg)},
      cancelcallback: () => {this._cancelAddTip()},
      categorylist: categoryList
    });
    this._container.appendChild(this._addTipDialog.render());

    this._editTipDialog = new DialogContainer({
      dialogtype: 'edit-tip',
      confirmcallback: (arg) => {this._finishEditTip(arg)},
      cancelcallback: () => {this._cancelEditTip()},
      categorylist: categoryList,
      showUsageInfo: false
    });
    this._container.appendChild(this._editTipDialog.render());

    this._container.addEventListener('dragenter', (e) => {this._handleDefaultDragEnter(e);});
    
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

  async _loadCategoryListFromDB() {
    var categoryList = null;
    
    var queryResults = await this._doGetQuery('tipmanager/query', 'categorylist');
    if (queryResults.success) {
      var data = queryResults.categorylist;
      categoryList = [];
      for (var i = 0; i < data.length; i++) {
        categoryList.push(data[i].categorytext);
      }
    };
    
    return categoryList;
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
      'tipschedule-icon collapse-icon fas fa-angle-double-right', 
      'collapse all weeks', 
      (e) => {return this._collapseAllWeeks(e);}
    ));
    contents.appendChild(CreateElement.createIcon(
      'expandAll', 
      'tipschedule-icon collapse-icon fas fa-angle-double-down', 
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
    var handler = (e) => {return this._toggleWeeklyBoxCollapse(e);}
    var container = CreateElement.createDiv(null, 'weeklytip-label');
    container.addEventListener('click', handler);
    
    var label;
    if (weeknum == 0) {
      label = 'before the term starts';
    } else {
      label = 'week ' + weeknum;
      var dateForWeek = this._addDays(overview.schedulestartdate, (weeknum - 1) * 7 + 1);
      label +=  ' (' + this._formatDate(dateForWeek) + ')';
    }
    
    var elemLabel = CreateElement.createSpan(null, null, label)
    container.appendChild(elemLabel);
    elemLabel.appendChild(CreateElement.createIcon(null, 'fas fa-caret-down weeklytip-collapse-icon', 'expand/collapse week'));
    
    container.appendChild(this._renderScheduleWeekConfig(weeknum));
    
    return container;
  }
  
  _renderScheduleWeekConfig(weeknum) {
    var container = CreateElement.createDiv(null, 'weeklytip-config');
    
    var handler = (e) => {this._handleConfigChoice(e, 'addtip');};
    container.appendChild(CreateElement.createIcon(null, 'weeklytip-config-icon addtip far fa-plus-square', 'add new tip to this week', handler));

    handler = (e) => {this._handleConfigChoice(e, 'addweek');};
    container.appendChild(CreateElement.createIcon(null, 'weeklytip-config-icon addweek far fa-calendar-plus', 'add new week after this one', handler));

    handler = (e) => {this._handleConfigChoice(e, 'removeweek');};
    container.appendChild(CreateElement.createIcon(null, 'weeklytip-config-icon removeweek far fa-calendar-minus', 'remove this week', handler));
    
    return container;
  }
  
  _renderScheduleWeekItems(overview, details, weeknum) {
    var container = CreateElement.createDiv(null, 'weeklytip-contents');
    
    var tipIconHandler = (e) => {return this._tipStateChange(e);}
    
    var itemsForWeek = details[weeknum]
    
    for (var i = 0; i < itemsForWeek.length; i++) {      
      var item = itemsForWeek[i];

      var classString = 'weeklytip-container ' + ((i % 2 == 0) ? 'eventip' : 'oddtip');      
      var subcontainer = CreateElement.createDiv(null, classString);
      container.appendChild(subcontainer);
      
      var itemInfo = item;
      item['dragtype'] = 'move';
      
      subcontainer.itemInfo = item;
      
      subcontainer.appendChild(this._renderDragHandle((i % 2 == 0), itemInfo, subcontainer));
      subcontainer.appendChild(this._renderTipState(this._tipStateIconClass[item.tipstate], (i % 2 == 0), tipIconHandler));

      var classString = 'weeklytip-sub ';
      classString += (i % 2 == 0) ? 'eventip' : 'oddtip';
      var subsubcontainer = CreateElement.createDiv(null, classString);
      subcontainer.appendChild(subsubcontainer);
      subsubcontainer.appendChild(CreateElement.createDiv(null, 'weeklytip-singletip', MarkdownToHTML.convert(item.tiptext)));

      classString = 'weeklytip-controls ';
      classString += (i % 2 == 0) ? 'eventip' : 'oddtip';
      subsubcontainer = CreateElement.createDiv(null, classString);
      subcontainer.appendChild(subsubcontainer);
      var handler = (e) => {this._handleConfigChoice(e, 'edittip');};
      var classString = 'weeklytip-controls-icon far fa-edit';
      var title = '';
      if (itemInfo.editable) {
        classString += ' editable';
        title = 'edit tip';
      }
      subsubcontainer.appendChild(CreateElement.createIcon(null, classString, title, handler));
    }
    
    return container;
  }
  
  _renderDragHandle(evenTip, itemInfo, elemItem) {
    var classString = 'tipschedule-draghandle';
    classString += evenTip ? ' eventip' : ' oddtip';
    var container = CreateElement.createDiv(null, classString);

    container.itemInfo = itemInfo;
    container.elemItem = elemItem;
    
    container.draggable = true;
    container.addEventListener('dragstart', (e) => {this._startTipDrag(e)});
    container.addEventListener('dragend', (e) => {this._handleDragEnd(e)});

    container.appendChild(CreateElement.createIcon(null, 'tipschedule-draghandle-icon fas fa-grip-vertical', null, null));
    
    return container;
  }

  _renderTipState(tipState, evenTip, tipIconHandler) {
    var classString = 'weeklytip-state ';
    classString += evenTip ? 'eventip': 'oddtip';
    var container = CreateElement.createDiv(null, classString);
    
    container.appendChild(CreateElement.createIcon(null, tipState, 'change tip status', tipIconHandler));
    
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
    var node = e.target;
    var elemContents = null;
    var elemIcon;
    
    for (var i = 0; i < 6 && !elemContents; i++) {
      if (node.classList.contains('weeklytip')) {
        elemContents = node.getElementsByClassName('weeklytip-contents')[0];
        elemIcon = node.getElementsByClassName('weeklytip-collapse-icon')[0];
      } else {
        node = node.parentNode;
      }
    }

    if (!elemContents) return;
    
    elemContents.classList.toggle('hide-weeklytip-contents');
    elemIcon.classList.toggle('fa-caret-right');
    elemIcon.classList.toggle('fa-caret-down');
  }
  
  _disableContents(disable) {
    var contents = this._container.getElementsByClassName('tipschedule-contents')[0];
    var title = this._container.getElementsByClassName('tipmanager-title')[0];

    if (disable) {
      contents.style.display = 'none';
      title.style.display = 'none';
      this._browse.show(false);
      
    } else {
      contents.style.display = 'block';
      title.style.display = 'block';
      this._browse.show(this._control.state().showbrowse);
    }
  }
    
  async _tipStateChange(e) {
    if (e.target.disabled) return;
    
    var itemInfo = e.target.parentNode.parentNode.itemInfo;
    
    var newTipState = 1;
    if (itemInfo.tipstate == 1) newTipState = 0;
    var queryResults = await this._doPostQuery('tipmanager/update', 'tipstate', {scheduletipid: itemInfo.scheduletipid, tipstate: newTipState});
    if (queryResults.success) {
      this.update(false);
    }
  }
  
  async _handleConfigChoice(e, choiceType) {
    e.stopPropagation();
    var elemIcon = e.target;
    var elemWeeklyTip = elemIcon.parentNode.parentNode.parentNode;
    var weekNum = elemWeeklyTip.weeknum;
    
    var scheduleId = this._control.state().scheduleid;
    
    if (choiceType == 'addtip') {
      var elemWeeklyTipContents = elemWeeklyTip.getElementsByClassName('weeklytip-contents')[0];
      var lastWeeklyItem = elemWeeklyTipContents.lastChild;

      this._disableContents(true);
      this._control.show(false);
      
      this._addTipDialog.show(true);
      this._addTipDialog.update({
        scheduleid: this._control.state().scheduleid,
        weeknum: weekNum
      });
      
    } else if (choiceType == 'edittip') {  
      var itemInfo = e.target.parentNode.parentNode.itemInfo;
      if (itemInfo.editable) {
        this._disableContents(true);
        this._control.show(false);
        this._editTipDialog.show(true);
        this._editTipDialog.update(itemInfo);
      }
      
    } else if (choiceType == 'addweek') {
      var queryResults = await this._doPostQuery('tipmanager/insert', 'addscheduleweek', {scheduleid: scheduleId, afterweek: weekNum});
      if (queryResults.success) {
        this.update(false);
      }
      
    } else if (choiceType == 'removeweek') {
      var msg = 'Week #' + weekNum + ' will be deleted along with any tips it contains.';
      msg += '\n\nContinue with removing week #' + weekNum + '?';
      
      if (confirm(msg)) {
        var queryResults = await this._doPostQuery('tipmanager/delete', 'removescheduleweek', {scheduleid: scheduleId, week: weekNum});
        if (queryResults.success) {
          this.update(false);
        }
      }
    }
  }
  
  async _finishAddTip(info) {    
    var addParams = {
      tiptext: info.tiptext,
      category: info.category,
      scheduleid: info.params.scheduleid,
      schedulelocation: info.params.weeknum,
      schedulelocationorder: 0
    };

    var queryResults = await this._doPostQuery('tipmanager/update', 'addtipandscheduletip', addParams);
    if (queryResults.success) {
      this.update(false);
      this._disableContents(false);
      this._control.show(true);    

    } else if (queryResults.details == '*ERROR: in dbPost, "duplicate tip for user"') {
      this._notice.setNotice('');
      this._addTipDialog.show(true);
      setTimeout(function() {
        alert('You already have a tip available with this text.');
      }, 300);
    }
  }
  
  _cancelAddTip() {
    this._disableContents(false);
    this._control.show(true);
  }
  
  async _finishEditTip(info) { 
    var editParams = {
      tipid: info.params.tipid,
      tiptext: info.tiptext,
      origcategory: info.params.category,
      category: info.category
    }

    var queryResults = await this._doPostQuery('tipmanager/update', 'tiptextandcategory', editParams);
    if (queryResults.success) {
      this.update(false);
      this._disableContents(false);
      this._control.show(true);    
    }
  }
  
  _cancelEditTip() {
    this._disableContents(false);
    this._control.show(true);
  }

  async _addTip(tipId, destinationInfo) {
    var addParams = {
      tipid: tipId,
      scheduleid: this._control.state().scheduleid,
      schedulelocation: destinationInfo.schedulelocation,
      schedulelocationorder: destinationInfo.schedulelocationorder
    };
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'addscheduletip', addParams);
    if (queryResults.success) {
      this.update(false);
    }
  }
  
  async _moveTip(scheduleTipId, destinationInfo) {
    var moveParams = {
      scheduletipid: scheduleTipId,
      scheduleid: this._control.state().scheduleid,
      tipid: destinationInfo.tipid,
      origschedulelocation: destinationInfo.origschedulelocation,
      origschedulelocationorder: destinationInfo.origschedulelocationorder,
      schedulelocation: destinationInfo.schedulelocation,
      schedulelocationorder: destinationInfo.schedulelocationorder
    };
    
    var queryResults = await this._doPostQuery('tipmanager/update', 'movescheduletip', moveParams);
    if (queryResults.success || queryResults.details == 'tip is already assigned to week') {
      this.update(false);
    }
  }
    
  async _removeTip(params) {
    var queryResults = await this._doPostQuery('tipmanager/delete', 'scheduletip', params);
    if (queryResults.success) {
      this.update(false);
    }
  }  
  
  //--------------------------------------------------------------
  // drag and drop for tips
  //--------------------------------------------------------------  
  _startTipDrag(e) {
    var itemInfo = e.target.itemInfo;
    this._elemDragging = null;
    
    if (!itemInfo) {
      e.preventDefault();
      this._dragTarget = null;
      return false;
      
    } else {      
      e.dataTransfer.setData('text', JSON.stringify(itemInfo));
      this._dragTarget = CreateElement.createDiv(null, 'weeklytip-dragtarget', '&nbsp; ');
      
      if (itemInfo.dragtype == 'move') {
        this._elemDragging = e.target.elemItem;

        this._trashTarget = CreateElement.createDiv(null, 'weeklytip-trashcontainer');
        this._trashTarget.appendChild(CreateElement.createIcon(null, 'weeklytip-trashicon far fa-trash-alt trash', null, null));
        this._container.appendChild(this._trashTarget);
        this._trashTarget.addEventListener('dragenter', (e) => {this._handleDragEnter(e);});
        this._trashTarget.addEventListener('dragover', (e) => {this._handleDragOver(e);});
        this._trashTarget.addEventListener('drop', (e) => {this._finishTipDrop(e);});
      }
    }
    
    return true;
  }
  
  _handleDefaultDragEnter(e) {
    var elemTarget = e.target;
    
    var dragTargetClassSet = new Set([
      'weeklytip', 'weeklytip-container', 'weeklytip-label', 'weeklytip-collapse',
      'tipschedule-draghandle', 'tipschedule-draghandle-icon',
      'weeklytip-singletip', 'weeklytip-state', 'weeklytip-icon', 'weekly-tip-sub'
    ]);
    
    if (elemTarget.classList.length == 0) {
      if (elemTarget.parentNode && elemTarget.parentNode.classList.contains('weeklytip-singletip')) {
        elemTarget = elemTarget.parentNode;
      }
    }
    
    var passThrough = (elemTarget.classList.length == 0);
    for (var i = 0; i < elemTarget.classList.length && !passThrough; i++) {
      passThrough = dragTargetClassSet.has(elemTarget.classList[i]);
    }
    
    if (!passThrough && this._dragTarget && this._dragTarget.targetNode) {
      this._dragTarget.style.display = 'none';
    }
  }
  
  _handleDragEnd(e) {
    if (this._dragTarget && this._dragTarget.parentNode) {
      this._dragTarget.parentNode.removeChild(this._dragTarget);
      this._dragTarget = null;
    }
    
    if (this._trashTarget && this._trashTarget.parentNode) {
      this._trashTarget.parentNode.removeChild(this._trashTarget);
      this._trashTarget = null;
    }
    
    if (this._elemDragging && this._elemDragging.classList.contains('dragging')) {
      this._elemDragging.classList.remove('dragging');
    }
  }
  
  _handleDragEnter(e) {
    e.preventDefault();
    
    var destContainer = this._getDropLocation(e.target).dropcontainer;
    
    if (destContainer.classList.contains('weeklytip-trashcontainer')) {
      this._dragTarget.style.display = 'none';
      
    } else if (destContainer.classList.contains('weeklytip')) {
      var elemLabel = destContainer.getElementsByClassName('weeklytip-contents')[0];
      destContainer.insertBefore(this._dragTarget, elemLabel);
      this._dragTarget.targetNode = destContainer;
      
    } else if (destContainer.classList.contains('weeklytip-container')) {
      destContainer.parentNode.insertBefore(this._dragTarget, destContainer.nextSibling);
      this._dragTarget.targetNode = destContainer;

    } else {
      this._dragTarget.style.display = 'none';
      this._dragTarget.targetNode = null;
    }
    
    if (this._elemDragging) this._elemDragging.classList.add('dragging');
    
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

    if (this._elemDragging) this._elemDragging.classList.add('dragging');
  }
  
  async _finishTipDrop(e) {
    if (this._elemDragging && this._elemDragging.classList.contains('dragging')) {
      this._elemDragging.classList.remove('dragging');
      this._elemDragging = null;
    }
    e.preventDefault();

    var data = e.dataTransfer.getData('text');
    if (!data) return;
    
    var itemInfo = JSON.parse(data);
    
    if (this._getDropLocation(e.target).dropcontainer.classList.contains('weeklytip-trashcontainer')) {
      var deleteParams = itemInfo;
      itemInfo.scheduleid = this._control.state().scheduleid;
      
      await this._removeTip(deleteParams);

    } else if (itemInfo.dragtype == 'move') {
      var destinationInfo = this._getDropLocation(this._dragTarget.targetNode);
      
      var newLocationOrder = destinationInfo.schedulelocationorder;
      if (destinationInfo.schedulelocation == itemInfo.schedulelocation &&
          destinationInfo.schedulelocationorder >= itemInfo.schedulelocationorder) {
        newLocationOrder--;
      }
      
      var moveParams = {
        scheduletipid: itemInfo.scheduletipid,
        scheduleid: this._control.state().scheduleid,
        tipid: itemInfo.tipid,
        origschedulelocation: itemInfo.schedulelocation,
        origschedulelocationorder: itemInfo.schedulelocationorder,
        schedulelocation: destinationInfo.schedulelocation,
        schedulelocationorder: newLocationOrder
      }
      await this._moveTip(itemInfo.scheduletipid, moveParams);

    } else if (itemInfo.dragtype == 'add') {
      var destinationInfo = this._getDropLocation(this._dragTarget.targetNode);
      await this._addTip(itemInfo.tipId, destinationInfo);
    }
  }  
  
  _getDropLocation(elem) {
    var droppedOnWeekLabel = false;
    var droppedOnTip = false;
    var scheduleLocation, scheduleLocationOrder;
    
    if (elem.classList.contains('weeklytip-trashcontainer')) {
      return {dropcontainer: this._trashTarget};
    } else if (elem.classList.contains('weeklytip-trashicon')) {
      return {dropcontainer: this._trashTarget};
    }
    
    if (elem.classList.contains('weeklytip')) elem = elem.getElementsByClassName('weeklytip-label')[0];
    var node = elem;
    
    for (var limit = 0; limit < 20 && node.nodeName != 'BODY' && !(droppedOnWeekLabel || droppedOnTip); limit++) {
      droppedOnWeekLabel = node.classList.contains('weeklytip-label');
      droppedOnTip = node.classList.contains('weeklytip-container');
      if (!(droppedOnWeekLabel || droppedOnTip)) node = node.parentNode;
    }
    
    if (droppedOnWeekLabel) {
      node = node.parentNode;
      scheduleLocation = node.weeknum;
      scheduleLocationOrder = 0;
      
    } else if (droppedOnTip) {
      scheduleLocation = node.itemInfo.schedulelocation;
      scheduleLocationOrder = node.itemInfo.schedulelocationorder + 1;
    }

    return {
      schedulelocation: scheduleLocation, 
      schedulelocationorder: scheduleLocationOrder,
      dropcontainer: node
    };
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
  _setClass(elem, className, add) {
    if (elem.classList.contains(className)) elem.classList.remove(className);
    if (add) elem.classList.add(className);
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
      resultData.details = requestResult.details;
      this._notice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }  
}
