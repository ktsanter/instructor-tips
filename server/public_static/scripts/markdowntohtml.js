"use strict";
//-----------------------------------------------------------------------------------
// convert Markdown to HTML
// *** note this requires the inclusion of the CommonMark library (commonmark_min.js)
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class MarkdownToHTML {
  static convert(str) {
    var reader = new commonmark.Parser();
    var writer = new commonmark.HtmlRenderer();
    
    str = MarkdownToHTML._replaceAll(str, '|', '\n');
    var parsed = reader.parse(str);
    var result = writer.render(parsed);
    
    result = MarkdownToHTML._formatIframeStrings(result);

    result = MarkdownToHTML._replaceAll(result, '<code>', MarkdownToHTML._makeCodeBlock().opentext);
    result = MarkdownToHTML._replaceAll(result, '<code class="language-function">', MarkdownToHTML._makeCodeBlock().opentext);
    result = MarkdownToHTML._replaceAll(result, '</code>', MarkdownToHTML._makeCodeBlock().closetext);
    
    result = MarkdownToHTML._extraMarkdownReplaceAll(result, /\^\^\^[^^]*\^\^\^/g, 3, '<sub>', '</sub>'); 
    result = MarkdownToHTML._extraMarkdownReplaceAll(result, /\^\^[^^]*\^\^/g, 2, '<sup>', '</sup>'); 
    result = MarkdownToHTML._extraMarkdownReplaceAll(result, /\~\~[^~]*\~\~/g, 2, '<s>', '</s>'); 
    result = MarkdownToHTML._extraMarkdownReplaceAll(result, /\%\%[^%]*\%\%/g, 2, MarkdownToHTML._makeHighlight().opentext, MarkdownToHTML._makeHighlight().closetext);
    
    result = MarkdownToHTML._replaceAll(result, '<a href=', '<a target="_blank" href=');
    
    var firstThree = result.substring(0,3);
    var lastFive = result.substring(result.length-5, result.length);
    if (firstThree == '<p>' && lastFive == '</p>\n') {
      result = result.substring(3);
      result = result.substring(0, result.length-5);
    }

    result = MarkdownToHTML._replaceAll(result, '&amp;amp;', '&');

    return result;
  }
  
  static _makeCodeBlock() {
    var codeblockspan = "<span style="
    codeblockspan += "\"font-family: 'courier new', courier; ";
    codeblockspan += "background: #F1F1F1;";
    codeblockspan += "border: 1px solid #E1E1E1;";
    codeblockspan += "border-radius: 4px;";
    codeblockspan += "display:inline-block;";
    codeblockspan += "\">";
    
    return {opentext: codeblockspan, closetext: '</span><br>'}
  }
  
  static _makeHighlight() {
    return {opentext: '<span style=\"background-color: #FFFF00\">', closetext: '</span>'}
  }
  
  static _formatIframeStrings(originalString) {
    var regex = /\?\?\[([0-9]*) ([0-9]*) \&quot\;(.*)\&quot\;]/i;
    
    const bailoutLimit = 100;
    var s = originalString;
    var parsed = regex.exec(s);
    var count = 0;
    while (parsed != null && count < bailoutLimit) {
      var iframeString = MarkdownToHTML._makeIframeCode(parsed[1], parsed[2], parsed[3]);
      s = s.replace(parsed[0], iframeString);
      parsed = regex.exec(s);
      count++;
    }
    
    return s;
  }

  static _makeIframeCode(width, height, url) {
    var iframeString = '<iframe ';
    iframeString += 'width="' + width + '" height="' + height + '" src="' + url + '">';
    iframeString += '</iframe>';
    
    return iframeString;
  }  
  
  static _replaceAll (target, search, replacement) {
    return target.split(search).join(replacement);
  };  

  static _extraMarkdownReplaceAll(originalString, pattern, patternlength, opentoken, closetoken) {
    var s = originalString;

    var result = s.match(pattern);
    if (result !== null) {
      for (var i = 0; i < result.length; i++) {
        s = s.replace(result[i], opentoken + result[i].slice(patternlength, -patternlength) + closetoken);
      }
    }

    return s;
  }
}
