import Modal, { ModalContent } from '../Modal'
import { Row, Col } from '../Layout'
import styles from './ConfirmationModal.module.scss'
import Button from '../Button'

const defaultProps = {
    visible : false,
    closeModal : null,
    title: 'Konfirmasi Hapus',
    content: 'Menghapus data tidak dapat dikembalikan',
    buttonRightTitle: 'Ya, Hapus',
    buttonLeftTitle: 'Batal',
    onDelete: null,
    onLoading: false
}

ConfirmationModal.defaultProps = defaultProps

export default function ConfirmationModal(props = defaultProps){
   
    return (
        <Modal
        visible={props.visible}
        centeredContent
        >   
            <ModalContent
            header={{
                title: props.title,
            }}
            >   
            <div
            className={styles.container}
            >   
                <div className={styles.content}>
                    <p>
                        {props.content}
                    </p>
                </div>
                
                <Row
                spaceBetween
                >
                    <Col
                    column={2}
                    >
                        <Button
                        fluidWidth
                        title={props.buttonLeftTitle}
                        styles={Button.info}
                        onClick={() => props.closeModal()}
                        small
                        />
                    </Col>
                    <Col
                    column={2}
                    >
                        <Button
                        fluidWidth
                        title={props.buttonRightTitle}
                        styles={Button.error}
                        onClick={() => props.onDelete()}
                        small
                        onProcess={props.onLoading}
                        />
                    </Col>
                </Row>
            </div>
                
            </ModalContent>
        </Modal>
    )
}