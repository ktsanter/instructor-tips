"use strict";
//---------------------------------------------------------------
// server-side for walkthrough analyzer 
//---------------------------------------------------------------
// TODO: 
//---------------------------------------------------------------
const internal = {};

module.exports = internal.WalkthroughAnalyzer = class {
  constructor(params) {
    this._dbManager = params.dbManager;
    this._userManagement = params.userManagement;    
    this._tempFileManager = params.tempFileManager;
    this._formManager = params.formManager;
        
    // Excel column names for walkthrough data (partial - these are the first few fixed columns)
    this.colWalkthrough_Course_Section = 'Course/ Section Title';
    this.colWalkthrough_CreatedBy = 'Created By';
    this.colWalkthrough_InstructorName = 'Instructor Name';
    this.colWalkthrough_CreatedDate = 'Created';
    this._requiredColumns_Walkthrough = new Set([
      this.colWalkthrough_Course_Section,
      this.colWalkthrough_CreatedBy,
      this.colWalkthrough_InstructorName,
      this.colWalkthrough_CreatedDate
    ]);    

  }
  
//---------------------------------------------------------------
// public: dispatchers
//---------------------------------------------------------------
  async doQuery(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();

    if (params.queryName == 'admin-allowed') {
      dbResult = await this._getAdminAllowed(params, postData, userInfo, funcCheckPrivilege);
      
    } else if (params.queryName == 'walkthrough-datasets') {
      dbResult = await this._getWalkthroughDatasets(params, postData, userInfo);
            
    } else if (params.queryName == 'walkthrough-datasetselections') {
      dbResult = await this._getWalkthroughDatasetSelections(params, postData, userInfo);
            
    } else if (params.queryName == 'walkthrough-data') {
      dbResult = await this._getWalkthroughData(params, postData, userInfo);
            
    } else if (params.queryName == 'walkthrough-filter') {
      dbResult = await this._getFilter(params, postData, userInfo);
            
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    } 
    
    return dbResult;
  }

  async doInsert(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    dbResult.details = 'unrecognized parameter: ' + params.queryName;
        
    return dbResult;
  }
  
  async doUpdate(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'walkthrough-dataset') {
      dbResult = await this._updateWalkthroughDataset(params, postData, userInfo);
      
    } else if (params.queryName == 'filter-hideempty') {
      dbResult = await this._updateFilterEmpty(params, postData, userInfo);
      
    } else if (params.queryName == 'filter-criterion') {
      dbResult = await this._updateFilterCriterion(params, postData, userInfo);
      
    } else if (params.queryName == 'filter-criterionlist') {
      dbResult = await this._updateFilterCriterionList(params, postData, userInfo);
      
    } else if (params.queryName == 'walkthrough-dataset-selection') {
      dbResult = await this._updateWalkthroughSetSelection(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }  

  async doDelete(params, postData, userInfo, funcCheckPrivilege) {
    var dbResult = this._dbManager.queryFailureResult();
    
    if (params.queryName == 'walkthrough-dataset') {
      dbResult = await this._deleteWalkthroughDataset(params, postData, userInfo);
      
    } else {
      dbResult.details = 'unrecognized parameter: ' + params.queryName;
    }
    
    return dbResult;
  }
  
//---------------------------------------------------------------
// other public methods
//---------------------------------------------------------------  
  processUploadedFile(req, res, uploadType, userInfo) {
    var validTypes = new Set(['walkthrough']);

    if (validTypes.has(uploadType)) {
      this._processExcelFile(req, res, uploadType, userInfo);
      
    } else {
      this._sendFail(res, 'unrecognized upload type: ' + uploadType);
    }
  }
  
  exportToExcel(req, res, callback) {
    var thisObj = this;
    var result = {
        "success": false,
        "description": "export failed",
        "workbook": null,
        "targetfilename": ""
      }

    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        callback(req, res, {"success": false, "description": 'error in form.parse: ' + JSON.stringify(err)});
        return;
      }
      
      if (!fields.hasOwnProperty('export-data')) {
        callback(req, res, {"success": false, "description": 'missing export data field'});
        return;
      }
      
      var exportData = JSON.parse(fields['export-data']);
      
      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      workbook.clearThemes();
      
      var exportFileName = 'roster-manager-export.xlsx';
      thisObj._writeExportDataToWorkbook(thisObj, exportData, workbook);
      
      var result = {
        "success": true,
        "description": "success",
        "workbook": workbook,
        "targetfilename": exportFileName
      }
      
      callback(req, res, result);
   });
  }
    
//---------------------------------------------------------------
// private methods - file processing
//--------------------------------------------------------------- 
  async _processExcelFile(req, res, uploadType, userInfo) {
    var thisObj = this;

    var form = new this._formManager.IncomingForm();
    form.parse(req, async function(err, fields, files) {
      if (err) {
        thisObj._sendFail(res, 'error in form.parse: ' + JSON.stringify(err));
        return;
      }
      
      let datasetName = fields.datasetname;
      
      var origFileName = files.file.name;
      var filePath = files.file.path;
      const exceljs = require('exceljs');
      var workbook = new exceljs.Workbook();
      await workbook.xlsx.readFile(filePath);
      if (workbook.worksheets.length == 0) {
        thisObj._sendFail(res, 'missing first worksheet');
        return;
      }    
      
      workbook.clearThemes();
      var worksheet = workbook.getWorksheet(1);
       
      var processRoutingMap = {
        "walkthrough": thisObj._processWalkthroughFile
      }
      
      if (processRoutingMap.hasOwnProperty(uploadType)) {
        processRoutingMap[uploadType](res, thisObj, worksheet, userInfo, datasetName);

      } else {
        thisObj._sendFail(res, 'unrecognized upload type: ' + uploadType);
      }
    });
  }
  
  //----------------------------------------------------------------------
  // process specific Excel file
  //----------------------------------------------------------------------
  async _processWalkthroughFile(res, thisObj, worksheet, userInfo, datasetName) {
    var validate = thisObj._verifyHeaderRow(worksheet.getRow(1), thisObj._requiredColumns_Walkthrough);
    if (!validate.success) {
      console.log('missing columns', validate);
      thisObj._sendFail(res, 'missing one or more required columns');
      return;
    }
    let foundColumnInfo = validate.columnInfo;
    
    var result = await thisObj._getWalkthroughCriteria();
    if (!result.success) {
      console.log('failed to retrieve walkthrough criteria');
      thisObj._sendFail(res, 'failed to retrieve walkthrough criteria');
    }
    var criteriaMasterList = result.data.criteriaList;
    
    result = thisObj._packageUploadedWalkthroughValues(thisObj, worksheet, foundColumnInfo, criteriaMasterList);
    if (!result.success) {
      thisObj._sendFail(res, '**failed to package values');
    }
    let walkthroughItems = result.data.walkthroughItems;

    var result = await thisObj._postWalkthroughItems(thisObj, walkthroughItems, userInfo, datasetName);
    if (!result.success) {
      thisObj._sendFail(res, result.details);
      return;
    }

    result.success = true;
    result.data = {"dummy": "dummy walkthrough results"};
    thisObj._sendSuccess(res, 'upload succeeded', result.data);
  }
  
  //-----------------------------------------------------------------
  // package data from specific uploaded file
  //-----------------------------------------------------------------
  _packageUploadedWalkthroughValues(thisObj, worksheet, foundColumnInfo, criteriaMasterList) {
    var result = {success: false, data: null};
    
    let criteriaFoundList = thisObj._findCriteriaList(criteriaMasterList, worksheet.getRow(1));;
    let createDateList = thisObj._getCreateDateList(worksheet.getColumn(foundColumnInfo[thisObj.colWalkthrough_CreatedDate]));
    
    var walkthroughItems = [];
    for (let i = 0; i < criteriaFoundList.length; i++) {
      let criterionInfo = criteriaFoundList[i];
      let criterionColumnData = worksheet.getColumn(criterionInfo.index);
      criterionColumnData.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
        if (rowNumber > 1) {
          let cellValue = cell.value == null ? '' : cell.value.toLowerCase();
          let criterionValue = 'n/a';
          if (cellValue == 'yes') {
            criterionValue = 'yes';
          } else if (cellValue == 'no') {
            criterionValue = 'no';
          }
          
          walkthroughItems.push({
            "criterionTitle": criterionInfo.title,
            "criterionValue": criterionValue,
            "criterionDate": createDateList[rowNumber - 1],
            "criterionId": criterionInfo.criterionId
          });
        }
      });
    }

    result.success = true;
    result.data = {
      "walkthroughItems": walkthroughItems
    };
    
    return result;
  }

  _findCriteriaList(criteriaMasterList, headerRow) {
    let criteriaFoundList = [];
    for (let i = 0; i < headerRow._cells.length; i++) {
      let colTitle = headerRow.getCell(i + 1).value;
      if (criteriaMasterList.hasOwnProperty(colTitle)) {
        criteriaFoundList.push({
          index: i + 1,
          title: colTitle,
          criterionId: criteriaMasterList[colTitle]
        });
      }
    }
    
    return criteriaFoundList;
  }
  
  _getCreateDateList(createDateColumn) {
    let createDateList = ['n/a'];
    
    createDateColumn.eachCell({ includeEmpty: true }, function(cell, rowNumber) {
      if (rowNumber > 1) {
        createDateList.push
        const dateVal = cell.value;
        
        const m = dateVal.getMonth();
        const d = dateVal.getDate();
        const y = dateVal.getFullYear();
        
        let formattedDate = ("0000" + y).slice (-4);
        formattedDate += '-' + ("00" + (m + 1)).slice(-2);
        formattedDate += '-' + ("00" + d).slice(-2);
        
        createDateList.push(formattedDate);
      } 
    });

    return createDateList;
  }  
    
  //------------------------------------------------------------
  // post uploaded Excel data to DB
  //------------------------------------------------------------
  async _postWalkthroughItems(thisObj, data, userInfo, datasetName) {
    var result = thisObj._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      addset:
        'call add_walkthroughset (' +
          userInfo.userId + ', ' +
          '"' + datasetName + '" ' + 
        ')'
    }

    queryResults = await this._dbManager.dbQueries(queryList); 
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    let walkthroughSetId = queryResults.data.addset[0][0].walkthroughsetid;
    
    queryList = {};
    queryList.add = 'insert into walkthroughitem (walkthroughsetid, criterionid, itemvalue, itemdate) values ';
      
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      
      if (i > 0) queryList.add += ', ';
      queryList.add +=  
        '(' +
            walkthroughSetId + ', ' +
            item.criterionId + ', ' +
            '"' + item.criterionValue + '", ' +
            '"' + item.criterionDate + '" ' +
        ') ';          
    }

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (queryResults.success) {
      result.success = true;
      result.details = 'query succeeded';
      
    } else {
      result.details = queryResults.details;
    }
    
    return result;
  }
  
//---------------------------------------------------------------
// specific query methods
//---------------------------------------------------------------    
  async _getAdminAllowed(params, postData, userInfo, funcCheckPrivilege) {
    var result = this._dbManager.queryFailureResult(); 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = {adminallowed: funcCheckPrivilege(userInfo, 'admin')};

    return result;
  }  
  
  async _getWalkthroughDatasets(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;

    queryList = {
      walkthroughset:
        'select ' +
          'a.walkthroughsetid, ' +
          'a.walkthroughsetname ' +
        'from  ' +
          'walkthroughset as a ' +
        'where ' +
          'a.userid = ' + userInfo.userId
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = queryResults.data.walkthroughset;  

    return result;
  }
  
  async _getWalkthroughDatasetSelections(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;

    queryList = {
      selections:
        'select ' +
          'a.walkthroughsetid ' +
        'from  ' +
          'walkthroughsetselection as a ' +
        'where ' +
          'a.userid = ' + userInfo.userId
    };

    queryResults = await this._dbManager.dbQueries(queryList); 

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = queryResults.data.selections;  

    return result;
  }
  
  async _getWalkthroughData(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;

    if (postData.selectedsets.length == 0) {
      result.success = true;
      result.details = 'query succeeded (no data)';
      result.data = {};
      return result;
    }
    
    let selectedSetString = '';
    for (let i = 0; i < postData.selectedsets.length; i++) {
      if (i > 0) selectedSetString += ', ';
      selectedSetString += postData.selectedsets[i];
    }
    
    queryList = {
      criteria:
        'select distinct ' +
          'a.criterionid, ' +
          'b.indexwithindomain, ' +
          'b.criteriontext, ' +
          'b.mandatory, ' +
          'c.domainnumber, ' +
          'c.domaindescription ' +
        'from  ' +
          'walkthroughitem as a, ' +
          'criterion as b, ' +
          'domaininfo as c ' +
        'where ' +
          'a.criterionid = b.criterionid ' +
          'and b.domainid = c.domainid ' +
          'and a.walkthroughsetid in (' + selectedSetString + ')'
    };
    
    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    let criteriaForUser = queryResults.data.criteria;
    queryList = {}
    let walkthroughSummary = {};
    
    for (let i = 0; i < criteriaForUser.length; i++) {
      const criterion = criteriaForUser[i];

      queryList['yesCount' + criterion.criterionid] = 
        'select ' +
          'count(itemvalue) as "yescount" ' +
        'from ' +
          'walkthroughitem ' +
        'where ' +
          'walkthroughsetid in (' + selectedSetString + ') ' +
          'and criterionid = ' + criterion.criterionid  + ' ' +
          'and itemvalue = "yes" '

      queryList['noCount' + criterion.criterionid] = 
        'select ' +
          'count(itemvalue) as "nocount" ' +
        'from ' +
          'walkthroughitem ' +
        'where ' +
          'walkthroughsetid in (' + selectedSetString + ') ' +
          'and criterionid = ' + criterion.criterionid  + ' ' +
          'and itemvalue = "no" '

      queryList['otherCount' + criterion.criterionid] = 
        'select ' +
          'count(itemvalue) as "othercount" ' +
        'from ' +
          'walkthroughitem ' +
        'where ' +
          'walkthroughsetid in (' + selectedSetString + ') ' +
          'and criterionid = ' + criterion.criterionid  + ' ' +
          'and itemvalue not in ("yes", "no") '
          
      walkthroughSummary[criterion.criterionid] = {
        "criterionid": criterion.criterionid,
        "criteriontext": criterion.criteriontext,
        "mandatory": criterion.mandatory,
        "domainnumber": criterion.domainnumber,
        "domaindescription": criterion.domaindescription,
        "indexwithindomain": criterion.indexwithindomain,
        "label": ["yes", "no", "other"],
        "count": [0, 0, 0]
      }
    }
    
    queryResults = await this._dbManager.dbQueries(queryList); 

    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    for (var id in walkthroughSummary) {
      walkthroughSummary[id].count[0] = queryResults.data['yesCount' + id][0].yescount;
      walkthroughSummary[id].count[1] = queryResults.data['noCount' + id][0].nocount;
      walkthroughSummary[id].count[2] = queryResults.data['otherCount' + id][0].othercount;
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = walkthroughSummary;  

    return result;
  }
  
  async _getWalkthroughCriteria(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "criteria":
        'select a.criterionid, a.criteriontext ' +
        'from criterion as a '
    }

    queryResults = await this._dbManager.dbQueries(queryList); 
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    var criteriaList = {};
    for (var i = 0; i < queryResults.data.criteria.length; i++) {
      let item = queryResults.data.criteria[i];
      criteriaList[item.criteriontext] = item.criterionid;
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = {}
    result.data.criteria = queryResults.data.criteria;  
    result.data.criteriaList = criteriaList;

    return result;
  }
  
  async _getFilter(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryResults = await this._getFilterEmpty(userInfo);
    if (!queryResults.success) {
      result.details = 'failed to get filter empty results';
      return result;
    }
    let emptyResults = queryResults.data;
    
    queryResults = await this._getFilterCriteria(userInfo);
    if (!queryResults.success) {
      result.details = 'failed to get filter criteria results';
      return result;
    }
    let criteriaResults = queryResults.data;
    
    queryResults = await this._getFullCriteriaList();
    if (!queryResults.success) {
      result.details = 'failed to get full criteria list';
      return result;
    }
    let fullCriteriaList = queryResults.data;
    
    let filterSettings = {
      "filterEmpty": emptyResults,
      "filterCriteria": criteriaResults,
      "fullCriteria": fullCriteriaList
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = filterSettings;  

    return result;
  }
  
  async _getFilterEmpty(userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      filter:
        'select ' +
          'a.hideempty ' +
        'from  ' +
          'filterempty as a ' +
        'where ' +
          'userid = ' + userInfo.userId
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    let hideEmpty = false;
    if (queryResults.data.filter.length > 0) {
      hideEmpty = (queryResults.data.filter[0].hideempty == 1);
    } 
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = hideEmpty;  

    return result;
  }
  
  async _getFilterCriteria(userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      filter:
        'select ' +
          'a.filtercriterionid, ' +
          'a.criterionid, ' +
          'a.include ' +
        'from  ' +
          'filtercriterion as a ' +
        'where ' +
          'a.userid = ' + userInfo.userId
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
        
    result.success = true;
    result.details = 'query succeeded';
    result.data = queryResults.data.filter;  

    return result;
  }

  async _getFullCriteriaList() {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      criteria:
        'select distinct ' +
          'b.criterionid, ' +
          'b.indexwithindomain, ' +
          'b.criteriontext, ' +
          'b.mandatory, ' +
          'c.domainnumber, ' +
          'c.domaindescription ' +
        'from  ' +
          'criterion as b, ' +
          'domaininfo as c ' +
        'where ' +
          'b.domainid = c.domainid '  
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = queryResults.data.criteria;  

    return result;
  }

  async _updateFilterEmpty(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      filter: 
        'replace into filterempty (' +
          'userid, hideempty' +
        ') values (' +
          userInfo.userId + ', ' +
          postData.hideempty +
        ') '
    };

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = null;  

    return result;
  }

  async _updateFilterCriterionList(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {};
    
    if (postData.excluded.length > 0) {
      queryList.excluded = 
        'replace into filtercriterion (' +
          'userid, criterionid, include' +
        ') values ';
        
      for (let i = 0; i < postData.excluded.length; i++) {
        if (i > 0) queryList.excluded += ', ';
        queryList.excluded += '(' +
          userInfo.userId + ', ' +
          postData.excluded[i] + ', ' +
          '0' +
        ')';
      }
    }

    if (postData.included.length > 0) {
      queryList.included = 
        'replace into filtercriterion (' +
          'userid, criterionid, include' +
        ') values ';
        
      for (let i = 0; i < postData.included.length; i++) {
        if (i > 0) queryList.included += ', ';
        queryList.included += '(' +
          userInfo.userId + ', ' +
          postData.included[i] + ', ' +
          '1' +
        ')';
      }
    }
    
    if (Object.keys(queryList).length == 0) {
      result.success = true;
      result.details = 'no included or excluded => no change';
      return result;
    }
    
    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = null;  

    return result;
  }

  async _updateFilterCriterion(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      filter:
        'replace into filtercriterion (' +
          'userid, criterionid, include' +
        ') values (' +
          userInfo.userId + ', ' +
          postData.criterionid + ', ' +
          postData.include +
        ')'
    }
    
    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }
    
    result.success = true;
    result.details = 'query succeeded';
    result.data = null;  

    return result;
  }

  async _updateWalkthroughDataset(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "walkthroughset":
        'update walkthroughset ' +
        'set walkthroughsetname = "' + postData.walkthroughsetname + '" ' +
        'where walkthroughsetid = ' + postData.walkthroughsetid
    }

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = {}

    return result;
  }  
  
  async _deleteWalkthroughDataset(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    queryList = {
      "walkthroughset":
        'delete ' +
        'from walkthroughset ' +
        'where walkthroughsetid = ' + postData.walkthroughsetid
    }

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = {}

    return result;
  }  
  
  async _updateWalkthroughSetSelection(params, postData, userInfo) {
    var result = this._dbManager.queryFailureResult(); 
    var queryList, queryResults;
    
    if (postData.selected) {
      queryList = {
        "replace":
          'replace into walkthroughsetselection (' +
            'userid, walkthroughsetid' +
          ') values (' +
            userInfo.userId + ', ' +
            postData.walkthroughsetid +
          ') '
      }

    } else {
      queryList = {
        "delete":
          'delete from walkthroughsetselection ' +
          'where userid = ' + userInfo.userId + ' ' +
            'and walkthroughsetid = ' + postData.walkthroughsetid
      }
    }

    queryResults = await this._dbManager.dbQueries(queryList); 
    
    if (!queryResults.success) {
      result.details = queryResults.details;
      return result;
    }

    result.success = true;
    result.details = 'query succeeded';
    result.data = {}

    return result;
  }  
  
//----------------------------------------------------------------------
// utility
//----------------------------------------------------------------------  
  _sendFail(res, failMessage) {
    var result = {
      sucess: false,
      details: failMessage,
      data: null
    };
    
    res.send(result);
  }
  
  _sendSuccess(res, successMessage, dataValues) {
    if (!dataValues) dataValues = null;
    
    var result = {
      success: true,
      details: successMessage,
      data: dataValues
    };
    
    res.send(result);
  }  
  
  _verifyHeaderRow(headerRow, requiredColumns) {
    var result = {
      success: false,
      columnInfo: {}
    };
    
    var foundColumns = new Set();
    var columnMapping = {};
    
    for (var i = 0; i < headerRow.values.length; i++) {
      var columnName = headerRow.getCell(i + 1).value;
      if (columnName) {
        foundColumns.add(headerRow.getCell(i+1).value);
        columnMapping[columnName] = i + 1;
      }
    }
    
    const difference = new Set(
      [...requiredColumns].filter(x => !foundColumns.has(x)));

    if (difference.size == 0) {
      result.success = true;
      result.columnInfo = columnMapping;
    }
    
    return result;
  }

  _reduceObjectArray(objectArray, keyToRemove, funcMakeIndex) {
    var result = [];
    var map = new Map();
    
    for (var item of objectArray) {
      var indexVal = funcMakeIndex(item);
      
      if(!map.has(indexVal)){
        map.set(indexVal, true);
        var reducedItem = JSON.parse(JSON.stringify(item));
        delete reducedItem.student;
        result.push(reducedItem);
      }
    }

    return result;
  }
  
  _removeDuplicates(list, funcKey) {
    var result = [];
    var keyList = new Set();
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var key = funcKey(item);
      if (!keyList.has(key)) {
        result.push(item);
      }
      keyList.add(key);
    }
    
    return result;
  }
  
  _formatDate(theDate) {
    if (typeof theDate == 'string') return theDate;
    
    var y = String(theDate.getFullYear()).padStart(4, '0');
    var m = String(theDate.getMonth() + 1).padStart(2, '0');
    var d = String(theDate.getDate()).padStart(2, '0');
    
    return y + '-' + m + '-' + d;
  }  
}
