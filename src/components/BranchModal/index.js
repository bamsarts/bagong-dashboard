import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './Branchmodal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'
import { Col, Row } from '../Layout'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: null,
}

BranchModal.defaultProps = defaultProps

export default function BranchModal(props = defaultProps){

    const CONFIG_PARAM = {
        "name": "",
        "address": "",
        "branchDivisionId": "",
        "email": "",
        "fax": "",
        "latitude": "",
        "longitude": "",
        "phoneNumber": "",
        "postalCode": "",
        "cityId": "",
        "branchClassId": "",
        "branchClassName": "",
        "divisionName": "",
        "cityName": ""
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const [_divisionRanges, _setDivisionRanges] = useState([]);
    const [_cityRanges, _setCityRanges] = useState([]);
    const [_classRanges, _setClassRanges] = useState([]);

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
        let isFilled = true

        for(const prop in _form){

            if(_form[prop] == ""){
                isFilled = false
            }
        }

        if(!isFilled){
            popAlert({"message": "Semua form wajib terisi"})
            return false
        }
        
        _setIsProcessing(true)

        try{
            let query  = {
                ..._form
            }

            delete query.divisionName
            delete query.cityName
            delete query.branchClassName

            if(props.data.id){
                message = "diubah"
                typeSubmit = "update"
                delete query.branchDivisionName
            }

            const result = await postJSON('/masterData/branch/'+typeSubmit, query, appContext.authData.token)
            
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

    async function _getDivision() {
        const params = {
            "startFrom": 0,
            "length": 280
        }
        
        try {
            const division = await postJSON(`/masterData/branch/division/list`, params, appContext.authData.token)
            let divisionRange = [];
            division.data.forEach(function(val, key){
                divisionRange.push({
                    "title": val.division,
                    "value": val.id
                })
            })
            _setDivisionRanges(divisionRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getCity() {
        const params = {
            "startFrom": 0,
            "length": 180
        }
        
        try {
            const city = await postJSON(`/masterData/point/wilayah/list`, params, appContext.authData.token)
            let cityRange = [];
            city.data.forEach(function(val, key){
                cityRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setCityRanges(cityRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getClass() {
        const params = {
            "startFrom": 0,
            "length": 180
        }
        
        try {
            const res = await postJSON(`/masterData/branch/class/list`, params, appContext.authData.token)
            let classRange = [];
            res.data.forEach(function(val, key){
                classRange.push({
                    "title": val.class,
                    "value": val.id
                })
            })
            _setClassRanges(classRange)
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        _getDivision()
        _getCity()
        _getClass()
        _updateQuery({
            ...props.data
        })
        console.log(props.data)
    }, [props.data])

    return (
        <Modal
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: props.data.id ? 'Ubah Cabang' : 'Tambah Cabang',
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                },
            }}
            >   
               

                <Input
                withMargin
                title={"Nama Cabang"}
                placeholder={'Nama Cabang'}
                value={_form.name}
                onChange={(value) => {
                    _updateQuery({
                        "name": value
                    })
                }}
                />

                <Input
                withMargin
                type={"textarea"}
                title={"Alamat"}
                placeholder={'Masukan Alamat'}
                value={_form.address}
                onChange={(value) => {
                    _updateQuery({
                        "address": value
                    })
                }}
                />

                <Input
                withMargin
                title={"Email"}
                placeholder={'Masukan Email'}
                value={_form.email}
                onChange={(value) => {
                    _updateQuery({
                        "email": value
                    })
                }}
                />

                <Row>
                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Divisi"}
                        placeholder={'Pilih Divisi'}
                        value={_form.divisionName}
                        suggestions={_divisionRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(value) => {
                            _updateQuery({
                                "branchDivisionId": value.value,
                                "divisionName": value.title
                            })
                        }}
                        />

                    </Col>

                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Kota"}
                        placeholder={'Pilih Kota'}
                        value={_form.cityName}
                        suggestions={_cityRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(value) => {
                            _updateQuery({
                                "cityId": value.value,
                                "cityName": value.title
                            })
                        }}
                        />
                    </Col>
                </Row>

                <Row>
                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Kode Pos"}
                        placeholder={'Masukan kode pos'}
                        value={_form.postalCode}
                        onChange={(value) => {
                            _updateQuery({
                                "postalCode": value
                            })
                        }}
                        />
                    </Col>
                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Kelas"}
                        placeholder={'Pilih Kelas'}
                        value={_form.branchClassName}
                        suggestions={_classRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(value) => {
                            _updateQuery({
                                "branchClassId": value.value,
                                "branchClassName": value.title
                            })
                        }}
                        />
                    </Col>
                </Row>

                <Row>
                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Telepon"}
                        placeholder={'Masukan telepon'}
                        value={_form.phoneNumber}
                        onChange={(value) => {
                            _updateQuery({
                                "phoneNumber": value
                            })
                        }}
                        />
                    </Col>

                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Fax"}
                        placeholder={'Masukan fax'}
                        value={_form.fax}
                        onChange={(value) => {
                            _updateQuery({
                                "fax": value
                            })
                        }}
                        />
                    </Col>
                </Row>
               
                <div className={styles.container}>
                    <strong>Koordinat</strong>
                </div>

                <Row>
                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Latitude"}
                        placeholder={'Latitude'}
                        value={_form.latitude}
                        onChange={(value) => {
                            _updateQuery({
                                "latitude": value
                            })
                        }}
                        />
                    </Col>

                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Longitude"}
                        placeholder={'Longitude'}
                        value={_form.longitude}
                        onChange={(value) => {
                            _updateQuery({
                                "longitude": value
                            })
                        }}
                        />
                    </Col>
                </Row>
                
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