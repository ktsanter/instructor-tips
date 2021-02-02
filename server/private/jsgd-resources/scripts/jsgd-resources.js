const app = function () {
	const page = {
		body: null
	};
	
  const imageBaseURL = 'https://res.cloudinary.com/ktsanter/image/upload/v1581550363/JSGD_resources';
  const audioBaseURL = 'https://res.cloudinary.com/ktsanter/video/upload/v1581550395/JSGD_resources/';
  
	const settings = {
    title: 'JavaScript Game Design resources',
    project: ['pong', 'fish', 'platform'],
    resource: ['images', 'music'],
        
    imageURL: {
      'pong': {
        baseURL: imageBaseURL + '/Pong/Images/',
        fileURL: [
          'basketball.png', 
          'blue.png', 
          'golfball.png', 
          'green.png', 
          'paddle.png', 
          'paddle2.png', 
          'pink.png', 
          'pizza.png', 
          'planet.png', 
          'red.png', 
          's.png', 
          'soccerball.png', 
          'spike.png', 
          'volleyball.png'
        ]
      },
      
      'fish': {
        baseURL: imageBaseURL + '/Fish/Images/',
        fileURL: [
          'background.png', 
          'battleship_left.png', 
          'battleship_right.png', 
          'bluefish_left.png', 
          'bluefish_right.png', 
          'blue_left.png', 
          'blue_right.png', 
          'clown_left.png', 
          'clown_right.png', 
          'crumbs.png', 
          'fish2_left.png', 
          'fish2_right.png', 
          'fish_left.png', 
          'fish_right.png', 
          'flash_left.png', 
          'flash_right.png', 
          'galactica_left.png', 
          'galactica_right.png', 
          'green_left.png', 
          'green_right.png', 
          'medfighter_left.png', 
          'medfighter_right.png', 
          'orange_left.png', 
          'orange_right.png', 
          'purple_left.png', 
          'purple_right.png', 
          'redfish_left.png', 
          'redfish_right.png', 
          'red_left.png', 
          'red_right.png', 
          'shark_left.png', 
          'shark_right.png', 
          'ship_left.png', 
          'ship_right.png', 
          'space.png', 
          'space2.png', 
          'space3.png', 
          'space4.png', 
          'space5.png', 
          'space6.png', 
          'space7.png', 
          'spaceship_left.png', 
          'spaceship_right.png', 
          'sword_left.png', 
          'sword_Right.png', 
          'titan_left.png', 
          'titan_right.png', 
          'yellow_left.png', 
          'yellow_right.png'
        ]
      },
      
      'platform':{
        baseURL: imageBaseURL + '/Platform/Images/',
        fileURL: [
          'assets.gif', 
          'background.png', 
          'flag_bad.png', 
          'flag_none.png', 
          'flag_win.png', 
          'images.png', 
          'jump_pad.png', 
          'laser.png', 
          'l_enemy.gif', 
          'l_idle.png', 
          'l_jump.png', 
          'l_walk-0.png', 
          'l_walk-1.png', 
          'l_walk-2.png', 
          'l_walk-3.png', 
          'l_walk-4.png', 
          'l_walk-5.png', 
          'l_walk-6.png', 
          'l_walk-7.png', 
          'platform.png', 
          'power_up.png', 
          'r_enemy.gif', 
          'r_idle.png', 
          'r_jump.png', 
          'r_walk-0.png', 
          'r_walk-1.png', 
          'r_walk-2.png', 
          'r_walk-3.png', 
          'r_walk-4.png', 
          'r_walk-5.png', 
          'r_walk-6.png', 
          'r_walk-7.png', 
          'score.gif', 
          'trash.png'
        ]
      }
    },

    audioURL: {
      'pong': {
        baseURL: audioBaseURL + '/Pong/Music/',
        fileURL: [
          'doh.mp3', 
          'organ.mp3', 
          'pop.mp3', 
          'reminder.mp3', 
          'signal.mp3', 
          'techno.mp3'
        ]
      },
      
      'fish': {
        baseURL: audioBaseURL + '/Fish/Music/',
        fileURL: [
          'infinite_strings.mp3', 
          'mad_robots.mp3', 
          'only.mp3'
        ]
      },
      
      'platform': {
        baseURL: audioBaseURL + '/Platform/Music/',
        fileURL: [
          'mountain.mp3', 
          'ova.mp3', 
          'shelf_life.mp3'
        ]
      }
    }
  };
  
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0];  
    
    _renderPage();

  }
  	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function _renderPage() {
    page.body.appendChild(_renderTitle());
    page.body.appendChild(_renderControls());
    
    page.imageContainer = _renderImageContainer();
    page.body.appendChild(page.imageContainer);
    page.audioContainer = _renderAudioContainer();
    page.body.appendChild(page.audioContainer);

    _initResourceDisplay();    
  }

  function _renderTitle() {
    var container = CreateElement.createDiv(null, 'title', settings.title);
    
    return container;    
  }
  
  function _renderControls() {
    var container = CreateElement.createDiv(null, 'controls-container', null);
    
    var elem = CreateElement.createDiv(null, 'controls-container-project', null);
    container.appendChild(elem);
    for (var i = 0; i < settings.project.length; i++) {
      var project = settings.project[i];
      elem.appendChild(CreateElement.createRadio(null, 'controls-project', 'controls_project', project, project, (i == 0), _handleProjectSelect));
    }
    
    elem = CreateElement.createDiv(null, 'controls-container-resource', null);
    container.appendChild(elem);
    for (var i = 0; i < settings.resource.length; i++) {
      var resource = settings.resource[i];
      elem.appendChild(CreateElement.createRadio(null, 'controls-resource', 'resource', resource, resource, (i == 0), _handleResourceSelect));
    }

    return container;    
  }
  
  function _renderImageContainer() {
    var container = CreateElement.createDiv(null, 'image-container', null);
    
    return container;    
  }
  
  function _renderAudioContainer() {
    var container = CreateElement.createDiv(null, 'audio-container', null);
    
    return container;    
  }

  function _initResourceDisplay() {
    settings.projectName = settings.project[0];
    settings.resourceName = settings.resource[0];
    
    _showResources();
  }

  function _showResources() {
    var resourceKey = settings.resourceName == 'images' ? 'imageURL' : 'audioURL';
    var resourceURL = settings[resourceKey][settings.projectName];
    var baseURL = resourceURL.baseURL;
    var fileURL = resourceURL.fileURL;

    if (settings.resourceName == 'images') {
      _showImageResources(baseURL, fileURL);
      
    } else {
      _showAudioResources(baseURL, fileURL);
    }    
  } 

  function _showImageResources(baseURL, fileURL) {
    _clearElement(page.imageContainer);
    _clearElement(page.audioContainer);
    var container = page.imageContainer;
    
    for (var i = 0; i < fileURL.length; i++) {
      var url = baseURL + fileURL[i];
      container.appendChild(_showImage(url, fileURL[i]));
    }
  }

  function _showImage(url, fileURL) {
    var container = CreateElement.createDiv(null, 'image-item', null);
    
    container.appendChild(CreateElement.createImage(null, 'image-resource', url, fileURL));
    container.appendChild(CreateElement._createElement( 'br', null, null));
    
    var elemGetURL = CreateElement.createButton(null, 'resource-label', fileURL, 'copy full URL to clipboard', _handleResourceClick);
    container.appendChild(elemGetURL);
    elemGetURL.shortURL = fileURL;
    elemGetURL.fullURL = url;
    
    return container;
  }
  
  function _showAudioResources(baseURL, fileURL) {
    _clearElement(page.imageContainer);
    _clearElement(page.audioContainer);
    var container = page.audioContainer;
    
    for (var i = 0; i < fileURL.length; i++) {
      var url = baseURL + fileURL[i];
      container.appendChild(_showAudio(url, fileURL[i]));
    }
  }    
  
  function _showAudio(url, fileURL) {
    var container = CreateElement.createDiv(null, 'audio-item', null);
    
    container.appendChild(_createAudioElement(null, null, url, fileURL));
    container.appendChild(CreateElement._createElement( 'br', null, null));
    
    var elemGetURL = CreateElement.createButton(null, 'resource-label', fileURL, 'copy full URL to clipboard', _handleResourceClick);
    container.appendChild(elemGetURL);
    elemGetURL.shortURL = fileURL;
    elemGetURL.fullURL = url;

    return container;
  }

  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function _handleProjectSelect(e) {
    settings.projectName = e.target.value;
    _showResources();
  }
  
  function _handleResourceSelect(e) {
    settings.resourceName = e.target.value;
    _showResources();
  }
  
  function _handleResourceClick(e) {
    var shortURL = e.target.shortURL;
    var fullURL = e.target.fullURL;
    _copyToClipboard(fullURL);
    alert('full URL for "' + shortURL + '" copied to clipboard');
  }
  
	//---------------------------------------
	// utility functions
	//----------------------------------------
  function _clearElement(elem) {
    while (elem.firstChild) elem.removeChild(elem.firstChild);
  }
  
  function _createAudioElement(id, classes, sourceURL, title) {
    var elem = CreateElement._createElement('audio', id, classes);
    elem.setAttribute('controls', 'controls');
    elem.title = title;
    
    var elemSource = CreateElement._createElement('source', null, null);
    elem.appendChild(elemSource);
    elemSource.src = sourceURL;
    elemSource.type = 'audio/mpeg';
    
    return elem;
  }
  
  function _copyToClipboard(txt) {
    if (!page._clipboard) page._clipboard = new ClipboardCopy(page.body, 'plain');

    page._clipboard.copyToClipboard(txt);
	}	  
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();
