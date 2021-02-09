//---------------------------------------------------
// image flipper generator app
//---------------------------------------------------
const app = function () {
	const page = {};
  
  const appInfo = {
    appName: 'Image flipper generator'
  };
	
	const settings = {
    logoutURL: '/usermanagement/logout',
    maxCards: 36,
    thumbnailErrorImg: 'https://res.cloudinary.com/ktsanter/image/upload/v1612802166/image%20flipper%20resources/invalid_image.png'
	};
	
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    page.body = document.getElementsByTagName('body')[0];
    
    await _getUserInfo();
    
    _renderPage();
  }
  
  async function _getUserInfo() {
    var dbResult = await SQLDBInterface.doGetQuery('usermanagement', 'getuser');
    settings.userInfo = null;
    if (dbResult.success) {
      settings.userInfo = dbResult.userInfo;
    }     
  }    
	
	//--------------------------------------------------------------
	// page rendering
	//--------------------------------------------------------------
  function _renderPage() {
    page.contentsProjects = page.body.getElementsByClassName('contents-projects')[0];
    page.contentsLayout = page.body.getElementsByClassName('contents-layout')[0];
    page.contentsPreview = page.body.getElementsByClassName('contents-preview')[0];
    
    page.keyvalueControl = page.body.getElementsByClassName('control-keyvalue')[0];
    page.titleControl = page.body.getElementsByClassName('control-title')[0];
    page.subtitleControl = page.body.getElementsByClassName('control-subtitle')[0];
    page.colorControl = page.body.getElementsByClassName('control-color')[0];
    page.layoutControl = page.body.getElementsByClassName('control-layout')[0];
    page.colorOptions = page.body.getElementsByClassName('color-options')[0];
    
    page.layoutContainer = page.body.getElementsByClassName('layout')[0];
    
    page.body.getElementsByClassName('navbarcontainer')[0].appendChild(_renderNavbar());
    _attachHandlers();
    _renderLayout();
    _updateLayout();
    
    settings.navbar.selectOption('Projects');    
  }
  
  function _renderNavbar() {
    var navConfig = {
      title: appInfo.appName,
      
      items: [
        {label: 'Projects', callback: () => {return _navDispatch('projects');}, subitems: null, rightjustify: false},
        {label: 'Layout', callback: () => {return _navDispatch('layout');}, subitems: null, rightjustify: false},
        {label: settings.userInfo.userName, callback: () => {return _navDispatch('profile');}, subitems: null, rightjustify: true}        
      ],
      
      hamburgeritems: [           
        {label: 'preview', markselected: false, callback: () => {return _navDispatch('preview');}},
        {label: 'embed', markselected: false, callback: () => {return _navDispatch('embed');}},
        {label: 'help', markselected: false, callback: _showHelp},
        {label: 'sign out', markselected: false, callback: _doLogout}
      ]   
    };

    settings.navbar = new NavigationBar(navConfig);
        
    return settings.navbar.render();
  } 
  
  function _attachHandlers() {
    page.keyvalueControl.addEventListener('input', (e) => { _hideEmbed(); _restrictInput(e); });
    page.titleControl.addEventListener('input', (e) => {_hideEmbed();});
    page.subtitleControl.addEventListener('input', (e) => {_hideEmbed();});
   
    page.layoutControl.addEventListener('change', (e) => {_hideEmbed(); _updateLayout();});
    page.colorControl.addEventListener('click', (e) => {_hideEmbed(); _handleColorControl(e);});
    
    page.colorOptions.addEventListener('mouseleave', (e) => { UtilityKTS.setClass(page.colorOptions, 'hide-me', true); });
    var samples = page.colorOptions.getElementsByClassName('color-sample');
    for (var i = 0; i < samples.length; i++) {
      samples[i].addEventListener('click', (e) => { _handleColorSelection(e); });
    }
  }
  
  function _renderLayout() {
    var layoutTable = page.layoutContainer.getElementsByTagName('table')[0];
    
    var tableRow = CreateElement._createElement('tr', null, null);
    layoutTable.appendChild(tableRow);
    var tableCell = CreateElement._createElement('td', null, null);
    tableRow.appendChild(tableCell);
    
    for (var i = 0; i < settings.maxCards; i++) {
      var handler = (e) => { _hideEmbed(); _handleCardButton(e);};
      var elem = CreateElement.createButton('btnCard' + i, 'cardbutton cardbutton' + i, i + 1, null, handler);
      elem.value = i;
      elem.imageURL = '';
      elem.title = 'specify image URL for card #' + (i + 1);
      tableCell.appendChild(elem);
    }
    
    var elemURLInput = page.layoutContainer.getElementsByClassName('imageurl')[0];
    page.ImageInputRow = CreateElement._createElement('tr', null, null);
    page.ImageInputRow.appendChild(elemURLInput);
  }
	
	//--------------------------------------------------------------
	// updating
	//--------------------------------------------------------------
  function _navDispatch(dispatchOption) {
    var dispatchMap = {
      'projects': function() { _showContents('contents-projects'); },
      'layout': function() { _showContents('contents-layout'); },
      'preview': function() { _showContents('contents-preview'); },
      'embed': function() { _showContents('contents-embed'); },
      'profile': function() {}
    };
    
    var route = dispatchMap[dispatchOption];
    route();
  }
  
  function _showContents(contentsClass) {
    var contents = page.body.getElementsByClassName('contents');
    for (var i = 0; i < contents.length; i++) {
      UtilityKTS.setClass(contents[i], 'hide-me', true);
    }
    UtilityKTS.setClass(page.body.getElementsByClassName(contentsClass)[0], 'hide-me', false);
  }
  
  function _updateLayout() {
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

  function _promptForImageURL(elem) {
    var cardNum = elem.value;
    var currentURL = elem.imageURL;
    
    return prompt('Please enter the URL for image #' + (cardNum + 1), currentURL);
  }
  
  function _setCardImage(elem, imageURL) {
    var origWidth = elem.offsetWidth;
    var origHeight = elem.offsetHeight;

    if (imageURL == null || imageURL == "") {
      elem.style.background = "";
      elem.imageURL = "";

    } else {
      elem.style.background = "url(" + imageURL + "), url('" + settings.thumbnailErrorImg + "') no-repeat right top";
      elem.style.backgroundSize = origWidth + "px " + origHeight + "px";
      elem.imageURL = imageURL;
    }
  }

	//--------------------------------------------------------------
	// handlers
	//--------------------------------------------------------------    
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
    var cardNum = e.target.value;
    var currentURL = e.target.imageURL;
    
    var imageURL = _promptForImageURL(e.target);
    if (imageURL) _setCardImage(e.target, imageURL);
  }
	
	//---------------------------------------
	// utility functions
	//---------------------------------------
  function _restrictInput(e) {
    if (!e.data) return;
    
    if (!e.data.match(/[0-9a-zA-Z_\-]/)) {
      e.target.value = e.target.value.replace(/[^0-9a-zA-Z_\-]/g, '');
    }
  }
  
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
  
  async function _doLogout() {
    window.open(settings.logoutURL, '_self'); 
  }

  function _showHelp() {
    console.log('help');
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
