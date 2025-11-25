import generateClasses from '../../utils/generateClasses'
import styles from './Seat.module.scss'

const defaultProps = {
    backgroundColor : 'grey',
    color : 'grey',
    size : 48,
    number : null,
    disabled : false,
    visible : true,
    isBusDriver : "",
    onSelect : () => false,
    passenger: null,
    isToilet : false
}

Seat.defaultProps = defaultProps

export default function Seat(props = defaultProps) {

    function _getImage(type) {
  
        let image = "/assets/icons/seat-masking.png"

        switch (type) {
            case 'DRIVER':
                image = '/assets/icons/steering-wheel.png'
                break
            case 'TOILET':
                image = '/assets/icons/toilet.svg'
                break
            case 'STAIR_UP':
                image = '/assets/icons/stair-up.svg'
                break
            case 'STAIR_DOWN':
                image =  '/assets/icons/stair-down.svg'
                break
            default:
                break
        }
        return image
    }

    return (
        <div
        style={{
            width : props.size,
            height : props.size,
            position : 'relative',
            cursor : props.disabled ? 'not-allowed' : 'pointer',
            borderRadius : '.5rem'
        }}
        className={generateClasses([
            props.backgroundColor,
            styles.tooltip
        ])}
        onClick={() => {
            if (props.disabled || !props.visible) {
                return false
            }
            props.onSelect()
        }}
        >
            {
                props.visible && (
                    <>
                     
                        <div
                        style={{
                            position : 'absolute',
                            top : 0,
                            left : 0,
                            width : props.size,
                            height : props.size
                        }}
                        >
                            <img
                            src={_getImage(props.isBusDriver)}
                            style={{
                                width : props.size,
                                height : props.size,
                            }}
                            />

                        
                            {
                                props.passenger != null && (
                                    <span
                                    className={styles.tooltip_text}
                                    >
                                        {props.passenger.name}
                                    </span>
                                )
                            }
                            
                        </div>
                        <div
                        style={{
                            position : 'absolute',
                            top : 0,
                            left : 0,
                            width : props.size,
                            height : props.size,
                            display : 'flex',
                            alignItems : 'center',
                            justifyContent : 'center'
                        }}
                        >
                            <b
                            style={{
                                color : props.color,
                                fontSize : '.75rem'
                            }}
                            >
                                {props.number}
                            </b>
                        </div>
                    </>
                )
            }
        </div>
    )

}