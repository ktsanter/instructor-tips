//-------------------------------------------------------------------
// EditUtilities
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
class EditUtilities {
  constructor(config) {}
  
  static _setEditControlHandlers(container, classList, handler) {
    const editControls = container.getElementsByClassName(classList);
    
    for (let i = 0; i < editControls.length; i++) {
      editControls[i].addEventListener('click', handler);
    }
  }


  static _clearFormValuesInContainer(container) {
    const elementList = container.getElementsByClassName('form-control');
    for (let i = 0; i < elementList.length; i++) {
      const elem = elementList[i];
      if (elem.tagName == 'INPUT') {
        if (elem.type == 'text') elem.value = '';
      }
    }
  }
  
  static _setValueInContainer(container, classList, value) {
    container.getElementsByClassName(classList)[0].value = value;
  }
  
  static _getValueFromContainer(container, classList) {
    let val = null;
    const elem = container.getElementsByClassName(classList)[0];
    if (elem.tagName == 'INPUT') {
      const elemType = elem.getAttribute('type');
      if (elemType == 'text') {
        val = elem.value;
      } else if (elemType == 'checkbox') {
        val = elem.checked;
      }
      
    } else if (elem.tagName == 'SELECT') {
      val = elem[elem.selectedIndex].value;
    }
    
    if (val == null) {
      console.log('unhandled element in _getValueFromContainer', elem);
    }
    
    return val;
  }
  
  static _enableEditControls(container, classList, enable) {
    const editControls = container.getElementsByClassName(classList);

    for (let i = 0; i < editControls.length; i++) {
      UtilityKTS.setClass(editControls[i], 'disabled', !enable);
    }
  }

  static _selectByText(elemSelect, optionText) {
    let selectedIndex = -1;
    const options = elemSelect.getElementsByTagName('OPTION');
    for (let i = 0; i < options.length && selectedIndex < 0; i++) {
      if (options[i].text == optionText) selectedIndex = i;
    }
    elemSelect.selectedIndex = selectedIndex;
  }
    
  static _forceSelection(elemSelect, optionText) {
    let selectedIndex = -1;
    const options = elemSelect.getElementsByTagName('OPTION');
    for (let i = 0; i < options.length && selectedIndex < 0; i++) {
      if (options[i].text == optionText) selectedIndex = i;
    }
    elemSelect.selectedIndex = selectedIndex;
    elemSelect.dispatchEvent(new Event('change'));
  }
    
  static _findNodeInfo(elem, itemClass, infoAttributeName) {
    let node = elem;
    while (!node.classList.contains(itemClass) && node.tagName != 'BODY') {
      node = node.parentNode;
    }
    
    let nodeInfo = null;
    if (node.hasAttributes(infoAttributeName)) nodeInfo = JSON.parse(node.getAttribute(infoAttributeName));

    return nodeInfo;
  }

  static _findNodeInfoContainer(elem, itemClass, infoAttributeName) {
    let node = elem;
    while (!node.classList.contains(itemClass) && node.tagName != 'BODY') {
      node = node.parentNode;
    }
    
    if (!node.hasAttributes(infoAttributeName)) node = null;

    return node;
  }

  static _blipNotice(elemNotice, msg) {
    elemNotice.setNotice(msg);
    const me = this;
    setTimeout(function() {
     elemNotice.setNotice('');
    }, 500);
  }
  
  static _triggerChange(elem) {
    let changeEvent = new Event('change');
    elem.dispatchEvent(changeEvent);
  }  
}
