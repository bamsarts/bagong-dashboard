import generateClasses from '../../utils/generateClasses'

import styles from './Card.module.scss'

const defaultProps = {
    title : '',
    fluidHeight : false,
    invertedColor : false,
    noPadding : false,
    className : null,
    onClick : null,
    headerContent : null,
    style : null,
    hideOverflow : false
}

export default function Card(props = defaultProps) {
    
    return (
        <div
        className={generateClasses([
            'card',
            styles.container,
            props.fluidHeight && styles.fluid_height,
            props.className
        ])}
        style={props.style}
        >
            <div
            className={generateClasses([
                styles.card,
                props.invertedColor && styles.inverted,
                props.noPadding && styles.no_padding,
                props.onClick && styles.clickable,
                props.hideOverflow && styles.hide_overflow
            ])}
            onClick={props.onClick}
            >
                {
                    props.title && (
                        <div
                        className={styles.card_title}
                        >
                            <h3>
                                {props.title}
                            </h3>
                        </div>
                    )
                }
                <div
                className={generateClasses([
                    styles.card_content,
                    props.noPadding && styles.no_padding,
                ])}
                >
                    {
                        props.headerContent && (
                            <div
                            className={styles.card_header}
                            >
                                {props.headerContent}
                            </div>
                        )
                    }
                    {props.children}
                </div>
            </div>
        </div>
    )

}