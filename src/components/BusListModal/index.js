import AppContext from '../../context/app'
import Modal, { ModalContent } from '../Modal'
import { useEffect, useState, useContext } from 'react'
import Input from '../Input'
import { postJSON } from '../../api/utils'
import Button from '../Button'
import styles from './BusListModal.module.scss'
import { popAlert } from '../Main'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
}

BusListModal.defaultProps = defaultProps

export default function BusListModal(props = defaultProps){
    const appContext = useContext(AppContext)
    const [_categoryRanges, _setCategoryRanges] = useState([]);
    const [_trajectTypeRanges, _setTrajectTypeRanges] = useState([]);
    const [_isProcessing, _setIsProcessing] = useState(false)
    const CONFIG_PARAM = {
        "code": "",
        "isActive": true,
        "name": "",
        "busCategoryId": "",
        "companyId": appContext.authData.companyId,
        "trajectTypeId": "",
        "registrationPlate": "",
        "totalSeat": "",
        "category": {},
        "trajectType": {},
        "id": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)

    useEffect(() => {
        _getCategory()
        _getTypeTraject()
    }, [])

    useEffect(() => {        
        let category = _findData(_categoryRanges, "category", props.data.busCategoryId)
        let trajectType = _findData(_trajectTypeRanges, "traject", props.data.trajectTypeId)

        _updateQuery({
            ...props.data,
            "category": category,
            "trajectType": trajectType
        })

    }, [props.data])

    function _findData(data, type, objectSearch){
        var result = {}
        data.forEach(function(val, key){
            if(val.value == objectSearch){
                result = val
            }
        })
    
        return result
    }

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

    async function _getCategory() {
        const params = {
            "startFrom": 0,
            "length": 60
        }
        
        try {
            const category = await postJSON(`/masterData/bus/kategori/list`, params, appContext.authData.token)
            let categoryRange = [];
            category.data.forEach(function(val, key){
                categoryRange.push({
                    "title": val.name + " (" + val.code + ")",
                    "value": val.id,
                    "totalSeat": val.totalSeat
                })
            })
          
            _setCategoryRanges(categoryRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getTypeTraject() {
        const params = {
            "startFrom": 0,
            "length": 60,
            "companyId": appContext.authData.companyId
        }
        
        try {
            const trajectType = await postJSON(`/masterData/trayekType/list`, params, appContext.authData.token)
            let trajectTypeRange = [];
            trajectType.data.forEach(function(val, key){
                trajectTypeRange.push({
                    "title": val.name,
                    "value": val.id,
                })
            })
          
            _setTrajectTypeRanges(trajectTypeRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _submitData(){
        _setIsProcessing(true)

        try{
            let typeUrl = "add"
            let query  = {
                ..._form
            }
            delete query.totalSeat
            delete query.category
            delete query.trajectType
            
            if(props.data.id){
                typeUrl = "update"
                delete query.busCategoryCode
                delete query.busCategoryType
                delete query.busCategoryTotalSeat
            }else{
                delete query.id
            }

            const result = await postJSON('/masterData/bus/'+typeUrl, query, appContext.authData.token)
            props.refresh()
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": "Berhasil ditambahkan", "type": "success"})
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
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
                title: props.data.id ? 'Ubah Bus' : 'Tambah Bus',
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                },
            }}
            >

                <Input
                withMargin
                title={"Kode Bus"}
                placeholder={'1A'}
                value={_form.code}
                onChange={(value) => {
                    _updateQuery({
                        "code": value
                    })
                }}
                />

                <Input
                withMargin
                title={"Nama Bus"}
                placeholder={'Nama Bus'}
                value={_form.name}
                onChange={(value) => {
                    _updateQuery({
                        "name": value
                    })
                }}
                />

                <Input
                withMargin
                title={"Kategori"}
                placeholder={'Pilih Kategori'}
                value={_form.category.title}
                suggestions={_categoryRanges}
                suggestionField={'title'}
                onSuggestionSelect={(data) => {
                    _updateQuery({
                        "busCategoryId": data.value,
                        "category": data,
                        "totalSeat": data.totalSeat
                    })
                }}
                />

                <Input
                withMargin
                disabled
                title={"Jumlah Kursi"}
                placeholder={''}
                value={_form.totalSeat == null ? 0 : _form.totalSeat}
                />

                <Input
                withMargin
                title={"Jenis Trayek"}
                placeholder={'Pilih Jenis Trayek'}
                value={_form.trajectType.title}
                suggestions={_trajectTypeRanges}
                suggestionField={'title'}
                onSuggestionSelect={(data) => {
                    _updateQuery({
                        "trajectTypeId": data.value,
                        "trajectType": data,
                    })
                }}
                />

                <Input
                withMargin
                title={"Plat Nomor"}
                placeholder={'B 1234 ABC'}
                value={_form.registrationPlate}
                onChange={(value) => {
                    _updateQuery({
                        "registrationPlate": value
                    })
                }}
                />

                <div className={styles.buttonContainer}>
                    <Button
                    title={'Tambahkan'}
                    styles={Button.secondary}
                    onClick={_submitData}
                    onProcess={_isProcessing}
                    />
                </div>

            </ModalContent>

        </Modal>
    )
}