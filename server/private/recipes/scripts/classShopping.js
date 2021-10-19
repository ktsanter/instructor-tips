//-------------------------------------------------------------------
// Shopping
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Shopping {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.shoppingTableBody = this.config.container.getElementsByClassName('shoppinglist-body')[0];
    this.shoppingTemplateRow = this.config.container.getElementsByClassName('shoppinglist-templaterow')[0];

  }
  
  async update() {
    console.log('Shopping.update');
    var shoppingList = await this.config.db.getShoppingList();
    if (shoppingList == null) return;
    
    this._loadShopping(shoppingList);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _loadShopping(shoppingList) {
    UtilityKTS.removeChildren(this.shoppingTableBody);
    for (var i = 0; i < shoppingList.length; i++) {
      this._addIngredientRow(shoppingList[i]);
    }
  }
  
  _addIngredientRow(ingredient) {
    var row = this.shoppingTemplateRow.cloneNode(true);
    
    UtilityKTS.setClass(row, this.config.hideClass, false);
    UtilityKTS.setClass(row, 'shoppinglist-templaterow', false);
    UtilityKTS.setClass(row, 'single-ingredient', true);
    
    var controlCell = row.getElementsByClassName('controls')[0];
    var deleteIcon = controlCell.getElementsByClassName('delete-icon')[0];
    deleteIcon.addEventListener('click', (e) => { this._handleDelete(e); });
    deleteIcon.setAttribute('ingredient-info', JSON.stringify(ingredient));
    
    var nameCell = row.getElementsByClassName('ingredientname')[0];
    nameCell.innerHTML = ingredient.ingredientname;
    
    this.shoppingTableBody.appendChild(row);
  }  
  
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleDelete(e) {
    var ingredientInfo = JSON.parse(e.target.getAttribute('ingredient-info'));
    console.log('_handleDelete', ingredientInfo);
    return;
    
    var success = this.removeFromMenu(recipeInfo);
    if (!success) return;
    
    this.update();
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
