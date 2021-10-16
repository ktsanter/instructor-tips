//-------------------------------------------------------------------
// ImportRecipe
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class ImportRecipe {
  constructor(config) {
    this.config = config;
  }
  
  //--------------------------------------------------------------
  // public methods
  //--------------------------------------------------------------   
  async importRecipe(params) {
    var recipe = null;
    
    if (params.importType == 'epicurious') {
      recipe = await this._importEpicurious(params.importFile);
    }
    
    return recipe;
  }

  //--------------------------------------------------------------
  // private methods - for each import type
  //--------------------------------------------------------------
  async _importEpicurious(file) {
    var recipe = null;
    
    try {
      var rawText = await this._extractTextPromise(file);
      var lineArrays = await this._makeLineArraysPromise(rawText);
      recipe = this._parsePDF(lineArrays);
      
    } catch (err) {
      console.log('ImportRecipe._importEpicurious failed', err);
    }

    return recipe;
  }
  
  //--------------------------------------------------------------
  // private methods - getting text from PDF
  //--------------------------------------------------------------
  _extractTextPromise(file) {
    return new Promise((resolve) => {        
      this._extractText(file, (array) => {
        resolve(array);
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
  
  _extractText(file, callback) {
    var BASE64_MARKER = ';base64,';
    
    var fReader = new FileReader();
    fReader.readAsDataURL(file);
    var me = this;
    
    fReader.onloadend = function (event) {
      var dataURI = event.target.result;
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
    var pieces = [];
    
    for (var i = 0; i < lineArrays.length; i++) {
      pieces = pieces.concat(lineArrays[i]);
    }

    var combined = pieces.join('');
    
    var title = this._findTitle(pieces, combined);
    var ingredients = this._findIngredients(pieces, combined);
    var instructions = this._findInstructions(pieces, combined);
    
    var instructionsFormatted = '';
    var firstStep = true;
    for (var i = 0; i < instructions.length; i++) {
      var isStep = instructions[i].indexOf('Step ') >= 0;
      if (isStep) {
        if (!firstStep) instructionsFormatted += '\n\n';
        firstStep = false;
      }
      instructionsFormatted += ' ' + instructions[i];
      if (isStep) instructionsFormatted += '\n';
    }
    
    var ingredientObjects = [];
    for (var i = 0; i < ingredients.length; i++) {
      ingredientObjects.push({"ingredientid": null, "ingredientname": ingredients[i]});
    }

    var recipe = {
      "recipeid": null,
      "recipename": title,
      "ingredients": ingredientObjects,
      "instructions": instructionsFormatted,
      "notes": ''
    };      
    
    return recipe;
  }
  
  _findTitle(pieces, combined) {
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var title = '[unknown title]';
    
    var locDate = this._findOccurrence(pieces, combined, months);
    if (locDate.success) {
      title = combined.substring(0, locDate.start.location);
    }
    
    return title;
  }
  
  _findIngredients(pieces, combined) {
    var ingredients = [];
    
    var locServings = this._findOccurrence(pieces, combined, ["Servings", "servings"]);
    var locInstructions = this._findOccurrence(pieces, combined, ["Step "]);
    if (locServings.success && locInstructions.success) {
      ingredients = pieces.slice(locServings.end.piecenum, locInstructions.start.piecenum);
    }
    
    return ingredients;
  }
  
  _findInstructions(pieces, combined) {
    var instructions = [];
    
    var locInstructions = this._findOccurrence(pieces, combined, ["Step "]);
    if (locInstructions.success) {
      instructions = pieces.slice(locInstructions.start.piecenum);
    }
    
    return instructions;
  }
  
  _findOccurrence(pieces, combined, targetList) {
    var startLocation = -1;
    var endLocation = -1;
    for (var i = 0; i < targetList.length && startLocation < 0; i++) {
      var target = targetList[i];
      startLocation = combined.indexOf(target);
      if (startLocation >= 0) endLocation = startLocation + target.length;
    }
    
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
  // handlers
  //--------------------------------------------------------------   
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
}
