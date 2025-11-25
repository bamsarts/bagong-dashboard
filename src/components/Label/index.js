import generateClasses from '../../utils/generateClasses'
import styles from './Label.module.scss'
import { Row } from '../Layout'

Label.defaultProps = {
    labels: [],
    activeIndex: null,
}

export default function Label(props = Label.defaultProps){
    return (
        <Row>
            <div
            style={{
                overflow: "auto",
                display: "flex"
            }}
            >
            {
                props.labels.map((label, key) => {

                    if(!label?.isHide){
                        return (
                            <div
                            style={{
                                width: "fit-content",
                                whiteSpace: "nowrap"
                            }}
                            key={key}
                            className={generateClasses([
                                styles.label_status,
                                label.class == "danger" && styles.danger,
                                label.class == "primary" && styles.primary,
                                label.class == "warning" && styles.warning,
                                label.marginRight && styles.mr-1,
                                props.activeIndex !== label.value && styles.disabled
                            ])}
                            onClick={label.onClick}
                            >
                                <span>{label.title}</span>
                            </div>
                        )
                    }
                   
                })
            }
            </div>
        </Row>
        
    )
}