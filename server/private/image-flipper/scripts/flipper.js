//-------------------------------------------------------------------------
// image flipper app
//-------------------------------------------------------------------------
// TODO: add handling of 'preview' configkey
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

		page.contents = page.body.getElementsByClassName('contents')[0];
    page.titletext = page.contents.getElementsByClassName('flipper-title-text')[0];
    page.subtitletext = page.contents.getElementsByClassName('flipper-subtitle-text')[0];
    
    page.flipperCard = page.contents.getElementsByClassName('flipper-card')[0];
    page.flipperCardInner = page.flipperCard.getElementsByClassName('flipper-card-inner')[0];
    page.flipperCardFront = page.flipperCardInner.getElementsByClassName('flipper-card-front')[0];
    page.flipperCardBack = page.flipperCardInner.getElementsByClassName('flipper-card-back')[0];

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
    _loadFrontOfCard(page.flipperCardFront);
    _loadBackOfCard(page.flipperCardBack);
    
		var cardButtons = page.flipperCardFront.getElementsByClassName('front');
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

		var cardBacks = page.flipperCardBack.getElementsByClassName('back');
		for (var i = 0; i < cardBacks.length; i++) {
			cardBacks[i].addEventListener('click', () => {_unflip();}, false);
		}
  }
	
	function _loadFrontOfCard(container)	{
    var rows = settings.config.layoutrows;
    var cols = settings.config.layoutcols;
    var elemFrontPrototype = page.body.getElementsByClassName('card-proto front-proto')[0];
    
    var elemTable = CreateElement.createTable(null, 'flipper-card-table');
    container.appendChild(elemTable);
    
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
        UtilityKTS.setClass(elemContents, 'front' + count, true);
        
        elemContents.innerHTML = (count + 1);
        count++;
      }
    }
	}

	function _loadBackOfCard(container) {
    var numItems = settings.config.layoutrows * settings.config.layoutcols;
    var elemBackPrototype = page.body.getElementsByClassName('card-proto back-proto')[0];
    
    for (var i = 0; i < numItems; i++) {
      var elem = elemBackPrototype.cloneNode(true);
      UtilityKTS.setClass(elem, 'card-proto', false);
      UtilityKTS.setClass(elem, 'back-proto', false);
      UtilityKTS.setClass(elem, 'back' + i, true);
      
      var elemImage = elem.getElementsByTagName('img')[0];
      
      var imageURL = settings.config.layoutimages[i];
      if (imageURL && imageURL != '') {
        elemImage.src = imageURL;
        elemImage.alt = 'image #' + i;
      }
      container.appendChild(elem);
    }
	}

	//--------------------------------------------------------------
	// handlers
	//--------------------------------------------------------------
	function _handleReset() {
    var cardFronts = page.flipperCardFront.getElementsByClassName('front');
    for (var i = 0; i < cardFronts.length; i++) {
      UtilityKTS.setClass(cardFronts[i], 'invisible', false);
    }
    if (page.flipperCard.classList.contains('flipped')) _unflip();
	}	
	
	function _flip(cardIndex) {  
    var backList = page.flipperCardBack.getElementsByClassName('back');
    var elemFront = page.flipperCardFront.getElementsByClassName('front front' + cardIndex)[0];
    var elemBack = page.flipperCardBack.getElementsByClassName('back back' + cardIndex)[0];
    
    for (var i = 0; i < backList.length; i++) {
      UtilityKTS.setClass(backList[i], 'hide-me', true);
    }
    
    UtilityKTS.setClass(elemFront, 'invisible', true);
    UtilityKTS.setClass(elemBack, 'hide-me', false);
    
    UtilityKTS.setClass(page.flipperCard, 'flipped', true);       
	}

	function _unflip() {
    UtilityKTS.setClass(page.flipperCard, 'flipped', false);
	}

	//--------------------------------------------------------------
	// DB interaction
	//--------------------------------------------------------------
  async function _getConfigInfo(configkey) {
    var result = null;
    
    page.notice.setNotice('loading configuration...', true);
    if (configkey == 'preview') {
      var dbResult = await SQLDBInterface.doGetQuery('image-flipper/project', 'preview', page.notice);
      if (dbResult.success) {
        page.notice.setNotice('');
        result = dbResult.project;
      }
      
    } else {
      var dbResult = await SQLDBInterface.doGetQuery('image-flipper/project', configkey, page.notice);
      if (dbResult.success) {
        page.notice.setNotice('');
        dbResult.project.layoutimages = JSON.parse(dbResult.project.layoutimages);
        result = dbResult.project;
      }
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