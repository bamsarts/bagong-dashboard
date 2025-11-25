import generateClasses from '../../utils/generateClasses'
import { Row } from '../Layout'

import styles from './Tabs.module.scss'

Tabs.defaultProps = {
    tabs : [],
    activeIndex : null,
    disabled: false,
    isHide: false
}

export default function Tabs(props = Tabs.defaultProps) {

    return (
        <div style={{"min-width": "300px"}}>
            <Row>
                {
                    props.tabs.map((tab, key) => {

                        if(!tab.isHide){
                            return (
                                <div
                                key={key}
                                className={generateClasses([
                                    styles.tab,
                                    props.activeIndex === tab.value && styles.active,
                                    props.disabled && styles.disabled
                                ])}
                                onClick={tab.onClick}
                                >
                                    {tab.title}
                                </div>
                            )
                        }
                       
                    })
                }
            </Row>
        </div>
        
    )

}   