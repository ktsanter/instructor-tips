//-------------------------------------------------------------------
// EditResourceLinks
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class EditResourceLinks {
  constructor(config) {
    this.config = config;
    this.settings = {
      hideClass: 'hide-me',
      
      info: null,

      selectedResourcelinkId: null,
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
      'edit-control edit-control-resourcelink',
      (e) => { this._handleEditControl(e); }
    );

    this.config.resourcelinkSelect = this.config.container.getElementsByClassName('select-resourcelink')[0];
    this.config.resourcelinkEditContainer = this.config.container.getElementsByClassName('resourcelink-edit-container')[0];
    this.config.resourcelinkSelect.addEventListener('change', (e) => { this._handleResourcelinkSelect(e); });
  }

  _updateUI() {
    const container = this.config.resourcelinkEditContainer;
    
    EditUtilities._enableEditControls(this.config.container, 'edit-control-resourcelink-conditional', false);
    EditUtilities._clearFormValuesInContainer(container);

    this._loadResourcelinkSelect();
  }
  
  //--------------------------------------------------------------
  // edit resource links
  //--------------------------------------------------------------   
  _loadResourcelinkSelect() {
    let resourcelinkList = this.settings.info.general.resourcelink.sort( 
      function(a, b) {
        return a.templateitem.toLowerCase().localeCompare(b.templateitem.toLowerCase());
      }
    );
    
    UtilityKTS.removeChildren(this.config.resourcelinkSelect);
    let selectedIndex = -1;
    for (let i = 0; i < resourcelinkList.length; i++) {
      let resourcelink = resourcelinkList[i];
      let elemItem = CreateElement.createOption(null, 'select-resourcelink-option', i, resourcelink.templateitem);
      this.config.resourcelinkSelect.appendChild(elemItem);
      elemItem.setAttribute("resourcelink-info", JSON.stringify(resourcelink));
      
      if (resourcelink.resourcelinkid == this.settings.selectedResourcelinkId) selectedIndex = i;      
    }
    
    this.config.resourcelinkSelect.selectedIndex = selectedIndex;
    UtilityKTS.setClass(this.config.resourcelinkEditContainer, this.settings.hideClass, selectedIndex < 0);    
    EditUtilities._enableEditControls(this.config.container, 'edit-control-resourcelink-conditional', selectedIndex >= 0);
    
    if (selectedIndex >= 0) EditUtilities._triggerChange(this.config.resourcelinkSelect);
  }
    
  _loadResourcelink(resourcelinkInfo) {
    EditUtilities._enableEditControls(this.config.container, 'edit-control-resourcelink-conditional', true);
    const container = this.config.resourcelinkEditContainer;
    const elemRestriction = container.getElementsByClassName('select-restriction')[0];
    
    EditUtilities._clearFormValuesInContainer(container);
    elemRestriction.selectedIndex = -1;
    
    EditUtilities._setValueInContainer(container, 'templateitem', resourcelinkInfo.templateitem);
    EditUtilities._selectByText(elemRestriction, resourcelinkInfo.restriction);
    EditUtilities._setValueInContainer(container, 'linktext', resourcelinkInfo.linktext);
    EditUtilities._setValueInContainer(container, 'linkurl', resourcelinkInfo.linkurl);
    
    container.setAttribute('resourcelink-info', JSON.stringify(resourcelinkInfo));
    this.settings.selectedResourcelinkId = resourcelinkInfo.resourcelinkid;
    UtilityKTS.setClass(this.config.resourcelinkEditContainer, this.settings.hideClass, false);
  }

  async _reloadResourcelink() {
    const msg = 'Any changes will be lost. Continue?';
    if (!confirm(msg)) return;
    
    const container = this.config.resourcelinkEditContainer;
    const infoOriginal = JSON.parse(container.getAttribute('resourcelink-info'));
    this._loadResourcelink(infoOriginal);
  }
    
  async _saveResourcelink() {
    if (!this.settings.selectedResourcelinkId) return;
    
    const container = this.config.resourcelinkEditContainer;

    let resourcelinkInfo = {};
    resourcelinkInfo.resourcelinkid = JSON.parse(container.getAttribute('resourcelink-info')).resourcelinkid;
    resourcelinkInfo.templateitem = EditUtilities._getValueFromContainer(container, 'templateitem');
    resourcelinkInfo.restriction = EditUtilities._getValueFromContainer(container, 'select-restriction');
    resourcelinkInfo.linktext = EditUtilities._getValueFromContainer(container, 'linktext');
    resourcelinkInfo.linkurl = EditUtilities._getValueFromContainer(container, 'linkurl');
    
    const success = await this._saveResourcelinkToDB(resourcelinkInfo);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    EditUtilities._blipNotice(this.config.notice, 'resource link info saved');
  }
  
  async _addResourcelink() {
    const msg = "Please enter the template tag for the new resource link";
    const templateTag = prompt(msg);
    
    if (!templateTag || templateTag.length == 0) return;

    const success = await this._addResourcelinkToDB(templateTag);
    if (!success) return;
    
    await this.config.callbackRefreshData();
    EditUtilities._forceSelection(this.config.resourcelinkSelect, templateTag);
  }
  
  async _deleteResourcelink() {
    if (!this.settings.selectedResourcelinkId) return;
    
    const container = this.config.resourcelinkEditContainer;
    const resourcelinkInfo = JSON.parse(container.getAttribute('resourcelink-info'));
    const templateTag = resourcelinkInfo.templateitem
    
    const msg = 'This resource link \n' +
                templateTag + '\n ' +
                'will be deleted. Are you sure?';
    if (!confirm(msg)) return;

    const success = await this._deleteResourcelinkFromDB(resourcelinkInfo.resourcelinkid);
    if (!success) return;

    this.settings.selectedResourcelinkId = null;
    await this.config.callbackRefreshData();
  }
      
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleEditControl(e) {
    if (e.target.classList.contains('disabled')) return;
    if (!e.target.classList.contains('edit-control-resourcelink')) return;
    
    
    if (e.target.classList.contains('reload')) {
      this._reloadResourcelink();
    } else if (e.target.classList.contains('save')) {
      this._saveResourcelink();
    } else if (e.target.classList.contains('add')) {
      this._addResourcelink();
    } else if (e.target.classList.contains('delete')) {
      this._deleteResourcelink();
    }
  }

  _handleResourcelinkSelect(e) {
    const optionSelected = e.target[e.target.selectedIndex];
    const info = JSON.parse(optionSelected.getAttribute('resourcelink-info'));
    this._loadResourcelink(info);
  }

  //--------------------------------------------------------------
  // database
  //--------------------------------------------------------------
  async _addResourcelinkToDB(templateTag) {
    let params = {
      "templateitem": templateTag
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/insert', 'resourcelink', params, this.config.notice);
    
    return dbResult.success;
  }
   
  async _saveResourcelinkToDB(resourcelinkInfo) {
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/update', 'resourcelink', resourcelinkInfo, this.config.notice);
    
    return dbResult.success;
  }
  
  async _deleteResourcelinkFromDB(resourcelinkId) {
    let params = {
      "resourcelinkid": resourcelinkId
    };
    
    let dbResult = await SQLDBInterface.doPostQuery('coursepolicies/delete', 'resourcelink', params, this.config.notice);
    
    return dbResult.success;
  }
   
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
