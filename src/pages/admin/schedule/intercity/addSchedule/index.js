import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import Button from '../../../../../components/Button'
import Tabs from '../../../../../components/Tabs'
import { Col, Row } from '../../../../../components/Layout'
import throttle from '../../../../../utils/throttle'
import PointModal from '../../../../../components/PointModal'
import styles from '../Intercity.module.scss'
import { AiFillEye, AiFillDelete, AiOutlinePlus, AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'
import generateClasses from '../../../../../utils/generateClasses'
import ConfirmationModal from '../../../../../components/ConfirmationModal'
import Calendar from '../../../../../components/Calendar'
import ScheduleModal from '../../../../../components/ScheduleModal'
import Link from 'next/link'

export default function AddSchedule(props) {

    const [_templateScheduleLists, _setTemplateScheduleLists] = useState([])

    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_dataSchedule, _setDataSchedule] = useState({})
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_branchRanges, _setBranchRanges] = useState([]);
    const [_segmentRanges, _setSegmentRanges] = useState([]);
    const [_trajectRanges, _setTrajectRanges] = useState([]);
    const [_isEmpty, _setIsEmpty] = useState(false)

    const CONFIG_PARAM = {
        "name": "",
        "branchId": "",
        "branchName": "Semua Cabang",
        "segmentId": "",
        "segmentName": "Semua Segmentasi",
        "trajectMasterId": "",
        "trajectMasterName": "Semua Trayek",
    }
    const [_form, _setForm] = useState(CONFIG_PARAM)

    useEffect(() => {   
        _getData()
        _getBranch()
        _getSegment()
    }, [])

    useEffect(() => {
        if(_form.segmentId != ""){
            _getTrajectMaster()
        }
    }, [_form.segmentId])

    async function _getData(query = _searchQuery) {
        _setIsProcessing(true)
        const params = {
            "orderBy": "id",
            "sortMode": "desc",
            "startFrom": 0,
            "length": 390
        }

        if (query) params.query = query
        if (_form.branchId != "") params.branchId = `${_form.branchId}`
        if (_form.segmentId != "") params.trajectTypeId = `${_form.segmentId}`
        if (_form.trajectMasterId != "") params.trajectMasterId = `${_form.trajectMasterId}`

        try {
            const scheduleTemplate = await postJSON('/masterData/jadwal/template/list', params, props.authData.token)
            // let filteredSchedule = []

            // scheduleTemplate.data.forEach(function(val, key){
            //     if(val.trajectTypeCategory == "INTERCITY"){
            //         filteredSchedule.push(val)
            //     }
            // })

            _setTemplateScheduleLists(scheduleTemplate.data)
           
            _setIsProcessing(false)

            if(scheduleTemplate.data == 0){
                _setIsEmpty(true)
            }
        } catch (e) {
            popAlert({ message : e.message })
            _setIsProcessing(false)
        }
    }

    async function _getBranch() {
        const params = {
            "startFrom": 0,
            "length": 300
        }
        
        try {
            const branch = await postJSON(`/masterData/branch/list`, params, props.authData.token)
            let branchRange = [];
            branch.data.forEach(function(val, key){

                if(key == 0){
                    branchRange.push({
                        "title": "Semua Cabang",
                        "value": ""
                    })      
                }

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

    async function _getSegment() {
        const params = {
            "startFrom": 0,
            "length": 300
        }
        
        try {
            const segments = await postJSON(`/masterData/trayekType/list`, params, props.authData.token)
            let segmentRange = [];
            segments.data.forEach(function(val, key){

                if(key == 0){
                    segmentRange.push({
                        "title": "Semua Segmentasi",
                        "value": ""
                    })        
                }

                if(val.category == "INTERCITY"){
                    segmentRange.push({
                        "title": val.code,
                        "value": val.id
                    })
                }
                
            })
            _setSegmentRanges(segmentRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getTrajectMaster(){
        const params = {
            "startFrom": 0,
            "length": 390,
            "trajectTypeId": _form.segmentId
        }
        
        try {
            const traject = await postJSON(`/masterData/trayekMaster/list`, params, props.authData.token)
            let trajectRange = [];
            
            traject.data.forEach(function(val, key){

                if(key == 0){
                    trajectRange.push({
                        "title": "Semua Trayek",
                        "value": ""
                    })
                }

                trajectRange.push({
                    "title": val.name+" ("+val.code+")",
                    "value": val.id
                })
            })

            _setTrajectRanges(trajectRange)
        } catch (e) {
            console.log(e)
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


    return (
        <Main>
            <ScheduleModal
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)
                _setDataSchedule({})
            }}
            data={_dataSchedule}
            onSuccess={() => {
                _setIsOpenModal(false)
            }}
            />

        
            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <Link
                    legacyBehavior
                    href={"/admin/schedule/intercity"}
                    >
                        {/* <a href="#"> */}
                            <AiOutlineLeft />
                        {/* </a>  */}
                    </Link>
                    <aside>
                        Tambah Jadwal
                    </aside>
                </div>
            }
            >  

                <Card
                noPadding
                >
                    <Row
                    withPadding
                    >
                        <Col
                        column={1}
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
                        </Col>

                        <Col
                        column={2}
                        >
                            <Input
                            withMargin
                            title={"Segmentasi"}
                            placeholder={'Pilih Segmentasi'}
                            value={_form.segmentName}
                            suggestions={_segmentRanges}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _updateQuery({
                                    "segmentId": value.value,
                                    "segmentName": value.title
                                })
                            }}
                            />
                        </Col>
                        
                        {
                            _form.segmentId != "" && (
                                <Col
                                column={2}
                                >
                                    <Input
                                    withMargin
                                    title={"Trayek"}
                                    placeholder={'Pilih Trayek'}
                                    value={_form.trajectMasterName}
                                    suggestions={_trajectRanges}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _updateQuery({
                                            "trajectMasterId": value.value,
                                            "trajectMasterName": value.title
                                        })
                                    }}
                                    />
                                </Col>
                            )
                        }

            
                        <Col
                        column={1}
                        withPadding
                        justifyCenter
                        >
                            <Button
                            title={'Cari Jadwal'}
                            styles={Button.secondary}
                            onClick={() => {
                                _getData()
                            }}
                            small
                            />
                        </Col>
                    </Row>
                </Card>

                <Card
                noPadding
                >
                    {
                        _templateScheduleLists.length > 0 && (
                       
                            _templateScheduleLists.map((item, key) => {
                                return (
                                    <Row
                                    key={key}
                                    className={generateClasses([
                                        styles.schedule,
                                    ])}
                                    verticalCenter
                                    >
                                        <Col
                                        column={1}
                                        mobileFullWidth
                                        >
                                            <small>Kode Jadwal</small>
                                            <div
                                            style={{
                                                "display": "grid"
                                            }}
                                            >
                                                <strong>{item.code}</strong>
                                            </div>
                                        </Col>

                                        <Col
                                        column={2}
                                        mobileFullWidth
                                        >
                                            <small>Trayek</small>
                                            <div
                                            style={{
                                                "display": "grid"
                                            }}
                                            >
                                                <strong>{item.trajectMasterCode}</strong>
                                                <strong>{item.trajectMasterName}</strong>
                                            </div>
                                        </Col>

                                        <Col
                                        column={1}
                                        mobileFullWidth
                                        >
                                            <small>Arah Trip</small>
                                            <div
                                            style={{
                                                "marginTop": ".5rem"
                                            }}
                                            >
                                                <span
                                                style={{
                                                    "fontSize": ".7rem"
                                                }}
                                                className={generateClasses([
                                                    styles.label,
                                                    item.isPulang ? styles.warning : styles.primary  
                                                ])}
                                                >
                                                    {item.isPulang ? 'Pulang' : 'Pergi'}
                                                </span>
                                            </div>

                                           
                                        </Col>

                                        <Col
                                        column={1}
                                        mobileFullWidth
                                        >
                                            <small>Bis</small>
                                            <div
                                            style={{
                                                "display": "grid"
                                            }}
                                            >
                                                <strong>{item.busCategoryName}</strong>
                                                <strong>{item.busCategoryCode}</strong>
                                            </div>
                                        </Col>
                                        
                                        <Col
                                        column={1}
                                        mobileFullWidth
                                        justifyEnd
                                        >
                                            <Button
                                            iconRight={<AiOutlineRight/>}
                                            title={'Buat Jadwal'}
                                            styles={Button.primary}
                                            onClick={() => {
                                                _setIsOpenModal(true)
                                                _setDataSchedule(item)
                                            }}
                                            small
                                            />
                                        </Col>

                                    </Row>
                                )
                            })

                        )
                    }

                    {
                        (_isEmpty) && (
                            <div
                            style={{
                                textAlign: "center"
                            }}
                            >
                                <h4
                                style={{
                                    marginTop: "1rem"
                                }}
                                >
                                    Jadwal tidak tersedia
                                </h4>
                            </div>
                        )
                    }
                    
                </Card>

            </AdminLayout>
        </Main>
    )

}