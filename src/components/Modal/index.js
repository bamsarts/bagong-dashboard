import { useEffect } from 'react'

import generateClasses from '../../utils/generateClasses'

import styles from './Modal.module.scss'

const defaultProps = {
    visible : false,
    delay : false,
    centeredContent : false,
    large : false,
    extraLarge : false,
    transparent : false,
    onBackdropClick : null
}

Modal.defaultProps = defaultProps

export default function Modal(props = defaultProps) {

    useEffect(() => {
        if (props.visible) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        
    }, [props.visible])

    return (
        <div
        className={generateClasses([
            styles.container,
            props.visible && styles.modal_visible,
            props.delay && styles.transition_delay,
            props.transparent && styles.transparent
        ])}
        >
            <div
            className={styles.backdrop}
            onClick={props.onBackdropClick}
            />
            <div
            className={styles.center}
            >
                <div
                className={styles.backdrop}
                onClick={props.onBackdropClick}
                />
                <div
                className={generateClasses([
                    styles.children,
                    props.large && styles.large,
                    props.extraLarge && styles.extra_large
                ])}
                >
                    {props.children}
                </div>
                <div
                className={styles.backdrop}
                onClick={props.onBackdropClick}
                />
            </div>
            {
                props.centeredContent && (
                    <div
                    className={styles.backdrop}
                    onClick={props.onBackdropClick}
                    />
                )
            }
        </div>
    )

}

const ModalContentProps = {
    header : {
        title : '',
        closeModal : null
    },
    actions : []
}

ModalContent.defaultProps = ModalContentProps

export function ModalContent(props = ModalContentProps) {

    return (
        <div
        className={styles.modal_content_container}
        >
            <div
            className={styles.modal_content_wrapper}
            >
                {
                    (props.header.title || props.header.closeModal) && (
                        <ModalHeader
                        {...props.header}
                        />
                    )
                }
                <div
                className={styles.modal_content}
                >
                    {props.children}
                    {
                        props.actions.length > 0 && (
                            <div
                            className={styles.modal_actions}
                            >
                                {
                                    props.actions.map((action, key) => {
                                        return (
                                            <span
                                            key={key}
                                            className={styles.modal_action}
                                            >
                                                {action}
                                            </span>
                                        )
                                    })
                                }
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )

}

ModalHeader.defaultProps = ModalContentProps.header

export function ModalHeader (props = ModalheaderdefaultProps) {

    useEffect(() => {
        let escapeKeyDownEventHandler = (e) => {
            if (e.keyCode === 27) {
                if (props.closeModal) props.closeModal()
            }
        }

        document.addEventListener('keydown', escapeKeyDownEventHandler, false)

        return () => {
            document.removeEventListener('keydown', escapeKeyDownEventHandler, false)
        }
    }, [])

    return (
        <div
        className={styles.header}
        >
            <h3>
                {props.title}
            </h3>
            {
                props.closeModal && (
                    <div
                    className={styles.close_button}
                    onClick={props.closeModal}
                    >
                        <img
                        src={'/assets/icons/crossmark.png'}
                        className={styles.close_button_icon}
                        />
                    </div>
                )
            }
        </div>
    )
}