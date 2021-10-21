//-------------------------------------------------------------------
// Shopping
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Shopping {
  constructor(config) {
    this.config = config;
    this.settings = {};
    this.filterIsOn = false;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.filterIcon = this.config.container.getElementsByClassName('icon-filter')[0];
    this.filterIcon.addEventListener('click', (e) => { this._handleFilter(e); } );
    this.config.container.getElementsByClassName('icon-copy')[0].addEventListener('click', (e) => { this._handleCopy(e); } );

    this.shoppingTableBody = this.config.container.getElementsByClassName('shoppinglist-body')[0];
    this.shoppingTemplateRow = this.config.container.getElementsByClassName('shoppinglist-templaterow')[0];
  }
  
  async update() {
    var shoppingList = await this.config.db.getShoppingList();
    if (shoppingList == null) return;
    
    this.config.setAppMessage('');
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
    var isChecked = (ingredient.ingredientchecked != 0);
    
    UtilityKTS.setClass(row, this.config.hideClass, false);
    UtilityKTS.setClass(row, 'shoppinglist-templaterow', false);
    UtilityKTS.setClass(row, 'single-ingredient', true);
    
    var controlCell = row.getElementsByClassName('controls')[0];
    var itemCheck = controlCell.getElementsByClassName('shoppingitem-check')[0];
    itemCheck.setAttribute('ingredient-info', JSON.stringify(ingredient));
    itemCheck.addEventListener('change', (e) => { this._handleCheckChange(e); });
    itemCheck.checked = isChecked;

    var nameCell = row.getElementsByClassName('ingredientname')[0];
    var nameSpan = nameCell.getElementsByClassName('ingredientnamet-text')[0];
    nameSpan.innerHTML = ingredient.ingredientname;
    
    if (!this.filterIsOn || !isChecked) this.shoppingTableBody.appendChild(row);
  }  
  
  _setFilter(turnFilterOn) {
    this.filterIsOn = turnFilterOn;

    UtilityKTS.setClass(this.filterIcon, 'filter-off', !this.filterIsOn);
    if (this.filterIsOn) {
      this.filterIcon.title = 'show only unchecked';
    } else {
      this.filterIcon.title = 'show all items';
    }

    this.update();
  }
  
  _isRowChecked(row) {
    var elemCheck = row.getElementsByClassName('shoppingitem-check')[0];
    
    return elemCheck.checked;
  }
  
  async _processCheckChange(ingredientInfo, row) {
    var isChecked = this._isRowChecked(row);

    var success = await this.config.db.setShoppingItemCheck({
      "shoppingid": ingredientInfo.shoppingid,
      "ingredientchecked": isChecked ? 1 : 0
    });
    if (!success) return;
    
    await this.update();
  }
  
  _copyListToClipboard() {
    var strList = '';
    
    var rows = this.shoppingTableBody.getElementsByClassName('single-ingredient');
    for (var i = 0; i < rows.length; i++) {
      var ingredientName = rows[i].getElementsByClassName('ingredientnamet-text')[0].innerHTML;
      if (i > 0) strList += '\n';
      strList += ingredientName
    }
    
    this._copyToClipboard(strList);
    this.config.setAppMessage('shopping list copied');
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleFilter(e) {
    this._setFilter(!this.filterIsOn);
  }
  
  _handleCopy(e) {
    this._copyListToClipboard();
  }
  
  async _handleCheckChange(e) {
    var ingredientInfo = JSON.parse(e.target.getAttribute('ingredient-info'));
    var row = this._upsearchForRow(e.target);
    if (row == null) return;
    
    await this._processCheckChange(ingredientInfo, row);
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _upsearchForRow(origNode) {
    var elemRow = null;
    var node = origNode;

    for (var i = 0; i < 5 && elemRow == null; i++) {
      if (node.tagName == 'TD') {
        elemRow = node.parentNode;
      } else {
        node = node.parentNode;
      }
    }
    
    if (elemRow == null) console.log('Shopping._upsearchForRow failed for', origNode);
    return elemRow;
  }
  
  //---------------------------------------
  // clipboard functions
  //----------------------------------------
  _copyToClipboard(txt) {
    if (!this.settings.clipboard) this.settings.clipboard = new ClipboardCopy(this.config.container, 'plain');

    this.settings.clipboard.copyToClipboard(txt);
	}	    
}
