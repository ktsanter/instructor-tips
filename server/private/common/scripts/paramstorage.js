//-------------------------------------------------------------------------------------
// wrapper class for Chrome sync storage (fallback to local storage)
//-------------------------------------------------------------------------------------
// TODO: 
//-------------------------------------------------------------------------------------

class ParamStorage {
  constructor() {}
  
  //-----------------------------------------------------------------------------------
  // load:
  //   paramList: [ {paramkey: xxx, resultkey: xxx, defaultval: xxx}, ... } 
  //-----------------------------------------------------------------------------------
  static async load(paramList) {
    if (chrome.storage) {
      return (await this._loadChromeStorage(paramList));
      
    } else {
      return this._loadLocal(paramList);
    }
  }
  
  //-----------------------------------------------------------------------------------
  // store:
  //   paramList: [ {paramkey: xxx, value: xxxxx}, ... ]
  //-----------------------------------------------------------------------------------
  static async store(paramList) {
    if (chrome.storage) {
      this._storeChromeStorage(paramList);
      
    } else {
      await this._storeLocal(paramList);
    }
  }
    
  //---------------------------------------------------------------------------------
  // private methods
  //---------------------------------------------------------------------------------
  static _loadLocal(paramList) {
    var results = {};
    for (var i = 0; i < paramList.length; i++) {
      var param = paramList[i];
      var val = localStorage.getItem(param.paramkey);
      results[param.resultkey] = val ? val : param.defaultval;
    }
    return results;
  }
  
  static _storeLocal(paramList) {
    for (var i = 0; i < paramList.length; i++) {
      var param = paramList[i];
      localStorage.setItem(param.paramkey, param.value);
    }
  }
  
  static async _loadChromeStorage(paramList) {
    var result = {};
    var resultMap = {};
    var keyList = [];
    
    for (var i = 0;  i < paramList.length; i++) {
      var param = paramList[i];
      result[ param.resultkey ] = param.defaultval;
      resultMap[ param.paramkey ] = param.resultkey;
      keyList.push( param.paramkey );
    }
    
    await this._loadPromise(keyList, resultMap)
      .then((value) => {        
        for (var i = 0; i < keyList.length; i++) {
          var key = keyList[i];
          if (value.hasOwnProperty(key)) result[ resultMap[key] ] = value[key];
        }
      });
    
    return result;
  }
  
  static _loadPromise(keyList, resultMap) {
    return new Promise((resolve) => {
      this._loadPromiseInner(keyList, (result) => {
        resolve(result);
      });
    })
  }  
  
  static _loadPromiseInner(keyList, promiseCallback) {
    chrome.storage.sync.get(keyList, function(result) {
      promiseCallback(result);
    });
  }    
  
  static async _storeChromeStorage(paramList) {
    var storageVals = {};
    for (var i = 0; i < paramList.length; i++) {
      var param = paramList[i];
      storageVals[param.paramkey] = param.value;
    }

    var result = await this._storePromise(storageVals);

    return true;    
  }
  
  static _storePromise(storageVals) {
    return new Promise((resolve) => {
      this._storePromiseInner(storageVals, () => {
        resolve();
      });
    })
  }

  static _storePromiseInner(storageVals, promiseCallback) {
    chrome.storage.sync.set(storageVals, function() {
      promiseCallback();
    });    
  }  
}
