import generateClasses from '../../utils/generateClasses'

import styles from './Layout.module.scss'


const RowDefaultProps = {
    marginBottom : false,
    center : false,
    verticalCenter : false,
    verticalEnd : false,
    spaceBetween : false,
    spaceAround : false,
    spaceEvenly : false,
    flexEnd : false,
    className : null,
    style : null,
    withPadding : false,
}

Row.defaultProps = RowDefaultProps

export function Row(props = RowDefaultProps) {
    
    return (
        <div
        className={generateClasses([
            styles.row,
            props.marginBottom && styles.margin_bottom,
            props.withPadding && styles.with_padding,
            props.center && styles.center_content,
            props.verticalCenter && styles.vertical_center,
            props.verticalEnd && styles.vertical_end,
            props.spaceBetween && styles.space_between,
            props.spaceAround && styles.space_around,
            props.spaceEvenly && styles.space_evenly,
            props.flexEnd && styles.flex_end,
            props.className && props.className
        ])}
        style={props.style}
        >
            {props.children}
        </div>
    )

}

const ColDefaultProps = {
    column : null,
    style : null,
    className : null,
    mobileFullWidth : false,
    withPadding : false,
    justifyEnd: false,
    justifyCenter: false,
    ignoreScreenSize : false,
    alignEnd : false,
    alignCenter : false,
    marginBottom : false,
    onClick : () => false,
}

Col.defaultProps = ColDefaultProps


export function Col(props = ColDefaultProps) {
    
    function _onClick(e) {
        props.onClick()
        if (!e) e = window.event
        e.cancelBubble = true
        if (e.stopPropagation) e.stopPropagation()
    }
    
    return (
        <div
        className={generateClasses([
            !props.column && styles.column,
            props.column === 1 && styles.col_1,
            props.column === 2 && styles.col_2,
            props.column === 3 && styles.col_3,
            props.column === 4 && styles.col_4,
            props.column === 5 && styles.col_5,
            props.column === 6 && styles.col_6,
            props.className && props.className,
            props.marginBottom && styles.margin_bottom,
            props.mobileFullWidth && styles.full_width,
            props.withPadding && styles.with_padding,
            props.justifyEnd && styles.justify_end,
            props.justifyCenter && styles.justify_center,
            props.justifyStart && styles.justify_start,
            props.alignEnd && styles.align_end,
            props.alignCenter && styles.align_center,
            props.ignoreScreenSize && styles.ignore_screen_size
        ])}
        style={props.style}
        onClick={props.disabled || props.onProcess ? null : _onClick}
        >
            {props.children}
        </div>
    )

}