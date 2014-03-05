// http://wiki.jqueryui.com/w/page/12138135/Widget%20factory

(function( $ ) {

$.widget( 'ui.rte', {
	// These options will be used as defaults
	options: {
		disabled: true,
		mode: 'html'
	},
	// Set up the widget
	_create: function() {
		console.log('rte._create');
		var self = this,
			o = self.options,
			dirty = false,
			textarea = this.element; //.hide(),
			pos = textarea.position();
			//this.element.text = this.text;
		this.converter = new Markdown.Converter();
		this.mirror = $('<div class="rte-content" contenteditable="true"></div>').css({
				top:pos.top,
				left: pos.left,
			}).insertAfter(textarea).show();
		textarea.hide();
		this.formatText('styleWithCSS', true);
		this.validtags = ['A','P','STRONG', 'B', 'I',  'SPAN', 'DIV', 'OL', 'UL', 'LI', 'DL', 'DT', 'DD'];
		this.enabled = true;

		/*$(window).resize(function(){
			textarea.css({
				width: textarea.width(),
				height: textarea.height(),
				top: textarea.offset().top,
				left: textarea.offset().left
			});
		});*/
		this.mirror.on('keydown', function(event){
			if(event.which == 13) {
				self.insertAtCaret('<br />');
			}
		});
		this.mirror.on('keyup', function() {
			//console.log('keyup, set dirty.');
			self.dirty = true;
		});
		this.mirror.on('paste', function() {
			console.log('paste, set dirty.');
			self.dirty = true;
		});
		this.mirror.on('blur', function() {
			if(self.dirty) {
				console.log('div blur');
				self.element.val(self.mirror.html().replace(/<br *>/g,"\n").stripTags());
				self.mirror.trigger('change');
				self.dirty = false;
			}
		});

	},
	_init: function() {
		console.log('rte._init');
		var self = this;
		$.each(this.options, function(key, value) {
			self._setOption(key, value);
		});
	},
	text: function(str) {
		console.log('function text', str);
		if(str != undefined) {
			this.mirror.html(str);
			this.element.val(str);
		} else {
			//console.log('returning: ' + this.element.val());
			return this.element.val();
		}
	},
	html: function(str) {
		console.log('function html');
		if(str != undefined) {
			console.log('str: ' + str);
			var $str;
			try {
				$str = $(str);
				this.mirror.html(str);
				this.element.text($str.text());
			} catch(e) {
				console.warn(e.message);
				this.mirror.empty().html(str);
				this.element.text(str);
			}
			//console.log('length: ' + $str.length);
			//this.mirror.get(0).contenteditable=false;
		} else {
			console.log('returning: ' + this.mirror.html());
			return this.mirror.html();
		}
	},
	insertAtCaret: function(myValue){
		// Found this at stackoverflow
		return this.mirror.each(function(i) {
			if (document.selection) {
				console.log('IE');
				//For browsers like Internet Explorer
				this.focus();
				sel = document.selection.createRange();
				sel.text = myValue;
				this.focus();
			}
			else if (this.selectionStart || this.selectionStart == '0') {
				console.log('FF');
				//For browsers like Firefox and Webkit based
				var startPos = this.selectionStart;
				var endPos = this.selectionEnd;
				var scrollTop = this.scrollTop;
				this.value = this.value.substring(0, startPos)+myValue+this.value.substring(endPos,this.value.length);
				this.focus();
				this.selectionStart = startPos + myValue.length;
				this.selectionEnd = startPos + myValue.length;
				this.scrollTop = scrollTop;
			} else {
				console.log('Smth.');
				this.value += myValue;
				this.focus();
			}
		})
	},
	showSelection: function() {
		var textComponent = this.mirror.get(0); //document.getElementById('Editor');
		var selectedText;
		// IE version
		if (document.selection != undefined) {
			textComponent.focus();
			var sel = document.selection.createRange();
			selectedText = sel.text;
		}
		// Mozilla version
		else if (textComponent.selectionStart != undefined) {
			var startPos = textComponent.selectionStart;
			var endPos = textComponent.selectionEnd;
			console.log(startPos, endPos);
			selectedText = textComponent.value.substring(startPos, endPos)
		}
		//alert("You selected: " + selectedText);
	},
	formatText: function(command, option) {
		var self = this, useDialog = false;
		switch(command) {
			case 'ulist':
				command = 'insertUnorderedList';
				break;
			case 'olist':
				command = 'insertOrderedList';
				break;
			case 'createlink':
				self.showSelection();
				option=prompt('Write the URL here')
				useDialog = true;
			default:
				break;
		}
		try{
			document.execCommand(command, useDialog, option);
			self.dirty = true; // FIXME: This doesn't work because blur is triggered before dirty is set.
			self.mirror.trigger('blur'); // Dirty hack to trigger save. Hmm, if it only worked...
		}catch(e){
			console.log('Error: ' + e)
		}
	},
	setEnabled: function(state) {
		console.log('function setEnabled: ' + state);
		if(state != undefined) {
			this._setOption('disabled', !state);
		}
		return this.options['disabled'];
	},
	mode: function(mode) {
		if(mode != undefined) {
			this._setOption('mode', mode);
		}
		return this.options['mode'];
	},
	/*toggle: function() {
		this._setOption('disabled', !this.options['disabled']);
		return !this.options['disabled'];
	},*/
	toggleMode: function() {
		this._setOption('mode', (this.options['mode'] == 'html'?'text':'html'));
		return this.options['mode'];
	},
	// Use the _setOption method to respond to changes to options
	_setOption: function( key, value ) {
		console.log('rte option ' + key + ': ' + value);
		switch( key ) {
			case 'disabled':
				if(value) {
					this.mirror.get(0).contenteditable = false;
					this.mirror.attr('contenteditable', false);
					this.mirror.removeClass('editable');
					this.element.attr('disabled', true);
					this.element.removeClass('editable');
				} else {
					this.mirror.get(0).contenteditable = true;
					this.mirror.attr('contenteditable', true);
					this.mirror.addClass('editable');
					this.element.attr('disabled', false);
					this.element.addClass('editable');
				}
				break;
			case 'mode':
				switch(value) {
					case 'html':
						console.log('converting to html:', this.element.val());
						this.mirror.html(this.converter.makeHtml(this.element.val()));
						this.mirror.show();
						this.element.hide();
						this.mirror.trigger('change');
						break;
					case 'text':
						console.log('converting to text:', $(this.mirror).html());
						try {
							//this.element.val($(this.mirror).html().replace(/<br>/g, "\n"));
							this.element.val(html2markdown($(this.mirror).html()));
							//this.element.val(this.converter.makeMarkdown($(this.mirror).html()));
						} catch(e) {
							console.warn('Exception:', e);
						}
						this.mirror.hide();
						this.element.show();
						this.element.trigger('resize');
						this.element.trigger('change');
						break;
					default:
						throw { name: 'UnknownMode', message: 'Invalid mode: ' + value }
						break;
				}
				break;
			case 'classes':
				if($.isArray(value)) {
					var mirror = this.mirror;
					$.each(this.options['classes'], function(key, value) {
						mirror.addClass(value);
					});
				} else {
					this.mirror.addClass(value);
				}
				break;
			default:
				this.options[key] = value;
				break;
		}
		// In jQuery UI 1.8, you have to manually invoke the _setOption method from the base widget

		$.Widget.prototype._setOption.apply( this, arguments );
		// In jQuery UI 1.9 and above, you use the _super method instead
		//this._super( "_setOption", key, value );
	},
	// Use the destroy method to clean up any modifications your widget has made to the DOM
	destroy: function() {
		this.mirror.remove();
		this.element.show();
		$(window).unbind('resize');
		// In jQuery UI 1.8, you must invoke the destroy method from the base widget
		$.Widget.prototype.destroy.call( this );
		// In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
	}

});

}( jQuery ) );


