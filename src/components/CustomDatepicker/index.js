import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css";
import { useEffect, useState, forwardRef } from 'react'
import { Col, Row } from '../Layout'
import Input from '../Input'

const defaultProps = {
    value: '',
    title: "Tanggal",
    withMargin: false,
    minDate: new Date(),
    reset: ""
}

CustomDatepicker.defaultProps = defaultProps

export default function CustomDatepicker(props = defaultProps){
    const [_dateChoose, _setDateChoose] = useState(props.value)

    const DatepickerComponent = forwardRef(({ value, onClick }, ref) => (
        <Col>
            <Input
            withMargin
            title={props.title}
            onClick={onClick}
            ref={ref}
            value={_dateChoose == "" ? "" : dateFilter.getMonthDate(_dateChoose)}
            onChange={(value) => {
            }}
            />

            {
                _dateChoose != "" && (
                    <div
                    style={{
                        display: "flex",
                        position: "absolute",
                        right: "15px",
                        bottom: "2px",
                    }}
                    onClick={() => {
                        props.reset()
                    }}
                    >
                        <AiOutlineClose
                        title={"Reset"}
                        style={{
                            marginBottom: "1rem"
                        }}
                        />
                    </div>
                )
            }
        </Col>
    ));

    return (
        <DatePicker
        style={{
            width: "100%"
        }}
        selected={_dateChoose}
        onChange={(date) => {
            _setDateChoose(date)
            props.onChange(date)
        }}
        minDate={props.minDate}
        customInput={<DatepickerComponent/>}
        />
    )
    
}