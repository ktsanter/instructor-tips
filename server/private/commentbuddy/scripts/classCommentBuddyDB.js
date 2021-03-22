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
  async getCommentData() {
    var dbResult = await SQLDBInterface.doGetQuery('commentbuddy/query', 'comments');

    return dbResult;
  }
  
  async saveComment(itemData) {
    var dbResult = await SQLDBInterface.doPostQuery('commentbuddy/update', 'comment', itemData);

    return dbResult.success;
  }
  
  async addDefaultComment() {
    var dbResult = await SQLDBInterface.doPostQuery('commentbuddy/insert', 'default-comment', {});

    return dbResult;
  }
  
  async deleteComment(itemData) {
    var dbResult = await SQLDBInterface.doPostQuery('commentbuddy/delete', 'comment', itemData);

    return dbResult.success;
  }
  
  //--------------------------------------------------------------
  // utility
  //--------------------------------------------------------------
  
}
