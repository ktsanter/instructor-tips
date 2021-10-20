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
    var itemCheck = controlCell.getElementsByClassName('shoppingitem-check')[0];
    itemCheck.setAttribute('ingredient-info', JSON.stringify(ingredient));
    itemCheck.addEventListener('change', (e) => { this._handleCheckChange(e); });

    var nameCell = row.getElementsByClassName('ingredientname')[0];
    var nameSpan = nameCell.getElementsByClassName('ingredientnamet-text')[0];
    nameSpan.innerHTML = ingredient.ingredientname;
    
    var deleteIcon = nameCell.getElementsByClassName('delete-icon')[0];
    deleteIcon.setAttribute('ingredient-info', JSON.stringify(ingredient));
    deleteIcon.addEventListener('click', (e) => { this._handleDelete(e); });
    
    this.shoppingTableBody.appendChild(row);
  }  
  
  async _removeFromShoppingList(ingredientInfo) {
    console.log('Shopping._removeFromShoppingList', ingredientInfo);
    var success = await this.config.db.removeShoppingItem(ingredientInfo.ingredientid);
    
    return success;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  async _handleDelete(e) {
    var ingredientInfo = JSON.parse(e.target.getAttribute('ingredient-info'));
    
    var success = await this._removeFromShoppingList(ingredientInfo);
    if (!success) return;
    
    this.update();
  }
  
  _handleCheckChange(e) {
    var ingredientInfo = JSON.parse(e.target.getAttribute('ingredient-info'));
    console.log('Shopping._handleCheckChange', ingredientInfo);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
