import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
// import styles from './AccessRoleModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import { Col, Row } from '../Layout'
import Datepicker from '../Datepicker'
import Label from '../Label'
import { dateFilter } from '../../utils/filters'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: () => null,
    category: [],
    typeModal: 'waTemplate',
    titleModal: 'Template'
}

TemplateWaModal.defaultProps = defaultProps

export default function TemplateWaModal(props = defaultProps){

    const appContext = useContext(AppContext)
    const CONFIG_PARAM = {
        "categoryId": "",
        "categoryName": "",
        "text": "",
        "name": "",
        "description": ""
    }

    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_categoryRanges, _setCategoryRanges] = useState([])
    const [_isProcessing, _setIsProcessing] = useState(false)

    useEffect(() => {
        if(props.category.length > 0){

            console.log("kate")
            console.log(props.category)
            _setCategoryRanges(props.category)
        }

       
    }, [props.visible])

    useEffect(() => {
        if(props.data?.id){

            _updateQuery({
                "categoryId": `${props.data?.categoryId}`,
                "text": props.data?.template,
                "categoryName": props.data?.categoryName,
                "id": `${props.data?.id}`,
                "name": props.data?.name,
                "description": props.data?.description
            })
        }
    }, [props.data])

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _clearForm(){
        _setForm(CONFIG_PARAM)
    }

    async function _submitData(){
        _setIsProcessing(true)
        try{
            let query = {
                ..._form
            }
            let url = "add"

            if(props.data?.id) url = "update"


            for(const property in query){
                if(query[property] == "") {
                    delete query[property]
                }
            }

            delete query.categoryName

            if(props.typeModal == "waCategory"){
                delete query.categoryId
            }

            const result = await postJSON('/masterData/'+props.typeModal+'/'+url, query, appContext.authData.token)
            
            if(result) props.closeModal()
            props.onSuccess()
            _clearForm()
            popAlert({"message": "Berhasil disimpan", "type": "success"})
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    return (
        <Modal
        large
        visible={props.visible}
        centeredContent
        >

            <ModalContent
            header={{
                title: (props.data?.id ? 'Ubah' : "Tambah") + " "+props.titleModal,
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                }
            }}
            >

                {
                    props.typeModal == "waTemplate" && (
                        <>
                            <Input
                            withMargin
                            title={"Kategori"}
                            placeholder={'Pilih Kategori'}
                            value={_form.categoryName}
                            suggestions={_categoryRanges}
                            suggestionField={'name'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "categoryId": `${value.id}`,
                                    "categoryName": value.name
                                })
                            }}
                            />

                            <Input
                            multiline={7}
                            withMargin
                            title={"Deskripsi"}
                            value={_form.text}
                            onChange={(value) => {
                                _updateQuery({
                                    "text": value
                                })
                            }}
                            />
                        </>
                    )
                }

                {
                    props.typeModal == "waCategory" && (
                        <>
                            <Input
                            withMargin
                            title={"Nama"}
                            value={_form.name}
                            onChange={(value) => {
                                _updateQuery({
                                    "name": value
                                })
                            }}
                            />

                            <Input
                            multiline={3}
                            withMargin
                            title={"Deskripsi"}
                            value={_form.description}
                            onChange={(value) => {
                                _updateQuery({
                                    "description": value
                                })
                            }}
                            />
                        </>
                    )
                }
                
                
                <Col
                withPadding
                style={{
                    marginTop: "1rem"
                }}
                >
                    <Button
                    title={'Simpan'}
                    styles={Button.secondary}
                    onClick={_submitData}
                    onProcess={_isProcessing}
                    />
                </Col>
                

            </ModalContent>

        </Modal>
    )
}