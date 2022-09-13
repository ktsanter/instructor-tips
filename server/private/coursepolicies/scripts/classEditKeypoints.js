//-------------------------------------------------------------------
// EditKeypoints
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class EditKeypoints {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      navItemClass: 'nav-item',
      
      info: null,
    }
    
    this._initUI();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------  
  update(info) {
    this.settings.info = {
      "general": info.general,
      "course": info.course
    };
    
    this._updateUI();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initUI() {
    EditUtilities._setEditControlHandlers(
      this.config.container, 
      'edit-control edit-control-keypoint',
      (e) => { this._handleEditControl(e); }
    );
        
    this.config.keypointContainer = this.config.container.getElementsByClassName('navEditKeypoints')[0];
  }

  _updateUI() {
    let keypointList = this._collateKeypoints();
    this._loadKeypointList(keypointList);
  }
        
  _showEditKeypoints() {
    let keypointList = this._collateKeypoints();
    this._loadKeypointList(keypointList);
  }
  
  _collateKeypoints() {
    let keypointList = this.settings.info.general.keypoints;
    
    keypointList = keypointList.sort(
      function(a,b) {
        let res = a.category.localeCompare(b.category);
        
        if (res == 0) {
          res = a.keypointtext.toLowerCase().localeCompare(b.keypointtext.toLowerCase());
        }
        
        return res;
      }
    );
    
    return keypointList;
  }
  
  _loadKeypointList(keypointList) {
    let container = this.config.keypointContainer.getElementsByClassName('keypoint-container')[0];
    UtilityKTS.removeChildren(container);
    
    let elemTemplate = this.config.keypointContainer.getElementsByClassName('item-template')[0];
    for (let i = 0; i < keypointList.length; i++) {
      let keypoint = keypointList[i];
      let elemItem = elemTemplate.cloneNode(true);
      container.appendChild(elemItem);
      UtilityKTS.setClass(elemItem, this.settings.hideClass, false);
      UtilityKTS.setClass(elemItem, 'item-template', false);
      
      let elemCategory = elemItem.getElementsByClassName('select-category')[0];
      EditUtilities._selectByText(elemCategory, keypoint.category);
      
      elemItem.getElementsByClassName('keypoint-text')[0].value = keypoint.keypointtext;
      
      elemItem.setAttribute("keypoint-info", JSON.stringify(keypoint));
      
      elemItem.getElementsByClassName('edit-control')[0].addEventListener('click', (e) => { this._handleEditControl(e); });
    }    
  }
  
  async _addKeypoint() {
    const msg = "Please enter the text for the new keypoint";
    const keypointText = prompt(msg);
    
    if (!keypointText || keypointText.length == 0) return;

    const success = await this._addKeypointToDB(keypointText);
    if (!success) return;
    
    await this.config.callbackRefreshData();
  }
  
  async _reloadKeypoints() {
    const msg = 'Any changes will be lost. Continue?';
    if (!confirm(msg)) return;
    
    this._updateUI();
  }

  async _saveKeypoints() {
    let container = this.config.keypointContainer.getElementsByClassName('keypoint-container')[0];
    let keypointList = [];
    
    let keypointItems = container.getElementsByClassName('keypoint-item');
    for (let i = 0; i < keypointItems.length; i++) {
      let keypoint = keypointItems[i];
      let keypointId = JSON.parse(keypoint.getAttribute('keypoint-info')).keypointid;

      let elemCategory = keypoint.getElementsByClassName('select-category')[0];
      let category = elemCategory[elemCategory.selectedIndex].text;

      let keypointText = keypoint.getElementsByClassName('keypoint-text')[0].value;
      
      keypointList.push({
        "keypointid": keypointId,
        "category": category,
        "keypointtext": keypointText
      });
    }
    
    const success = await this._saveKeypointsToDB(keypointList);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    EditUtilities._blipNotice(this.config.notice, 'keypoint data saved');
  }

  async _deleteKeypoint(keypointInfo) {
    const msg = 'This keypoint \n' +
                '-----------------------------\n' +
                '  category: ' + keypointInfo.category + '\n' +
                '  ' + keypointInfo.keypointtext + '\n' +
                '-----------------------------\n' +
                'will be deleted. Are you sure?';
    if (!confirm(msg)) return;
    
    const success = await this._deleteKeypointFromDB(keypointInfo.keypointid);
    if (!success) return;
    
    await this.config.callbackRefreshData();
  }
    
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleEditControl(e) {
    console.log('EditKeypoints', e.target);
    if (e.target.classList.contains('disabled')) return;
    if (!e.target.classList.contains('edit-control-keypoint')) return;

      
    if (e.target.classList.contains('reload')) {
      this._reloadKeypoints();
    } else if (e.target.classList.contains('save')) {
      this._saveKeypoints();
    } else if (e.target.classList.contains('add')) {
      this._addKeypoint();
    } else if (e.target.classList.contains('delete')) {
      this._deleteKeypoint(EditUtilities._findNodeInfo(e.target, 'keypoint-item', 'keypoint-info'));
    }
  }

  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------
  async _addKeypointToDB(keypointText) {
    let params = {
      "category": "other",
      "keypointtext": keypointText
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/insert', 'keypoint', params, this.config.notice);
    
    return dbResult.success;
  }
 
  async _saveKeypointsToDB(keypointList) {
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/update', 'keypoint', keypointList, this.config.notice);
    
    return dbResult.success;
  }
 
  async _deleteKeypointFromDB(keypointId) {
    let params = {
      "keypointid": keypointId
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/delete', 'keypoint', params, this.config.notice);
    
    return dbResult.success;
  }

  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
