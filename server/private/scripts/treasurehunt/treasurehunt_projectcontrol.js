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

    return this._container;
  }

  _renderContents() {
    var container = CreateElement.createDiv(null, 'treasurehuntprojectcontrol-contents');
    
    container.appendChild(this._renderProjectOptions());
    container.appendChild(this._renderProjectSelect());
    container.appendChild(this._renderProjectPreview());
    
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

    var handler = (e) => {return this._handleProjectAdd(e);};
    subcontainer.appendChild(CreateElement.createIcon(null, 'icon subicon add far fa-plus-square', 'create new project', handler));
    
    handler = (e) => {return this._handleProjectEdit(e);};
    subcontainer.appendChild(CreateElement.createIcon(null, 'icon subicon edit fas fa-edit', 'edit the parameters for this project', handler));
    
    handler = (e) => {return this._handleProjectDelete(e);};
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
  
  _showElement(elem, makeVisible) {
    if (elem.classList.contains(this._HIDE_CLASS)) {
      elem.classList.remove(this._HIDE_CLASS);
    }
    
    if (!makeVisible) {
      elem.classList.add(this._HIDE_CLASS);
    }
  }

  async update() {
    console.log('TreasureHuntProjectControl.update');

    var handler = (e) => {return this._handleProjectSelect(e);};
    var projectList = await this._getProjectList();

    var elemCurrentSelect = this._container.getElementsByClassName('projectselect')[0];
    var elemNewSelect = CreateElement.createSelect(null, 'projectselect select-css', handler, projectList);
    elemCurrentSelect.parentNode.replaceChild(elemNewSelect, elemCurrentSelect);    
    return;
    
    /*
    var state = await this._loadStateFromDB();
   
    if (state) {
      //update particulars
    }
    */
  }
  
  async _getProjectList() {
    var projectList = [
      {value: 1, textval: 'Foundations of Programming B (2020-2021 Sem1'},
      {value: 2, textval: 'JavaScript Game Design (2020-2021 Sem1'}
    ];
    
    return projectList;
  }
  
  getProjectInfo() {
    var projectInfo = null;
    
    var elemSelect = this._container.getElementsByClassName('projectselect')[0];
    var index = elemSelect.selectedIndex;
    if (index >= 0) {
      projectInfo = {
        projectId: elemSelect[index].value,
        projectName: elemSelect[index].text
      };
    }
    
    return projectInfo;
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
    this._config.updateCallback(this.getProjectInfo());
  }
  
  _handleProjectAdd(e) {
    console.log('add project');
  }
  
  _handleProjectEdit(e) {
    console.log('edit project');
  }
  
  _handleProjectDelete(e) {
    console.log('delete project');
  }
  
  _handleProjectPreview(e) {
    console.log('preview project');
  }
  
  //--------------------------------------------------------------
  // utility methods
  //--------------------------------------------------------------  
}
