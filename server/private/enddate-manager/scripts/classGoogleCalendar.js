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
  getCalendarInfo(callback) {
    return gapi.client.calendar.calendarList.list({})
    .then (
      function(response) {
        callback(true, response.result);
      },
      
      function(err) { 
        console.error("GoogleCalendar.loadCalendarInfo error", err); 
        callback(false, err);
      }
    );
  }    
  
  getEventInfo(params, callback) {
    console.log('GoogleCalendar.loadEventInfo');
    console.log(params.calendarId);
    
    return gapi.client.calendar.events.list({
      'calendarId': params.calendarId,
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 10,
      'orderBy': 'startTime'
    }) 
    .then (
      function(response) {
        var events = response.result.items;
        callback(true, response.result);
      },
      
      function(err) {
        console.log('GoogleCalendar.getEventInfo error', err);    
        callback(false, err);
      }
    )
  }
  
  addAllDayEvent(params, callback) {
    console.log('GoogleCalendar.addEvent');
    console.log(params.calendarId);

    return gapi.client.calendar.events.insert({
      'calendarId': params.calendarId, 
      "resource": {
        "end": {
          "date": params.date
        },
        "start": {
          "date": params.date
        },
        "summary": params.summary,
        "description": params.description,
        "location": params.location
      }
    })
        .then(function(response) {
                // Handle the results here (response.result has the parsed body).
                console.log("Response", response);
              },
              function(err) { console.error("Execute error", err); });  }

  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
