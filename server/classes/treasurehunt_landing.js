"use strict";
//---------------------------------------------------------------
// TreasureHunt landing page interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.TreasureHuntLanding = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;
    this._commonmark = params.commonmark;
    this._pug = params.pug;
    this._fileServices = params.fileServices;
  }
  
//---------------------------------------------------------------
// render landing page
//---------------------------------------------------------------
  async renderLandingPage(params, pugFileName, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    if (params.projectid == 'preview') {
      queryResults = await this._getProjectPreview(userInfo);
    
    } else {
      queryList = { 
        project:
          'select ' +
          '  projectid, projectname, imagename, imagefullpage, message, positiveresponse, negativeresponse ' +
          'from project ' +
          'where projectid = ' + params.projectid
      };
      
      queryResults = await this._dbManager.dbQueries(queryList);
    }
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    if (queryResults.data.project.length == 0) {
      result.details = 'cannot retrieve project info';
      return result;
    }
    
    var projectInfo = queryResults.data.project[0];
    if (this._fileServices.existsSync(pugFileName)) {
      result.success = true;
      result.data = this._pug.renderFile(pugFileName, {"params": projectInfo});
    }
    
    return result;
  }
  
  async _getProjectPreview(userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
      
    queryList = {
      project:
        'select ' + 
          'p.snapshot ' + 
        'from projectpreview as p ' +
        'where p.userid = ' + userInfo.userId + ' '
    };
    
    queryResults = await this._dbManager.dbQueries(queryList);
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      
      var snapshot = queryResults.data.project[0].snapshot;
      var parsed = snapshot;
      
      // hack: don't know why this is different between prod and dev
      if (typeof snapshot == 'string') {
        var snapshot = this._unescapeSingleQuote(snapshot);
        parsed = JSON.parse(snapshot);
      }

      result.data = {
        project: [parsed.project]
      };

    } else {
      result.details = queryResults.details;
    }
    
    return result;    
  }

//---------------------------------------------------------------
// check user clue answer
//---------------------------------------------------------------
  async checkAnswer(postData) {
    var result = this._dbManager.queryFailureResult(); 
    
    var query, queryResults;
    
    query = 
      'select ' + 
        'c.clueid, c.cluenumber, ' +
        'c.clueprompt, c.clueresponse, c.clueconfirmation, ' +
        'c.clueactiontype, c.clueactiontarget, c.clueactioneffecttype, c.clueactionmessage, c.cluesearchfor ' +
      'from clue as c ' +
      'where c.projectid = ' + postData.projectid + ' ' +
      'order by c.cluenumber';

    queryResults = await this._dbManager.dbQuery(query);

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var clueInfo = queryResults.data;
    var matchingClue;
    for (var i = 0; i < clueInfo.length && !matchingClue; i++) {
      var clue = clueInfo[i];
      if (clue.clueresponse.toLowerCase() == postData.answer.toLowerCase()) {
        matchingClue = clue;
      }
    }
    
    var resultData = {correct: false};
    if (matchingClue) {
      resultData = {
        correct: true,
        cluenumber: matchingClue.cluenumber,
        numberofclues: clueInfo.length,
        confirmation: matchingClue.clueconfirmation,
        action: {
          type: matchingClue.clueactiontype,
          target: matchingClue.clueactiontarget,
          effecttype: matchingClue.clueactioneffecttype,
          message: matchingClue.clueactionmessage,
          searchfor: matchingClue.cluesearchfor
        }
      };
    }  
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = resultData;

    return result;
  }
  
//---------------------------------------------------------------
// support methods
//---------------------------------------------------------------     
  _unescapeSingleQuote(str) {
    return str.replace(/singlequotereplacement/g, '\'');
  }
  
}
