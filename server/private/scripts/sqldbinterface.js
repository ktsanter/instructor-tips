"use strict";
//---------------------------------------------------------------
// SQL DB interface class
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
class SQLDBInterface {
  static async dbGet(queryType, queryName) {
    const METHOD_TITLE = 'dbGet';
    
    var url = this.__buildApiUrl__(queryType, queryName);

    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE};

    try {
      const resp = await fetch(url);
      const json = await resp.json();
      //console.log(json);

      if (!json.success) {
        var errmsg = '*ERROR: in ' + METHOD_TITLE + ', ' + JSON.stringify(json.details);
        console.log(errmsg);
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
  
  static async dbPost(queryType, queryName, postData) {
    const METHOD_TITLE = 'dbPost';
    
    var url = this.__buildApiUrl__(queryType, queryName);
    var result = {success: false, details: 'unspecified error in ' + METHOD_TITLE};

    try {
      const resp = await fetch(url, {method: 'post', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(postData)});
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
