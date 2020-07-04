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
  async renderLandingPage(params, pugFileName) {
    var result = this._dbManager.queryFailureResult(); 
    
    var queryList, queryResults;
    
    queryList = { 
      project:
        'select ' +
        '  projectid, projectname, imagename, imagefullpage, message, positiveresponse, negativeresponse ' +
        'from project ' +
        'where projectid = ' + params.projectid
    };
      
    queryResults = await this._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    if (queryResults.data.project.length == 0) {
      result.details = 'cannot retrieve project info';
      return result;
    }
    
    var projectInfo = queryResults.data.project[0];
    projectInfo.message = this._convertToHTML(projectInfo.message);
    projectInfo.positiveresponse = this._convertToHTML(projectInfo.positiveresponse);
    projectInfo.negativeresponse = this._convertToHTML(projectInfo.negativeresponse);
    
    if (this._fileServices.existsSync(pugFileName)) {
      result.success = true;
      result.data = this._pug.renderFile(pugFileName, {"params": projectInfo});
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
      'order by c.cluenumber'
      
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
// other support methods
//---------------------------------------------------------------     
  _convertToHTML(str) {
    var reader = new this._commonmark.Parser();
    var writer = new this._commonmark.HtmlRenderer();
    
    var parsed = reader.parse(str);
    var result = writer.render(parsed);
    
    result = result.replace(/%%(.*?)%%/g, '<span style=\"background-color: #FFFF00\">$1</span>');
    
    //if (result.slice(0, 3) == '<p>' && result.slice(-5) == '</p>\n') {
    //  result = result.substring(3);
    //  result = result.substring(0, result.length-5);
    //}

    return result;
  }
}
