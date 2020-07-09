"use strict";

class StandardNotice {
  constructor(attachErrorTo, attachNoticeTo) {
    this._renderErrorNotice(attachErrorTo);
    this._renderNormalNotice(attachNoticeTo);
  }
  
  _renderErrorNotice(attachTo) {
    this._errorNotice = CreateElement.createDiv(null, 'standard_error', '')
    attachTo.appendChild(this._errorNotice);
  }
  
   _renderNormalNotice(attachTo) {
    var container = CreateElement.createDiv(null, 'standard-notice');
    attachTo.appendChild(container);
    this._normalNoticeContainer = container;
    
    this._normalNotice = CreateElement.createDiv(null, null);
    container.appendChild(this._normalNotice);
    this._elemNoticeSpinner = CreateElement.createIcon('noticeSpinner', 'fa fa-spinner fa-pulse fa-3x fa-fw"');
    container.appendChild(this._elemNoticeSpinner);
  }  
  
  removeNotice() {
    this._errorNotice.parentNode.removeChild(this._errorNotice);
    this._normalNoticeContainer.parentNode.removeChild(this._normalNoticeContainer);
  }
  
	reportError (src, err) {
		this._errorNotice.innerHTML = 'Error in ' + src + ': ' + err.name + ' "' + err.message + '"';
		this._errorNotice.style.display = 'inline-block';
	}  
  
  hideError() {
		this._errorNotice.style.display = 'none';
  }

	setNotice (msg, showSpinner) {
		this._normalNotice.innerHTML = msg;

		if (msg == '') {
      this._normalNotice.parentNode.style.display = 'none';
			this._normalNotice.style.display = 'none'; 
      this._elemNoticeSpinner.style.display = 'none'
      
		} else {
      this._normalNotice.parentNode.style.display = 'inline-block';
			this._normalNotice.style.display = 'inline-block';
      if (showSpinner) {
        this._elemNoticeSpinner.style.display = 'inline-block';
      } else {
        this._elemNoticeSpinner.style.display = 'none'
      }
		}
	}
}