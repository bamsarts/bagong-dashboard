import { useState, useEffect } from 'react'

import { AiFillCaretUp, AiFillCaretDown } from 'react-icons/ai'
import { currency, input } from '../../utils/filters'

import generateClasses from '../../utils/generateClasses'

import styles from './Input.module.scss'

const defaultProps = {
    flex : true,
    placeholder : '',
    isPassword : false,
    onChange : () => false,
    value : '',
    field : '',
    type : 'text',
    minLength : null,
    maxLength : null,
    min : null,
    max : null,
    disabled : null,
    onClick : null,
    title : null,
    note : null,
    multiline : null,
    numberOnly : false,
    withMargin : false,
    showSuggestions : false,
    suggestions : null,
    suggestionField : 'title',
    suggestionImage : null,
    suggestionSearch : true,
    onSuggestionSelect : null,
    autoComplete : true,
    capitalize : null,
    rounded : false,
    transparent : false,
    icon : null,
    alphaNumericOnly : false,
    required : false,
    inputWrapperClassName : null,
    titleContainerClassName : null,
    id: "",
    className: "",
    hidden: false,
    error: "",
    checked: false,
    marginBottom: false,
    onError: false,
    style: null
}

Input.defaultProps = defaultProps

export default function Input(props = defaultProps) {

    const Component = props.multiline ? 'textarea' : 'input'

    const [_showSuggestions, _setShowSuggestions] = useState(false)
    const [_suggestions, _setSuggestions] = useState([])
    const [_errMessage, _setErrMessage] = useState("")

    useEffect(() => {
        if (_showSuggestions) {
            setTimeout(() => {
                document.getElementsByTagName('body')[0].onclick = (e) => {
                    if (e.target.localName !== 'input') {
                        _setShowSuggestions(false)
                        _setSuggestions(props.suggestions)
                    }
                }
            }, 400)
        } else {
            document.getElementsByTagName('body')[0].onclick = null
        }
    }, [_showSuggestions])

    useEffect(() => {
        if (props.suggestions && props.suggestions.length > 0) {
            _setSuggestions(props.suggestions)
        }
    }, [props.suggestions])

    useEffect(() => {
        if(props.onError){
            _setErrMessage(props.error)
        }else{
            _setErrMessage("")
        }
    }, [props.onError])

    function _onChangeHandler(e) {
        let { value, validity } = e.target

        if (props.type === 'number') {
            if (props.max && parseFloat(value) > props.max) {
                props.onChange(String(props.max), props.field)
            } else if (parseInt(value) < 0)  {
                props.onChange('0', props.field)
            } else {
                if (value !== '') {
                    let result = ''
                    value = value.replace(',', '.')
                    result = value
                    if (value.charAt(0) === '.') {
                        result = '0' + value
                    }
                    if (value.charAt(0) === '0') {
                        if (value.length > 1 && value.charAt(1) !== '.') {
                            result = value.substr(1)
                        }
                    }
                    props.onChange(String(result), props.field)
                } else {
                    props.onChange(value, props.field)
                }
            }

        } else if (props.type === 'currency') {
            props.onChange(value)
            props.onChange(currency(String(value).replace(/\./g, '')))
        } else if (props.type === 'tel') {
            if (validity.valid) {
                props.onChange(value, props.field)
                if (value.length > 2 & value.charAt(0) === '0') {
                    props.onChange('62' + value.substring(1), props.field)
                }
            }
        } else if(props.type == 'file'){
            console.log("file")
            console.log(e)
            props.onChange(e, props.field)
        } else {
            let newValue = value
            if (props.capitalize === 'words') {
                newValue = value.split(' ').map(i => {
                    if (i.length > 0) {
                        return i[0].toUpperCase() + i.substr(1)
                    }
                }).join(' ')
            } else if (props.capitalize === 'characters') {
                newValue = value.toUpperCase()
            }
            if (props.alphaNumericOnly) {
                newValue = newValue.replace(/[^a-z0-9]/gi,'')
            }

            if(props.type == "email"){
                if(!input.validateEmail(newValue)){
                    _setErrMessage(props.error)
                }else{
                    _setErrMessage("")   
                }
            }

            props.onChange(newValue, props.field)
        }
    }

    function _onKeyPress(e) {
        if (props.type === 'number' || props.type === 'currency') {
            e = e ? e : window.event;
            const charCode = e.which ? e.which : e.keyCode;
            if ([190,46, 44].indexOf(charCode) < 0) {
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                    return e.preventDefault()
                }
            } else {
                const value = String(props.value)
                if (charCode === 44 && value.includes('.')) {
                    return e.preventDefault()
                }
                if ([190,46].indexOf(charCode) > 0 && value.includes(',')) {
                    return e.preventDefault()
                }
            }
        }
    }

    function _onClick() {
        if (!props.disabled) {
            if (props.onClick) {
                props.onClick()
            }
            if (props.suggestions) {
                _setShowSuggestions(!_showSuggestions)
            }
        }
    }

    return (
        <>
            <div
            className={generateClasses([
                styles.container,
                props.flex && styles.input_flex,
                props.withMargin && styles.with_margin,
                props.marginBottom && styles.margin_bottom
            ])}
            >
                {
                    props.title && (
                        <div
                        className={generateClasses([
                            styles.title_container,
                            props.titleContainerClassName
                        ])}
                        >
                            <Title
                            title={props.title}
                            note={props.note}
                            />
                        </div>
                    )
                }
                <div
                className={generateClasses([
                    styles.input_wrapper,
                    props.disabled && styles.input_disabled,
                    props.rounded && styles.rounded,
                    props.transparent && styles.transparent,
                    (props.required && !props.value) && styles.is_empty,
                    _showSuggestions && styles.focus_within,
                    props.inputWrapperClassName && props.inputWrapperClassName
                ])}
                >
                    {
                        (props.onClick || props.suggestions) && (
                            <div
                            className={styles.on_click_wrapper}
                            onClick={_onClick}
                            />
                        )
                    }
                    {
                        (props.type === 'tel' && props.value && props.value.length >= 2) && `+`
                    }
                    <Component
                    style={props.style}
                    id={props.id}
                    className={generateClasses([
                        styles.textinput,
                        props.disabled && styles.disabled
                    ])}
                    rows={props.multiline}
                    placeholder={props.placeholder}
                    type={props.isPassword ? 'password' : props.type === 'number' ? 'text' : props.type}
                    value={props.value}
                    onChange={_onChangeHandler}
                    onBlur={() => {
                        if (props.type === 'number') {
                            if (!props.value) {
                                props.onChange(parseFloat(0).toString(), props.field)
                            } else {
                                props.onChange(parseFloat(String(props.value).replace(',', '.')).toString(), props.field)
                            }
                        }
                    }}
                    minLength={props.minLength}
                    maxLength={props.maxLength}
                    min={props.min}
                    max={isNaN(props.max) ? String(props.max) : props.max}
                    disabled={props.disabled || props.onClick !== null || props.suggestions}
                    readOnly={props.disabled || props.onClick !== null}
                    onKeyPress={_onKeyPress}
                    pattern={props.type === 'tel' ? '[0-9]+' : null}
                    autoComplete={!props.autoComplete ? 'new-password' : ''}
                    capitalize={String(props.capitalize)}
                    hidden={props.hidden}
                    checked={props.checked}
                    />
                    <span
                    className={styles.icon}
                    >
                        {
                            (props.suggestions && !props.disabled) && (
                                _showSuggestions
                                ? <AiFillCaretUp/>
                                : <AiFillCaretDown/>
                            )
                        }
                        {props.icon}
                    </span>
                </div>
                {
                    (_showSuggestions && props.suggestions) && (
                        <div
                        className={styles.input_suggestions_wrapper}
                        >
                            <div
                            className={styles.input_suggestions}
                            >
                                {
                                    props.suggestionSearch && (
                                        <div
                                        className={styles.input_suggestions_search_wrapper}
                                        >
                                            <input
                                            autoFocus
                                            type={'text'}
                                            className={styles.input_suggestions_search}
                                            placeholder={`Cari`}
                                            onChange={e => {
                                                let { value } = e.target
                                                let suggestions = [...props.suggestions].filter(suggestion => suggestion[props.suggestionField].toLowerCase().includes(value.toLowerCase()))
                                                _setSuggestions(suggestions)
                                                props.onChange(e.target.value)
                                            }}
                                            />
                                        </div>
                                    )
                                }
                                
                                {
                                    _suggestions.map((suggestion, key) => {
                                        return (
                                            <div
                                            style={{"align-items": "center", "display": "flex"}}
                                            key={key}
                                            className={styles.input_suggestion}
                                            onClick={() => {
                                                props.onSuggestionSelect(suggestion)
                                                _setShowSuggestions(false)
                                                _setSuggestions(props.suggestions)
                                            }}
                                            >
                                                {
                                                    props.suggestionImage != null && (
                                                        <img 
                                                        style={{"margin-right": "1rem"}}
                                                        src={suggestion[props.suggestionImage]+"?option=thumbnail&size=10"} 
                                                        width="50" 
                                                        height="50"
                                                        />
                                                    )
                                                }

                                                {suggestion[props.suggestionField]}
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    )
                }
                <small className={styles.text_danger}>{_errMessage}</small>
            </div>
        </>
    )

}

const title_defaultProps = {
    title : '',
    note : ''
}

Title.defaultProps = title_defaultProps

Input.Title = Title

function Title(props = title_defaultProps) {
    return (
        <p
        className={styles.title}
        >
            {props.title}
            {
                props.note && (
                    <span
                    className={styles.note}
                    >
                        &#42;{props.note}
                    </span>
                )
            }
        </p>
    )
}
