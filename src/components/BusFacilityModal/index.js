import AppContext from '../../context/app'
import Modal, { ModalContent } from '../Modal'
import { useEffect, useState, useContext } from 'react'
import Input from '../Input'
import { postJSON } from '../../api/utils'
import Button from '../Button'
import styles from './BusFacilityModal.module.scss'
import { popAlert } from '../Main'
import { camelToSnakeCase } from '../../utils/case-converter'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
}

BusFacilityModal.defaultProps = defaultProps

export default function BusFacilityModal(props = defaultProps) {
    const appContext = useContext(AppContext)

    const CONFIG_PARAM = {
        "code": "",
        "name": "",
        "image_id": "",
        "image_link": "",
        "image_title": "",
        "image_url": ""
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_imageRanges, _setImageRanges] = useState([]);

    function _updateQuery(data = {}) {
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _clearForm() {
        _setForm(CONFIG_PARAM)
    }

    useEffect(() => {
        _getImages()

        if (props.data?.id) {


            _updateQuery({
                ...camelToSnakeCase(props.data),
            })
        }

    }, [props.data])

    async function _getImages() {
        const params = {
            "startFrom": 0,
            "length": 660
        }

        try {
            const image = await postJSON(`/masterData/media/image/list`, params, appContext.authData.token)
            let imageRange = [];
            image.data.forEach(function (val, key) {

                if (val.id == props.data?.imageId) {
                    _updateQuery({
                        "image_title": val.title,
                        "image_id": val.id,
                        "image_link": val.thumbnail
                    })
                }

                imageRange.push({
                    "title": val.title,
                    "value": val.id,
                    "link": val.thumbnail
                })
            })
            _setImageRanges(imageRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _submitData() {
        _setIsProcessing(true)

        try {
            let typeUrl = "add"
            let query = {
                ..._form
            }

            if (props.data.id) {
                typeUrl = "update"
                delete query.imageId
                delete query.link
            }

            delete query.image_link
            delete query.image_title

            const result = await postJSON('/masterData/bus/fasilitas/' + typeUrl, query, appContext.authData.token)
            props.refresh()
            if (result) props.closeModal()
            _clearForm()
            popAlert({ "message": "Berhasil disimpan", "type": "success" })
        } catch (e) {
            popAlert({ message: e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    return (
        <Modal
            visible={props.visible}
            centeredContent
        >
            <ModalContent
                header={{
                    title: props.data.id ? 'Ubah Bus Fasilitas' : 'Tambah Bus Fasilitas',
                    closeModal: () => {
                        props.closeModal()
                        _clearForm()
                    },
                }}
            >

                <Input
                    withMargin
                    title={"Kode Fasilitas"}
                    placeholder={'Masukan Kode Fasilitas'}
                    value={_form.code}
                    onChange={(value) => {
                        _updateQuery({
                            "code": value
                        })
                    }}
                />

                <Input
                    withMargin
                    title={"Nama Fasilitas"}
                    placeholder={'Masukan Nama Fasilitas'}
                    value={_form.name}
                    onChange={(value) => {
                        _updateQuery({
                            "name": value
                        })
                    }}
                />

                <Input
                    title={"Gambar Fasilitas"}
                    withMargin
                    placeholder={'Pilih Gambar'}
                    value={_form.image_title}
                    suggestions={_imageRanges}
                    suggestionField={'title'}
                    suggestionImage={'link'}
                    onSuggestionSelect={(value) => {
                        _updateQuery({
                            "image_id": value.value,
                            "image_title": value.title,
                            "image_link": value.link
                        })
                    }}
                />

                <Input
                    withMargin
                    title={""}
                    placeholder={'Link gambar CDN'}
                    value={_form.image_url}
                    onChange={(value) => {
                        _updateQuery({
                            "image_url": value
                        })
                    }}
                />

                {
                    _form.image_link != "" && (
                        <img
                            style={{ "margin": ".5rem" }}
                            src={_form.image_link}
                            width="200"
                            height="auto"
                        />
                    )
                }

                <div className={styles.buttonContainer}>
                    <Button
                        title={'Simpan'}
                        styles={Button.secondary}
                        onClick={_submitData}
                        onProcess={_isProcessing}
                    />
                </div>

            </ModalContent>
        </Modal>
    )
}