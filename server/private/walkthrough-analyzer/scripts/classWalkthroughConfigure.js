//-------------------------------------------------------------------
// WalkthroughConfigure
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class WalkthroughConfigure {
  constructor(config) {
    console.log('add mandatory flag to relevant criteria');
    this.config = config;
    this.config.data = null;
    
    this.config.elemDatasetList = this.config.container.getElementsByClassName('dataset-list')[0];
    this.config.elemDatasetTemplate = this.config.container.getElementsByClassName('dataset-template')[0];
    this.config.elemNoDatasets = this.config.container.getElementsByClassName('no-datasets')[0];
    
    this.config.elemHideEmpty = this.config.container.getElementsByClassName('filter-emptyitems')[0];
    this.config.elemHideEmpty.addEventListener('click', (e) => { this._handleHideEmpty(e); });
    
    this._initializeUploadFileInfo();
  }
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  show(data) {
    this.config.data = data;
    this._renderDatasetList();
    this._renderFilterSettings();
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------
  _initializeUploadFileInfo() {
    var elemResultWalkthrough = this.config.container.getElementsByClassName('upload-result walkthrough')[0];

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
  
  _renderFilterSettings() {
    this.config.elemHideEmpty.checked = this.config.filter.getHideEmpty();
    
    let fullCriteria = this.config.filter.getFullCriteria();

    let domainList = [];
    for (let id in fullCriteria) {
      domainList.push(fullCriteria[id]);
    }
    domainList.sort(function(a, b) {
      return (a.domainnumber - b.domainnumber);
    });
    
    let elemDomainFilterContainer = this.config.container.getElementsByClassName('domain-filter-container')[0];
    UtilityKTS.removeChildren(elemDomainFilterContainer);
    
    for (let i = 0; i < domainList.length; i++) {
      let domain = domainList[i];
      elemDomainFilterContainer.appendChild(this._renderDomainFilter(domain));
    }    
  }
  
  _renderDomainFilter(domain) {
    let elemDomainTemplate = this.config.container.getElementsByClassName('filter-domain-template')[0];
    let elemDomain = elemDomainTemplate.cloneNode(true);
    
    elemDomain.setAttribute('domaininfo', JSON.stringify(domain));
    
    UtilityKTS.setClass(elemDomain, 'filter-domain-template', false);
    UtilityKTS.setClass(elemDomain, 'filter-domain', true);
    UtilityKTS.setClass(elemDomain, this.config.hideClass, false);
    
    let elemInput = elemDomain.getElementsByClassName('form-check-input')[0];
    let elemLabel = elemDomain.getElementsByClassName('form-check-label')[0];
    
    elemInput.setAttribute('id','checkFilterDomain' + domain.domainnumber);
    elemInput.addEventListener('click', (e) => { this._handleDomainFilter(e); });
    
    elemLabel.setAttribute('for', 'checkFilterDomain' + domain.domainnumber);
    elemLabel.innerHTML = domain.domainnumber + '. ' + domain.domaindescription;
    
    let excludedCriteriaCount = 0;
    for (let i = 0; i < domain.criteria.length; i++) {
      let criterion = domain.criteria[i];
      elemDomain.appendChild(this._renderCriterionFilter(criterion));
      if (this.config.filter.criterionIsExcluded(criterion)) excludedCriteriaCount++;
    }
    
    elemInput.indeterminate = !(excludedCriteriaCount == 0 || excludedCriteriaCount == domain.criteria.length);
    elemInput.checked = (excludedCriteriaCount == 0);
      
    return elemDomain;
  }
  
  _renderCriterionFilter(criterion) {
    let elemCriterionTemplate = this.config.container.getElementsByClassName('filter-criterion-template')[0];
    let elemCriterion = elemCriterionTemplate.cloneNode(true);
    
    elemCriterion.setAttribute('criterioninfo', JSON.stringify(criterion));

    UtilityKTS.setClass(elemCriterion, 'filter-criterion-template', false);
    UtilityKTS.setClass(elemCriterion, 'filter-criterion', true);
    UtilityKTS.setClass(elemCriterion, this.config.hideClass, false);

    let elemInput = elemCriterion.getElementsByClassName('form-check-input')[0];
    let elemLabel = elemCriterion.getElementsByClassName('form-check-label')[0];
    
    elemInput.setAttribute('id','checkFilterCriterion' + criterion.criterionid);
    elemInput.checked = !this.config.filter.criterionIsExcluded(criterion);
    elemInput.addEventListener('click', (e) => { this._handleCriterionFilter(e); });
    
    elemLabel.setAttribute('for', 'checkFilterCriterion' + criterion.criterionid);
    elemLabel.innerHTML = criterion.criteriontext;

    return elemCriterion;
  }
  
  async _doFileUpload(uploadType, file) {
    this.config.notice.setNotice('loading...', true);

    var elemResult = this.config.container.getElementsByClassName('upload-result ' + uploadType)[0];
    
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
  
  _findControlContainer(elem, controlType) {
    let className = 'dataset';
    if (controlType == 'domainfilter') className = 'filter-domain';
    if (controlType == 'criterionfilter') className = 'filter-criterion';
    
    let container = null;
    let node = elem;
    for (let i = 0; i < 5 && !container; i++) {
      if (node.classList.contains(className)) {
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
  
  async _saveDomainFilters(domainInfo, checked) {
    let criterionIdList = [];
    for (let i = 0; i < domainInfo.criteria.length; i++) {
      criterionIdList.push(domainInfo.criteria[i].criterionid);
    }
    let params = { "excluded": criterionIdList, "included": [] };
    if (checked) params = { "excluded": [], "included": criterionIdList };
    
    let dbResult = await SQLDBInterface.doPostQuery('walkthrough-analyzer/update', 'filter-criterionlist', params, this.config.notice);

    if (dbResult.success) {
      await this.config.filter.refreshFilterSettings()
      await this.config.callbackUpdate();
    }
  }
  
  async _saveCriterionFilter(criterionInfo, checked) {
    let params = { 
      "criterionid": criterionInfo.criterionid, 
      "include": checked
    }
    
    let dbResult = await SQLDBInterface.doPostQuery('walkthrough-analyzer/update', 'filter-criterion', params, this.config.notice);

    if (dbResult.success) {
      await this.config.filter.refreshFilterSettings()
      await this.config.callbackUpdate();
    }
  }
  
  //--------------------------------------------------------------
  // callbacks
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  async _handleDatasetSelection(e) {
    this._setContainerEnable(false);

    let datasetContainer = this._findControlContainer(e.target, 'dataset');
    let datasetSelected = e.target.checked
    if (datasetContainer) await this._saveDatasetSelection(JSON.parse(datasetContainer.getAttribute('dataset-info')), datasetSelected);

    this._setContainerEnable(true);
  }
  
  async _handleEditDataset(e) {
    this._setContainerEnable(false);

    let datasetContainer = this._findControlContainer(e.target, 'dataset');
    if (datasetContainer) await this._editDataset(JSON.parse(datasetContainer.getAttribute('dataset-info')));

    this._setContainerEnable(true);
  }
  
  async _handleDeleteDataset(e) {
    this._setContainerEnable(false);

    let datasetContainer = this._findControlContainer(e.target, 'dataset');
    if (datasetContainer) await this._deleteDataset(JSON.parse(datasetContainer.getAttribute('dataset-info')));

    this._setContainerEnable(true);
  }
  
  async _handleFileUpload(e) {
    if (e.target.files.length == 0) return;
    
    this._setContainerEnable(false);

    await this._doFileUpload('walkthrough', e.target.files[0]);
    e.target.value = null;
    
    this._setContainerEnable(true);
  }
  
  async _handleHideEmpty(e) {
    let success = await this.config.filter.setHideEmpty(e.target.checked);
    if (success) await this.config.callbackUpdate();
  }
  
  async _handleDomainFilter(e) {
    let container = this._findControlContainer(e.target, 'domainfilter');
    if (container) await this._saveDomainFilters(JSON.parse(container.getAttribute('domaininfo')), e.target.checked);
  }
  
  async _handleCriterionFilter(e) {
    let container = this._findControlContainer(e.target, 'criterionfilter');
    if (container) await this._saveCriterionFilter(JSON.parse(container.getAttribute('criterioninfo')), e.target.checked);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
