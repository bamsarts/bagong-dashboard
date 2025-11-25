import Modal, { ModalContent } from '../Modal'
import { Col, Row } from '../Layout'
import { useEffect, useState } from 'react'
import styles from './ImageSlider.module.scss'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: [],
    index: 0
}

ImageSlider.defaultProps = defaultProps

export default function ImageSlider(props = defaultProps){

    const [_mediaRange, _setMediaRange] = useState([])
    
    useEffect(() => {
        _setMediaRange(props.data)
    }, [props.data])

    return (
        <Modal
        large
        visible={props.visible}
        centeredContent
        >   
            
            <ModalContent
            header={{
                title: '',
                closeModal: () => {
                    props.closeModal()
                },
            }}
            >
               
                <Row
                center
                >
                    <div
                    style={{"display": "grid"}}
                    >
                        {
                            _mediaRange.length > 0 && (
                                <img 
                                loading={"lazy"}
                                style={{"margin": "auto"}}
                                src={_mediaRange[props.index].link} 
                                width="100%" 
                                height="auto"
                                />
                            )
                        }
                        
                    </div>
                </Row>

                <div
                className={styles.slide_item_container}
                >   
                    <div>
                    {
                        _mediaRange.map(function(val, key){
                            return (
                                <div>
                                    <img 
                                    loading={"lazy"}
                                    style={{"margin": "auto"}}
                                    src={_mediaRange[key].link+"?option=thumbnail&size=10"} 
                                    width="10%" 
                                    height="auto"
                                    />
                                </div>
                            )
                        })
                    }
                    </div>
                </div>
            </ModalContent>
        </Modal>
    )
}