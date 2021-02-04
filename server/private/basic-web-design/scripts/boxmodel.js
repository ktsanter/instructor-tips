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
      border: _getSettings('border', '0', 'px'),
      padding: _getSettings('padding', '0', 'px')
    };
    
    _setElementStyling(page.elementDemo, 'margin', controlSettings.margin);
    _setElementStyling(page.elementDemo, 'border-width', controlSettings.border);
    _setElementStyling(page.elementDemo, 'padding', controlSettings.padding);

    _showElementCSS(page.elementText, controlSettings);
  }
  
  function _getSettings(groupname, defaultVal, unit) {
    var settings = '';
    for (var i = 0; i < 4; i++) {
      settings += ' ' + defaultVal + unit;
    }
    
    settings = page.body.getElementsByClassName('slider ' + groupname + '-top')[0].value + unit;
    settings += ' ' + page.body.getElementsByClassName('slider ' + groupname + '-right')[0].value + unit;
    settings +=  ' ' + page.body.getElementsByClassName('slider ' + groupname + '-bottom')[0].value + unit;
    settings +=  ' ' + page.body.getElementsByClassName('slider ' + groupname + '-left')[0].value + unit;
    
    return settings;
  }
  
  function _showElementCSS(elem, settings) {
    var marginCSS = 'margin: ' + settings.margin + ';';
    
    var borderCSS = 'border-style: solid; border-width: ' + settings.border + ';';

    if (settings.border == '0px 0px 0px 0px') {
      borderCSS = 'border-style: none;';
    }
    
    var paddingCSS = 'padding: ' + settings.padding + ';';
    
    var cssText = marginCSS + '<br>' + borderCSS + '<br>' + paddingCSS;
    
    elem.innerHTML = cssText;
  }
  
  function _setElementStyling(elem, styleName, styleSettings) {
    if (styleName == 'border-width') {
      if (styleSettings.includes('none')) {
        elem.style.borderStyle = 'none';
        elem.style[styleName] = '0';
      } else {
        elem.style.borderStyle = 'solid';
        elem.style[styleName] = styleSettings;
      }
      
    } else {
      elem.style[styleName] = styleSettings;
    }
    /*
    if (styleName == 'margin' || styleName == 'padding') {
      elem.style[styleName + 'Top'] = styleSettings.topval;
      elem.style[styleName + 'Right'] = styleSettings.rightval;
      elem.style[styleName + 'Bottom'] = styleSettings.bottomval;
      elem.style[styleName + 'Left'] = styleSettings.leftval;
      
    } else if (styleName = 'border') {
    }
    */
  }
  
	//---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
