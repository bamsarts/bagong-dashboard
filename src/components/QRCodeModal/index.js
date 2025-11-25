import Modal, { ModalContent } from '../Modal'
import { QRCode } from 'react-qrcode-logo'
import { Col } from '../Layout'

const defaultProps = {
    visible: false,
    closeModal: null,
    userData: {}
}

QRCodeModal.defaultProps = defaultProps

export default function QRCodeModal(props = defaultProps) {
    return (
        <Modal
            visible={props.visible}
            centeredContent
        >
            <ModalContent
                header={{
                    title: 'QR Code User',
                    closeModal: props.closeModal,
                }}
            >
                <Col alignCenter>
                    <img
                        style={{
                            margin: "1rem 0rem"
                        }}
                        src={"/assets/logo/bagong.svg"}
                        width={"100"}
                        height={"auto"}
                    />

                    <QRCode
                        value={JSON.stringify({ "name": props.userData.name, "id": props.userData.id })}
                        ecLevel={'L'}
                        size={200}
                        fgColor={'#000'}
                        removeQrCodeBehindLogo={true}
                        style={{
                            marginBottom: '1rem',
                        }}
                    />

                    <span>{props.userData.name}</span>
                    <span>{props.userData.id}</span>
                </Col>
            </ModalContent>
        </Modal>
    )
}
