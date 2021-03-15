//-------------------------------------------------------------------
// Accordion class
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class Accordion {
  constructor(config) {
    this._config = config;  
  }
  
  //--------------------------------------------------------------
  // rendering
  //--------------------------------------------------------------
  render(faqData) {
    this.root = CreateElement.createDiv(this._config.baseId, 'accordion', null);    
    
    this.update(faqData);
    return this.root;
  }
      
  //--------------------------------------------------------------
  // updating
  //--------------------------------------------------------------
  update(faqData) {
    UtilityKTS.removeChildren(this.root);

    for (var i = 0; i < faqData.length; i++) {
      var itemData = faqData[i];
      var container = CreateElement.createDiv(null, 'accordion-item');
      container.setAttribute('node-data', JSON.stringify(itemData));
      this.root.appendChild(container);
      
      var headingId = this._config.baseId + '-heading' + i;
      var collapseId = this._config.baseId + '-collapse' + i;
      
      var elemHeader = CreateElement._createElement('h2', headingId, 'accordion-header');
      container.appendChild(elemHeader);
      
      if (this._config.allowReordering && i != 0) {
        var elemOrderIcon = this._renderReorderingIcon();
        elemHeader.appendChild(elemOrderIcon);
      }
      
      var elemButton = this._renderButton(itemData.label, collapseId);
      elemHeader.appendChild(elemButton);      
      
      var elemContentContainer = CreateElement.createDiv(collapseId, 'accordion-collapse collapse');
      elemContentContainer.setAttribute('aria-labelledby', headingId);
      elemContentContainer.setAttribute('data-bs-parent', '#' + this._config.baseId);
      
      var elemContent = CreateElement.createDiv(null, 'accordion-body', itemData.content);
      
      container.appendChild(elemContentContainer);
      elemContentContainer.appendChild(elemContent);
    }
  }
  
  _renderReorderingIcon() {
      var handler = (e) => {this._handleReorder(e); };
      var elem = CreateElement.createIcon(null, 'reorder-icon fas fa-arrow-circle-up', null, handler);
      return elem;
  }
  
  _renderButton(buttonLabel, collapseId) {
      var elemButton = CreateElement.createButton(null, 'accordion-button collapsed');
      elemButton.type = 'button';
      elemButton.setAttribute('data-bs-toggle', 'collapse');
      elemButton.setAttribute('data-bs-target', '#' + collapseId);
      elemButton.setAttribute('aria-expanded', 'false');
      elemButton.setAttribute('aria-controls', collapseId);
      
      elemButton.innerHTML = buttonLabel;
      
      return elemButton;
  }
  
  _getItemOrder() {
    var elemItems = this.root.getElementsByClassName('accordion-item');
    var itemOrder = [];
    for (var i = 0; i < elemItems.length; i++) {
      var nodeData = JSON.parse(elemItems[i].getAttribute('node-data'));
      itemOrder.push(nodeData.id);
    }
    
    return itemOrder;
  }
  
  getItemList() {
    var elemItems = this.root.getElementsByClassName('accordion-item');
    var itemList = [];
    for (var i = 0; i < elemItems.length; i++) {
      var nodeData = JSON.parse(elemItems[i].getAttribute('node-data'));
      itemList.push(nodeData);
    }
    
    return itemList;    
  }
  
  //--------------------------------------------------------------
  // show/hide
  //--------------------------------------------------------------
  show(makeVisible) {
    UtilityKTS.setClass(this._container, this._config.hideClass, !makeVisible);
  }
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  _handleReorder(e) {
    var targetItem = e.target.parentNode.parentNode;
    var targetNodeId = JSON.parse(targetItem.getAttribute('node-data')).id;
    var itemOrder = this._getItemOrder();

    var index = itemOrder.indexOf(targetNodeId);
    itemOrder.splice(index, 1);
    itemOrder.splice(index - 1, 0, targetNodeId);
    this._config.callbackOnReordering(itemOrder);   
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
