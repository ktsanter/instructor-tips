//-------------------------------------------------------------------
// countdown generator app
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const settings = {
    ktsCountdownPreviewRunning: false,
    //countdownscript: 'scripts/countdown.js'
    countdownscript: 'https://raw.githubusercontent.com/ktsanter/countdown-generator/master/scripts/countdown.js'
  };

  //---------------------------------------
  // get things going
  //----------------------------------------
  function init () {
    page.body = document.getElementsByTagName('body')[0];

    var elemDeadlineDate1 = document.getElementById('ktsDeadlineDate1');
    var elemTitleDuring1 = document.getElementById('ktsDeadlineTitleDuring1');
    var elemTitleAfter1 = document.getElementById('ktsDeadlineTitleAfter1');
    var elemPreviewButton = document.getElementById('ktsPreviewButton');
    var elemGenerateButton = document.getElementById('ktsGenerateButton');
    var elemCopyToClipboardButton = document.getElementById('ktsCopyToClipboardButton');
    
    initializeDate(elemDeadlineDate1);
        
    elemPreviewButton.addEventListener('click', function() {
      displayCountdownPreview();
    });
    
    elemGenerateButton.addEventListener('click', function() {
      displayCountdownEmbedCode();
    });
    
    elemCopyToClipboardButton.addEventListener('click', function() {
      copyEmbedCodeToClipboard();
    });

    var elemToHide = [elemDeadlineDate1, elemTitleDuring1, elemTitleAfter1];
    for (var i = 0; i < elemToHide.length; i++) {
      elemToHide[i].addEventListener('click', function() {
        hideArea('ktsEmbedCodeArea');
        hideArea('ktsPreviewArea');
        if (settings.ktsCountdownPreviewRunning) {
          ktsCountdownCode.clearCountdown();
          settings.ktsCountdownPreviewRunning = false;
        }
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
  function displayCountdownPreview() {
    var ktsXHTTP = new XMLHttpRequest();
    ktsXHTTP.onreadystatechange = function() {	
      if (this.readyState == 4 && this.status == 200) {		
        var scriptElement = document.createElement('script');		
        scriptElement.innerHTML = ktsXHTTP.responseText;		
        document.getElementById('ktsCountdownContent').parentElement.appendChild(scriptElement);	
        var p2 = getCountdownParameters();
        ktsCountdownCode.ktsCreateCountdownTimer(getCountdownParameters());	
      }
    };
    ktsXHTTP.open('GET', settings.countdownscript, true);
    ktsXHTTP.send();

    settings.ktsCountdownPreviewRunning = true;
    showArea('ktsPreviewArea');
  }

  function displayCountdownEmbedCode() {
    var param = getCountdownParameters();
    var embedCode = generateCountdownEmbedCode(param);
    var embedElement = document.getElementById('ktsEmbedCodeText');
    
    embedElement.value = embedCode;
    document.getElementById('ktsCopiedNotice').innerHTML = '';
    showArea('ktsEmbedCodeArea');
  }

  function getCountdownParameters() {
    var nDates = 1;

    var deadline1 = document.getElementById('ktsDeadlineDate1').value + ' 23:59:59';

    return {
      'nDates': nDates,
      'titleDuring': [ document.getElementById('ktsDeadlineTitleDuring1').value], 
      'titleAfter': [document.getElementById('ktsDeadlineTitleAfter1').value], 
      'date': [deadline1]
    };
  }

  function generateCountdownEmbedCode(param) {
    var sHTML = ""
      + "<span>"
      + "  <span id='ktsCountdownContent'> ... </span>"
      + "</span>"
      + "<script>"
      + "var ktsXHTTP = new XMLHttpRequest();"
      + "ktsXHTTP.onreadystatechange = function() {"
      + "if (this.readyState == 4 && this.status == 200) {"
      + "	   var scriptElement = document.createElement('script');"
      + "    scriptElement.innerHTML = ktsXHTTP.responseText;"
      + "	   document.getElementById('ktsCountdownContent').parentElement.appendChild(scriptElement);"
      + "	   ktsCountdownCode.ktsCreateCountdownTimer(" + JSON.stringify(param) + ");"
      + "	}"
      + "};"
//      + "ktsXHTTP.open('GET', 'https://raw.githubusercontent.com/ktsanter/countdown-generator/master/scripts/countdown.js', true);"
      + "ktsXHTTP.open('GET', '" + settings.countdownscript + "', true);"
      + "ktsXHTTP.send();"
      + "</script>";
      
    return sHTML;
  }
        
  //---------------------------------------
	// handlers
	//----------------------------------------
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
  function showArea(elemId) {
    var embedAreaClist = document.getElementById(elemId).classList;

    if (embedAreaClist.contains('kts-dont-show')) {
      embedAreaClist.remove('kts-dont-show');
    }
  }

  function hideArea(elemId) {
    document.getElementById(elemId).classList.add('kts-dont-show');
  }

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
