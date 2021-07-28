//-----------------------------------------------------------------------
// Timer
//-----------------------------------------------------------------------
// TODO:
//-----------------------------------------------------------------------
const app = function () {
	const page = {};
  
  const baseDate = '1/1/2000';
  const settings = {
    hideClass: 'hide-me',
    timerState: 'cleared',
    timer: null,
    defaultTimerSetting: new Date(baseDate + ' 00:05:00'),
    timerSetting: null
  };
    
	//---------------------------------------
	// get things going
	//----------------------------------------
	function init (sodium) {
		page.body = document.getElementsByTagName('body')[0]; 

    renderContents();
    settings.timerState = 'cleared';
    settings.timerSetting = settings.defaultTimerSetting;
    setStartStopLabel();
  }
    	  
  //-----------------------------------------------------------------------------
	// page rendering
	//-----------------------------------------------------------------------------
  function renderContents() {
    page.contents = page.body.getElementsByClassName('contents')[0];    

    page.timerOutput = page.contents.getElementsByClassName('timer-output')[0];
    page.timerSettings = page.contents.getElementsByClassName('timer-settings')[0];   

    page.hoursOutput = page.contents.getElementsByClassName('timer-number timer-number-hours')[0];
    page.minutesOutput = page.contents.getElementsByClassName('timer-number timer-number-minutes')[0];
    page.secondsOutput = page.contents.getElementsByClassName('timer-number timer-number-seconds')[0];
    
    page.hoursUnitOutput = page.contents.getElementsByClassName('timer-unit timer-unit-hours')[0];
    page.minutesUnitOutput = page.contents.getElementsByClassName('timer-unit timer-unit-minutes')[0];
    page.secondsUnitOutput = page.contents.getElementsByClassName('timer-unit timer-unit-seconds')[0];

    page.controlStartStop = page.contents.getElementsByClassName('control-startstop')[0];
    page.controlReset = page.contents.getElementsByClassName('control-reset')[0];
    
    page.hoursInput = page.contents.getElementsByClassName('control-number control-hours')[0];
    page.minutesInput = page.contents.getElementsByClassName('control-number control-minutes')[0];
    page.secondsInput = page.contents.getElementsByClassName('control-number control-seconds')[0];
    
    page.hoursInput.addEventListener('keyup', (e) => { handleTimerInputText(e); });
    page.minutesInput.addEventListener('keyup', (e) => { handleTimerInputText(e); });
    page.secondsInput.addEventListener('keyup', (e) => { handleTimerInputText(e); });

    page.timerOutput.addEventListener('click', (e) => { handleTimerOutputClick(e); });    
    page.controlStartStop.addEventListener('click', (e) => { handleStartStepClick(e); });
    page.controlReset.addEventListener('click', (e) => { handleResetClick(e); });
    
    setTimeOutput(settings.defaultTimerSetting);
  }
    
  //-----------------------------------------------------------------------------
	// updating
	//-----------------------------------------------------------------------------
  function startTimer() {
    settings.timerState = 'running';
    setStartStopLabel();

    if (!settings.timer) {
      settings.timerSetting = getTimerSetting();
      settings.timerResetValue = settings.timerSetting;
      
      settings.timer = {};
      settings.timer.startTime = new Date();
      settings.timer.obj = setInterval(function() {
        updateTimer();
      }, 1000);
    }    
  }
  
  function stopTimer() {
    settings.timerState = 'paused';
    setStartStopLabel();
    
    if (settings.timer) {
      clearInterval(settings.timer.obj);
      settings.timer = null;
    }
  }
  
  function endTimer() {
    stopTimer();
    settings.timerState = 'elapsed';
    setStartStopLabel();
    
    setTimeOutput(new Date(baseDate + ' 00:00:00'));
  }
  
  function resetTimer() {
    if (settings.timerState == 'running') {
      stopTimer();
    }

    setTimeOutput(settings.timerResetValue);
    settings.timerState = 'cleared';
    setStartStopLabel();
  }
  
  function updateTimer() {
    var elapsedSeconds = Math.round((Date.now() - settings.timer.startTime) / 1000);
    var dateRemaining = new Date(settings.timerSetting - (elapsedSeconds * 1000));
    var secondsRemaining = dateRemaining.getHours() * 60 * 60 + dateRemaining.getMinutes() * 60 + dateRemaining.getSeconds();

    if (secondsRemaining <= 0) {
      endTimer();
      
    } else {
      setTimeOutput(dateRemaining);
    }
  }
  
  function setTimeOutput(t) {
    var hours = t.getHours();
    var minutes = t.getMinutes();
    var seconds = t.getSeconds();
    
    settings.lastTimerOutputValue = t;
    
    page.hoursOutput.innerHTML = ('' + hours).padStart(2, '0');
    page.minutesOutput.innerHTML = ('' + minutes).padStart(2, '0');
    page.secondsOutput.innerHTML = ('' + seconds).padStart(2, '0');
    
    var hideHours = hours <= 0;
    var hideMinutes = hours <= 0 && minutes <= 0;
    var hideSeconds = false;
    
    UtilityKTS.setClass(page.hoursOutput, settings.hideClass, hideHours);
    UtilityKTS.setClass(page.hoursUnitOutput, settings.hideClass, hideHours);
    
    UtilityKTS.setClass(page.minutesOutput, settings.hideClass, hideMinutes);
    UtilityKTS.setClass(page.minutesUnitOutput, settings.hideClass, hideMinutes);
    
    UtilityKTS.setClass(page.secondsOutput, settings.hideClass, hideSeconds);
    UtilityKTS.setClass(page.secondsUnitOutput, settings.hideClass, hideSeconds);
  }
  
  function getTimerSetting() {
    var hours = page.hoursOutput.innerHTML;
    var minutes = page.minutesOutput.innerHTML;
    var seconds = page.secondsOutput.innerHTML
    
    var dateTimerSetting = new Date(baseDate + ' ' + hours + ':' + minutes + ':' + seconds);
    
    return dateTimerSetting;
  }
  
  function setStartStopLabel() {
    var label = '??';
    
    if (settings.timerState == 'elapsed') {
      label = 'ok';
    } else if (settings.timerState == 'running') {
      label = 'stop';
    } else if (settings.timerState == 'paused') {
      label = 'resume';
    } else if (settings.timerState == 'cleared') {
      label = 'start';
    } 
    
    page.controlStartStop.innerHTML = label;
  }
  
  function showTimerSettings() {
    if (settings.timerState == 'running'  || settings.timerState == 'paused') return;
    
    page.hoursInput.value = settings.timerSetting.getHours()
    page.minutesInput.value = settings.timerSetting.getMinutes();
    page.secondsInput.value = settings.timerSetting.getSeconds();

    UtilityKTS.setClass(page.timerSettings, settings.hideClass, false);
    page.hoursInput.focus();
  }
  
  function saveTimerSettings(saveValues) {
    if (page.timerSettings.classList.contains(settings.hideClass)) return;
    
    if (saveValues) {
      var hours = page.hoursInput.value;
      var minutes = page.minutesInput.value;
      var seconds = page.secondsInput.value;
      
      var timerSettingNew = new Date(baseDate + ' ' + hours + ':' + minutes + ':' + seconds);
      settings.timerSetting = timerSettingNew;
      settings.timerResetValue = timerSettingNew;
      setTimeOutput(timerSettingNew);
    }
    
    UtilityKTS.setClass(page.timerSettings, settings.hideClass, true);
  }
    
  //--------------------------------------------------------------------------
  // handlers
	//--------------------------------------------------------------------------
  function handleTimerOutputClick(e) {
    showTimerSettings();
  }
  
  function handleStartStepClick(e) {
    saveTimerSettings(true);
    
    if (settings.timerState == 'running') {
      stopTimer();
    } else if (settings.timerState == 'cleared') {
      startTimer();
    } else if (settings.timerState == 'paused') {
      startTimer();
    } else if (settings.timerState == 'elapsed') {
      // nothing
    }
  }
  
  function handleResetClick(e) {
    saveTimerSettings(true);

    resetTimer();
  }
  
  function handleTimerInputText(e) {
    if (e.key == 'Escape') {
      saveTimerSettings(false);
      
    } else if (e.key = 'Enter') {
      saveTimerSettings(true);

    } else {
      return false;
    }
  }
  
  //--------------------------------------------------------------------------
  // utility
	//--------------------------------------------------------------------------  
  
	//-----------------------------------------------------------------------------------
	// init:
	//-----------------------------------------------------------------------------------
	return {
		init: init
 	};
}();