//-----------------------------------------------------------------------------------
// TipMapping class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

class TipMapping {
  constructor() {
    this._version = '0.01';
    this._title = 'Mapping';
    
    this._HIDE_CLASS = 'tipmanager-hide';
    
    this._container = null;

    this._tipFilter = new TipManagerFilter('mapping', () => {return this.update();});   
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  render() {
    this._container = CreateElement.createDiv(null, 'tipmapping ' + this._HIDE_CLASS);
    
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

    //var tipsQuery = await this._doPostQuery('tipmanager/query', 'tipmap', this._tipFilter.getFilter());
    
    //if (tipsQuery.success) {
      //this._container.appendChild(this._showTips(tipsQuery));
    //} 
  }
  
  async userchange() {
    await this._tipFilter.userchange();
    await this.update();
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
  
  _showTips(tipsInfo) {
    var contentContainer = CreateElement.createDiv(null, 'tipmapping-content');
    console.log(tipsInfo);
    
    var tips = tipsInfo.tips;
    var mapping = tipsInfo.mapping;
    var termgroups = tipsInfo.termgroups;
    
    var headers = ['tip text', 'course'];
    var colgroupInfo = ['width: 40%', 'width: 10%'];
    for (var i = 0; i < termgroups.length; i++) {
      headers.push(termgroups[i].termgroupname);
      colgroupInfo.push('width: 4%');
    }
    headers.push('  ');
    colgroupInfo.push('width: *');

    var tipTable = CreateElement.createTable(null, null, headers, null, null, null, colgroupInfo);
    contentContainer.appendChild(tipTable);
    
    for (var i = 0; i < tips.length; i++) {
      var tip = tips[i];
      var singleMap = null;
      if (mapping.hasOwnProperty(tip.tipid)) singleMap = mapping[tip.tipid];
      
      this._showSingleTip(tipTable, tip, singleMap, termgroups);
    }

    return contentContainer;
  }
  
  _showSingleTip(tipTable, tip, singleMap, termgroups) {
    var tipRow = CreateElement.createTableRow(null, null, tipTable);
    tipRow.tipid = tip.tipid;
    
    CreateElement.createTableCell(null, null, tip.tiptext, false, tipRow);
    
    var courseCell = CreateElement.createTableCell(null, null, '', false, tipRow);
      var coursename = 'none';
    
    for (var i = 0; i < termgroups.length; i++) {
      var termCell = CreateElement.createTableCell(null, 'tipmapping-termcontent', '', false, tipRow);
;
      var termgroupName = termgroups[i].termgroupname;
      var termLength = termgroups[i].termlength;
      
      var week = '?';
      if (singleMap && singleMap.hasOwnProperty(termgroupName)) {
        week = singleMap[termgroupName].week;
        termCell.generaltipid = singleMap[termgroupName].generaltipid;
        termCell.coursetipid = singleMap[termgroupName].coursetipid;
        if (singleMap[termgroupName].coursetipid) {
          coursename = singleMap[termgroupName].coursename;
        } else {
          coursename = 'all';
        }
      }
      termCell.innerHTML = week;
    }
    
    courseCell.innerHTML = coursename;
    console.log('what if different terms are matched with different courses???');
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
