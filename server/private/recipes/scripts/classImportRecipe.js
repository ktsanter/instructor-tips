//-------------------------------------------------------------------
// ImportRecipe
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ImportRecipe {
  constructor(config) {
    this.config = config;

    this.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    this.formatKeys = {
      "epicurious": [this.months, ["Servings", "servings"], ["Step "]],
      "bon_appetit": [this.months, ["Ingredient"], ["Steps", "Preparation"]]
    };
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async importRecipe(params) {
    var result = {"success": false, "details": 'import failed for ' + params.importFile.name, "data": null};
    var recipe = null;
    
    var fileType = params.importFile.type;
    if (fileType == 'application/pdf') {
      recipe = await this._importPDF(params.importFile);
      if (recipe != null) {
        result.success = true;
        result.details = 'import succeeded for ' + params.importFile.name;
        result.data = recipe;
      }

    } else if (fileType == 'text/plain') {
      recipe = await this._importText(params.importFile);
      if (recipe != null) {
        result.success = true;
        result.details = 'import succeeded for ' + params.importFile.name;
        result.data = recipe;
      }
      
    } else {
      result.details = 'invalid file type: ' + params.importFile.name;
    }
    
    return result;
  }

  //--------------------------------------------------------------
  // private methods - for each import type
  //--------------------------------------------------------------
  async _importPDF(file) {
    var recipe = null;
    
    try {
      var rawText = await this._extractTextFromPDFPromise(file);
      var lineArrays = await this._makeLineArraysPromise(rawText);
      recipe = this._parsePDF(lineArrays);
      
    } catch (err) {
      console.log('ImportRecipe._importPDF failed', err);
    }

    return recipe;
  }
  
  async _importText(file) {
    var recipe = null;
    
    try {
      var rawText = await this._extractTextFromTextPromise(file);
      recipe = this._parseText(rawText);
      
    } catch (err) {
      console.log('ImportRecipe._importText failed', err);
    }

    return recipe;
  }
  
  //--------------------------------------------------------------
  // private methods - getting text from PDF
  //--------------------------------------------------------------
  _extractTextFromPDFPromise(file) {
    return new Promise((resolve) => {
      this._extractTextFromPDF(file, (result) => {
        resolve(result);
      });
    })
  }
  
  _extractTextFromTextPromise(file) {
    return new Promise((resolve) => {
      this._extractTextFromText(file, (result) => {
        resolve(result);
      });
    })
  }
  
  _makeLineArraysPromise(rawText) {
    return new Promise((resolve) => {        
      this._makeLineArrays(rawText, this, (lineArrays) => {
        resolve(lineArrays);
      });
    })
  }
  
  _extractTextFromPDF(file, callback) {
    var fReader = new FileReader();
    
    fReader.readAsDataURL(file);
    
    fReader.onloadend = function (event) {
      var dataURI = event.target.result;
      var BASE64_MARKER = ';base64,';
      var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
      var base64 = dataURI.substring(base64Index);
      var raw = window.atob(base64);
      var rawLength = raw.length;
      var array = new Uint8Array(new ArrayBuffer(rawLength));

      for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }

      callback(array);
    }
  }

  _extractTextFromText(file, callback) {
    var fReader = new FileReader();
    
    fReader.readAsText(file);
    
    fReader.onloadend = function (event) {
      callback(fReader.result);
    }
  }

  _makeLineArrays(arr, me, callback) {
    PDFJS.getDocument(arr).then(function (pdf) {
      var pdfDocument = pdf;
      var pagesPromises = [];

      for (var i = 0; i < pdf.pdfInfo.numPages; i++) {
        (function (pageNumber) {
          pagesPromises.push(me._getPageText(pageNumber, pdfDocument));
        })(i + 1);
      }

      Promise.all(pagesPromises).then(function (lineArrays) {
        callback(lineArrays);
      });

    }, function (reason) {
      console.error(reason);
    });
  }
      
  _getPageText(pageNum, PDFDocumentInstance) {
    return new Promise(function (resolve, reject) {
      PDFDocumentInstance.getPage(pageNum).then(function (pdfPage) {
        pdfPage.getTextContent().then(function (textContent) {
          var textItems = textContent.items;
          var lineArray = [];

          for (var i = 0; i < textItems.length; i++) {
            lineArray.push(textItems[i].str);
          }

          resolve(lineArray);
          
        }, function(err) {
          console.log(err);
        });
      });
    });
  }

  //--------------------------------------------------------------
  // private methods - parsing PDF text
  //--------------------------------------------------------------  
  _parsePDF(lineArrays) {
    var recipe = null;
    var pieces = [];
    
    for (var i = 0; i < lineArrays.length; i++) {
      pieces = pieces.concat(lineArrays[i]);
    }
    var combined = pieces.join('');
    
    var pdfFormat = this._guessPDFFormat(combined);
    if (pdfFormat == null) {
      console.log('unrecognized PDF format');
      return recipe;
    }
    
    var title = this._findTitle(pieces, combined, pdfFormat);
    if (title == null) return recipe;
    
    var ingredients = this._findIngredients(pieces, combined, pdfFormat);
    if (ingredients.length == 0) return recipe;
    
    var instructions = this._findInstructions(pieces, combined, pdfFormat);
    if (instructions == null) return recipe;
    
    var ingredientObjects = [];
    for (var i = 0; i < ingredients.length; i++) {
      ingredientObjects.push({"ingredientid": null, "ingredientname": ingredients[i]});
    }

    recipe = {
      "recipeid": null,
      "recipename": title,
      "taglist": [],
      "ingredients": ingredientObjects,
      "instructions": instructions,
      "notes": ''
    };      
    
    return recipe;
  }
  
  _guessPDFFormat(combinedText) {
    //console.log('combinedText', combinedText);
    var format = null;
    
    for (var key in this.formatKeys) {
      var keyWordArrays = this.formatKeys[key];
      
      var foundAllKeyWords = true;
      for (var i = 0; i < keyWordArrays.length && foundAllKeyWords; i++) {
        var keyWordArray = keyWordArrays[i];

        var foundKeyWord = false;        
        for (var j = 0; j < keyWordArray.length && !foundKeyWord; j++) {
          var keyWord = keyWordArray[j];
          foundKeyWord = (combinedText.indexOf(keyWord) >= 0);
        }
        
        foundAllKeyWords = foundAllKeyWords && foundKeyWord;
      }
      
      if (foundAllKeyWords) {
        format = {
          "key": key,
          "formatInfo": keyWordArrays
        };
        break;
      }
    }      
    
    return format;
  }
  
  _findTitle(pieces, combined, pdfFormat) {
    var title = null;
    
    var locEnd = this._findOccurrence(pieces, combined, pdfFormat.formatInfo[0]);
    if (locEnd.success) {
      title = combined.substring(0, locEnd.start.location);
    }
    
    return title;
  }
  
  _findIngredients(pieces, combined, pdfFormat) {
    var ingredients = [];

    var locStart = this._findOccurrence(pieces, combined, pdfFormat.formatInfo[1]);
    var locEnd = this._findOccurrence(pieces, combined, pdfFormat.formatInfo[2]);
    if (locStart.success && locEnd.success) {
      ingredients = pieces.slice(locStart.end.piecenum, locEnd.start.piecenum);
    }

    return ingredients;
  }
  
  _findInstructions(pieces, combined, pdfFormat) {
    var instructionsFormatted = '';
    
    var locStart = this._findOccurrence(pieces, combined, pdfFormat.formatInfo[2]);
    if (locStart.success) {
      var instructions = pieces.slice(locStart.start.piecenum);
      
      var firstStep = true;
      for (var i = 0; i < instructions.length; i++) {
        if (pdfFormat.key == 'epicurious') {
          var isStep = instructions[i].indexOf('Step ') >= 0;
          if (isStep) {
            if (!firstStep) instructionsFormatted += '\n\n';
            firstStep = false;
          }
          instructionsFormatted += ' ' + instructions[i];
          if (isStep) instructionsFormatted += '\n';

        } else {
          instructionsFormatted += instructions[i];
        }
      }
    }
    
    return instructionsFormatted;
  }
  
  _findOccurrence(pieces, combined, targetList) {
    var startLocation = -1;
    var endLocation = -1;
    for (var i = 0; i < targetList.length && startLocation < 0; i++) {
      var target = targetList[i];
      startLocation = combined.indexOf(target);
      if (startLocation >= 0) endLocation = startLocation + target.length;
    }
    if (startLocation < 0) console.log(targetList);
    
    var result = {
      "success": startLocation >= 0,
      "start": {location: startLocation},
      "end": {location: endLocation},
    }
    
    if (startLocation > 0) {
      var lengthSum = 0;
      var startsWithinThisPiece = false;
      var endsWithinThisPiece = false;
      
      for (var i = 0; i < pieces.length && !endsWithinThisPiece; i++) {
        var piece = pieces[i];
        
        startsWithinThisPiece = (startLocation >= lengthSum) && (startLocation < lengthSum + piece.length);
        if (startsWithinThisPiece) {
          result.start.piecenum = i;
          result.start.locationwithpiece = startLocation - lengthSum;
        }
        
        endsWithinThisPiece = (endLocation >= lengthSum) && (endLocation < lengthSum + piece.length);
        if (endsWithinThisPiece) {
          result.end.piecenum = i;
          result.end.locationwithpiece = endLocation - lengthSum;
        }
        
        lengthSum += piece.length;
      }
    }

    return result;
  }

  //--------------------------------------------------------------
  // private methods - parsing text file data
  //--------------------------------------------------------------  
  _parseText(rawText) {
    var recipe = null;

    rawText = rawText.replace(/\r/g, '');
    var arrLines = rawText.split('\n');
    
    var title = arrLines[0];
    var ingredients = [];
    var instructions = [];
    
    var mode = '';
    for (var i = 1; i < arrLines.length; i++) {
      var line = arrLines[i];
      if (line.toLowerCase() == 'ingredients') {
        mode = 'ingredients';
        
      } else if (line.toLowerCase() == 'instructions') {
        mode = 'instructions';
        
      } else {
        if (mode == 'ingredients') ingredients.push(line);
        if (mode == 'instructions') instructions.push(line);
      }
    }
        
    var ingredientObjects = [];
    for (var i = 0; i < ingredients.length; i++) {
      ingredientObjects.push({"ingredientid": null, "ingredientname": ingredients[i]});
    }

    recipe = {
      "recipeid": null,
      "recipename": title,
      "taglist": [],      
      "ingredients": ingredientObjects,
      "instructions": instructions.join('\n'),
      "notes": ''
    };
    
    return recipe;
  }
    
  //--------------------------------------------------------------
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
