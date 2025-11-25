import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import { Row, Col } from '../Layout'
import styles from './Point.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
import SelectArea from '../SelectArea'
import generateClasses from '../../utils/generateClasses'

const defaultProps = {
    visible : false,
    closeModal : null,
    typeModal: '',
    data: {},
    onSuccess: null,
    branch: []
}

PointModal.defaultProps = defaultProps

export default function PointModal(props = defaultProps) {

    const appContext = useContext(AppContext)
    const [_form, _setForm] = useState({
        "name": "",
        "address": "",
        "damriCode": "",
        "latitude": "",
        "longitude": "",
        "specialRegions": "",
        "cityId": "",
        "url": "-",
        "specialRegions": "",
        "specialRegionsInput": {},
        "province": {},
        "city": {},
        "provinceId": "",
        "branchId": "",
        "branchName": ""
    })
    
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_provinceRanges, _setProvinceRanges] = useState([]);
    const [_specialRegion, _setSpecialRegion] = useState([])
    const [_cityRanges, _setCityRanges] = useState([]);
    const [_branchRanges, _setBranchRanges] = useState([])
   
    useEffect(() => {
        _getProvince()
    }, [])

    useEffect(() => {
        if(props?.branch.length > 0){
            _setBranchRanges(props.branch)
        }
        
    }, [props.branch])

    useEffect(() => {
        if(props.data?.id){

            let branch = {}

            if(props.branch?.length > 0){
                props.branch.forEach(function(val, key){
                    if(val.value == props.data?.branchId){
                        branch.branchId = val.value
                        branch.branchName = val.title
                    }
                })
            }

            if(_provinceRanges.length > 0 && props.typeModal == "lokasi"){
                let province = _provinceRanges.find(v => v.value == props.data.provinceId)
                
                _updateQuery({
                    "province": {
                        "title": province?.title || province?.provinceName,
                        "value": province?.value
                    }
                })
            }

            if(props.data.cityId){
                _getCity(props.data.provinceId)
            }

          
            _updateQuery(props.data)
            _updateQuery({
                "latitude": props.data.latitude == null ? '' : props.data.latitude,
                "longitude": props.data.longitude == null ? '' : props.data.longitude,
                "specialRegions": props.data.specialRegions == null ? '' : props.data.specialRegions,
                ...branch
            })
        }else{
            _clearForm()
        }
    }, [props.data])

    useEffect(() => {
        let paramSpecialRegion = []

        _specialRegion.forEach(function(val, key){
            paramSpecialRegion.push(val.value)
        })
        _updateQuery({
            "specialRegions": paramSpecialRegion.toString()
        })
    }, [_specialRegion])

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    function _clearForm(){
        _setForm({
            "name": "",
            "address": "",
            "damriCode": "",
            "latitude": "",
            "longitude": "",
            "specialRegions": "",
            "cityId": "",
            "url": "-",
            "specialRegions": "",
            "specialRegionsInput": {},
            "province": {},
            "city": {}
        })
    }

    function _updateSpecialRegion(data = {}, isDelete = false){
        let specialRegion = [..._specialRegion]
        const index = _specialRegion.indexOf(data)

        if(index < 0 && !isDelete){
            specialRegion.push(data)
        }else{
            specialRegion.splice(index, 1)
        }

        _setSpecialRegion(specialRegion)
    }

    
    async function _getProvince() {
        const params = {
            "startFrom": 0,
            "length": 280
        }
        
        try {
            const province = await postJSON(`/masterData/point/provinsi/list`, params, appContext.authData.token)
            let provinceRange = [];
            province.data.forEach(function(val, key){
                provinceRange.push({
                    "title": val.provinceName,
                    "value": val.id
                })
            })
            _setProvinceRanges(provinceRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getCity(idProvince) {
        const params = {
            "startFrom": 0,
            "length": 290,
            "provinceId": idProvince?.value || idProvince?.id
        }

        try {
            const cities = await postJSON(`/masterData/point/wilayah/list`, params, appContext.authData.token)
            let citiesRange = [];
            let selectedCity = {}
            let specialRegion = []

            cities.data.forEach(function(val, key){
                citiesRange.push({
                    "title": val.name,
                    "value": val.id
                })

                if(val.id == props.data.cityId){
                    selectedCity = {
                        "title": val.name,
                        "value": val.id
                    }
                }

                if(props.data.specialRegions){
                    props.data.specialRegions.split(',').forEach(function(item, key){
                        
                        if(item == val.id){
                            specialRegion.push({
                                "title": val.name,
                                "value": val.id
                            })
                        }
                    })
                }
            })

            _setSpecialRegion(specialRegion)
            _setCityRanges(citiesRange)
            _updateQuery({
                "city": selectedCity
            })
        } catch (e) {
            console.log(e)
        }
    }

    async function _submitData(url){
        _setIsProcessing(true)
        try{
            let query = {
                ..._form
            }
            let url = "add"

            if(props.data?.id) url = "update"

            delete query.specialRegionsInput
            delete query.province
            delete query.city
            delete query.branchName

            for(const property in query){
                if(query[property] == "") {
                    delete query[property]
                }
            }

            if(props.typeModal == "wilayah"){
                delete query.url
                delete query.address
                delete query.cityId
                delete query.damriCode
                delete query.provinceName
                delete query.branchId

            }else if(props.typeModal == "provinsi"){
                delete query.url
                delete query.branchId
            }
            else{
                delete query.provinceId
                query.branchId = query.branchId.toString()
            }

          
            const result = await postJSON('/masterData/point/'+props.typeModal+'/'+url, query, appContext.authData.token)
            
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
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: (props.data?.id ? 'Ubah ' : 'Tambah ')+props.typeModal,
                closeModal: props.closeModal
            }}
            >
                {
                    props.typeModal == "provinsi" && (
                        <Input
                        withMargin
                        title={"Provinsi"}
                        placeholder={'Masukan Provinsi'}
                        value={_form.provinceName}
                        onChange={(value) => {
                            _updateQuery({
                                "provinceName": value
                            })
                        }}
                        />
                    )
                }
                

                {
                    props.typeModal == "wilayah" && (

                        <>
                            <Input
                            withMargin
                            title={"Provinsi"}
                            placeholder={'Pilih Provinsi'}
                            value={_form.province.title}
                            suggestions={_provinceRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _getCity(value)
                                _updateQuery({
                                    "province": value,
                                    "provinceId": value.value
                                })
                            }}
                            />

                            <Input
                            withMargin
                            title={"Wilayah"}
                            placeholder={'Masukan Wilayah'}
                            value={_form.name}
                            onChange={(value) => {
                                _updateQuery({
                                    "name": value
                                })
                            }}
                            />
                        </>
                    )
                }

                {
                    props.typeModal == "lokasi" && (
                        <>

                            <Input
                            withMargin
                            title={"Cabang"}
                            placeholder={'Pilih Cabang'}
                            value={_form.branchName}
                            suggestions={_branchRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "branchId": `${value.value}`,
                                    "branchName": value.title
                                })
                            }}
                            />

                        <Input
                        withMargin
                        title={"Provinsi"}
                        placeholder={'Pilih Provinsi'}
                        value={_form.province.title}
                        suggestions={_provinceRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(value) => {
                            _getCity(value)
                            _updateQuery({
                                "province": value,
                                "provinceId": value.value
                            })
                        }}
                        />
                        
                        <Input
                        withMargin
                        title={"Wilayah"}
                        placeholder={'Pilih Wilayah'}
                        value={_form.city.title}
                        suggestions={_cityRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(data) => {
                            _updateQuery({
                                "cityId": data.value,
                                "city": data
                            })
                        }}
                        />
                
                        <SelectArea
                        title={"Special Regions"}
                        onSelect={(data) => {
                            _updateSpecialRegion(data, true)
                        }}
                        select={_specialRegion}
                        />

                        <Input
                        withMargin
                        title={""}
                        placeholder={'Pilih Special Regions'}
                        value={_form.specialRegionsInput.title}
                        suggestions={_cityRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(data) => {
                            _updateSpecialRegion(data)
                            return false
                        }}
                        />

                        <Input
                        withMargin
                        title={"Lokasi"}
                        placeholder={'Pool Damri Bandung'}
                        value={_form.name}
                        onChange={(value) => {
                            _updateQuery({
                                "name": value
                            })
                        }}
                        />

                        <Input
                        withMargin
                        title={"Kode Lokasi"}
                        placeholder={'PDB'}
                        value={_form.damriCode}
                        onChange={(value) => {
                            _updateQuery({
                                "damriCode": value
                            })
                        }}
                        />

                        <Input
                        withMargin
                        title={"Alamat Lokasi"}
                        placeholder={'Nama Jalan, No, Kecamatan dll'}
                        value={_form.address}
                        multiline={3}
                        onChange={(value) => {
                            _updateQuery({
                                "address": value
                            })
                        }}
                        />
                
                        <p className={styles.title}>Koordinat</p>

                        <Row>
                            <Col
                            column={3}
                            mobileFullWidth
                            >

                                <Input
                                withMargin
                                placeholder={'Longitude'}
                                value={_form.longitude}
                                onChange={(value) => {
                                    _updateQuery({
                                        "longitude": value
                                    })
                                }}
                                />
                            </Col>

                            <Col
                            column={3}
                            mobileFullWidth
                            >
                                <Input
                                withMargin
                                placeholder={'Latitude'}
                                value={_form.latitude}
                                onChange={(value) => {
                                    _updateQuery({
                                        "latitude": value
                                    })
                                }}
                                />
                            </Col>
                        </Row>

                        <Input
                        withMargin
                        multiline={4}
                        title={"URL Map"}
                        placeholder={'https://goo.gl/maps/xxxx'}
                        value={_form.url}
                        onChange={(value) => {
                            _updateQuery({
                                "url": value
                            })
                        }}
                        />

                        </>
                    )
                }

                <div 
                className={generateClasses([
                    styles.buttonContainer,
                    props.typeModal == "provinsi" && styles.mtProvince
                ])}>
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
