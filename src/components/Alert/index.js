import generateClasses from '../../utils/generateClasses'

import styles from './Alert.module.scss'

const defaultProps = {
    show : false,
    type : 'success',
    slideTo : 'top',
    message : '',
    onClick : null
}

Alert.defaultProps = defaultProps

export default function Alert(props = defaultProps) {

    function _getBackgroundColor() {
        
        let backgroundColor = ''

        switch (props.type) {
            case 'success':
                backgroundColor = styles.background_success
                break;
            case 'error':
                backgroundColor = styles.background_error
                break;
            case 'info':
                backgroundColor = styles.background_info
                break;
            case 'warning':
                backgroundColor = styles.background_warning
                break;
            default:
                backgroundColor = styles.background_info
                break;
        }

        return backgroundColor
    }

    function _getIcon() {
        
        let icon = ''

        switch (props.type) {
            case 'success':
                icon = '/assets/icons/alert-success.svg'
                break;
            case 'error':
                icon = '/assets/icons/alert-error.svg'
                break;
            case 'info':
                icon = '/assets/icons/alert-success.svg'
                break;
            default:
                icon = '/assets/icons/alert-success.svg'
                break;
        }

        return icon
    }

    function _renderMessages(messages) {
        if (messages instanceof Array) {
            return messages.join('\n')
        }
        return messages
    }

    return (
        <div
        className={generateClasses([
            styles.alert_container,
            props.show && styles.alert_show,
            styles[props.slideTo]
        ])}
        >
            <div
            className={generateClasses([
                styles.container,
                _getBackgroundColor()
            ])}
            >
                <div
                className={styles.icon}
                >
                    <img
                    src={_getIcon()}
                    />
                </div>
                <div
                className={styles.message}
                >
                    <p>
                        {_renderMessages(props.message)}
                    </p>
                </div>
                <div
                className={styles.action}
                onClick={props.onClick}
                >
                    <p>
                        ok
                    </p>
                </div>
            </div>
        </div>
    )

}