import React from 'react';

const PreviewImageModal = ({ 
    isOpen, 
    onClose, 
    imageUrl, 
    altText = "Preview image",
    overlayOpacity = 0.8,
    maxWidth = '90vw',
    maxHeight = '90vh'
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    position: 'relative',
                    maxWidth,
                    maxHeight,
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '10px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                    }}
                    onClick={onClose}
                    title="Close"
                >
                    ×
                </button>
                <img
                    src={imageUrl}
                    alt={altText}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        borderRadius: '4px'
                    }}
                />
            </div>
        </div>
    );
};

export default PreviewImageModal;