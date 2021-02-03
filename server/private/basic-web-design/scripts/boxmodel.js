"use strict";
//-----------------------------------------------------------------------------------
// Basice Web Design: Box model interactive
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------

const app = function () {
  const appversion = '0.01';
  const appname = 'Box model';
	const page = {};
  const settings = {};
  
	//---------------------------------------
	// get things going
	//----------------------------------------
  function init() {
		page.body = document.getElementsByTagName('body')[0];
    page.elementText = page.body.getElementsByClassName('element-text')[0];
    page.elementDemo = page.body.getElementsByClassName('element-demo')[0];
    
    _addEventHandlers();
    _update();
  }
  
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------  
  function _addEventHandlers() {
    var handler = e => {_update(); };
    
    var checkboxes = page.body.getElementsByClassName('checkbox');
    for (var i = 0; i < checkboxes.length; i++) {
      checkboxes[i].addEventListener('click', handler);
    }

    var sliders = page.body.getElementsByClassName('slider');
    for (var i = 0; i < sliders.length; i++) {
      sliders[i].addEventListener('input', handler);
    }
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------    
  function _update() {
    var controlSettings = {
      margin: _getSettings('margin', '0', 'px'),
      border: _getSettings('border', 'none', ''),
      padding: _getSettings('padding', '0', 'px')
    };
     
    console.log(controlSettings);
    
  }
  
  function _getSettings(groupname, defaultVal, unit) {
    var settings = {
      topval: defaultVal,
      rightval: defaultVal,
      bottomval: defaultVal,
      leftval: defaultVal
    };
    
    var elemCheckbox = page.body.getElementsByClassName('checkbox ' + groupname)[0];
    if (elemCheckbox.checked) {
      settings.topval = page.body.getElementsByClassName('slider ' + groupname + '-top')[0].value + unit;
      settings.rightval = page.body.getElementsByClassName('slider ' + groupname + '-right')[0].value + unit;
      settings.bottomval = page.body.getElementsByClassName('slider ' + groupname + '-bottom')[0].value + unit;
      settings.leftval = page.body.getElementsByClassName('slider ' + groupname + '-left')[0].value + unit;
    }
    
    return settings;
  }
  
	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
