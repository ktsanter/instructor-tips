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
    console.log('GoogleCalendar.getCalendarInfo');
    return gapi.client.calendar.calendarList.list({}).then (
      function(response) {
        console.log('gapi.client.calendar.calendarList.list succeeded');
        callback(true, response.result);
      },
      
      function(err) { 
        console.error("GoogleCalendar.getCalendarInfo error", err); 
        callback(false, err);
      }
    );
  }    
  
  /* getEventInfo:
   * params = {
   *   calendarId: google calendar ID,
   * }
   */
  getEventInfo(params, callback, timeMin, timeMax) {
    console.log('GoogleCalendar.getEventInfo', params);
    var params = {
      'calendarId': params.calendarId,
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 1000,
      'orderBy': 'startTime'
    };
    return gapi.client.calendar.events.list(params).then (
      function(response) {
        var events = response.result.items;
        console.log('GoogleCalendar.getEventInfo succeeded', events);
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
    
  /* removeEvent:
   * params = {
   *   calendarId:  google calendar ID,
   *   eventId:  calendar event ID
   * }
   */
  async removeEvent(eventInfo) {
    return await gapi.client.calendar.events.delete(this._formatDeleteParams(eventInfo))
    .then(
      function(response) {
        return({success: true, data: response, details: 'event removed'});
      },
      
      function(err) { 
        console.error("GoogleCalendar.removeEvent error");
        console.error(err);
        return({success: false, data: null, details: err});
      }
    )  
  }
  
  //--------------------------------------------------------------
  // synchronous batching
  //--------------------------------------------------------------
  async addEventBatch(calendarId, eventList) {
    var success = true;
    
    for (var i = 0; i < eventList.length && success; i++) {
     var result = await this.addEvent(calendarId, eventList[i]);
     success = result.success;
    }

    return success;
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
  // async batching using Google API
  //--------------------------------------------------------------
  async executeBatch(batchParams) {
    //console.log('GoogleCalendar.executeBatch');
    //console.log('batchParams...');
    //console.log(batchParams);
    
    var result = await this._executeBatchPromise(batchParams);
    //console.log('result...');
    //console.log(result);
    
    return result;
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
  
  _executeBatchPromise(batchParams) {
    return new Promise((resolve, reject) => {        
      this._executeBatch_internal((result) => {
        //console.log('_executeBatchPromise result...');
        //console.log(result);

        if (!result.hasOwnProperty('success')) {
          result = {success: true, details: 'batch succeeded', data: result};
        }
        resolve(result);
      }, 
      batchParams);
    });
  }
  
  _executeBatch_internal(promiseCallback, batchParams) {
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
      console.log('_executeBatch_internal catch');
      console.log(err);
      promiseCallback({success: false, data: null, details: JSON.stringify(err)});
    }
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
