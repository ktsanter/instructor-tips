//-------------------------------------------------------------------------
// image flipper app
//-------------------------------------------------------------------------
// TODO: add flipping animation
// TODO: resize "invalid image" pic
// TODO: disable reset when card back is shown?
// TODO: add "use preview" query param (or extend configkey interpretation
//-------------------------------------------------------------------------
const app = function () {
	const page = {};	
	const settings = {};
	
	//---------------------------------------
	// get things going
	//----------------------------------------
	async function init () {
    page.body = document.getElementsByTagName('body')[0];
    page.notice = new StandardNotice(page.body, page.body);
    console.log('add styling for notice, including spinner');

		page.contents = page.body.getElementsByClassName('contents')[0];
    page.titletext = page.contents.getElementsByClassName('flipper-title-text')[0];
    page.subtitletext = page.contents.getElementsByClassName('flipper-subtitle-text')[0];
    
    page.flipperContainer = page.contents.getElementsByClassName('flipper-container')[0];
    page.flipperCard = page.flipperContainer.getElementsByClassName('flipper-card')[0];

		if (!_initializeSettings()) {
			page.notice.setNotice('error in parameters');
      
		} else {
      settings.config = await _getConfigInfo(settings.configkey);
      if (settings.config) {
        _renderLayout();
      }
		}
	}
	
	//-----------------------------------------------------------
	// query params:
	//-----------------------------------------------------------
	function _initializeSettings() {
		var success = false;
		var params = {};
				
		var urlParams = new URLSearchParams(window.location.search);
		params.configkey = urlParams.has('configkey') ? urlParams.get('configkey') : null;

		if (params.configkey != null) {
			settings.configkey = params.configkey;
			success = true;
		}
		
		return success;
	}

	//--------------------------------------------------------------
	// layout routines
	//--------------------------------------------------------------
	function _renderLayout() {
    UtilityKTS.setClass(page.contents, settings.config.colorscheme, true);
		
		_renderDescriptiveInfo();
		_renderFlipper();
		
    page.contents.getElementsByClassName('flipper-button')[0].addEventListener('click', _handleReset);
    
    UtilityKTS.setClass(page.contents, 'hide-me', false);
	}
	
	function _renderDescriptiveInfo() {
		page.titletext.innerHTML = settings.config.projecttitle;
		page.subtitletext.innerHTML = settings.config.projectsubtitle;
	};
	
	function _renderFlipper() {
    page.flipperCard.appendChild(_loadFrontOfCard());
    page.flipperCard.appendChild(_loadBackOfCard());

		var cardButtons = document.getElementsByClassName('card-front');
		for (var i = 0; i < cardButtons.length; i++) {
			cardButtons[i].addEventListener(
        'click', 
        (function(cardIndex) {
          return function() { 
            _flip(cardIndex);
          }
        })(i), 
        false);
		}

		var cardBacks = document.getElementsByClassName('card-back');
		for (var i = 0; i < cardBacks.length; i++) {
			cardBacks[i].addEventListener(
        'click', 
        (function(cardIndex) {
          return function() { 
            _unflip(cardIndex);
          }
        })(i), 
        false);
		}
  }
	
	function _loadFrontOfCard()	{
    var rows = settings.config.layoutrows;
    var cols = settings.config.layoutcols;
    var elemFrontPrototype = page.body.getElementsByClassName('card-proto front-proto')[0];
    
    var elemTable = CreateElement.createTable(null, 'flipper-card-table');
    var count = 0;
    for (var r = 0; r < rows; r++) {
      var elemRow = CreateElement._createElement('tr', null, null);
      elemTable.appendChild(elemRow);
      
      for (var c = 0; c < cols; c++) {
        var elemCell = CreateElement._createElement('td', null, null);
        elemRow.appendChild(elemCell);
        var elemContents = elemFrontPrototype.cloneNode();
        elemCell.appendChild(elemContents);
        
        UtilityKTS.setClass(elemContents, 'card-proto', false);
        UtilityKTS.setClass(elemContents, 'front-proto', false);
        UtilityKTS.setClass(elemContents, 'card-front', true);
        UtilityKTS.setClass(elemContents, 'front' + count, true);
        UtilityKTS.setClass(elemContents, 'hide-me', false);
        
        elemContents.innerHTML = (count + 1);
        count++;
      }
    }
    
    return elemTable;
	}

	function _loadBackOfCard() {
    var numItems = settings.config.layoutrows * settings.config.layoutcols;
    var container = CreateElement.createDiv(null, 'cardbacks');
    var elemBackPrototype = page.body.getElementsByClassName('card-proto back-proto')[0];
    
    for (var i = 0; i < numItems; i++) {
      var elem = elemBackPrototype.cloneNode(true);
      UtilityKTS.setClass(elem, 'card-proto', false);
      UtilityKTS.setClass(elem, 'back-proto', false);
      UtilityKTS.setClass(elem, 'card-back', true);
      UtilityKTS.setClass(elem, 'back' + i, true);
      
      var elemImage = elem.getElementsByTagName('img')[0];
      
      var imageURL = settings.config.layoutimages[i];
      if (imageURL && imageURL != '') {
        elemImage.src = imageURL;
        elemImage.alt = 'image #' + i;
      }
      container.appendChild(elem);
    }
		  
		return container;
	}

	//--------------------------------------------------------------
	// handlers
	//--------------------------------------------------------------
	function _handleReset() {
    var cardFronts = page.flipperContainer.getElementsByClassName('card-front');
    for (var i = 0; i < cardFronts.length; i++) {
      UtilityKTS.setClass(cardFronts[i], 'invisible', false);
    }
	}	
	
	function _flip(cardIndex) {  
    var elemFlipperTable = page.flipperContainer.getElementsByClassName('flipper-card-table')[0];
    var elemFront = page.flipperContainer.getElementsByClassName('card-front front' + cardIndex)[0];
    var elemBack = page.flipperContainer.getElementsByClassName('card-back back' + cardIndex)[0];

    UtilityKTS.setClass(elemFront, 'invisible', true);
    UtilityKTS.setClass(elemFlipperTable, 'hide-me', true);    
    UtilityKTS.setClass(elemBack, 'hide-me', false);
	}

	function _unflip(cardIndex) {
    var elemFlipperTable = page.flipperContainer.getElementsByClassName('flipper-card-table')[0];
    var elemBack = page.flipperContainer.getElementsByClassName('card-back back' + cardIndex)[0];

    UtilityKTS.setClass(elemBack, 'hide-me', true);
    UtilityKTS.setClass(elemFlipperTable, 'hide-me', false);    
	}

	//--------------------------------------------------------------
	// DB interaction
	//--------------------------------------------------------------
  async function _getConfigInfo(configkey) {
    var result = null;
    
    page.notice.setNotice('loading configuration...', true);
    var dbResult = await SQLDBInterface.doGetQuery('image-flipper/project', configkey, page.notice);
    if (dbResult.success) {
      page.notice.setNotice('');
      dbResult.project.layoutimages = JSON.parse(dbResult.project.layoutimages);
      result = dbResult.project;
    }
    
    return result;
  }
	
	//---------------------------------------
	// utility functions
	//----------------------------------------
	
	return {
		init: init
 	};
}();