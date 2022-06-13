//-------------------------------------------------------------------
// WalkthroughConfigure
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class WalkthroughConfigure {
  constructor(config) {
    this.config = config;
    this.config.data = null;
    
    this.config.elemDatasetList = this.config.container.getElementsByClassName('dataset-list')[0];
    this.config.elemDatasetTemplate = this.config.container.getElementsByClassName('dataset-template')[0];
    this.config.elemNoDatasets = this.config.container.getElementsByClassName('no-datasets')[0];
    
    this._initializeUploadFileInfo();
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  show(data) {
    this.config.data = data;
    this._renderDatasetList();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------
  _initializeUploadFileInfo() {
    var elemResultWalkthrough = this.config.container.getElementsByClassName('upload-result walkthrough')[0];
    var elemStatus = this.config.container.getElementsByClassName('configure-status')[0];
    
    elemResultWalkthrough.innerHTML = '';

    UtilityKTS.removeChildren(elemStatus);

    var fileUploads = this.config.container.getElementsByClassName('uploadfile');
    for (var i = 0; i < fileUploads.length; i++) {
      fileUploads[i].addEventListener('change', (e) => { this._handleFileUpload(e); });
    }
  }
  
  _renderDatasetList() {
    UtilityKTS.removeChildren(this.config.elemDatasetList);
    
    let dataSets = this.config.data.datasets.sort(function(a, b) {
      return a.walkthroughsetname.localeCompare(b.walkthroughsetname);
    });
    UtilityKTS.setClass(this.config.elemDatasetList, this.config.hideClass, dataSets.length == 0);
    UtilityKTS.setClass(this.config.elemNoDatasets, this.config.hideClass, dataSets.length > 0);
    
    let selectedSets = [];
    for (let i = 0; i < this.config.data.datasetselections.length; i++) {
      selectedSets.push(this.config.data.datasetselections[i].walkthroughsetid)
    }
    
    for (let i = 0; i < dataSets.length; i++) {
      let dataset = dataSets[i];
      let elem = this.config.elemDatasetTemplate.cloneNode(true);
      this.config.elemDatasetList.appendChild(elem);
 
      UtilityKTS.setClass(elem, this.config.hideClass, false);
      UtilityKTS.setClass(elem, 'dataset-template', false);
      UtilityKTS.setClass(elem, 'dataset', true);
      
      elem.setAttribute("dataset-info", JSON.stringify(dataset));
      elem.getElementsByClassName('dataset-checkbox')[0].addEventListener('click', (e) => { this._handleDatasetSelection(e); });
      elem.getElementsByClassName('dataset-name')[0].innerHTML = dataset.walkthroughsetname;
      elem.getElementsByClassName('edit-dataset')[0].addEventListener('click', (e) => { this._handleEditDataset(e); });
      elem.getElementsByClassName('delete-dataset')[0].addEventListener('click', (e) => { this._handleDeleteDataset(e); });
      
      let elemCheck = elem.getElementsByClassName('dataset-checkbox')[0];
      if (selectedSets.includes(dataset.walkthroughsetid)) elemCheck.checked = true;
    }
  }
  
  async _doFileUpload(uploadType, file) {
    this.config.notice.setNotice('loading...', true);

    var elemResult = this.config.container.getElementsByClassName('upload-result ' + uploadType)[0];
    var elemStatus = this.config.container.getElementsByClassName('configure-status')[0];
    UtilityKTS.removeChildren(elemStatus);
    
    let datasetName = prompt("Name for the new data set?");
    if (datasetName == null) {
      this.config.notice.setNotice('');
      return;
    }
    
    var url = '/usermanagement/routeToApp/walkthrough-analyzer/upload/' + uploadType;    
    var result = await this.config.poster.post(url, file, datasetName);
    
    var resultElem = this.config.container.getElementsByClassName('upload-result')[0];
    resultElem.innerHTML = '';
    
    if (!result.success) {
      elemResult.innerHTML = result.details;
      if (result.details.includes('Duplicate entry')) {
        elemResult.innerHTML = 'The dataset titled "datasetName" already exists.  Please try a different name.';
      }
      this.config.notice.setNotice('');
      return;
    }

    elemResult.innerHTML = result.details;
    
    await this.config.callbackUpdate();

    this.config.notice.setNotice('');
  }
    
  _setContainerEnable(enable) {
    UtilityKTS.setClass(this.config.container, 'disable-container', !enable);
  }  
  
  _findDatasetContainer(elem) {
    let container = null;
    let node = elem;
    for (let i = 0; i < 5 && !container; i++) {
      if (node.classList.contains('dataset')) {
        container = node;
      } else {
        node = node.parentNode;
      }        
    }
    
    return container;
  }
  
  async _saveDatasetSelection(datasetInfo, datasetSelected) {
    let params = {
      "walkthroughsetid": datasetInfo.walkthroughsetid,
      "selected": datasetSelected
    }

    let dbResult = await SQLDBInterface.doPostQuery('walkthrough-analyzer/update', 'walkthrough-dataset-selection', params, this.config.notice);
    
    if (dbResult.success) await this.config.callbackUpdate();
  }
  
  async _editDataset(datasetInfo) {
    let newDatasetName = prompt('Please enter the new data set name for\n"' + datasetInfo.walkthroughsetname + '"');
    if (!newDatasetName) return;
    
    let params = {
      "walkthroughsetid": datasetInfo.walkthroughsetid,
      "walkthroughsetname": newDatasetName
    }

    let dbResult = await SQLDBInterface.doPostQuery('walkthrough-analyzer/update', 'walkthrough-dataset', params, this.config.notice);

    if (dbResult.success) await this.config.callbackUpdate();
  }
  
  async _deleteDataset(datasetInfo) {
    let response = confirm('Are you sure you want to delete the data set named\n"' + datasetInfo.walkthroughsetname + '" ?');
    if (!response) return;
    
    let dbResult = await SQLDBInterface.doPostQuery('walkthrough-analyzer/delete', 'walkthrough-dataset', datasetInfo, this.config.notice);

    if (dbResult.success) await this.config.callbackUpdate();
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _handleDatasetSelection(e) {
    let datasetContainer = this._findDatasetContainer(e.target);
    let datasetSelected = e.target.checked
    if (datasetContainer) await this._saveDatasetSelection(JSON.parse(datasetContainer.getAttribute('dataset-info')), datasetSelected);
  }
  
  async _handleEditDataset(e) {
    let datasetContainer = this._findDatasetContainer(e.target);
    if (datasetContainer) await this._editDataset(JSON.parse(datasetContainer.getAttribute('dataset-info')));
  }
  
  async _handleDeleteDataset(e) {
    let datasetContainer = this._findDatasetContainer(e.target);
    if (datasetContainer) await this._deleteDataset(JSON.parse(datasetContainer.getAttribute('dataset-info')));
  }
  
  async _handleFileUpload(e) {
    if (e.target.files.length == 0) return;
    
    this._setContainerEnable(false);

    await this._doFileUpload('walkthrough', e.target.files[0]);
    e.target.value = null;
    
    this._setContainerEnable(true);
  }
  
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
