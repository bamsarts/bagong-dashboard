import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './Poolmodal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
}

PoolModal.defaultProps = defaultProps

export default function PoolModal(props = defaultProps){

    const CONFIG_PARAM = {
        "name": "",
        "branchId": "",
        "branchName": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [_branchRanges, _setBranchRanges] = useState([]);

    function _clearForm(){
        _setForm(CONFIG_PARAM)
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitData(){

        let typeSubmit = 'add'
        let message = "ditambahkan"

        if(props.data.id){
            message = "diubah"
            typeSubmit = "update"
        }
        
        delete _form.branchName
        
        for(const prop in _form){

            if(_form[prop] == ""){

                if(typeSubmit == "update"){
                    if(prop == "password" || prop == "cpassword"){
                        continue
                    }
                }

                popAlert({"message": "Semua form wajib terisi"})
                return false
            }
        }
        
        _setIsProcessing(true)

        try{
            let query  = {
                ..._form
            }

            const result = await postJSON('/masterData/branch/pool/'+typeSubmit, query, appContext.authData.token)
            
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": "Berhasil "+message, "type": "success"})
            props.onSuccess()
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _getBranch() {
        const params = {
            "startFrom": 0,
            "length": 300
        }
        
        try {
            const branch = await postJSON(`/masterData/branch/list`, params, appContext.authData.token)
            let branchRange = [];
            branch.data.forEach(function(val, key){
                branchRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setBranchRanges(branchRange)
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        _getBranch()
        _updateQuery({
            ...props.data
        })
    }, [props.data])

    return (
        <Modal
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: props.data.id ? 'Ubah Pool' : 'Tambah Pool',
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                },
            }}
            >

                <Input
                withMargin
                title={"Cabang"}
                placeholder={'Pilih Cabang'}
                value={_form.branchName}
                suggestions={_branchRanges}
                suggestionField={'title'}
                onSuggestionSelect={(value) => {
                    _updateQuery({
                        "branchId": value.value,
                        "branchName": value.title
                    })
                }}
                />

                <Input
                withMargin
                title={"Nama Pool"}
                placeholder={'Nama Pool'}
                value={_form.name}
                onChange={(value) => {
                    _updateQuery({
                        "name": value
                    })
                }}
                />
                
                <div className={styles.container}>

                    {
                        props.data.id && (
                            <>
                                <div
                                className={generateClasses([
                                    styles.d_flex,
                                    styles.align_items_between,
                                    styles.mt_1
                                ])}
                                >
                                    <Button
                                    title={'Simpan Perubahan'}
                                    styles={Button.secondary}
                                    onClick={_submitData}
                                    onProcess={_isProcessing}
                                    />
                                </div>
                                
                            </>
                        )
                    }

                    {
                        !props.data.id && (
                            <Button
                            title={'Tambahkan'}
                            styles={Button.secondary}
                            onClick={_submitData}
                            onProcess={_isProcessing}
                            />
                        )
                    }
                    
                </div>

            </ModalContent>
            
        </Modal>
    )
}