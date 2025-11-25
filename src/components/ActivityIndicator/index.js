import generateClasses from '../../utils/generateClasses'

import styles from './ActivityIndicator.module.scss'

const defaultProps = {
    className : '',
    dark : false
}

ActivityIndicator.defaultProps = defaultProps

export default function ActivityIndicator(props = defaultProps) {

    const rings = new Array(4).fill('')

    return (
        <div className={styles.ring}>
            {
                rings.map((ring, key) => {
                    return (
                        <div
                        key={key}
                        className={generateClasses([
                            styles.rings_item,
                            props.className,
                            props.dark && styles.dark
                        ])}
                        />
                    )
                })
            }
        </div>
    )

}