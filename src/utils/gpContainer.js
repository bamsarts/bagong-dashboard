/**
 * gpContainer SDK Helper
 * Wrapper for window.gpContainer.call method
 */

/**
 * Call gpContainer SDK method
 * @param {string} className - The class name in the SDK
 * @param {string} methodName - The method name to call
 * @param {object} params - Parameters to pass to the method
 * @param {number} timeout - Timeout in milliseconds (default: 10000)
 * @returns {Promise} Promise that resolves with success data or rejects with error
 */
export const callGpContainer = (className, methodName, params = {}, timeout = 10000) => {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.gpContainer) {
            reject(new Error('gpContainer SDK is not loaded'));
            return;
        }

        const successCallback = (result) => {
            resolve(result);
        };

        const failureCallback = (error) => {
            reject(error);
        };

        try {
            window.gpContainer.call(
                className,
                methodName,
                params,
                successCallback,
                failureCallback,
                timeout
            );
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Check if gpContainer SDK is available
 * @returns {boolean}
 */
export const isGpContainerAvailable = () => {
    return typeof window !== 'undefined' && typeof window.gpContainer !== 'undefined';
};

// Example usage methods for common operations
export const gpContainerMethods = {
    // Add your specific SDK methods here based on the API documentation
    // Example:
    // getDeviceInfo: () => callGpContainer('Device', 'getInfo', {}),
    // processPayment: (amount, currency) => callGpContainer('Payment', 'process', { amount, currency }),
};
