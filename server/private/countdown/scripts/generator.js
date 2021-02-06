//-------------------------------------------------------------------
// countdown generator app
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const settings = {
    countdownBaseURL: '/countdown/countdown'
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  function init () {
    page.body = document.getElementsByTagName('body')[0];
    
    page.msgBefore = page.body.getElementsByClassName('msg-before')[0];
    page.msgAfter = page.body.getElementsByClassName('msg-after')[0];
    page.date = page.body.getElementsByClassName('date')[0];

    page.previewcontainer = page.body.getElementsByClassName('preview-container')[0];
    page.previewcontents = page.body.getElementsByClassName('preview-contents')[0];
    page.embedcontainer = page.body.getElementsByClassName('embed-container')[0];

    var elemPreviewButton = document.getElementById('ktsPreviewButton');
    var elemGenerateButton = document.getElementById('ktsGenerateButton');
    var elemCopyToClipboardButton = document.getElementById('ktsCopyToClipboardButton');
    
    initializeDate(page.date);
        
    elemPreviewButton.addEventListener('click', function() { displayCountdownPreview(); });
    elemGenerateButton.addEventListener('click', function() { displayCountdownEmbedCode(); });
    elemCopyToClipboardButton.addEventListener('click', function() { copyEmbedCodeToClipboard(); });

    var elemToHideFor = [page.date, page.msgBefore, page.msgAfter];
    for (var i = 0; i < elemToHideFor.length; i++) {
      elemToHideFor[i].addEventListener('click', function() {
        UtilityKTS.setClass(page.previewcontainer, 'hide-me', true);
        UtilityKTS.setClass(page.embedcontainer, 'hide-me', true);
      });
    }
  }

  function initializeDate(elem) {
    var d = new Date();
    var year = d.getFullYear();
    var month = padNumber(d.getMonth() + 1, 2);
    var day = padNumber(d.getDate(), 2);
    
    elem.value = year + '-' + month + '-' + day;
  }
    
  //---------------------------------------
	// update
	//----------------------------------------
  function getCountdownParameters() {
    return {
      'before': page.body.getElementsByClassName('msg-before')[0].value, 
      'after': page.body.getElementsByClassName('msg-after')[0].value, 
      'date': page.body.getElementsByClassName('date')[0].value
    };
  }

  function generateCountdownEmbedCode(param) {
    var url = window.location.origin + makeCountdownURL();

    var embedCode = 
        '<iframe'
      +   ' style="border: none; width: 30.0em; height: 2.8em;"'
      +   ' src=\'' + url + '\''
      + '>'  
      + '</iframe>';
      
    return embedCode;
  }
        
  function makeCountdownURL() {
    var params = getCountdownParameters();
    var url = settings.countdownBaseURL
      + '?date=' + '"' + params.date + '"' 
      + '&before=' + params.before.replaceAll(' ', '%20')
      + '&after=' + params.after.replaceAll(' ', '%20');
      
      return url;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------
  function displayCountdownPreview() {
    page.previewcontents.src = makeCountdownURL();
    UtilityKTS.setClass(page.previewcontainer, 'hide-me', false);    
  }

  function displayCountdownEmbedCode() {
    var embedCode = generateCountdownEmbedCode(getCountdownParameters());
    var embedElement = document.getElementById('ktsEmbedCodeText');
    
    embedElement.value = embedCode;
    document.getElementById('ktsCopiedNotice').innerHTML = '';
    UtilityKTS.setClass(page.embedcontainer, 'hide-me', false);
  }

  function copyEmbedCodeToClipboard() {
    var embedElement = document.getElementById('ktsEmbedCodeText');
    embedElement.text = 'this should be embed code';
    embedElement.select();
    document.execCommand("Copy");
    embedElement.selectionEnd = embedElement.selectionStart;
    document.getElementById('ktsCopiedNotice').innerHTML = 'embed code copied to clipboard';
  }

  //---------------------------------------
	// utility
	//----------------------------------------
  String.prototype.replaceAll = function(search, replacement) {
      var target = this;
      return target.replace(new RegExp(search, 'g'), replacement);
  };

  function padNumber(n) {
    return ('00' + n).slice(-2);
  }
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
