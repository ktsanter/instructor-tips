//-------------------------------------------------------------------
// Google Calendar
//-------------------------------------------------------------------
// TODO: standardize/generalize error handling and display
//-------------------------------------------------------------------
class GoogleCalendar {
  constructor(config) {
    this._config = config;
  }
  
  //--------------------------------------------------------------
  // initialization
  //--------------------------------------------------------------
    
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  listUpcomingEvents() {
    gapi.client.calendar.events.list({
      'calendarId': 'primary',
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 10,
      'orderBy': 'startTime'
    }).then(function(response) {
      var events = response.result.items;
      console.log('Upcoming events:');

      if (events.length > 0) {
        for (var i = 0; i < events.length; i++) {
          var event = events[i];
          var when = event.start.dateTime;
          if (!when) {
            when = event.start.date;
          }
          console.log(event.summary + ' (' + when + ')')
        }
      } else {
        console.log('No upcoming events found.');
      }
    });
  }
  
  listCalendars() {
    return gapi.client.calendar.calendarList.list({})
        .then(function(response) {
                // Handle the results here (response.result has the parsed body).
                console.log('Calendars:');
                var calendarItems = response.result.items;
                for (var i = 0; i < calendarItems.length; i++) {
                 var item = calendarItems[i];
                 console.log(item.summary + ' | ' + item.id + ' | ' + item.accessRole);
                 console.log(item.summary + ' | ' + item.id + ' | ' + item.accessRole);
                  console.log(item);
                }
                console.log('\n');
                
              },
              function(err) { console.error("Execute error", err); });
  }  
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
