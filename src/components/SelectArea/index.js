import styles from './SelectArea.module.scss'
import generateClasses from '../../utils/generateClasses'
import { AiFillCloseCircle } from 'react-icons/ai'

SelectArea.defaultProps = {
    select: [],
    title: "",
    field: 'title'
}

export default function SelectArea(props = SelectArea.defaultProps){
    return (
        <div
        className={generateClasses([
            styles.container
        ])}
        >
            <label>{props.title}</label>
            <div
            className={generateClasses([
                styles.container_select
            ])}
            >
                {
                    props.select?.map((val, key) => {
                        return (
                            <div
                            key={key}
                            onClick={() => {
                                props.onSelect(val)
                            }}
                            >
                                <span>{val[props.field]}</span>
                                <AiFillCloseCircle/>
                            </div>
                        )
                    })
                }
            </div>
        </div>
    )
}