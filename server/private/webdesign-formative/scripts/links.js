//
//
const app = function () {		
	const page = {
		body: null,
		itemtree: null,
    explorebutton: null,
    quizbutton: null,
    instructions: {},
    explore: null,
    titleexplore: null,
    restartexplorebutton: null,
    restartexplorebuttoncontainer: null,
    quiz: null
	};
  
  const ACTIVITY_EXPLORE = "explore";
  const ACTIVITY_QUIZ = "quiz";
  
  const settings = {
    activity: null,
    explorestage: null,
    selectedfolder: null,
    selectedfile: null
  };
  
  const EXPLORE_SELECTSOURCE = 'source';
  const EXPLORE_SELECTDEST = 'dest';
  const EXPLORE_COMPLETE = 'complete';
  
  const CLASS_EXPLOREFOLDER = 'selected-explore-folder';
  const CLASS_EXPLOREFILE = 'selected-explore-file';
  
  const hierarchy = [
      {
        name: 'projectroot', id: 0,
        children: [
          { name: 'index.html', id: 1 },
          { name: 'otherpage.html', id: 2 },
          
          { 
            name: 'images', id: 30,
            children: [
              { name: 'mypony.png', id: 31 },
              { name: 'coolcar.jpg', id: 32 }
            ]
          },
            
          { 
            name: 'documents', id: 40,
            children: [
              { 
                name: 'news', id: 41,
                children: [
                  { name: 'fire.pdf', id: 411 },
                  { name: 'flood.pdf', id: 412 },
                  { name: 'tornado.pdf', id: 413 }
                ]
              },
              { 
                name: 'reports', id: 42,
                children: [
                  { name: 'monthly.pdf', id: 421 },
                  { name: 'yearly.pdf', id: 422 }
                ]
              },
            ]                    
          },
            
          { 
            name: 'css', id: 50,
            children: [
              { name: 'main.css', id: 51 },
              { name: 'secondary.css', id: 52}
            ]            
          }
        ]
      }
    ];
		
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init () {
		page.body = document.getElementsByTagName('body')[0];
		page.itemtree = $('#hierarchy');
    page.explorebutton = document.getElementById('btnExplore');
    page.quizbutton = document.getElementById('btnQuiz');
    page.instructions[ACTIVITY_EXPLORE] = document.getElementById('instructions0');
    page.instructions[ACTIVITY_QUIZ] = document.getElementById('instructions1');
    page.titleexplore = document.getElementById('titleExplore');
    page.restartexplorebutton = document.getElementById('btnRestartExplore');
    page.restartexplorebuttoncontainer = document.getElementById('containerRestartExplore');
    page.explore = document.getElementById('explore');
    page.quiz = document.getElementById('quiz');
    	
		if (_initializeSettings()) {
      _renderPage();
      _beginActivity(ACTIVITY_EXPLORE);
		}
	}
	
	//-------------------------------------------------------------------------------------
	// query params:
	//-------------------------------------------------------------------------------------
	function _initializeSettings() {
		return true;
	}
	
	//-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
	function _renderPage() {
    page.itemtree.tree({
      data: hierarchy,
      autoOpen: true
    });
    
    page.itemtree.on('tree.select', function(e) {_treeSelectHandler(e);} );
    page.explorebutton.addEventListener('click', _handleExploreClick, false);
    page.quizbutton.addEventListener('click', _handleQuizClick, false);
    page.restartexplorebutton.addEventListener('click', _handleRestartExploreClick, false);
  }	
  
  function _setControlsBasedOnActivity() {
    page.explorebutton.disabled = (settings.activity == ACTIVITY_EXPLORE);
    page.quizbutton.disabled = !(settings.activity == ACTIVITY_EXPLORE);
    
    page.instructions[ACTIVITY_EXPLORE].style.display = 'none';
    page.instructions[ACTIVITY_QUIZ].style.display = 'none';
    page.instructions[settings.activity].style.display = 'inline-block';
    
    if (settings.activity == ACTIVITY_EXPLORE) {
      page.explore.style.visibility = 'visible';
      page.quiz.style.visibility = 'hidden';
      //page.restartexplorebutton.style.display = 'inline';
      page.titleexplore.style.display = 'inline';

    } else {
      page.explore.style.visibility = 'hidden';
      page.quiz.style.visibility = 'visible';
      //page.restartexplorebutton.style.display = 'none';
      page.titleexplore.style.display = 'none';
    }
  }
  
  function _beginActivity(newActivity) {
    settings.activity = newActivity;
    _setControlsBasedOnActivity();
    _removeClassFromAllElements(CLASS_EXPLOREFOLDER);
    _removeClassFromAllElements(CLASS_EXPLOREFILE);
    page.itemtree.tree('selectNode', null);
    
    settings.explorestage = EXPLORE_SELECTSOURCE;
    settings.selectedfolder = null;
    settings.selectedfile = null;
    _exploreDisplay();
  }
  
  function _exploreDisplay() {  
    var showRestartButton = false;
    var message = '<div id="displayMessage">';
    
    if (settings.explorestage == EXPLORE_SELECTSOURCE) {
      message += 'Next step: click on a folder to begin the path...';
      
    } else if (settings.explorestage == EXPLORE_SELECTDEST) {
      message += '<ul>'
      message += '<li class="explore-display">The relative path begins at the folder <div class="selected-explore-folder-display">' + settings.selectedfolder.name + '</div></li>';
      message += '</ul>';
      message += 'Next step: click on a file to end the path...';
      showRestartButton = true;
      
    } else if (settings.explorestage == EXPLORE_COMPLETE) {
      var relativePath = _getRelativePath(settings.selectedfolder, settings.selectedfile);
      message += '<ul>'
      message += '<li class="explore-display">The relative path begins at the folder <div class="selected-explore-folder-display">' + settings.selectedfolder.name + '</div></li>';
      message += '<li class="explore-display">The relative path ends with the file <div class="selected-explore-file-display">' + settings.selectedfile.name + '</div></li>';
      message += '</ul>';
      message += 'Hover over this box to see the relative path <span class="pathbox">' + relativePath + '</span>';
      showRestartButton = true;
      
    } else {
      message += 'Error: unexpected explore stage = (' + settings.explorestage + ')';
    }
    
    message += '</div>';
    
    page.explore.innerHTML = message;
    
    _showRestartExploreButton(showRestartButton);
  }
  
  function _addClassToNode(node, className) {
      var div = node.element.getElementsByTagName('div')[0];
      var span = div.getElementsByTagName('span')[0];
      span.classList.add(className);  
  }
  
  function _removeClassFromAllElements(className) {
    var elems = document.getElementsByClassName(className);
    
    for (var i = 0; i < elems.length; i++) {
      if (elems[i].classList.contains(className)) {
        elems[i].classList.remove(className);
      }
    }
  }
  
  function _getRelativePath(folderNode, fileNode) {
    var done = false;
    var path = '';
    var arrPath = [];
    var arrBacktrack = [];
    var arrForwardtrack = [];
    var setPath = new Set();
    var objPath = {};
    
    var curNode = fileNode;
    var status = '';
    
    // work backwards from tree until folder is matched or root reachd
    while (!done) {
      arrPath.unshift(curNode);
      setPath.add(curNode.id);
      objPath[curNode.id] = arrPath.slice(0, arrPath.length);

      if (curNode.getLevel() <= 1) {
        status = 'atroot';
        done = true;
      } else if (curNode.parent == folderNode) {
        status = 'matchedfolder';
        done = true;
      } else {
        status = 'movingup';
        curNode = curNode.parent;
      }
    }
    
    if (status == 'matchedfolder') { 
      arrForwardtrack = arrPath;  // no backtracking from folder necessary
      
    } else {  // work backward from folder until common ancestor found
      done = false;
      var curNode = folderNode.parent;

      while (!done) {
        arrBacktrack.push(curNode);
       if (setPath.has(curNode.id)) {
          done = true;
        } else {
          curNode = curNode.parent;
        }
      }
      
      // begin path by moving "up" to common ancestor
      for (var i = 0; i < arrBacktrack.length; i++) {
        path += '../';
      }

      arrForwardtrack = objPath[curNode.id].slice(1);
    }

    // complete path by moving "down" to file
    for (var i = 0; i < arrForwardtrack.length; i++) {
      if (i > 0) path += '/';
      path += arrForwardtrack[i].name;
    }

    return path;
  }
  
  function _showRestartExploreButton(show) {
    if (show) {
      page.restartexplorebuttoncontainer.style.visibility = 'visible';
    } else {
      page.restartexplorebuttoncontainer.style.visibility = 'hidden';
    }
  }
  
	//------------------------------------------------------------------
	// handlers
	//------------------------------------------------------------------
	function _treeSelectHandler(e) {
		if (e.node == null) return;
    if (settings.activity != ACTIVITY_EXPLORE) return;
    
    if (_isFolder(e.node) && settings.explorestage == EXPLORE_SELECTSOURCE) {
      settings.selectedfolder = e.node;
      _addClassToNode(e.node, CLASS_EXPLOREFOLDER);
      settings.explorestage = EXPLORE_SELECTDEST
      
    } else if (_isFile(e.node)  && settings.explorestage == EXPLORE_SELECTDEST) {
      settings.selectedfile = e.node;
      _addClassToNode(e.node, CLASS_EXPLOREFILE);
      page.itemtree.tree('selectNode', null);
      settings.explorestage = EXPLORE_COMPLETE;
      
    } else if (settings.explorestage == EXPLORE_COMPLETE) {
      page.itemtree.tree('selectNode', null);
    }
    
    _exploreDisplay();
	}   
  
  function _handleExploreClick() {
    _beginActivity(ACTIVITY_EXPLORE);
  }
  
  function _handleQuizClick() {
    _beginActivity(ACTIVITY_QUIZ);
  }
  
  function _handleRestartExploreClick() {
    _beginActivity(ACTIVITY_EXPLORE);
  }
  
	//---------------------------------------
	// tree support routines
	//----------------------------------------	
	function _isLeaf(node) {
		return (node.children.length == 0);
	}
  
  function _isFolder(node) {
    return !_isLeaf(node);
  }
  
  function _isFile(node) {
    return _isLeaf(node);
  }
  
	return {
		init: init
 	};
}();