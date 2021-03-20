//-------------------------------------------------------------------------------------
// wrapper class for Chrome sync storage
//-------------------------------------------------------------------------------------
class ChromeSyncStorage {
  constructor() {}
  
  //-----------------------------------------------------------------------------------
  // load:
  //   params: [ {key: xxx, resultfield: xxx, defaultval: xxx}, ... } 
  //   callback: optional callback function
  //-----------------------------------------------------------------------------------
  load(params, callback) {
    var result = {};
    var resultmap = {};
    var loadkeys = [];
    
    for (var i = 0;  i < params.length; i++) {
      var key = params[i].key;
      var resultfield = params[i].resultfield;
      var defaultval = params[i].defaultval;
      
      result[ resultfield ] = defaultval;
      resultmap[ key ] = resultfield;
      loadkeys.push( key );
    }
    
    chrome.storage.sync.get(loadkeys, function (loadresult) {
      for (var key in loadresult) {
        if (typeof loadresult[key] != 'undefined') result[ resultmap[key] ] = loadresult[key];
      }
      
      if (callback != null) callback(result);
    });
   }
  
  //-----------------------------------------------------------------------------------
  // store:
  //   params: [ {key: xxx, value: xxxxx}, ... ]
  //   callback: optional callback function
  //-----------------------------------------------------------------------------------
  store(params, callback) {
    var storagevals = {};
    for (var i = 0; i < params.length; i++) {
      storagevals[ params[i].key ] = params[i].value;
    }

    chrome.storage.sync.set(storagevals, function() {
      if (callback != null) callback();
    });
  }
}
