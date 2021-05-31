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
    return gapi.client.calendar.events.list({
      'calendarId': params.calendarId,
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 1000,
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
  async addEvent(params) {
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

    return await gapi.client.calendar.events.insert({
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
        console.log('(internal) success');
        return({success: true, data: response.result, details: 'add event succeeded'});
        //callback(true, response.result);
      },
      
      function(err) { 
        console.error('(internal) fail', err);
        return({success: false, data: null, details: err});
        //callback(false, err);        
      }
    )   
  }
  
  addBatchOfAllDayEvents(params, callback) {
    console.log('addBatchOfAllDayEvents');

    var eventList = [];
    for (var i = 0; i < params.length; i++) {
      var item = params[i];
      
      var propTransparency = 'transparent';  // check for busy
      var propReminders = { useDefault: true }; // check for overrides

      eventList.push({
        "calendarId": item.calendarId,
        "resource": {
          "end": {
            "date": item.date
          },
          "start": {
            "date": item.date
          },
          "summary": item.summary,
          "description": item.description,
          "location": item.location,
          "reminders": propReminders,
          "transparency": propTransparency
        }
      });
    }
    
    var batch = gapi.client.newBatch();
    var getCalendarList = gapi.client.calendar.calendarList.list({});
    batch.add(getCalendarList);
    batch.add(getCalendarList);
    batch.execute(callback);
  }
  
  foo(params) {
    console.log('foo');
    console.log(params);
  }
  
  /* removeEvent:
   * params = {
   *   calendarId:  google calendar ID,
   *   eventId:  calendar event ID
   * }
   */
  async removeEvent(params) {
    console.log('GoogleCalendar.removeEvent');
    console.log(params);

    return await gapi.client.calendar.events.delete({
      "calendarId": params.calendarId, 
      "eventId": params.eventId
    }).then(
      function(response) {
        // on success response.body = "", response.result = false, response.status = 204
        console.log("Response", response);
        return({success: true, data: params, details: 'event removed'});
      },
      
      function(err) { 
        console.error("GoogleCalendar.removeEvent error", err); 
        return({success: false, data: params, details: error});
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
