import generateClasses from '../../utils/generateClasses'

import styles from './ProfileCard.module.scss'
import ActivityIndicator from '../ActivityIndicator'
import { Row, Col } from '../Layout'

const defaultProps = {
    title : '',
    isConnectSimaDamri: {}
}

export default function ProfileCard(props = defaultProps) {

    return (
        <div
        className={generateClasses([
            'card',
            styles.container,
        ])}
        >
            <div
            className={generateClasses([
                styles.card,
            ])}
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
                ])}
                >

                {
                    props.content.map((val, key) => {
                        return (<div key={key}>
                            <strong>{val.name}</strong>
                            <span>{val.value}</span>
                        </div>)
                    })
                }


                    {
                        props.isConnectSimaDamri?.text && (
                            <div
                            className={props.isConnectSimaDamri.status ? styles.success : styles.error}
                            >
                                <span>{props.isConnectSimaDamri.text}</span>
                            </div>
                        )
                    }

                    {
                        !props.isConnectSimaDamri?.text && (
                            <Col
                            center
                            alignCenter
                            style={{
                                marginTop: '1rem'
                            }}
                            >
                                <small>
                                    <i>
                                        Connecting SIMA Damri...
                                    </i>
                                </small>
                                
                            </Col>
                        )
                    }
                    
                
                </div>
            </div>
        </div>
    )

}