//-----------------------------------------------------------------------------------
// TreasureHuntProjectControl class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class TreasureHuntProjectControl {
  constructor(config) {
    this._version = '0.01';
    this._title = 'TreasureHuntProjectControl';
    
    this._HIDE_CLASS = 'treasurehuntprojectcontrol-hide';

    this._config = {};
    if (config) this._config = config;
    
    this._container = null;
  }
 
  //--------------------------------------------------------------
  // initial rendering
  //--------------------------------------------------------------
  async render() {
    this._container = CreateElement.createDiv(null, 'treasurehuntprojectcontrol');
    
    this._notice = new StandardNotice(this._container, this._container);
    this._notice.setNotice('');

    this._container.appendChild(this._renderContents());
    this._container.appendChild(this._renderDialogs());

    return this._container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'treasurehuntprojectcontrol-contents');
    
    container.appendChild(this._renderProjectOptions());
    container.appendChild(this._renderProjectSelect());
    container.appendChild(this._renderProjectPreview());
    
    return container;
  }

  _renderDialogs() {
    var container = CreateElement.createDiv(null, 'treasurehuntprojectcontrol-dialogs');
    
    this._addProjectDialog = new TreasureHuntDialog({
      dialogtype: 'add-project',
      confirmcallback: (args) => {this._finishProjectAdd(args);},
      cancelcallback: () => {this._cancelProjectAdd();} 
    });
    this._editProjectDialog = new TreasureHuntDialog({
      dialogtype: 'edit-project',
      confirmcallback: (args) => {this._finishProjectEdit(args);},
      cancelcallback: () => {this._cancelProjectEdit();} 
    });
    this._deleteProjectDialog = new TreasureHuntDialog({
      dialogtype: 'delete-project',
      confirmcallback: (args) => {this._finishProjectDelete(args);},
      cancelcallback: () => {this._cancelProjectDelete();} 
    });
    
    container.appendChild(this._addProjectDialog.render());
    container.appendChild(this._editProjectDialog.render());
    container.appendChild(this._deleteProjectDialog.render());
    
    return container;
  }
  
  _renderProjectOptions() {
    var container = CreateElement.createDiv(null, 'projectoptions notshown');
    
    container.addEventListener('mouseover', (e) => {return this._optionsFlyout(true);});
    container.addEventListener('mouseout', (e) => {return this._optionsFlyout(false);});

    var iconcontainer = CreateElement.createDiv(null, 'iconcontainer notshown');
    container.appendChild(iconcontainer);
    
    iconcontainer.appendChild(CreateElement.createIcon(null, 'icon fas fa-cog', 'add/edit/delete project'));
    
    var subcontainer = CreateElement.createDiv(null, 'suboptions notshown');
    container.appendChild(subcontainer);

    var handler = (e) => {return this._startProjectAdd(e);};
    subcontainer.appendChild(CreateElement.createIcon(null, 'icon subicon add far fa-plus-square', 'create new project', handler));
    
    handler = (e) => {return this._startProjectEdit(e);};
    subcontainer.appendChild(CreateElement.createIcon(null, 'icon subicon edit fas fa-edit', 'edit the parameters for this project', handler));
    
    handler = (e) => {return this._startProjectDelete(e);};
    subcontainer.appendChild(CreateElement.createIcon(null, 'icon subicon delete far fa-trash-alt trash', 'delete this project', handler));    
    
    return container;
  }
  
  _renderProjectSelect() {
    var elem = CreateElement.createSelect(null, 'projectselect select-css', null, []);
    
    return elem;
  }
  
  _renderProjectPreview() {
    var container = CreateElement.createDiv(null, 'projectpreview');

    var handler = (e) => {return this._handleProjectPreview(e);};    
    container.appendChild(CreateElement.createIcon(null, 'icon fa fa-eye', 'preview project', handler));

    return container;
  }
            
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  show(makeVisible) {
    this._showElement(this._container, makeVisible);
  }
  
  _showContents(makeVisible) {
    var contents = this._container.getElementsByClassName('treasurehuntprojectcontrol-contents')[0];
    this._showElement(contents, makeVisible);
  }
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    await this._getProjectList();

    var handler = (e) => {return this._handleProjectSelect(e);};    
    var selectList = [];
    for (var i = 0; i < this._projects.length; i++) {
      var project = this._projects[i];
      selectList.push({value: project.projectid, textval: project.projectname});
    }

    var elemCurrentSelect = this._container.getElementsByClassName('projectselect')[0];
    var elemNewSelect = CreateElement.createSelect(null, 'projectselect select-css', handler, selectList);
    elemCurrentSelect.parentNode.replaceChild(elemNewSelect, elemCurrentSelect);
    this._config.callbackSelectionChanged();
  }

  isProjectSelected() {
    var elemSelect = this._container.getElementsByClassName('projectselect')[0];
    var index = elemSelect.selectedIndex;
    
    return (index >= 0);
  }
  
  setPairedChild(objChild) {
    this._config.pairedChild = objChild;
  }
  
  getProjectLayout() {
    var projectLayout;
    
    var elemSelect = this._container.getElementsByClassName('projectselect')[0];
    var index = elemSelect.selectedIndex;
    if (index >= 0) {
      projectLayout = this._projects[index];
    }
    
    return projectLayout;
  }
   
  getProjectClues() {
    var projectClues;
    
    var elemSelect = this._container.getElementsByClassName('projectselect')[0];
    var index = elemSelect.selectedIndex;
    if (index >= 0) {
      var projectId = this._projects[index].projectid;
      projectClues = this._clues[projectId];
    }
    
    return projectClues;
  }
  
  _startDialog(objDialog, params) {
    this._config.pairedChild.show(false);
    this._showContents(false);
    objDialog.show(true);
    objDialog.update(params);
  }
  
  _endDialog(objDialog) {
    this._config.pairedChild.show(true);
    this._showContents(true);
  }

  //--------------------------------------------------------------
  // DB interactions
  //-------------------------------------------------------------- 
  async _getProjectList() {
    var projectList;
    
    var queryResults = await SQLDBInterface.doGetQuery('treasurehunt/query', 'projectlist', this._notice);
    if (queryResults.success) {
      this._projects = queryResults.projects;
      this._clues = queryResults.clues;
      projectList = queryResults.projects;
    }
    
    return this._projects;
  }
  
  async _insertProject(params) {
    console.log('add project: name=' + params.projectname + ' - add DB interface');
    return true; // succcess or failure
  }
  
  async _updateProject(params) {
    console.log('update project: id=' + params.projectid + ' name=' + params.projectname + ' - add DB interface');
    return true; // succcess or failure
  }
  
  async _deleteProject(params) {
    console.log('delete project: id=' + params.projectid + ' - add DB interface');
    return true; // succcess or failure
  }
  
  //--------------------------------------------------------------
  // handlers
  //-------------------------------------------------------------- 
  _optionsFlyout(showContents) {
    var container = this._container.getElementsByClassName('projectoptions')[0];
    var iconcontainer = container.getElementsByClassName('iconcontainer')[0];
    var subcontainer = container.getElementsByClassName('suboptions')[0];
    
    if (showContents) {
      container.classList.remove('notshown');
      iconcontainer.classList.remove('notshown');
      subcontainer.classList.remove('notshown');
    } else {
      container.classList.add('notshown');
      iconcontainer.classList.add('notshown');
      subcontainer.classList.add('notshown');
    }
  }
  
  _handleProjectSelect(e) {
    this._config.callbackSelectionChanged();
  }
  
  _handleProjectPreview(e) {
    console.log('preview project');
  }
  
  // start dialogs
  _startProjectAdd(e) {
    this._startDialog(this._addProjectDialog);
  }
  
  _startProjectEdit(e) {
    this._startDialog(this._editProjectDialog, this.getProjectLayout());
  }
  
  _startProjectDelete(e) {
    this._startDialog(this._deleteProjectDialog, this.getProjectLayout());
  }
  
  // finish dialogs (action confirmed)
  async _finishProjectAdd(params) {
    if (await this._insertProject(params)) {
      this._endDialog(this._addProjectDialog);
      await this.update();
    }   
  }
  
  async _finishProjectEdit(params) {
    if (await this._updateProject(params)) {
      this._endDialog(this._editProjectDialog);
      await this.update();
    }      
  }
  
  async _finishProjectDelete(params) {
    if (await this._deleteProject(params)) {
      this._endDialog(this._deleteProjectDialog);
      await this.update();
    }
  }
  
  // cancel dialogs (action cancelled)
  _cancelProjectAdd() {
    this._endDialog(this._addProjectDialog);
  }
  
  _cancelProjectEdit() {
    this._endDialog(this._editProjectDialog);
  }  

  _cancelProjectDelete() {
    this._endDialog(this._deleteProjectDialog);
  }  
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
}
