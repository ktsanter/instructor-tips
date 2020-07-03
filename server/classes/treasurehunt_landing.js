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
        '  projectname, imagename, imagefullpage, message, positiveresponse, negativeresponse ' +
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
    console.log(projectInfo);
    
    if (this._fileServices.existsSync(pugFileName)) {
      result.success = true;
      result.data = this._pug.renderFile(pugFileName, {"params": projectInfo});
    }
    
    return result;
  }

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------

}
