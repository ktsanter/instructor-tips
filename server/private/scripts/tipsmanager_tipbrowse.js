//-----------------------------------------------------------------------------------
// TipBrowse class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipBrowse {
  constructor(config) {
    this._version = '0.01';
    this._title = 'Browse tips';
    
    this._HIDE_CLASS = 'tipbrowse-hide';
    
    this._config = {};
    if (config) this._config = config;
    
    this._setConfigHandler('updateCallback');
    this._setConfigHandler('dragstartCallback');
    this._setConfigHandler('dragendCallback');
    this._setConfigHandler('editCallback');
    this._setConfigHandler('deleteCallback');
    
    this._checkConfigOption('editing', false);
    this._checkConfigOption('allowEdit', false);
    this._checkConfigOption('allowDelete', false);

    this._container = null;  
  }

  _setConfigHandler(handlerName) {
    if (!this._config.hasOwnProperty(handlerName) || !this._config[handlerName]) {
      this._config[handlerName] = (e) => {this._doNothing(e);};
    }
  }
  
  _checkConfigOption(optionName, defaultVal) {
    if (!this._config.hasOwnProperty(optionName)) this._config[optionName] = defaultVal;
  }

  _doNothing(e) {}
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  async render(notice) {
    this._container = CreateElement.createDiv(null, 'tipbrowse');

    // this object has its own notice to avoid conflicts with that of "parent"
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');
    
    this._container.appendChild(this._renderTitle());
    
    var filterConfig = {updateCallback: (params) => {this._updateFromFilter(params);}};
    filterConfig.editing = this._config.editing;
    this._tipFilter = new TipFilter(filterConfig);
    
    this._container.appendChild(await this._renderContents());
        
    return this._container;
  }

  show(makeVisible) {   
    if (this._container.classList.contains(this._HIDE_CLASS)) {
      this._container.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      this._container.classList.add(this._HIDE_CLASS);
    }
  }  
    
  _renderTitle() {
    var container = CreateElement.createDiv(null, 'tipbrowse-title');
    container.appendChild(CreateElement.createSpan(null, 'tipbrowse-titletext', this._title));

    var subcontainer = CreateElement.createDiv(null, 'tipbrowse-filter-container');
    container.appendChild(subcontainer);
    
    var handler = (e) => {this._handleFilterToggle(e)};
    subcontainer.appendChild(CreateElement.createIcon(null, 'tipbrowse-filtertoggle fas fa-filter', 'show/hide filter', handler));
    
    return container;
  }
  
  async _renderContents() {
    var container = CreateElement.createDiv(null, 'tipbrowse-contents');
    
    container.appendChild(await this._tipFilter.render(this._notice));
    container.appendChild(CreateElement.createDiv(null, 'tipbrowse-results'));
    
    return container;
  }
  
  async update(skipTipFilterUpdate) {
    var resultContainer = this._container.getElementsByClassName('tipbrowse-results')[0];
    
    if (!skipTipFilterUpdate) await this._tipFilter.update();

    var tipList = await this._getTipList();
    if (!tipList) return;
    
    this._renderTipList(resultContainer, tipList);
  }
  
  _renderTipList(container, tipList) {
    this._removeAllChildren(container);
    
    container.tipList = tipList;

    for (var i = 0; i < tipList.length; i++) {
      var classString = 'tipbrowse-tip' + (i % 2 == 0 ? ' eventip' : ' oddtip');
      var subcontainer = CreateElement.createDiv(null, classString);
      container.appendChild(subcontainer);
      
      subcontainer.appendChild(this._renderDragHandle(tipList[i].tipid, i % 2 == 0));
      
      subcontainer.appendChild(this._renderTipControls(tipList[i], i % 2 == 0));

      classString = 'tipbrowse-tip-details' + (i % 2 == 0 ? ' eventip' : ' oddtip');
      var elemTip = CreateElement.createDiv(null, classString, MarkdownToHTML.convert(tipList[i].tiptext));
      subcontainer.appendChild(elemTip);
    }
  }
  
  _renderDragHandle(tipId, evenTip) {
    var classString = 'tipbrowse-draghandle';
    classString += evenTip ? ' eventip' : ' oddtip';
    var container = CreateElement.createDiv(null, classString);
    
    var handler = (e) => {this.test(e)};
    container.tipId = tipId;
    container.draggable = true;
    container.addEventListener('dragstart', (e) => {this._dragstartHandler(e)});
    container.addEventListener('dragend', (e) => {this._dragendHandler(e)});
    
    container.appendChild(CreateElement.createIcon(null, 'tipbrowse-draghandle-icon fas fa-grip-vertical', null, null));
    
    return container;
  }
  
  _renderTipControls(tipInfo, evenTip) {
    var classString = 'tipbrowse-tipcontrols';
    classString += evenTip ? ' eventip' : ' oddtip';
    var container = CreateElement.createDiv(null, classString);

    var subcontainer = CreateElement.createDiv(null, 'tipbrowse-tipcontrols-inner');
    container.appendChild(subcontainer);
    
    if (this._config.allowEdit) {
      var handler = (e) => {this._handleEdit(e);};
      var elem = CreateElement.createIcon(null, 'tipcontrol-icon far fa-edit', 'edit tip', handler);
      subcontainer.appendChild(elem);
      elem.tipInfo = tipInfo;
    }
    
    if (this._config.allowDelete) {
      var handler = (e) => {this._handleDelete(e);};
      var elem = CreateElement.createIcon(null, 'tipcontrol-icon far fa-trash-alt', 'delete tip', handler);
      subcontainer.appendChild(elem);
      elem.tipInfo = tipInfo;
      if (tipInfo.schedulecount + tipInfo.shareschedulecount > 0) {
        elem.classList.add('tipcontrol-disable');
        elem.title = 'tip is used in one or more schedules';
        elem.removeEventListener('click', handler);
      }
    }
    
    return container;
  }

  async _getTipList() {
    var result = null;
    
    var filterSettings = this._tipFilter.getFilterState();
    var queryParams = filterSettings;
    queryParams.editing = this._config.editing;
    
    var queryResults = await SQLDBInterface.doPostQuery('tipmanager/query', 'tiplist', queryParams, this._notice);
    if (queryResults.success) {
      result = queryResults.data.sort(function(a, b) {
        if (a.tiptext.toLowerCase() > b.tiptext.toLowerCase()) {
          return 1;
        } else if (a.tiptext.toLowerCase() < b.tiptext.toLowerCase()) {
          return -1;
        }
        return 0;
      });
    }
    
    return result;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleFilterToggle(e) {
    this._tipFilter.toggleShow();
  }
  
  _updateFromFilter(params) {
    this.update(true);
  }
  
  _handleEdit(e) {
    this._config.editCallback(e.target.tipInfo);
  };
  
  _handleDelete(e) {
    this._config.deleteCallback(e.target.tipInfo);
  };
  
  _dragstartHandler(e) {
    if (!e.target.classList.contains('tipbrowse-draghandle')) {
      e.preventDefault();
      return false;
    }

    var itemInfo = {
      dragtype: 'add',
      tipId: e.target.tipId,
      tipstate: 0,
      tiptext: null,
      nextitem: null,
      previousitem: null,
      scheduletipid: null,
    };
    
    e.target.itemInfo = itemInfo;

    return this._config.dragstartCallback(e);
  }
  
  _dragendHandler(e) {
    if (!e.target.classList.contains('tipbrowse-draghandle')) return false;
    return this._config.dragendCallback(e);
  }
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------
  _showElement(elem, makeVisible, override) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
    
    if (override) {
      if (makeVisible) {
        elem.style.display = 'inline-block';
      } else {
        elem.style.display = 'none';
      }
    }
  }
  
  _removeAllChildren(elem) {
    while (elem.firstChild) {
      elem.removeChild(elem.firstChild);
    }
  }
}
