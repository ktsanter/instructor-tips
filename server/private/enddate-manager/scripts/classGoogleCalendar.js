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
    return gapi.client.calendar.calendarList.list({}).then (
      function(response) {
        callback(true, response.result);
      },
      
      function(err) { 
        console.error("GoogleCalendar.loadCalendarInfo error", err); 
        callback(false, err);
      }
    );
  }    
  
  /* getEventInfo:
   * params = {
   *   calendarId: google calendar ID,
   * }
   */
  getEventInfo(params, callback) {
    console.log('GoogleCalendar.loadEventInfo');
    
    return gapi.client.calendar.events.list({
      'calendarId': params.calendarId,
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 10,
      'orderBy': 'startTime'
    }).then (
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
  
  /* addAllDayEvent:
   * params = {
   *   calendarId: google calendar ID,
   *   date:  date of event 'yyyy-mm-dd',
   *   summary: title of event
   *   description: description of event,
   *   location: location of event,
   *   busy: (optional) boolean, default = false
   *   reminders: (optional) list [
   *     {
   *        method: 'popup' or 'email',
   *        minutes: number of minutes reminder is sent before event
   *     }
   *   ]
   * }
   */
  addAllDayEvent(params, callback) {
    console.log('GoogleCalendar.addEvent');
    
    var propReminders = { useDefault: true };
    if (params.hasOwnProperty('reminders')) {
      propReminders.useDefault = false;
      propReminders.overrides = [];
      for (var i = 0; i < params.reminders.length; i++) {
        propReminders.overrides.push(params.reminders[i]);
      }
    }
    
    var propTransparency = 'transparent';
    if (params.hasOwnProperty('busy') && params.busy) propTransparency = 'opaque';

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
        "location": params.location,
        "reminders": propReminders,
        "transparency": propTransparency
      }
    }).then(
      function(response) {
        callback(true, response.result);
      },
      
      function(err) { 
        console.error("Execute error", err);
        callback(false, err);        
      }
    )  
  }
  
  /* removeEvent:
   * params = {
   *   calendarId:  google calendar ID,
   *   eventId:  calendar event ID
   * }
   */
  removeEvent(params) {
    console.log('GoogleCalendar.removeEvent');
    console.log(params);

    return gapi.client.calendar.events.delete({
      "calendarId": params.calendarId, 
      "eventId": params.eventId
    }).then(
      function(response) {
        // on success response.body = "", response.result = false, response.status = 204
        //console.log("Response", response);
      },
      
      function(err) { 
        console.error("GoogleCalendar.removeEvent error", err); 
      }
    )  
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
