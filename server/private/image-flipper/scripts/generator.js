//---------------------------------------------------
// image flipper generator app
//---------------------------------------------------
const app = function () {
	const page = {};
	
	const settings = {
    maxCards: 36
	};
	
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
    page.body = document.getElementsByTagName('body')[0];
    
    _renderPage();
  }
	
	//--------------------------------------------------------------
	// page rendering
	//--------------------------------------------------------------
  function _renderPage() {
    page.previewControl = page.body.getElementsByClassName('control-preview')[0];
    page.embedControl = page.body.getElementsByClassName('control-embed')[0];

    page.titleControl = page.body.getElementsByClassName('control-title')[0];
    page.subtitleControl = page.body.getElementsByClassName('control-subtitle')[0];
    page.colorControl = page.body.getElementsByClassName('control-color')[0];
    page.layoutControl = page.body.getElementsByClassName('control-layout')[0];
    page.colorOptions = page.body.getElementsByClassName('color-options')[0];
    
    page.layoutContainer = page.body.getElementsByClassName('layout')[0];
    page.previewContainer = page.body.getElementsByClassName('preview')[0];
    page.embedContainer = page.body.getElementsByClassName('embed')[0];
    
    _attachHandlers();

    _renderLayout();
    _updateLayout();
  }
  
  function _attachHandlers() {
    page.previewControl.addEventListener('click', (e) => {_handlePreviewControl(e);} );
    page.embedControl.addEventListener('click', (e) => {_handleEmbedControl(e);} );
   
    page.layoutControl.addEventListener('change', (e) => {_updateLayout();});
    page.colorControl.addEventListener('click', (e) => {_handleColorControl(e);});
    
    page.colorOptions.addEventListener('mouseleave', (e) => { UtilityKTS.setClass(page.colorOptions, 'hide-me', true); });
    var samples = page.colorOptions.getElementsByClassName('color-sample');
    for (var i = 0; i < samples.length; i++) {
      samples[i].addEventListener('click', (e) => { _handleColorSelection(e); });
    }
  }
  
  function _renderLayout() {
    console.log('renderLayout');
    var layoutTable = page.layoutContainer.getElementsByTagName('table')[0];
    
    var tableRow = CreateElement._createElement('tr', null, null);
    layoutTable.appendChild(tableRow);
    var tableCell = CreateElement._createElement('td', null, null);
    tableRow.appendChild(tableCell);
    
    for (var i = 0; i < settings.maxCards; i++) {
      var handler = (e) => { _handleCardButton(e);};
      var elem = CreateElement.createButton('btnCard' + i, 'cardbutton cardbutton' + i, i, null, handler);
      tableCell.appendChild(elem);
    }
  }
	
	//--------------------------------------------------------------
	// updating
	//--------------------------------------------------------------
  function _updateLayout() {
    console.log('updateLayout');
    var layoutTable = page.layoutContainer.getElementsByTagName('table')[0];
    var swapArea = page.layoutContainer.getElementsByClassName('swaparea')[0];

    for (var i = 0; i < settings.maxCards; i++) {
      var elemCard = page.layoutContainer.getElementsByClassName('cardbutton' + i)[0];
      swapArea.appendChild(elemCard)
    }
    
    UtilityKTS.removeChildren(layoutTable);

    var layout = _getLayoutSetting();
    var cardnum = 0;
    for(var r = 0; r < layout.rows; r++) {
      var elemRow = CreateElement._createElement('tr', null, null);
      layoutTable.appendChild(elemRow);

      for (var c = 0; c < layout.cols; c++) {
        var elemCol = CreateElement._createElement('td', null, null);
        elemRow.appendChild(elemCol);
        
        var elemCard = swapArea.getElementsByClassName('cardbutton' + cardnum)[0];
        elemCol.appendChild(elemCard);
        
        cardnum++;
      }
    }
  }

	//--------------------------------------------------------------
	// handlers
	//--------------------------------------------------------------
  function _handlePreviewControl(e) {
    console.log('preview control clicked');
    UtilityKTS.setClass(page.previewContainer, 'hide-me', false);
  }
  
  function _handleEmbedControl(e) {
    console.log('embed control clicked');
    UtilityKTS.setClass(page.embedContainer, 'hide-me', false);
  }
  
  function _handleColorControl(e) {
    UtilityKTS.setClass(page.colorOptions, 'hide-me', false);
  }
  
  function _handleColorSelection(e) {
    UtilityKTS.setClass(page.colorOptions, 'hide-me', true);

    var currentSchemeClass = _getColorScheme(page.colorControl);
    var newSchemeClass = _getColorScheme(e.target);
    
    if (currentSchemeClass.length > 0) {
      UtilityKTS.setClass(page.colorControl, currentSchemeClass, false);
    }
    
    UtilityKTS.setClass(page.colorControl, newSchemeClass, true);
  }
  
  function _handleCardButton(e) {
    console.log(e.target);
  }
	
	//---------------------------------------
	// utility functions
	//---------------------------------------
  function _getColorScheme(elem) {
    var currentSchemeClass = '';
    elem.classList.forEach(function(value, key) {
      if (value.includes('flipper-colorscheme-')) currentSchemeClass = value;
    });
    
    return currentSchemeClass
  }
  
  function _getLayoutSetting() {
    var layoutValues = page.layoutControl.value.split('x');
    
    return {
      rows: layoutValues[0],
      cols: layoutValues[1]
    };
  }
	
	return {
		init: init
 	};
}();

/*----------------------------------
function initFlipperGenerator()
{
	var previewClass = 'kts-preview-layout-button';
	var elemDefaultLayout = document.getElementById('ktsFlipperLayout2');

	elemDefaultLayout.checked = true;
	handleLayoutChange(elemDefaultLayout, previewClass);
	
	var layoutButtons = document.getElementsByClassName('kts-layout-button');
	for (var i = 0; i < layoutButtons.length; i++) {
		layoutButtons[i].addEventListener('change', function() {
			handleLayoutChange(this, previewClass);
		});
	}
	
	document.getElementById('ktsGenerateButton').addEventListener('click', function() {
		displayFlipperEmbedCode(previewClass);
	});
	
	
	var embedHideElements = document.getElementsByClassName('kts-hide-embed');
	for (var i = 0; i < embedHideElements.length; i++) {
		embedHideElements[i].addEventListener('click', function() {
			hideArea('ktsEmbedCodeArea');
		})
	}
	
	document.getElementById('ktsCopyToClipboardButton').addEventListener('click', copyEmbedCodeToClipboard);
	document.getElementById('ktsUploadSelector').addEventListener('click', triggerConfigFileUpload);
	document.getElementById('ktsUploadFileName').addEventListener('change', handleUploadFileSelect, false);
	document.getElementById('ktsDownloadConfigFile').addEventListener('click', handleDownloadFileSelect);
	document.getElementById('ktsShowPreviewButton').addEventListener('click', showPreviewWithCurrentLayout);
	document.getElementById('ktsFlipperPreview').style.display = 'none';
	document.getElementById('ktsClosePreviewButton').addEventListener('click', hidePreview);
	document.getElementById('ktsColorSchemeSample000').classList.remove('kts-dont-show');
	
	var schemes = document.getElementsByClassName('kts-flipper-generator-colorscheme');
	for (var i = 0; i < schemes.length; i++) {
		schemes[i].addEventListener('click', function() {
			handleColorSchemeClick(this);
			});
	}

	document.getElementById("ktsColorSchemeContainer").addEventListener("mouseleave", function() {
		handleColorSchemeMouseLeave(this);
	});
}

function triggerConfigFileUpload()
{
	var ctrl = document.getElementById('ktsUploadFileName');
	
	try {
		ctrl.value = null;
	} catch(ex) { }

	if (ctrl.value) {
		ctrl.parentNode.replaceChild(ctrl.cloneNode(true), ctrl);
	}

	ctrl.click();
}

function handleLayoutChange(elem, previewClass)
{
	document.getElementById('ktsFlipperLayoutPreview').innerHTML = loadFlipperImageLayout(elem.value, previewClass);
	
	var previewElems = document.getElementsByClassName(previewClass);
	for (var i = 0; i < previewElems.length; i++) {
		previewElems[i].addEventListener('click', function() {
			hideArea('ktsEmbedCodeArea');
			handleFlipperPreviewButtonClick(this);
		})
	}
}

function loadFlipperImageLayout(numItems, previewClass) 
{
	var layoutRowsCols = {
		"9": [3, 3],
		"16": [4, 4],
		"20": [4, 5],
		"25": [5, 5],
		"30": [6, 5]
	};
	var layout = layoutRowsCols[numItems];
	if (layout == null) {
		console.log("no layout for this number of items: " + numItems);
		alert("internal error - no layout for this number of items: " + numItems);
		return;
	}
	
	var rows = layout[0];
	var cols = layout[1];
	
	var s = '';
	s += '<div >'
	s += '<table>';
	for (var i = 0; i < numItems; i++) {
		var btnId = ' id="' + makeButtonId(i) + '" ';
		var btnClass = ' class="kts-flipper-generator ' + previewClass + '"';
		var text = (i+1);
		
		if (i % cols == 0) s += '<tr>';

		s += '<td>';
		s += '<button ' + btnId + btnClass + '>' + text + '</button>';
		s += '</td>';
		
		if (i % cols == cols - 1) s += '</tr>';
	}

	if (i % cols != 0) s += '</tr>';
	s += '</table>';
	s += '</div>';

	return s;
}

function makeButtonId(num)
{
	var paddedNum = ("00" + num).slice(-2);
	return 'btnGeneratorPreview' + paddedNum;
}

function handleFlipperPreviewButtonClick(elemButton)
{
	var idNum = elemButton.id.slice(-2);
	
    var txtURL = prompt("Please enter the URL for image #" + (idNum * 1), elemButton.value);
	setFlipperPreviewImage(elemButton, txtURL);
}

function setFlipperPreviewImage(elemButton, imageURL)
{
	var origWidth = elemButton.offsetWidth;
	var origHeight = elemButton.offsetHeight;

    if (imageURL == null || imageURL == "") {
		elemButton.style.background = "";
		elemButton.value = "";

	} else {
		elemButton.style.background = "url(" + imageURL + ") no-repeat right top";
		elemButton.style.backgroundSize = origWidth + "px " + origHeight + "px";
		elemButton.value = imageURL;
    }
}


function displayFlipperEmbedCode(previewClass)
{
	var param = getFlipperParameters(previewClass);
	var embedCode = generateFlipperEmbedCode(param);
	var embedElement = document.getElementById('ktsEmbedCodeText');
	
	embedElement.value = embedCode;
	document.getElementById('ktsCopiedNotice').innerHTML = '';
	showArea('ktsEmbedCodeArea');
}

function getFlipperParameters(previewClass)
{
	var param = {};
	
	param.title = document.getElementById('ktsFlipperGeneratorTitle').value;
	param.subtitle = document.getElementById('ktsFlipperGeneratorSubtitle').value;
	param.colorscheme = getColorScheme();
	
	var flipperImages = [];
	var imageElement = document.getElementsByClassName(previewClass);
	for (var i = 0; i < imageElement.length; i++) {
		flipperImages[i] = imageElement[i].value;
	}
	param.images = flipperImages;

	return param;
}

function generateFlipperEmbedCode(param)
{
	var sHTML = "<span id='ktsFlipperIframeWrapper'> loading iframe... </span>"
		+ "<script>"
		+ "var ktsXHTTP = new XMLHttpRequest();ktsXHTTP.onreadystatechange = function() {"
		+ "if (this.readyState == 4 && this.status == 200) {"
		+ "var scriptElement = document.createElement('script');"
		+ "scriptElement.innerHTML = ktsXHTTP.responseText;"
		+ "document.getElementById('ktsFlipperIframeWrapper').parentElement.appendChild(scriptElement);"
		+ "ktsFlipperCode.prepareFlipperIframe('ktsFlipperIframeWrapper', " + JSON.stringify(param) + ");"
		+ "}"
		+ "};"	
		+ "ktsXHTTP.open('GET', 'https://raw.githubusercontent.com/ktsanter/flipper-generator/master/scripts/flipper.js', true);"
		+ "ktsXHTTP.send();"
		+ "</script>"
	return sHTML;
}

function showArea(elemId)
{
	var embedAreaClist = document.getElementById(elemId).classList;

	if (embedAreaClist.contains('kts-dont-show')) {
		embedAreaClist.remove('kts-dont-show');
	}
}

function hideArea(elemId)
{
	document.getElementById(elemId).classList.add('kts-dont-show');
}

function copyEmbedCodeToClipboard()
{
	var embedElement = document.getElementById('ktsEmbedCodeText');
	embedElement.select();
	document.execCommand("Copy");
	embedElement.selectionEnd = embedElement.selectionStart;
	document.getElementById('ktsCopiedNotice').innerHTML = 'embed code copied to clipboard';
}

function handleUploadFileSelect(evt)
{
	var fileList = evt.target.files;
	if (fileList.length < 1) {
		return;
	}
	
	var configFile = fileList[0];
	if (configFile.size > 5000) {
		console.log('file is too big: ' + configFile.size + '\nfile=' + configFile.name);
		alert('file is too big: ' + configFile.size + '\nfile=' + configFile.name);
		return;
	}
	
	var reader = new FileReader();

	reader.onload = (function(theFile) {
        return function(e) {
			var param;
			try {
				param = JSON.parse(e.target.result);
			} catch(e) {
				console.log('not a valid configuration file - unable to parse as JSON');
				console.log(e);
				alert('not a valid configuration file - unable to parse as JSON' + '\n' + console.log(e));
				return;
			}
			loadConfiguration(param);
		};
	})(configFile);

	reader.readAsText(configFile);
}

function loadConfiguration(param)
{
	if (!('title' in param) || !('subtitle' in param) || !('images' in param)) {
		console.log('not a valid configuration file - missing one or more elements');
		alert('not a valid configuration file - missing one or more elements');
		return;
	}
	
	var nImages = param.images.length;
	var layoutElementId = {
		"9": "ktsFlipperLayout0",
		"16": "ktsFlipperLayout1",
		"20": "ktsFlipperLayout2",
		"25": "ktsFlipperLayout3",
		"30": "ktsFlipperLayout4"
	}

	if (!(nImages in layoutElementId)) {
		console.log('not a valid number of images: ' + nImages);
		alert('not a valid number of images: ' + nImages);
		return;
	}
	
	document.getElementById('ktsFlipperGeneratorTitle').value = param.title;
	document.getElementById('ktsFlipperGeneratorSubtitle').value = param.subtitle;
	setColorScheme(param.colorscheme);
	
	var layoutElement = document.getElementById(layoutElementId[nImages]);
	layoutElement.click();
	
	var theImages = param.images;
	for (var i = 0; i < nImages; i++) {
		var btnElement = document.getElementById(makeButtonId(i));
		setFlipperPreviewImage(btnElement, theImages[i]);
	}
}

function handleDownloadFileSelect()
{
	var param = getFlipperParameters('kts-preview-layout-button');
	downloadFile('flipper_configuration.json', JSON.stringify(param));
}

function downloadFile(filename, data) 
{
    var blob = new Blob([data], {type: 'application/json'});
    if(window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    }
    else{
        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;        
        document.body.appendChild(elem);
        elem.click();        
        document.body.removeChild(elem);
    }
}

function showPreviewWithCurrentLayout()
{
	hideArea('ktsEmbedCodeArea');
	document.getElementById('ktsMainFlipperGeneratorContainer').style.display = 'none';
	document.getElementById('ktsFlipperPreview').style.display = '';

	var ktsXHTTP = new XMLHttpRequest();
	ktsXHTTP.onreadystatechange = function() {	
		if (this.readyState == 4 && this.status == 200) {		
			var scriptElement = document.createElement('script');		
			scriptElement.innerHTML = ktsXHTTP.responseText;		
			document.getElementById('ktsFlipperWrapper').parentElement.appendChild(scriptElement);	
			var p2 = getFlipperParameters('kts-preview-layout-button');
			ktsFlipperCode.prepareFlipper(p2);	
		}
	};
	ktsXHTTP.open('GET', 'https://raw.githubusercontent.com/ktsanter/flipper-generator/master/scripts/flipper.js', true);
	ktsXHTTP.send();
}

function hidePreview()
{
	document.getElementById('ktsMainFlipperGeneratorContainer').style.display = '';
	document.getElementById('ktsFlipperPreview').style.display = 'none';
}

function handleColorSchemeClick(elem)
{
	var elemContent = document.getElementById('ktsColorSchemeContent');
	
	if (elem.id.includes('Sample')) {
		elemContent.style.display = 'block';
		
	} else {
		elemContent.style.display = 'none';
		setColorScheme(elem.id.slice(-3) * 1);
	}
}

function handleColorSchemeMouseLeave(elem)
{
	document.getElementById('ktsColorSchemeContent').style.display = 'none';
}

function getColorScheme()
{
	var schemeNum = 0;
	
	var elemSamples = document.getElementsByClassName('kts-flipper-color-sample');
	for (var i = 0; i < elemSamples.length; i++) {
		var clist = elemSamples[i].classList;
		if (!clist.contains('kts-dont-show')) {
			schemeNum = i;
		}
	}

	return schemeNum;
}

function setColorScheme(schemeNum)
{
	var schemeString = ("000" + schemeNum).slice(-3);

	var elemSamples = document.getElementsByClassName('kts-flipper-color-sample');
	for (var i = 0; i < elemSamples.length; i++) {
		elemSamples[i].classList.add('kts-dont-show');
	}

	document.getElementById('ktsColorSchemeSample' + schemeString).classList.remove('kts-dont-show');
}
---------------------------------------------------*/
