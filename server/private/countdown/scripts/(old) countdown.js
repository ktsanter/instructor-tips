var ktsCountdownCode = {
	"ktsCountdownParam" : {},

	"ktsCountdownTags" : {
		'content': 'ktsCountdownContent',
		'title': ['ktsTitle1', 'ktsTitle2', 'ktsTitle3'],
		'days': ['ktsDeadline1Days', 'ktsDeadline2Days', 'ktsDeadline3Days'],
		'hours': ['ktsDeadline1Hours', 'ktsDeadline2Hours', 'ktsDeadline3Hours'],
		'minutes': ['ktsDeadline1Minutes', 'ktsDeadline2Minutes', 'ktsDeadline3Minutes'],
		'seconds': ['ktsDeadline1Seconds', 'ktsDeadline2Seconds', 'ktsDeadline3Seconds'],
		'container': ['ktsDeadline1Container', 'ktsDeadline2Container', 'ktsDeadline3Container']
	},

	"ktsCountdownHTML" : ""
		+ "<div class='kts-countdown kts-countdown-container'>"
		+  " <table id='ktsDeadlineXXXXContainer' class='kts-countdown kts-countdown-table'>"
		+ 	"<tr>"
		+	"  <td id='ktsTitleXXXX' class='kts-countdown kts-countdown-title'> </td>"
		+	"  "
		+	"  <td class='kts-countdown kts-countdown-cell'> "
		+	"	<div id='ktsDeadlineXXXXDays' class='kts-countdown kts-countdown-num'> </div>"
		+	"	<div class='kts-countdown kts-countdown-label'> DAYS </div>"
		+	 " </td> "
		+	  ""
		+	 " <td class='kts-countdown kts-countdown-cell'> "
		+	"	<div id='ktsDeadlineXXXXHours' class='kts-countdown kts-countdown-num'> </div>"
		+	"	<div class='kts-countdown kts-countdown-label'> HOURS </div>"
		+	"  </td> "
		+	"  "
		+	 " <td class='kts-countdown kts-countdown-cell'> "
		+	"	<div id='ktsDeadlineXXXXMinutes' class='kts-countdown kts-countdown-num'> </div>"
		+	"	<div class='kts-countdown kts-countdown-label'> MINUTES </div>"
		+	 " </td> "
		+	 " "
		+	 " <td class='kts-countdown kts-countdown-cell'> "
		+	"	<div id='ktsDeadlineXXXXSeconds' class='kts-countdown kts-countdown-num'> </div>"
		+	"	<div class='kts-countdown kts-countdown-label'> SECONDS </div>"
		+	 " </td> "
		+	"</tr>"
		+ "</table>"
		+ "</div>"
		+ "",

	"ktsCountdownTimer": null,

	"ktsCreateCountdownTimer": function(inputParam)
		{
			ktsCountdownParam = this.loadParameters(inputParam);
			this.addCountdownCSS();
		},

	"loadParameters": function (inputParam)
		{
			var param = {};
			param.nDates = inputParam.nDates;
			param.titleDuring = [inputParam.titleDuring[0], inputParam.titleDuring[1], inputParam.titleDuring[2]];
			param.titleAfter = [inputParam.titleAfter[0], inputParam.titleAfter[1], inputParam.titleAfter[2]];
			
			var date1 = new Date(inputParam.date[0]);
			var date2 = new Date(inputParam.date[1]);
			var date3 = new Date(inputParam.date[2]);

			param.date = [date1, date2, date3];
			param.date_MMDD = [this.formatMMDD(date1), this.formatMMDD(date2), this.formatMMDD(date3)];
			param.date_YYYYMMDD = [this.formatYYYYMMDD(date1), this.formatYYYYMMDD(date2), this.formatYYYYMMDD(date3)];
			
			return param;
		},

	"addCountdownCSS": function ()
		{
			var ktsCountdownStyleSheet = 'styles/countdown.css';

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var styleElement = document.createElement('style');
					styleElement.innerHTML = xhttp.responseText;
					document.head.appendChild(styleElement);
					
					ktsCountdownCode.addCountdownHTML();
					ktsCountdownCode.doCountdown(ktsCountdownParam);
				}
			};
			xhttp.open("GET", ktsCountdownStyleSheet, true);
			xhttp.send();
		},

	"addCountdownHTML": function()
		{
			var sHTML = '';
			for (var i = 0; i < ktsCountdownParam.nDates; i++) {
				sHTML += this.ktsCountdownHTML.replace(/XXXX/g, (i + 1));
			}

			document.getElementById(this.ktsCountdownTags.content).innerHTML = sHTML;
		},

	"doCountdown": function (param) 
		{
			this.updateCountdown();
			ktsCountdownTimer = setInterval(function() {
				var done = ktsCountdownCode.updateCountdown();
				if (done) {	
					clearInterval(ktsCountdownTimer);
				}
			}, 1000);
		},

	"clearCountdown": function()
	{
		clearInterval(ktsCountdownTimer);
	},
	
	"updateCountdown": function()
		{
			var now = new Date().getTime();
			var done = true;

			for (var i = 0; i < ktsCountdownParam.nDates; i++) {
				if (!this.updateSingleCountdown(i, now)) {
					done = false;
				}
			}

			return done;
		},

	"updateSingleCountdown": function(whichCountdown, now) 
		{
		  var countdownDone = false;
		  var countdownDateTime = new Date(ktsCountdownParam.date[whichCountdown]).getTime();
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
			
		  if (distance >= 0) {
			countdownDone = false;
			document.getElementById(this.ktsCountdownTags.title[whichCountdown]).textContent = ktsCountdownParam.titleDuring[whichCountdown] + ' ' + ktsCountdownParam.date_MMDD[whichCountdown];
			document.getElementById(this.ktsCountdownTags.days[whichCountdown]).innerHTML = days;
			document.getElementById(this.ktsCountdownTags.hours[whichCountdown]).innerHTML = hours;
			document.getElementById(this.ktsCountdownTags.minutes[whichCountdown]).innerHTML = minutes;
			document.getElementById(this.ktsCountdownTags.seconds[whichCountdown]).innerHTML = seconds;

		  } else {
			countdownDone = true;
			document.getElementById(this.ktsCountdownTags.title[whichCountdown]).textContent = ktsCountdownParam.titleAfter[whichCountdown] + ' ' + ktsCountdownParam.date_MMDD[whichCountdown];
			document.getElementById(this.ktsCountdownTags.days[whichCountdown]).innerHTML = '00';
			document.getElementById(this.ktsCountdownTags.hours[whichCountdown]).innerHTML = '00';
			document.getElementById(this.ktsCountdownTags.minutes[whichCountdown]).innerHTML = '00';
			document.getElementById(this.ktsCountdownTags.seconds[whichCountdown]).innerHTML = '00';
			document.getElementById(this.ktsCountdownTags.container[whichCountdown]).classList.add('kts-expired');
		  }
		  
		  return countdownDone;
		},

	"formatMMDD": function(date) 
		{
			return this.padNumber(date.getMonth()+1) + '/' + this.padNumber(date.getDate());
		},

	"formatYYYYMMDD": function(date) 
		{
		  return date.getFullYear() + '-' + this.padNumber(date.getMonth()+1) + '-' + this.padNumber(date.getDate());
		},

	"padNumber": function(n) 
		{
		  return ('00' + n).slice(-2);
		}
}