/* OAuthSimple
  * A simpler version of OAuth
  *
  * author:     jr conlin
  * mail:       src@anticipatr.com
  * copyright:  unitedHeroes.net
  * version:    1.0
  * url:        http://unitedHeroes.net/OAuthSimple
  *
  * Copyright (c) 2009, unitedHeroes.net
  * All rights reserved.
  *
  * Redistribution and use in source and binary forms, with or without
  * modification, are permitted provided that the following conditions are met:
  *     * Redistributions of source code must retain the above copyright
  *       notice, this list of conditions and the following disclaimer.
  *     * Redistributions in binary form must reproduce the above copyright
  *       notice, this list of conditions and the following disclaimer in the
  *       documentation and/or other materials provided with the distribution.
  *     * Neither the name of the unitedHeroes.net nor the
  *       names of its contributors may be used to endorse or promote products
  *       derived from this software without specific prior written permission.
  *
  * THIS SOFTWARE IS PROVIDED BY UNITEDHEROES.NET ''AS IS'' AND ANY
  * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  * DISCLAIMED. IN NO EVENT SHALL UNITEDHEROES.NET BE LIABLE FOR ANY
  * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
var OAuthSimple;

if (OAuthSimple === undefined)
{
    /* Simple OAuth
     *
     * This class only builds the OAuth elements, it does not do the actual
     * transmission or reception of the tokens. It does not validate elements
     * of the token. It is for client use only.
     *
     * api_key is the API key, also known as the OAuth consumer key
     * shared_secret is the shared secret (duh).
     *
     * Both the api_key and shared_secret are generally provided by the site
     * offering OAuth services. You need to specify them at object creation
     * because nobody <explative>ing uses OAuth without that minimal set of
     * signatures.
     *
     * If you want to use the higher order security that comes from the
     * OAuth token (sorry, I don't provide the functions to fetch that because
     * sites aren't horribly consistent about how they offer that), you need to
     * pass those in either with .setTokensAndSecrets() or as an argument to the
     * .sign() or .getHeaderString() functions.
     *
     * Example:
       <code>
        var oauthObject = OAuthSimple().sign({path:'http://example.com/rest/',
                                              parameters: 'foo=bar&gorp=banana',
                                              signatures:{
                                                api_key:'12345abcd',
                                                shared_secret:'xyz-5309'
                                             }});
        document.getElementById('someLink').href=oauthObject.signed_url;
       </code>
     *
     * that will sign as a "GET" using "SHA1-MAC" the url. If you need more than
     * that, read on, McDuff.
     */

    /** OAuthSimple creator
     *
     * Create an instance of OAuthSimple
     *
     * @param api_key {string}       The API Key (sometimes referred to as the consumer key) This value is usually supplied by the site you wish to use.
     * @param shared_secret (string) The shared secret. This value is also usually provided by the site you wish to use.
     */
    OAuthSimple = function (consumer_key,shared_secret)
    {
/*        if (api_key == undefined)
            throw("Missing argument: api_key (oauth_consumer_key) for OAuthSimple. This is usually provided by the hosting site.");
        if (shared_secret == undefined)
            throw("Missing argument: shared_secret (shared secret) for OAuthSimple. This is usually provided by the hosting site.");
*/      this._secrets={};
        this._parameters={};

        // General configuration options.
        if (consumer_key !== undefined) {
            this._secrets['consumer_key'] = consumer_key;
            }
        if (shared_secret !== undefined) {
            this._secrets['shared_secret'] = shared_secret;
            }
        this._default_signature_method= "HMAC-SHA1";
        this._action = "GET";
        this._nonce_chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";


        this.reset = function() {
            this._parameters={};
            this._path=undefined;
            return this;
        };

        /** set the parameters either from a hash or a string
         *
         * @param {string,object} List of parameters for the call, this can either be a URI string (e.g. "foo=bar&gorp=banana" or an object/hash)
         */
        this.setParameters = function (parameters) {
            if (parameters === undefined) {
                parameters = {};
                }
            if (typeof(parameters) == 'string') {
                parameters=this._parseParameterString(parameters);
                }
            this._parameters = parameters;
            if (this._parameters['oauth_nonce'] === undefined) {
                this._getNonce();
                }
            if (this._parameters['oauth_timestamp'] === undefined) {
                this._getTimestamp();
                }
            if (this._parameters['oauth_method'] === undefined) {
                this.setSignatureMethod();
                }
            if (this._parameters['oauth_consumer_key'] === undefined) {
                this._getApiKey();
                }
            if(this._parameters['oauth_token'] === undefined) {
                this._getAccessToken();
                }

            return this;
        };

        /** convienence method for setParameters
         *
         * @param parameters {string,object} See .setParameters
         */
        this.setQueryString = function (parameters) {
            return this.setParameters(parameters);
        };

        /** Set the target URL (does not include the parameters)
         *
         * @param path {string} the fully qualified URI (excluding query arguments) (e.g "http://example.org/foo")
         */
        this.setURL = function (path) {
            if (path == '') {
                throw ('No path specified for OAuthSimple.setURL');
                }
            this._path = path;
            return this;
        };

        /** convienence method for setURL
         *
         * @param path {string} see .setURL
         */
        this.setPath = function(path){
            return this.setURL(path);
        };

        /** set the "action" for the url, (e.g. GET,POST, DELETE, etc.)
         *
         * @param action {string} HTTP Action word.
         */
        this.setAction = function(action) {
            if (action === undefined) {
                action="GET";
                }
            action = action.toUpperCase();
            if (action.match('[^A-Z]')) {
                throw ('Invalid action specified for OAuthSimple.setAction');
                }
            this._action = action;
            return this;
        };

        /** set the signatures (as well as validate the ones you have)
         *
         * @param signatures {object} object/hash of the token/signature pairs {api_key:, shared_secret:, oauth_token: oauth_secret:}
         */
        this.setTokensAndSecrets = function(signatures) {
            if (signatures)
            {
                for (var i in signatures) {
                    this._secrets[i] = signatures[i];
                    }
            }
            // Aliases
            if (this._secrets['api_key']) {
                this._secrets.consumer_key = this._secrets.api_key;
                }
            if (this._secrets['access_token']) {
                this._secrets.oauth_token = this._secrets.access_token;
                }
            if (this._secrets['access_secret']) {
                this._secrets.oauth_secret = this._secrets.access_secret;
                }
            // Gauntlet
            if (this._secrets.consumer_key === undefined) {
                throw('Missing required consumer_key in OAuthSimple.setTokensAndSecrets');
                }
            if (this._secrets.shared_secret === undefined) {
                throw('Missing required shared_secret in OAuthSimple.setTokensAndSecrets');
                }
            if ((this._secrets.oauth_token !== undefined) && (this._secrets.oauth_secret === undefined)) {
                throw('Missing oauth_secret for supplied oauth_token in OAuthSimple.setTokensAndSecrets');
                }
            return this;
        };

        /** set the signature method (currently only Plaintext or SHA-MAC1)
         *
         * @param method {string} Method of signing the transaction (only PLAINTEXT and SHA-MAC1 allowed for now)
         */
        this.setSignatureMethod = function(method) {
            if (method === undefined) {
                method = this._default_signature_method;
                }
            //TODO: accept things other than PlainText or SHA-MAC1
            if (method.toUpperCase().match(/(PLAINTEXT|HMAC-SHA1)/) === undefined) {
                throw ('Unknown signing method specified for OAuthSimple.setSignatureMethod');
                }
            this._parameters['oauth_signature_method']= method.toUpperCase();
            return this;
        };

        /** sign the request
         *
         * note: all arguments are optional, provided you've set them using the
         * other helper functions.
         *
         * @param args {object} hash of arguments for the call
         *                   {action:, path:, parameters:, method:, signatures:}
         *                   all arguments are optional.
         */
        this.sign = function (args) {
            if (args === undefined) {
                args = {};
                }
            // Set any given parameters
            if(args['action'] !== undefined) {
                this.setAction(args['action']);
                }
            if (args['path'] !== undefined) {
                this.setPath(args['path']);
                }
            if (args['method'] !== undefined) {
                this.setSignatureMethod(args['method']);
                }
            this.setTokensAndSecrets(args['signatures']);
            if (args['parameters'] !== undefined){
            this.setParameters(args['parameters']);
            }
            // check the parameters
            var normParams = this._normalizedParameters();
            this._parameters['oauth_signature']=this._generateSignature(normParams);
            return {
                parameters: this._parameters,
                signature: this._oauthEscape(this._parameters['oauth_signature']),
                signed_url: this._path + '?' + this._normalizedParameters(),
                header: this.getHeaderString()
            };
        };

        /** Return a formatted "header" string
         *
         * NOTE: This doesn't set the "Authorization: " prefix, which is required.
         * I don't set it because various set header functions prefer different
         * ways to do that.
         *
         * @param args {object} see .sign
         */
        this.getHeaderString = function(args) {
            if (this._parameters['oauth_signature'] === undefined) {
                this.sign(args);
                }

            var result = 'OAuth ';
            for (var pName in this._parameters)
            {
                if (!pName.match(/^oauth/)) {
                    continue;
                    }
                if ((this._parameters[pName]) instanceof Array)
                {
                    var pLength = this._parameters[pName].length;
                    for (var j=0;j<pLength;j++)
                    {
                        result += pName +'="'+this._oauthEscape(this._parameters[pName][j])+'" ';
                    }
                }
                else
                {
                    result += pName + '="'+this._oauthEscape(this._parameters[pName])+'" ';
                }
            }
            return result;
        };

        // Start Private Methods.

        /** convert the parameter string into a hash of objects.
         *
         */
        this._parseParameterString = function(paramString){
            var elements = paramString.split('&');
            var result={};
            for(var element=elements.shift();element;element=elements.shift())
            {
                var keyToken=element.split('=');
                var value='';
                if (keyToken[1]) {
                    value=decodeURIComponent(keyToken[1]);
                    }
                if(result[keyToken[0]]){
                    if (!(result[keyToken[0]] instanceof Array))
                    {
                        result[keyToken[0]] = Array(result[keyToken[0]],value);
                    }
                    else
                    {
                        result[keyToken[0]].push(value);
                    }
                }
                else
                {
                    result[keyToken[0]]=value;
                }
            }
            return result;
        };

        this._oauthEscape = function(string) {
            if (string === undefined) {
                return "";
                }
            if (string instanceof Array)
            {
                throw('Array passed to _oauthEscape');
            }
            return encodeURIComponent(string).replace(/\!/g, "%21").
            replace(/\*/g, "%2A").
            replace(/'/g, "%27").
            replace(/\(/g, "%28").
            replace(/\)/g, "%29");
        };

        this._getNonce = function (length) {
            if (length === undefined) {
                length=5;
                }
            var result = "";
            var cLength = this._nonce_chars.length;
            for (var i = 0; i < length;i++) {
                var rnum = Math.floor(Math.random() *cLength);
                result += this._nonce_chars.substring(rnum,rnum+1);
            }
            this._parameters['oauth_nonce']=result;
            return result;
        };

        this._getApiKey = function() {
            if (this._secrets.consumer_key === undefined) {
                throw('No consumer_key set for OAuthSimple.');
                }
            this._parameters['oauth_consumer_key']=this._secrets.consumer_key;
            return this._parameters.oauth_consumer_key;
        };

        this._getAccessToken = function() {
            if (this._secrets['oauth_secret'] === undefined) {
                return '';
                }
            if (this._secrets['oauth_token'] === undefined) {
                throw('No oauth_token (access_token) set for OAuthSimple.');
                }
            this._parameters['oauth_token'] = this._secrets.oauth_token;
            return this._parameters.oauth_token;
        };

        this._getTimestamp = function() {
            var d = new Date();
            var ts = Math.floor(d.getTime()/1000);
            this._parameters['oauth_timestamp'] = ts;
            return ts;
        };

        this.b64_hmac_sha1 = function(k,d,_p,_z){
        // heavily optimized and compressed version of http://pajhome.org.uk/crypt/md5/sha1.js
        // _p = b64pad, _z = character size; not used here but I left them available just in case
        if(!_p){_p='=';}if(!_z){_z=8;}function _f(t,b,c,d){if(t<20){return(b&c)|((~b)&d);}if(t<40){return b^c^d;}if(t<60){return(b&c)|(b&d)|(c&d);}return b^c^d;}function _k(t){return(t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514;}function _s(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}function _r(n,c){return(n<<c)|(n>>>(32-c));}function _c(x,l){x[l>>5]|=0x80<<(24-l%32);x[((l+64>>9)<<4)+15]=l;var w=[80],a=1732584193,b=-271733879,c=-1732584194,d=271733878,e=-1009589776;for(var i=0;i<x.length;i+=16){var o=a,p=b,q=c,r=d,s=e;for(var j=0;j<80;j++){if(j<16){w[j]=x[i+j];}else{w[j]=_r(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);}var t=_s(_s(_r(a,5),_f(j,b,c,d)),_s(_s(e,w[j]),_k(j)));e=d;d=c;c=_r(b,30);b=a;a=t;}a=_s(a,o);b=_s(b,p);c=_s(c,q);d=_s(d,r);e=_s(e,s);}return[a,b,c,d,e];}function _b(s){var b=[],m=(1<<_z)-1;for(var i=0;i<s.length*_z;i+=_z){b[i>>5]|=(s.charCodeAt(i/8)&m)<<(32-_z-i%32);}return b;}function _h(k,d){var b=_b(k);if(b.length>16){b=_c(b,k.length*_z);}var p=[16],o=[16];for(var i=0;i<16;i++){p[i]=b[i]^0x36363636;o[i]=b[i]^0x5C5C5C5C;}var h=_c(p.concat(_b(d)),512+d.length*_z);return _c(o.concat(h),512+160);}function _n(b){var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",s='';for(var i=0;i<b.length*4;i+=3){var r=(((b[i>>2]>>8*(3-i%4))&0xFF)<<16)|(((b[i+1>>2]>>8*(3-(i+1)%4))&0xFF)<<8)|((b[i+2>>2]>>8*(3-(i+2)%4))&0xFF);for(var j=0;j<4;j++){if(i*8+j*6>b.length*32){s+=_p;}else{s+=t.charAt((r>>6*(3-j))&0x3F);}}}return s;}function _x(k,d){return _n(_h(k,d));}return _x(k,d);
        }


        this._normalizedParameters = function() {
            var elements = new Array();
            var paramNames = [];
            var ra =0;
            for (var paramName in this._parameters)
            {
                if (ra++ > 1000) {
                    throw('runaway 1');
                    }
                paramNames.unshift(paramName);
            }
            paramNames = paramNames.sort();
            pLen = paramNames.length;
            for (var i=0;i<pLen; i++)
            {
                paramName=paramNames[i];
                //skip secrets.
                if (paramName.match(/\w+_secret/)) {
                    continue;
                    }
                if (this._parameters[paramName] instanceof Array)
                {
                    var sorted = this._parameters[paramName].sort();
                    var spLen = sorted.length;
                    for (var j = 0;j<spLen;j++){
                        if (ra++ > 1000) {
                            throw('runaway 1');
                            }
                        elements.push(this._oauthEscape(paramName) + '=' +
                                  this._oauthEscape(sorted[j]));
                    }
                    continue;
                }
                elements.push(this._oauthEscape(paramName) + '=' +
                              this._oauthEscape(this._parameters[paramName]));
            }
            return elements.join('&');
        };

        this._generateSignature = function() {

            var secretKey = this._oauthEscape(this._secrets.shared_secret)+'&'+
                this._oauthEscape(this._secrets.oauth_secret);
            if (this._parameters['oauth_signature_method'] == 'PLAINTEXT')
            {
                return secretKey;
            }
            if (this._parameters['oauth_signature_method'] == 'HMAC-SHA1')
            {
                var sigString = this._oauthEscape(this._action)+'&'+this._oauthEscape(this._path)+'&'+this._oauthEscape(this._normalizedParameters());
                return this.b64_hmac_sha1(secretKey,sigString);
            }
            return null;
        };

    return this;
    };
}
