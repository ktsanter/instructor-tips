//-------------------------------------------------------------------
// RecipesEdit
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class RecipesEdit {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    console.log('RecipesEdit.render');
    var btn = this.config.container.getElementsByClassName('temp-finish')[0];
    btn.addEventListener('click', (e) => { this.config.callbackFinishEditing({}); });
  }
  
  async update() {
    console.log('RecipesEdit.update');
  }
  
  beginAdd() {
    console.log('RecipesEdit.beginAdd');
  }
  
  beginEdit(params) {
    console.log('RecipesEdit.beginEdit', params);
  }
  
  beginDelete(params) {
    console.log('RecipesEdit.beginDelete', params);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------

  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
