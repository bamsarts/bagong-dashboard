# gpContainer SDK Integration Guide

## Setup Complete ✓

The gpContainer SDK has been integrated into your project:

1. **SDK Script Added** - The script tag is now in `src/pages/_document.js`
2. **Helper Utility Created** - `src/utils/gpContainer.js` provides easy-to-use methods

## How to Use

### Basic Usage in Any Component

```javascript
import { callGpContainer, isGpContainerAvailable } from '../utils/gpContainer';

// Check if SDK is available
if (isGpContainerAvailable()) {
    console.log('gpContainer SDK is ready');
}

// Call SDK method
const handleSdkCall = async () => {
    try {
        const result = await callGpContainer(
            'ClassName',      // SDK class name
            'methodName',     // SDK method name
            { key: 'value' }, // Parameters object
            10000             // Timeout (optional, default 10000ms)
        );
        console.log('Success:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

### Example in Transaction Page

```javascript
import { callGpContainer } from '../../../utils/gpContainer';

// Inside your component
const processPayment = async (transactionData) => {
    try {
        const result = await callGpContainer(
            'Payment',
            'process',
            {
                amount: transactionData.total_harga_normal,
                bookingCode: transactionData.kode_booking,
                // Add other required parameters
            }
        );
        
        popAlert({ message: 'Payment processed successfully' });
        _getData(); // Refresh data
    } catch (error) {
        popAlert({ message: error.message || 'Payment failed' });
    }
};

// Use in button onClick
<Button
    title="Process Payment"
    onClick={() => processPayment(row)}
/>
```

### Example with Device Info

```javascript
const getDeviceInfo = async () => {
    try {
        const deviceInfo = await callGpContainer('Device', 'getInfo', {});
        console.log('Device Info:', deviceInfo);
    } catch (error) {
        console.error('Failed to get device info:', error);
    }
};
```

## API Format

```javascript
window.gpContainer.call(
    className,        // String: SDK class name
    methodName,       // String: Method to call
    params,           // Object: Parameters
    successCallback,  // Function: Called on success
    failureCallback,  // Function: Called on failure
    timeout          // Number: Timeout in milliseconds
);
```

## Next Steps

1. Check the gpContainer SDK documentation for available classes and methods
2. Add specific methods to `src/utils/gpContainer.js` for your use cases
3. Test the integration in your transaction page
4. Handle success and error cases appropriately

## Notes

- The SDK is loaded globally via script tag in _document.js
- The helper utility handles Promise-based async/await pattern
- Always check if SDK is available before calling methods
- Set appropriate timeout values based on operation complexity
