//-------------------------------------------------------------------
// CommentBuddyDB class
//-------------------------------------------------------------------
// TODO:
//-------------------------------------------------------------------
class CommentBuddyDB {
  constructor(config) {
    this._config = config;  
  }

  //--------------------------------------------------------------
  // DB interaction
  //--------------------------------------------------------------
  async getAccessKey() {
    var dbResult = await SQLDBInterface.doGetQuery('commentbuddy/query', 'accesskey');

    return dbResult;
  }
  
  async getCommentData() {
    var dbResult = await SQLDBInterface.doGetQuery('commentbuddy/query', 'comments');

    return dbResult;
  }
  
  async saveComment(itemData) {
    var postData = {
      "commentid": itemData.commentid,
      "tags": this._sanitizeText(itemData.tags),
      "hovertext": this._sanitizeText(itemData.hovertext),
      "comment": this._sanitizeText(itemData.comment)
    };
    
    var dbResult = await SQLDBInterface.doPostQuery('commentbuddy/update', 'comment', postData);

    return dbResult.success;
  }
  
  async addDefaultComment() {
    var dbResult = await SQLDBInterface.doPostQuery('commentbuddy/insert', 'default-comment', {});

    return dbResult;
  }
  
  async deleteComment(itemData) {
    var postData = {
      "commentid": itemData.commentid,
    };
    
    var dbResult = await SQLDBInterface.doPostQuery('commentbuddy/delete', 'comment', itemData);

    return dbResult.success;
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  _sanitizeText(str) {
    var sanitized = str;
    
    sanitized = sanitized.replace(/"/g, '\\"');
    
    return sanitized;
  }
}
