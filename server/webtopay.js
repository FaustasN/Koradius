const crypto = require('crypto');
const CryptoJS = require('crypto-js');

class WebToPay {
    static VERSION = '3.1.1';
    static PAY_URL = 'https://bank.paysera.com/pay/';
    static PAYSERA_PAY_URL = 'https://bank.paysera.com/pay/';
    static XML_URL = 'https://www.paysera.com/new/api/paymentMethods/';

    /**
     * Builds request data array for payment
     */
    static buildRequest(data) {
        this.checkRequiredParameters(data);

        const password = data.sign_password;
        const projectId = data.projectid;
        
        // Remove sensitive data
        delete data.sign_password;
        delete data.projectid;

        // Add version
        data.version = this.VERSION;
        data.projectid = projectId;

        // Create request data
        const requestData = this.createRequest(data, password);
        
        return requestData;
    }

    /**
     * Builds payment URL and redirects user
     */
    static buildPaymentUrl(data) {
        this.checkRequiredParameters(data);

        const password = data.sign_password;
        const projectId = data.projectid;
        
        // Remove sensitive data
        delete data.sign_password;
        delete data.projectid;

        // Add version
        data.version = this.VERSION;
        data.projectid = projectId;

        // Create request data
        const requestData = this.createRequest(data, password);
        
        // Build URL
        const queryString = new URLSearchParams(requestData).toString();
        return `${this.PAY_URL}?${queryString}`;
    }

    /**
     * Validates and parses callback data
     */
    static validateAndParseData(query, projectId, password) {
        if (!query.data) {
            throw new Error('"data" parameter not found');
        }

        let queryString;
        
        if (query.ss1 || query.ss2) {
            // SS1 or SS2 signature validation
            if (!this.checkSign(query, password)) {
                throw new Error('Invalid signature');
            }
            queryString = this.decodeSafeUrlBase64(query.data);
        } else {
            // GCM decryption
            if (!password) {
                throw new Error('Password required for GCM decryption');
            }
            queryString = this.decryptGCM(this.decodeSafeUrlBase64(query.data), password);
            if (!queryString) {
                throw new Error('Callback data decryption failed');
            }
        }

        // Parse query string
        const request = this.parseHttpQuery(queryString);

        // Validate project ID
        if (!request.projectid) {
            throw new Error('Project ID not provided in callback');
        }

        if (request.projectid !== projectId.toString()) {
            throw new Error(`Bad projectid: ${request.projectid}, should be: ${projectId}`);
        }

        // Set payment type
        if (!request.type || !['micro', 'macro'].includes(request.type)) {
            const micro = request.to && request.from && request.sms;
            request.type = micro ? 'micro' : 'macro';
        }

        return request;
    }

    /**
     * Creates signed request data
     */
    static createRequest(request, password) {
        const queryString = this.encodeSafeUrlBase64(new URLSearchParams(request).toString());
        
        return {
            data: queryString,
            sign: crypto.createHash('md5').update(queryString + password).digest('hex')
        };
    }

    /**
     * Checks SS1 signature
     */
    static checkSign(request, password) {
        if (!request.data || !request.ss1) {
            throw new Error('Not enough parameters for SS1 signature check');
        }

        const expectedSign = crypto.createHash('md5').update(request.data + password).digest('hex');
        return request.ss1 === expectedSign;
    }

    /**
     * Encodes string to url-safe-base64
     */
    static encodeSafeUrlBase64(text) {
        return Buffer.from(text).toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }

    /**
     * Decodes url-safe-base64 encoded string
     */
    static decodeSafeUrlBase64(encodedText) {
        const base64 = encodedText.replace(/-/g, '+').replace(/_/g, '/');
        return Buffer.from(base64, 'base64').toString();
    }

    /**
     * Decrypts string with AES-256-GCM algorithm
     */
    static decryptGCM(stringToDecrypt, key) {
        try {
            const ivLength = 12; // AES-256-GCM IV length
            const tagLength = 16; // GCM auth tag length
            
            const iv = stringToDecrypt.slice(0, ivLength);
            const ciphertext = stringToDecrypt.slice(ivLength, -tagLength);
            const tag = stringToDecrypt.slice(-tagLength);

            const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(ciphertext, null, 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('GCM decryption failed:', error);
            return null;
        }
    }

    /**
     * Parses HTTP query string to object
     */
    static parseHttpQuery(query) {
        const params = {};
        const pairs = query.split('&');
        
        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key && value !== undefined) {
                params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
        }
        
        return params;
    }

    /**
     * Checks if required parameters are present
     */
    static checkRequiredParameters(data) {
        if (!data.sign_password || !data.projectid) {
            throw new Error('sign_password or projectid is not provided');
        }
    }

    /**
     * Gets payment URL based on language
     */
    static getPaymentUrl(language = 'LIT') {
        return (['lt', 'lit', 'LIT'].includes(language)) 
            ? this.PAY_URL 
            : this.PAYSERA_PAY_URL;
    }
}

module.exports = WebToPay;

