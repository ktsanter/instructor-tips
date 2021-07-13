"use strict";
//---------------------------------------------------------------
// SQL DB interface class
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
class SQLDBInterface {

  static async doGetQuery(queryType, queryName, elemNotice) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbGet(queryType, queryName);
    if (requestResult.success) {
      resultData = requestResult;
    } else {
      if (elemNotice) elemNotice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }

  static async doPostQuery(queryType, queryName, postData, elemNotice) {
    var resultData = {success: false};
    
    var requestResult = await SQLDBInterface.dbPost(queryType, queryName, postData);
    if (requestResult.success) {
      resultData = requestResult;
      if (elemNotice) elemNotice.setNotice('');
    } else {
      resultData.details = requestResult.details;
      if (elemNotice) elemNotice.setNotice('DB error: ' + JSON.stringify(requestResult.details));
    }
    
    return resultData;
  }      
  
  static async dbGet(queryType, queryName) {
    const METHOD_TITLE = 'dbGet';
    
    var url = this.__buildApiUrl__(queryType, queryName);
    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE};
    //console.log(url);

    try {
      const resp = await fetch(url);
      //console.log(resp);
      const json = await resp.json();
      //console.log(json);

      if (!json.success) {
        var errmsg = '*ERROR(1): in ' + METHOD_TITLE + ', ' + JSON.stringify(json.details);
        console.log(errmsg);
        result.details = errmsg;
      } else {
        result = json;
      }
      
    } catch (error) {
      var errmsg = '**ERROR(2): in ' + METHOD_TITLE + ', ' + error;
      console.log(errmsg);
      result.details = errmsg;
    }
    
    return result;
  }  
  
  static async dbPost(queryType, queryName, postData) {
    const METHOD_TITLE = 'dbPost';
    
    var url = this.__buildApiUrl__(queryType, queryName);
    //console.log(url);
    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE};

    try {
      const resp = await fetch(url, {method: 'post', headers: {'Content-Type': 'application/json; charset=utf-8'}, body: JSON.stringify(postData)});
      const json = await resp.json();
      //console.log(json);
      
      if (!json.success) {
        var errmsg = '*ERROR: in ' + METHOD_TITLE + ', ' + JSON.stringify(json.details);
        console.log(errmsg);
        console.log('url: ' + url);
        console.log('postData: ' + JSON.stringify(postData));
        result.details = errmsg;
      } else {
        result = json;
      }
      
    } catch (error) {
      var errmsg = '**ERROR: in ' + METHOD_TITLE + ', ' + error;
      console.log(errmsg);
      result.details = errmsg;
    }
    
    return result;
  }

  static __buildApiUrl__(queryType, queryName) {
    var url = '/' + queryType + '/' + queryName;
    
    //console.log('buildApiUrl: url=' + url);
    
    return url;
  }  
}
