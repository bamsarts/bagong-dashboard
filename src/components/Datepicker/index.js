import Input from '../Input'
import React, { useEffect, useState } from 'react'
import { dateFilter } from '../../utils/filters';
import styles from './Datepicker.module.scss'

const defaultProps = {
    value: '',
    title: "Tanggal",
    id: "datePicker",
    withMargin: false
}

Datepicker.defaultProps = defaultProps

export default function Datepicker(props = defaultProps) {

    const [_date, _setDate] = useState(props.value ? dateFilter.getMonthDate(new Date(props.value)) : "");
    const [_dateChoose, _setDateChoose] = useState(props.value)

    useEffect(() => {

    }, [_date])

    useEffect(() => {
        if (props.value && props.value.trim() !== '') {
            _setDate(dateFilter.getMonthDate(new Date(props.value)))
        }
    }, [props.value])

    let triggerDatepicker = () => {
        document.getElementById(props.id).showPicker()
    }

    return (
        <>
            <Input
            withMargin={props.withMargin ? true : false}
            title={props.title}
            value={_date}
            onChange={(value) => {
                if(value){
                    _setDate(value)
                }
            }}
            onClick={(value) => {
                triggerDatepicker()
            }}
            />

            <div
            className={styles.container}
            >
                <Input
                className={"datepicker"}
                id={props.id}
                type={'date'}
                value={_dateChoose}
                onChange={(value) => {
                    if (value && value.trim() !== '') {
                        _setDate(dateFilter.getMonthDate(new Date(value)))
                        _setDateChoose(value)
                    } 
                    
                    props.onChange(value)
                }}
                />
            </div>
        </>
    )
}