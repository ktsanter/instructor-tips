"use strict";
//-----------------------------------------------------------------------------------
// UserManagement class
//    Note this requires the SQLDBInterface class
//-----------------------------------------------------------------------------------
// TODO: 
//-----------------------------------------------------------------------------------
class UserManagement {
  constructor (sodium) {
    this._version = '1.00';    
    this._salt = null;
    this._sodium = sodium;
  }
      
//-----------------------------------------------------------------------------------
// public methods 
//-----------------------------------------------------------------------------------
  async init() {
    await this._sodium.ready;
    this._salt = await this._getSalt();
    
    this._appName = await this._getAppNameForSession();
    
    return (this._salt != null && this._appName != null);
  }
  
  hashPassword(password) {
    var result = {
      success: false,
      hashedPassword: null,
      details: 'unknown'
    };
    
    if (!this._salt) {
      result.details = 'invalid salt';
      return result;
    }
    
    var hashedPassword = this._sodium.to_hex(this._sodium.crypto_generichash(64, this._salt + password));
    
    result.success = true;
    result.hashedPassword = hashedPassword;
    result.details = 'hashing succeeded';
    
    return result;
  }
  
  sessionAppName() {
    return this._appName;
  }
  
//-----------------------------------------------------------------------------------
// private methods 
//-----------------------------------------------------------------------------------
  async _getSalt() {
    var queryResults = await SQLDBInterface.doGetQuery('usermanagement', 'passwordsalt');
    if (!queryResults.success) {
      console.log('failed to get password salt');
      return null;
    } 
    
    return queryResults.data.salt;      
  }
  
  async _getAppNameForSession() {
    var queryResults = await SQLDBInterface.doGetQuery('usermanagement', 'sessionappname');
    if (!queryResults.success) {
      console.log('failed to get session app name');
      return null;
    } 
    
    return queryResults.data.appname;
  }  
}
