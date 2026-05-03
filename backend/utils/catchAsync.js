/**
 * catchAsync Wrapper
 * Wraps asynchronous controller functions to catch errors and pass them to the Express next() function.
 * This eliminates the need for try-catch blocks in every controller.
 * 
 * @param {Function} fn - Async Express controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = { catchAsync };
