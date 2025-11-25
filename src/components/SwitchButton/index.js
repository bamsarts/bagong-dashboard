import styles from './SwitchButton.module.scss'
import generateClasses from '../../utils/generateClasses'

const defaultProps = {
    checked: false
}

export default function SwitchButton(props = defaultProps){
    return (
        <div
        className={styles.switch}
        onClick={props.onClick}
        >
            <input
            type={"checkbox"}
            checked={props.checked}>

            </input>

            <span 
            className={generateClasses([
                styles.slider,
                styles.round
            ])}
            >

            </span>
        </div>
    )
}