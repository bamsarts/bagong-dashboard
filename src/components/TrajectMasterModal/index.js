import { useState, useEffect, useContext } from 'react'

import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'

import Input from '../Input'
import { Col, Row } from '../Layout'
import Modal, { ModalContent } from '../Modal'
import Table from '../Table'
import Button from '../Button'
import { popAlert } from '../Main'
import styles from './TrajectMasterModal.module.scss'
import { dateFilter, currency } from '../../utils/filters'

TrajectMasterModal.defaultProps = {
    closeModal : null,
    data: {},
    visible: false
}

export default function TrajectMasterModal(props = TrajectMasterModal.defaultProps) {

    const appContext = useContext(AppContext)

    const [_isProcessing, _setIsProcessing] = useState(false)
    const FORM = {
        code: "",
        name: "",
        branchId: "",
        trajectTypeId: "",
        pulangTrajectId: "",
        pergiTrajectId: "",
        branchName: "",
        trajectTypeName: "",
        pergiTrajectName: "",
        pulangTrajectName: "",
        category: ""
    }
    const [_form, _setForm] = useState(FORM)
    const [_branchRanges, _setBranchRanges] = useState([]);
    const [_segmentRanges, _setSegmentRanges] = useState([]);
    const [_tripRanges, _setTripRanges] = useState([]);

    useEffect(() => {
        if(props.data?.id){
            _updateQuery({
                code: props.data.code,
                name: props.data.name,
                branchId: props.data.branchId,
                trajectTypeId: props.data.trajectTypeId,
                pulangTrajectId: props.data.pulangTrajectId,
                pergiTrajectId: props.data.pergiTrajectId,
                branchName: props.data.branchName,
                trajectTypeName: props.data.trajectTypeName,
                pergiTrajectName: props.data.pergiOriginName+" - "+props.data.pergiDestinationName,
                pulangTrajectName: props.data.pulangOriginName+" - "+props.data.pulangDestinationName,
                category: props.data.trajectTypeCategory,
                id: props.data.id
            })
        }else{
            _updateQuery(FORM)
        }
    }, [props.data])

    async function _submitData() {
        _setIsProcessing(true)

        let urlTarget = "update"
        let query = {
            ..._form
        }

        if(!props.data?.id){
            delete query.id
            urlTarget = "add"
        }

        delete query.branchName
        delete query.category
        delete query.pergiTrajectName
        delete query.pulangTrajectName
        delete query.trajectTypeName
        
        try {
            await postJSON('/masterData/trayekMaster/'+urlTarget, query, appContext.authData.token)

            popAlert({ message : 'Berhasil disimpan', type : 'success' })
            _updateQuery(FORM)
            props.refresh()
        } catch (e) {
            popAlert({ message : e.message })
        } finally {
            _setIsProcessing(false)
        }
    }

    async function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
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

    async function _getSegmentation() {
        const params = {
            "startFrom": 0,
            "length": 300
        }
        
        try {
            const segment = await postJSON(`/masterData/trayekType/list`, params, appContext.authData.token)
            let segmentRange = [];
            segment.data.forEach(function(val, key){
                segmentRange.push({
                    "title": val.name,
                    "value": val.id,
                    ...val
                })
            })
            _setSegmentRanges(segmentRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getTrip(){
        const params = {
            "startFrom": 0,
            "length": 750,
        }
        
        try {
            const trip = await postJSON(`/masterData/trayek/list`, params, appContext.authData.token)
            let tripRange = [];
            trip.data.forEach(function(val, key){
                tripRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setTripRanges(tripRange)
           
        } catch (e) {
            console.log(e)
        }
    }

    useEffect(() => {
        _getBranch()
        _getSegmentation()
        _getTrip()
    }, [])

    return (
        <Modal
        visible={props.visible}
        onBackdropClick={props.closeModal}
        centeredContent
        >
            <ModalContent
            header={{
                title : (props.data?.id ? 'Ubah' : `Tambah`) + " Trayek",
                closeModal : props.closeModal
            }}
            >   
                <form
                style={{
                    position : 'sticky',
                    top : 0,
                    zIndex : 9999,
                    backgroundColor: "#ffff"
                }}
                onSubmit={e => {
                    e.preventDefault()
                    _submitData()
                }}
                action={'.'}
                >
                   
                    <Input
                    withMargin
                    title="Kode Trayek"
                    placeholder='PDG-GBR'
                    onChange={(value) => {
                        _updateQuery({
                            code: value
                        })
                    }}
                    value={_form.code}
                    />

                    <Input
                    withMargin
                    title={"Nama trayek"}
                    placeholder='Padang - Gambir'
                    onChange={(value) => {
                        _updateQuery({
                            name: value
                        })
                    }}
                    value={_form.name}
                    />

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
                    title={"Segmentasi"}
                    placeholder={'Pilih Segmentasi'}
                    value={_form.trajectTypeName}
                    suggestions={_segmentRanges}
                    suggestionField={'title'}
                    onSuggestionSelect={(value) => {
                        _updateQuery({
                            "trajectTypeId": value.value,
                            "trajectTypeName": value.title,
                            "category": value.category
                        })
                    }}
                    />

                    <Input
                    withMargin
                    title={"Trip Pergi"}
                    placeholder={'Pilih Trip'}
                    value={_form.pergiTrajectName}
                    suggestions={_tripRanges}
                    suggestionField={'title'}
                    onSuggestionSelect={(value) => {
                        _updateQuery({
                            "pergiTrajectId": value.value,
                            "pergiTrajectName": value.title
                        })
                    }}
                    />

                    <Input
                    withMargin
                    title={"Trip Pulang"}
                    placeholder={'Pilih Trip'}
                    value={_form.pulangTrajectName}
                    suggestions={_tripRanges}
                    suggestionField={'title'}
                    onSuggestionSelect={(value) => {
                        _updateQuery({
                            "pulangTrajectId": value.value,
                            "pulangTrajectName": value.title
                        })
                    }}
                    />
                    
                    <Col
                    column={2}
                    withPadding
                    style={{"marginTop": "7rem"}}
                    >
                        <Button
                        title={'Simpan'}
                        onClick={_submitData}
                        onProcess={_isProcessing}
                        />
                    </Col>

                </form>
                   

            </ModalContent>
        </Modal>
    )

}