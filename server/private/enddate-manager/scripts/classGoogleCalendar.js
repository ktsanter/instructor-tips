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
  
  /* addEvent:
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
  async addEvent(calendarId, eventInfo) {
    return await gapi.client.calendar.events.insert({
      'calendarId': calendarId, 
      "resource": this._formatAddResource(eventInfo)
    }).then(
      function(response) {
        return({success: true, data: response.result, details: 'add event succeeded'});
      },
      
      function(err) { 
        console.error('(internal) fail', err);
        return({success: false, data: null, details: err});
      }
    )   
  }
  
  async addEventBatch(calendarId, eventList) {
    var success = true;
    
    for (var i = 0; i < eventList.length && success; i++) {
     var result = await this.addEvent(calendarId, eventList[i]);
     success = result.success;
    }

    return success;
  }
 
  
  /* removeEvent:
   * params = {
   *   calendarId:  google calendar ID,
   *   eventId:  calendar event ID
   * }
   */
  async removeEvent(eventInfo) {
    return await gapi.client.calendar.events.delete(_formatDeleteParams(eventInfo))
    .then(
      function(response) {
        return({success: true, data: params, details: 'event removed'});
      },
      
      function(err) { 
        console.error("GoogleCalendar.removeEvent error");
        console.error(err);
        return({success: false, data: params, details: err});
      }
    )  
  }
  
  async removeEventBatch(calendarId, eventList) {
    var success = true;

    for (var i = 0; i < eventList.length && success; i++) {
     var result = await this.removeEvent( {"calendarId": calendarId, "eventId": eventList[i]});
     success = result.success;
    }

    if (!success) console.log('removeEventBatch failed');

    return success;
  }  
  
  //--------------------------------------------------------------
  // true batching example
  //--------------------------------------------------------------
  async testBatch(batchParams) {
    return await this._testBatchPromise(batchParams);
  }
  
  _testBatchPromise(batchParams) {
    return new Promise((resolve, reject) => {        
      this._testBatch_internal((result) => {
        if (!result.hasOwnProperty('success')) {
          result = {success: true, details: 'batch succeeded', data: result};
        }
        resolve(result);
      }, 
      batchParams);
    });
  }
  
  _testBatch_internal(promiseCallback, batchParams) {
    try {
      var batchList = this._buildBatchList(batchParams);
      if (batchList.length == 0) {
        promiseCallback({success: true, data: null, details: 'no items in batch list'});
        return;
      }
      
      var batch = gapi.client.newBatch();

      for (var i = 0; i < batchList.length; i++) {
        batch.add(batchList[i]);
      }
      
      batch.execute(promiseCallback);
      
    } catch(err) {
      console.log('_testBatch_internal catch');
      console.log(err);
      promiseCallback({success: false, data: null, details: JSON.stringify(err)});
    }
  }
  
  //--------------------------------------------------------------
  // private methods
  //--------------------------------------------------------------   
  _formatAddResource(eventInfo) {
    var propReminders = { useDefault: true };
    if (eventInfo.hasOwnProperty('reminders')) {
      propReminders.useDefault = false;
      propReminders.overrides = [];
      for (var i = 0; i < eventInfo.reminders.length; i++) {
        propReminders.overrides.push(eventInfo.reminders[i]);
      }
    }
    
    var propTransparency = 'transparent';
    if (eventInfo.hasOwnProperty('busy') && eventInfo.busy) propTransparency = 'opaque';
    
    var resource = {
      "end": {
        "date": eventInfo.date
      },
      "start": {
        "date": eventInfo.date
      },
      "summary": eventInfo.summary,
      "description": eventInfo.description,
      "location": eventInfo.location,
      "reminders": propReminders,
      "transparency": propTransparency
    };
    
    return resource;
  }
  
  _formatDeleteParams(eventInfo) {
    var params = {
      "calendarId": eventInfo.calendarId, 
      "eventId": eventInfo.eventId
    };
    
    return params;      
  }
  
  _buildBatchList(batchParams) {
    var batchList = [];
    for (var i = 0; i < batchParams.length; i++) {
      var item = batchParams[i];
      
      if (item.action == 'add') {
        batchList.push(gapi.client.calendar.events.insert({
          "calendarId": item.params.calendarId, 
          "resource": this._formatAddResource(item.params)
        }));
    
      } else if (item.action == 'remove') {
        batchList.push(gapi.client.calendar.events.delete(this._formatDeleteParams(item.params)));
        
      } else if (item.action == 'get-calendars') {
        batchList.push(gapi.client.calendar.calendarList.list({}));
      }
    }
    
    return batchList;
  }
  
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
