//-------------------------------------------------------------------
// countdown app
//-------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------
const app = function () {
  const page = {};
  
  const settings = {};

  //---------------------------------------
  // get things going
  //----------------------------------------
  function init () {
    settings.timer = null;
    page.body = document.getElementsByTagName('body')[0];
    page.contents = page.body.getElementsByClassName('contents')[0];
    page.container = page.body.getElementsByClassName('countdown-container')[0];
    page.message = page.contents.getElementsByClassName('countdown-message')[0];
    page.days = page.contents.getElementsByClassName('countdown-num days')[0];
    page.hours = page.contents.getElementsByClassName('countdown-num hours')[0];
    page.minutes = page.contents.getElementsByClassName('countdown-num minutes')[0];
    page.seconds = page.contents.getElementsByClassName('countdown-num seconds')[0];
    
    var valid = _readParameters();
    if (!valid) {
      console.log('missing or invalid parameters');
      var errContainer = page.body.getElementsByClassName('badparams')[0];
      errContainer.innerHTML = 'missing or invalid parameters';
      UtilityKTS.setClass(errContainer, 'hide-me', false);
      UtilityKTS.setClass(page.contents, 'hide-me', true);
      
      console.log('add error message to HTML');
      return;
    }
  
    _doCountdown();
  }
  
  function _readParameters() {
    var msgBefore = page.body.getElementsByClassName('msg-before')[0].innerHTML;
    var msgAfter = page.body.getElementsByClassName('msg-after')[0].innerHTML;
    var endDateParam = page.body.getElementsByClassName('end-date')[0].innerHTML;
    
    var endDate = new Date(endDateParam);
    var validParams = (endDate != 'Invalid Date');
    
    if (validParams) {
      if (msgBefore && msgBefore.length > 0) {
        settings.msgBefore = msgBefore;
      } else {
        settings.msgBefore = 'Course ends';
      }
    
      if (msgAfter && msgAfter.length > 0) {
        settings.msgAfter = msgAfter;
      } else {
        settings.msgAfter = 'Course ended';
      }
      
      console.log(endDate);
      var oneSecBeforeMidnight = 
        23 * 60 * 60 * 1000 +
        59 * 60 * 1000 +
        59 * 1000;
        
      endDate = new Date(endDate.getTime() + oneSecBeforeMidnight);
      
      settings.endDate = endDate;
      settings.endDateMMDD = _formatMMDD(endDate);
    }
    
    return validParams;
  }

  function _doCountdown() {
    _updateCountdown();
    settings.timer = setInterval(function() {
      var done = _updateCountdown();
      if (done) {	
        clearInterval(settings.timer);
      }
    }, 1000);    
  }
  
  //---------------------------------------
	// update
	//----------------------------------------
  function _updateCountdown() {
    var now = new Date().getTime();
    
    var countdownDone = false;
    var countdownDateTime = settings.endDate.getTime();
    var distance = countdownDateTime - now;

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (days >= 100) {
      days = ("000" + days).slice(-3);
    } else {
      days = ("00" + days).slice (-2);
    }
    hours = ("00" + hours).slice (-2);
    minutes = ("00" + minutes).slice (-2);
    seconds = ("00" + seconds).slice (-2);
    
    countdownDone = (distance < 0);
    if (countdownDone) {
      page.message.textContent = settings.msgAfter + ' ' + settings.endDateMMDD;
      page.days.innerHTML = '00';
      page.hours.innerHTML = '00';
      page.minutes.innerHTML = '00';
      page.seconds.innerHTML = '00';
      
    } else {
      page.message.textContent = settings.msgBefore + ' ' + settings.endDateMMDD;
      page.days.innerHTML = days;
      page.hours.innerHTML = hours;
      page.minutes.innerHTML = minutes;
      page.seconds.innerHTML = seconds;
    }
    
    UtilityKTS.setClass(page.container, 'expired', countdownDone);
    
    return countdownDone;
  }
  
  //---------------------------------------
	// handlers
	//----------------------------------------

  //---------------------------------------
	// utility
	//----------------------------------------
	function _formatMMDD(date) {
    return _padNumber(date.getMonth()+1) + 
      '/' + _padNumber(date.getDate());
	}

	function _padNumber(n) {
    return ('00' + n).slice(-2);
	}
  
  //---------------------------------------
	// return from wrapper function
	//----------------------------------------
	return {
		init: init
 	};
}();
