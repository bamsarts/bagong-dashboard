import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import { Row, Col } from '../Layout'
import styles from './CounterModal.module.scss'
import Button from '../Button'
import { clearCache, postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
import SelectArea from '../SelectArea'

const defaultProps = {
    visible : false,
    closeModal : null,
    data: {}
}

CounterModal.defaultProps = defaultProps

export default function CounterModal(props = defaultProps) {

    const appContext = useContext(AppContext)
    const [_form, _setForm] = useState({
        "name": "",
        "address": "",
        "branchId": "",
        "companyId": appContext.authData.companyId,
        "branchName": "",
        "counterTypeId": "",
        "isDeposit": false,
        "isMulti": false,
        "counterTypeName": "",
        "pointId": "",
        "pointName": ""
    })
    
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_branchRanges, _setBranchRanges] = useState([]);
    const [_counterTypeRanges, _setCounterTypeRanges] = useState([
        {
            "title": "Loket",
            "value": 1
        },
        {
            "title": "Kantor Pemasaran",
            "value": 2
        },
        {
            "title": "Agen",
            "value": 3
        }

    ])

    const [_pointRange, _setPointRange] = useState([])
    const [_pointSelected, _setPointSelected] = useState([])

    useEffect(() => {
        _getBranch()    
        _getPoint()       
    }, [])

    useEffect(() => {

        let data = props.data
        let point = []

        if(props.data?.point_id_list){

            props.data.point_id_list.split(",").forEach(function(i, j){
                _pointRange.forEach(function(val, key){
                    if(val.value == i){
                        point.push(val)
                    }
                })
            })
           
        }
       

        delete data.point_id

        _setForm(data)
        _setPointSelected(point)
    }, [props.data])

    useEffect(() => {
        let paramPoint = []

        _pointSelected.forEach(function(val, key){
            paramPoint.push(val.value)
        })

        _updateQuery({
            "pointId": paramPoint.toString()
        })

    }, [_pointSelected])

    const handleChange = (type) => {
        _updateQuery({
            [type]: type == "isDeposit" ? !_form.isDeposit : !_form.isMulti
        })
    };

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
            "branchId": "",
            "companyId": appContext.authData.companyId,
        })
    }

    async function _getPoint() {
        const params = {
            "startFrom": 0,
            "length": 880
        }
        
        try {
            const point = await postJSON(`/masterData/point/lokasi/list`, params, appContext.authData.token)
            let pointRange = [];
            point.data.forEach(function(val, key){
                pointRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setPointRange(pointRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getBranch() {
        const params = {
            "startFrom": 0,
            "length": 230
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

    async function _submitData(url){
        _setIsProcessing(true)
        try{
            let query = {
                ..._form
            }


            const typeUrl = props.data?.companyId ? 'update' : 'add'

            delete query.branchName
            delete query.companyName
            delete query.counterTypeName
            delete query.lastMutation
            delete query.counter
            delete query.pointName
            delete query.point_id_list
            delete query.saldoDePosit

            // for(const property in query){
            //     if(query[property] == "") {
            //         delete query[property]
            //     }
            // }

            if(!query?.pointId) query.pointId = ""

            query.companyId = appContext.authData.companyId

           
            const result = await postJSON('/masterData/counter/'+typeUrl, query, appContext.authData.token)
            
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            props.refresh()
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    function _updatePointSelected(data = {}, isDelete = false){
        let point = [..._pointSelected]
        const index = _pointSelected.indexOf(data)

        if(index < 0 && !isDelete){
            point.push(data)
        }else{
            point.splice(index, 1)
        }

        _setPointSelected(point)
    }

    return (
        <Modal
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: (props.data?.companyId ? 'Ubah' : 'Tambah')+' Counter',
                closeModal: props.closeModal
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

                <SelectArea
                title={"Lokasi"}
                onSelect={(data) => {
                    _updatePointSelected(data, true)
                }}
                select={_pointSelected}
                />

                <Input
                withMargin
                title={""}
                placeholder={'Pilih Lokasi'}
                value={_form.pointName}
                suggestions={_pointRange}
                suggestionField={'title'}
                onSuggestionSelect={(value) => {
                    _updatePointSelected(value)
                    return false
                }}
                />

                <Input
                withMargin
                title={"Jenis"}
                placeholder={'Pilih Jenis'}
                value={_form.counterTypeName}
                suggestions={_counterTypeRanges}
                suggestionField={'title'}
                onSuggestionSelect={(value) => {
                    _updateQuery({
                        "counterTypeId": value.value,
                        "counterTypeName": value.title
                    })
                }}
                />

                <Input
                withMargin
                title={"Nama Counter"}
                placeholder={'Masukan nama'}
                value={_form.name}
                onChange={(value) => {
                    _updateQuery({
                        "name": value
                    })
                }}
                />

                <Input
                withMargin
                multiline={2}
                title={"Alamat"}
                placeholder={'Masukan alamat'}
                value={_form.address}
                onChange={(value) => {
                    _updateQuery({
                        "address": value
                    })
                }}
                />
                <Row>
                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Bisa Topup"}
                        type={"checkbox"}
                        checked={_form.isDeposit}
                        value={_form.isDeposit}
                        onChange={(value) => {
                            handleChange("isDeposit")
                        }}
                        />
                    </Col>

                    <Col
                    column={3}
                    >
                        <Input
                        withMargin
                        title={"Multi Cabang Trayek"}
                        type={"checkbox"}
                        checked={_form.isMulti}
                        value={_form.isMulti}
                        onChange={(value) => {
                            handleChange("isMulti")
                        }}
                        />
                    </Col>
                </Row>
               

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
