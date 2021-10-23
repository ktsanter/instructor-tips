//-------------------------------------------------------------------
// RecipesEdit
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class RecipesEdit {
  constructor(config) {
    this.config = config;
    this.notice = this.config.db.config.notice;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  render() {
    this.config.container.addEventListener('click', (e) => { this._handleContainerClick(e); });
    
    this.editContainer = this.config.container.getElementsByClassName('recipe-edit')[0];
    this.editRecipeName = this.editContainer.getElementsByClassName('input-name')[0];
    this.editRating = this.editContainer.getElementsByClassName('recipe-rating-input');
    this.editImportControlLabel = this.editContainer.getElementsByClassName('importfile-label')[0];
    this.editTags = this.editContainer.getElementsByClassName('input-tags')[0];
    this.editYield = this.editContainer.getElementsByClassName('input-yield')[0];
    this.editIngredientsTableBody = this.editContainer.getElementsByClassName('ingredients-body')[0];
    this.editInstructions = this.editContainer.getElementsByClassName('input-instructions')[0];
    this.editNotes = this.editContainer.getElementsByClassName('input-notes')[0];
    this.editMade = this.editContainer.getElementsByClassName('check-made')[0];
    this.ingredientTemplateRow = this.config.container.getElementsByClassName('ingredients-templaterow')[0];

    UtilityKTS.denyDoubleQuotes(this.editTags);
    UtilityKTS.denyDoubleQuotes(this.editInstructions);
    UtilityKTS.denyDoubleQuotes(this.editNotes);
    
    this.editContainer.getElementsByClassName('add-ingredient')[0].addEventListener('click', (e) => { this._handleAddIngredient(e); });
    this.editContainer.getElementsByClassName('importfile')[0].addEventListener('change', (e) => { this._handleImport(e); });
    this.editContainer.getElementsByClassName('bulk-add-ingredients')[0].addEventListener('click', (e) => { this._handleBulkAddIngredients(e); });
        
    this.deleteContainer = this.config.container.getElementsByClassName('recipe-delete')[0];
    this.deleteRecipeName = this.deleteContainer.getElementsByClassName('recipe-deletion-name')[0]
    
    this.btnOkay = this.config.container.getElementsByClassName('button-okay')[0];
    this.btnOkay.addEventListener('click', (e) => { this._handleOkay(e);});

    this.btnCancel = this.config.container.getElementsByClassName('button-cancel')[0];
    this.btnCancel.addEventListener('click', (e) => { this._handleCancel(e); });
    
    this.recipeImport = new ImportRecipe({});    
  }
  
  async update() {}
  
  beginAdd() {
    UtilityKTS.setClass(this.editImportControlLabel, this.config.hideClass, false);
    this._initiateEditing();
    this.config.container.setAttribute('recipe-mode', 'add');
    this.config.container.setAttribute('recipe-id', null);
  }
  
  beginEdit(recipe) {
    UtilityKTS.setClass(this.editImportControlLabel, this.config.hideClass, true);
    this._initiateEditing();
    this._loadRecipe(recipe);

    this.config.container.setAttribute('recipe-mode', 'edit');
    this.config.container.setAttribute('recipe-id', recipe.recipeid);
  }
  
  beginDelete(recipe) {
    this.btnOkay.innerHTML = 'confirm';
    this.config.container.setAttribute('recipe-mode', 'delete');
    this.config.container.setAttribute('recipe-id', recipe.recipeid);
    
    this.deleteRecipeName.innerHTML = recipe.recipename;
    
    UtilityKTS.setClass(this.editContainer, this.config.hideClass, true);
    UtilityKTS.setClass(this.deleteContainer, this.config.hideClass, false);
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _initiateEditing() {
    this.btnOkay.innerHTML = 'save';
    
    this.editRecipeName.value = '';
    this._setRadioValue(this.editRating, 0);
    this.editTags.value = '';
    this.editYield.value = '';
    this._loadIngredientList([]);
    this.editInstructions.value = '';
    this.editNotes.value = '';
    this.editMade.checked = false;

    UtilityKTS.setClass(this.editContainer, this.config.hideClass, false);
    UtilityKTS.setClass(this.deleteContainer, this.config.hideClass, true);
  }
  
  _loadRecipe(recipe) {
    console.log(recipe);
    this.editRecipeName.value = recipe.recipename;
    this._setRadioValue(this.editRating, recipe.rating);
    this.editTags.value = this._tagListToString(recipe.taglist);
    this.editYield.value = recipe.recipeyield;
    this._loadIngredientList(recipe.ingredients);
    this.editInstructions.value = recipe.instructions;
    this.editNotes.value = recipe.notes;
    this.editMade.checked = recipe.recipemade;    
  }
  
  _loadIngredientList(ingredients) {
    UtilityKTS.removeChildren(this.editIngredientsTableBody);
    for (var i = 0; i < ingredients.length; i++) {
      this._addIngredientRow(ingredients[i]);
    }
  }
  
  _addIngredientRow(ingredient) {
    var row = this.ingredientTemplateRow.cloneNode(true);
    ingredient.ingredientname = this._replaceQuotes(ingredient.ingredientname);
    row.setAttribute('ingredient-info', JSON.stringify(ingredient));
    
    UtilityKTS.setClass(row, this.config.hideClass, false);
    UtilityKTS.setClass(row, 'ingredients-templaterow', false);
    UtilityKTS.setClass(row, 'single-ingredient', true);

    var deleteIcon = row.getElementsByClassName('delete-ingredient')[0];
    deleteIcon.addEventListener('click', (e) => { this._handleDeleteClick(e); });
    
    var ingredientCell = row.getElementsByClassName('ingredient')[0];
    var ingredientText = ingredientCell.getElementsByClassName('ingredient-text')[0];
    ingredientText.innerHTML = ingredient.ingredientname;
    ingredientText.addEventListener('click', (e) => { this._handleIngredientClick(e); });

    var ingredientInput = ingredientCell.getElementsByClassName('ingredient-input')[0];
    ingredientInput.addEventListener('click', (e) => { e.stopPropagation(); });
    ingredientInput.addEventListener('keyup', (e) => { this._handleIngredientInput(e); });

    this._setIngredientVisiblity(row, false);
   
    this.editIngredientsTableBody.appendChild(row);
  }
  
  _bulkAddIngredients(ingredientList) {
    for (var i = 0; i < ingredientList.length; i++) {
      this._addIngredientRow({"ingredientid": null, "ingredientname": ingredientList[i]});
    }
  }
  
  _gatherContents() {
    var recipe = {};
    recipe.recipeid = this.config.container.getAttribute('recipe-id');
    recipe.recipename = this.editRecipeName.value;
    
    recipe.rating = this._getRadioValue(this.editRating);
    recipe.recipeyield = this._replaceQuotes(this.editYield.value);
    
    var ingredientRows = this.editIngredientsTableBody.getElementsByClassName('single-ingredient');
    
    recipe.taglist = this._tagStringToArray(this.editTags.value);
    
    recipe.ingredients = [];
    for (var i = 0; i < ingredientRows.length; i++) {
      var ingredientInfo = JSON.parse(ingredientRows[i].getAttribute('ingredient-info'));
      recipe.ingredients.push(ingredientInfo);
    }

    recipe.instructions = this._replaceQuotes(this.editInstructions.value);
    recipe.notes = this._replaceQuotes(this.editNotes.value);  
    
    recipe.recipemade = this.editMade.checked;

    return recipe;
  }
  
  async _saveChanges() {
    var success = false;

    
    var recipeMode = this.config.container.getAttribute('recipe-mode');
    var recipeId = this.config.container.getAttribute('recipe-id');
    
    if (recipeMode == 'add' || recipeMode == 'edit') {
      var recipe = this._gatherContents();
          
      if (recipe.recipename.trim().length == 0) {
        this.notice.setNotice('recipe must have a name');
        this.editRecipeName.focus();
        
        return success;
      }
      
      success = await this.config.db.saveRecipe(recipeMode, recipe);
      
    } else if (recipeMode == 'delete') {
      success = await this.config.db.deleteRecipe({"recipeid": recipeId});
    }
    
    if (!success) this._focusOnNotice();
    
    return success;
  }
  
  _setIngredientVisiblity(row, editing) {
    var ingredientCell = row.getElementsByClassName('ingredient')[0];
    var ingredientText = ingredientCell.getElementsByClassName('ingredient-text')[0];
    var ingredientInput = ingredientCell.getElementsByClassName('ingredient-input')[0];
    
    UtilityKTS.setClass(ingredientText, this.config.hideClass, editing);
    UtilityKTS.setClass(ingredientInput, this.config.hideClass, !editing);
    
    if (editing) ingredientInput.focus();
  }
  
  _startIngredientEdit(row) {
    var ingredientCell = row.getElementsByClassName('ingredient')[0];
    var ingredientText = ingredientCell.getElementsByClassName('ingredient-text')[0];
    var ingredientInput = ingredientCell.getElementsByClassName('ingredient-input')[0];
    
    var ingredientInfo = JSON.parse(row.getAttribute('ingredient-info'));
    ingredientInput.value = ingredientInfo.ingredientname;

    this._setIngredientVisiblity(row, true);
  }
  
  _finishIngredientEdit(row, saveChanges) {
    if (saveChanges) {
      var ingredientCell = row.getElementsByClassName('ingredient')[0];
      var ingredientText = ingredientCell.getElementsByClassName('ingredient-text')[0];
      var ingredientInput = ingredientCell.getElementsByClassName('ingredient-input')[0];
    
      var ingredientInfo = JSON.parse(row.getAttribute('ingredient-info'));
      ingredientInfo.ingredientname = this._replaceQuotes(ingredientInput.value);
      row.setAttribute('ingredient-info', JSON.stringify(ingredientInfo));
      ingredientText.innerHTML = ingredientInfo.ingredientname;
    }
    
    this._setIngredientVisiblity(row, false);
  }
  
  _closeAllIngredientEdits() {
    var ingredientRows = this.editIngredientsTableBody.getElementsByClassName('single-ingredient');
    for (var i = 0; i < ingredientRows.length; i++) {
      var row = ingredientRows[i];
      var ingredientCell = row.getElementsByClassName('ingredient')[0];
      var ingredientInput = ingredientCell.getElementsByClassName('ingredient-input')[0];
      
      if (!ingredientInput.classList.contains(this.config.hideClass)) {
        this._finishIngredientEdit(row, true);
      }
    }
  }
    
  async _doRecipeImport(params) {
    this.notice.setNotice('');
    
    var result = await this.recipeImport.importRecipe(params);
    if (!result.success) {
      console.log(result.details);
      this.notice.setNotice(result.details);
      return;
    }
    
    this._loadRecipe(result.data);
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------
  _handleContainerClick(e) {
    this._closeAllIngredientEdits();
  }
  
  async _handleImport(e) {
    if (e.target.files.length == 0) return;  

    var importParams = {
      importFile: e.target.files[0]
    }

    await this._doRecipeImport(importParams);

    e.target.value = null;    
  }  
  
  async _handleOkay(e) {
    this._closeAllIngredientEdits();
    var success = await this._saveChanges();

    if (success) this.config.callbackFinishEditing({});
  }
  
  _handleCancel(e) {
    this.config.callbackFinishEditing({});
  }

  _handleAddIngredient(e) {
    this._addIngredientRow({"ingredientid": null, "ingredientname": 'new ingredient'});
  }
  
  _handleBulkAddIngredients(e) {
    var response = window.prompt('Enter ingredients (on separate lines)');
    if (response == null || response.trim().length == 0) return;
    response = response.replace(/\r/g, '');
    this._bulkAddIngredients(response.split('\n'));
  }
  
  _handleIngredientClick(e) {
    this._closeAllIngredientEdits();
    
    var row = this._upsearchForRow(e.target);
    var ingredientInfo = JSON.parse(row.getAttribute('ingredient-info'));
    this._startIngredientEdit(row, ingredientInfo);

    e.stopPropagation();
  }
  
  _handleIngredientInput(e) {
    var row = this._upsearchForRow(e.target);
    
    if (e.keyCode == 13 || e.key == 'Enter') {
      this._finishIngredientEdit(row, true);
    } else if (e.keyCode == 27 || e.key == 'Escape') {
      this._finishIngredientEdit(row, false);
    }
  }
  
  _handleDeleteClick(e) {
    var row = this._upsearchForRow(e.target);
    row.remove();
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
    
    if (elemRow == null) console.log('RecipesEdit._upsearchForRow failed for', origNode);
    return elemRow;
  }  
  
  _focusOnNotice() {
    document.getElementById('linkNotice').focus();    
  }
  
  _tagListToString(tagList) {
    var tagString = tagList.toString();
    if (tagList.length == 0) tagString = ' ';
    return tagString;
  }
  
  _tagStringToArray(tagList) {
    var tagList = tagList.split(',');
    var tagListCleaned = [];

    for (var i = 0; i < tagList.length; i++) {
      var tag = tagList[i].trim();
      if (tag.length > 0) tagListCleaned.push(tag);
    }

    tagListCleaned = tagListCleaned.sort(function(a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });
    
    return tagListCleaned;
  }  
  
  _replaceQuotes(origStr) {
    var str = origStr.replace(/\"/g, '&quot;');
    return str;
  }
  
  _getRadioValue(radioElements) {
    var value = 0;
    for (var i = 0; i < radioElements.length; i++) {
      var elem = radioElements[i];
      if (elem.checked) value = elem.value;
    }
    return value;
  }
  
  _setRadioValue(radioElements, value) {
    for (var i = 0; i < radioElements.length; i++) {
      var elem = radioElements[i];
      elem.checked = (elem.value == value);
    }
    return value;
  }
}
