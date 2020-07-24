"use strict";
//---------------------------------------------------------------
// Welcome letter interface
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.WelcomeLetter = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;
    this._pug = params.pug;
    this._fileServices = params.fileServices;
  }
  
//---------------------------------------------------------------
// render landing page
//---------------------------------------------------------------
  async renderWelcomeLetter(params, pugFileNames) {
    var result = this._dbManager.queryFailureResult(); 
    
    /*
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
    */
   
    var pugFile = pugFileNames.student;
    if (params.audience == 'mentor') pugFile = pugFileNames.mentor;
    var letterParams = {
      coursekey: params.coursekey,
      coursename: 'DummyCourseName'
    }
    
    if (this._fileServices.existsSync(pugFile)) {
      result.success = true;
      result.data = this._pug.renderFile(pugFile, {"params": letterParams});
    }
    
    return result;
  }
  
  async renderConfigurationPage(res, me, pugFileName, renderAndSendPug) {
    var queryList, queryResults;
/*
    queryList = {
      courses: 
        'select courselistingid, textkey, description ' +
        'from courselisting ' +
        'order by description',
        
      startend:
        'select description, startdate, enddate ' +
        'from startend ' +
        'order by description'
    }
    
    queryResults = await me._dbManager.dbQueries(queryList);
    if (!queryResults.success) {
      me._renderFail();
      return;
    }
    
    var pugOptions = {
      courses: queryResults.data.courses,
      startend: queryResults.data.startend
    };
    
    */

    var pugOptions = {
      coursekey: 'fpa',
      coursename: 'Foundations of Programming A'
    };
    
    renderAndSendPug(res, 'welcome', pugFileName, {params: pugOptions});
  }
  
  _renderFail() {
    res.send('cannot access page: pgviewer')    
  }  

//---------------------------------------------------------------
// other support methods
//---------------------------------------------------------------     
}
