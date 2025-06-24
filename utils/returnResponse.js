HTTP_CODE = {
    HTTP_NOT_FOUND: 404,
    HTTP_UNAUTHORIZED: 401,
    HTTP_FORBIDDEN: 403,
    HTTP_BAD_REQUEST: 400,
    HTTP_INTERNAL_SERVER_ERROR: 500,
    HTTP_OK: 200,
}

/**
    * @description Function to return a success response
    * @param {Object} res - The response object from Express
    * @param {Object} data - The data to return in the response
    * @param {Object} messages - Optional messages for the response, defaulting to success messages in French and English
    * @returns {Object} JSON response with success status and data
*/
module.exports.responseSucess = (res, data, messages = { fr: 'Success', en: 'Success' }) => {
    return res.status(HTTP_CODE.HTTP_OK).json({
        error: false,
        messages,
        data
    });
}

/**
    * @description Function to return an error response
    * @param {Object} res - The response object from Express
    * @param {String} error - The error code to determine the HTTP status code {@link HTTP_CODE}
    * @param {Object} messages - Optional messages for the response, defaulting to error messages in French and English
    * @returns {Object} JSON response with error status and messages
*/
module.exports.responseError = (res, error, messages = { fr: 'Erreur', en: 'Error' }) => {
    return res.status(HTTP_CODE[error] || HTTP_CODE.HTTP_INTERNAL_SERVER_ERROR).json({
        error: true,
        messages
    });
}