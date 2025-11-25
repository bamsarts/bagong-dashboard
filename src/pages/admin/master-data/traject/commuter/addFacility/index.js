import { useEffect, useState } from 'react'

import { postJSON, get } from '../../../../../../api/utils'

import Main, { popAlert } from '../../../../../../components/Main'
import AdminLayout from '../../../../../../components/AdminLayout'
import Card from '../../../../../../components/Card'
import { Row, Col } from '../../../../../../components/Layout'
import Button from '../../../../../../components/Button'
import Input from '../../../../../../components/Input'
import styles from '../addTraject/AddTraject.module.scss'
import { BsChevronLeft, BsXLg, BsChevronRight, BsArrowRight, BsFillPencilFill, BsFillArchiveFill } from 'react-icons/bs'
import { useRouter } from 'next/router'
import SwitchButton from '../../../../../../components/SwitchButton'
import Link from 'next/link'
import generateClasses from '../../../../../../utils/generateClasses'
import ConfirmationModal from '../../../../../../components/ConfirmationModal'

export default function AddFacility(props) {
    const router = useRouter()
   
    const [_busCategoryRange, _setBusCategoryRange] = useState({
        title: "",
        value: ""
    })

    const CONFIG_PARAM = {
        "bus_category_id": "",
        "bus_facility_id": "",
        "traject_id": router.query.traject,
        "bus_category_name": ""
    }

    const [_form, _setForm] = useState(CONFIG_PARAM) 
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_traject, _setTraject] = useState({
        "name": "",
        "code": "",
        "poolName": "",
        "trajectTypeName": ""
    })

    const [_facilityRanges, _setFacilityRanges] = useState([])
    const [_allBusCategory, _setAllBusCategory] = useState([])
    
    useEffect(() => {
        _getBusCategory()
        _getTraject()
    }, [])  

    async function _getTraject() {
        const params = {
            startFrom : 0,
            length : 1,
            query: router.query.code
        }

        try {
            const traject = await postJSON('/masterData/trayek/list', params, props.authData.token)
            
            if(traject.data.length > 0){
                _setTraject(traject.data[0])
            }
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    const filterDuplicates = (arr, key) => {
        const values = new Set();
        return arr.filter((item) => {
          const value = item[key];
          if (values.has(value)) {
            return false;
          }
          values.add(value);
          return true;
        });
    };

    async function _getBusCategory() {
        const params = {
            startFrom : 0,
            length : 470,
        }
        try {
            const bus = await postJSON('/masterData/bus/kategori/list', params, props.authData.token)

            _setBusCategoryRange(filterDuplicates(bus.data, "name"))
            _setAllBusCategory(bus.data)

        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

    async function _updateQuery(data = {}, type = null){

        if(type == null){
            _setForm(oldQuery => {
                return {
                    ...oldQuery,
                    ...data
                }
            })
        }else{
            let facility = _facilityRanges
            facility[data].status = !facility[data].status
            _setFacilityRanges(oldQuery => {
                return [
                    ...oldQuery
                ]
            })
        }
        
    }
    
    async function _submitData(){
        _setIsProcessing(true)

        for(const item of _allBusCategory){

            if(item.name == _form.bus_category_name){
                try{
                    let query = {
                        ..._form
                    }
        
                    let facility = []
        
                    _facilityRanges.forEach(function(val, key){
                        if(val.status){
                            facility.push(val.id)
                        }
                    })
        
                    query.traject_id = router.query.traject
                    query.bus_facility_id = facility.toString()
                    query.bus_category_id = item.id

                    delete query.bus_category_name
                    
                    const result = await postJSON('/masterData/bus/kategori/fasilitas/traject/add', query, props.authData.token)
                    
                    if(result){
                        popAlert({"message": "Berhasil disimpan "+item.code, "type": "success"})
                    
                    }
                   
                    
                } catch(e){
                    popAlert({ message : e.message })       
                } finally{
                }
            }
           
        }

        _setIsProcessing(false)
        _getFacility()

        
    }

    async function _getFacility(){
        try {
            const facility = await get('/masterData/bus/kategori/fasilitas/'+_form.bus_category_id+"/"+router.query.traject, props.authData.token)
            _setFacilityRanges(facility.data)
        } catch (e) {
            popAlert({ message : e.message })
        } 
    }

   
    useEffect(() => {
        console.log(_form)
    }, [_form])

    return (
        <Main>

            <AdminLayout
            headerContent={
                <div className={styles.header_content}>
                    <div>
                        <a href="/admin/master-data/traject/commuter/">
                            <BsChevronLeft/>
                        </a>
                        <strong>Ubah Fasilitas</strong>
                    </div>
                </div>
            }
            >
                <Card>
                    <Row>
                        
                        <Col
                        withPadding
                        column={2}
                        >   
                            <div
                            className={styles.head_traject}
                            >
                                <span>Nama Trayek</span>
                                <strong>{_traject.name}</strong>
                            </div>
                        </Col>

                        <Col
                        withPadding
                        column={2}
                        >   
                            <div
                            className={styles.head_traject}
                            >
                                
                                <Input
                                marginBottom
                                title={"Kategori Bis"}
                                placeholder={'Pilih Kategori'}
                                value={_form.bus_category_name}
                                suggestions={_busCategoryRange}
                                suggestionField={'name'}
                                onSuggestionSelect={(data) => {
                                   
                                    _updateQuery({
                                        "bus_category_name": data.name,
                                        "bus_category_id": data.id,
                                    })
                                }}
                                />
                            </div>
                        </Col>

                        <Col
                        withPadding
                        column={2}
                        justifyCenter
                        >   
                            <div
                            className={styles.head_traject}
                            >
                                <Button
                                title={'Terapkan'}
                                styles={Button.primary}
                                onClick={_getFacility}
                                onProcess={_isProcessing}
                                />  

                            </div>
                        </Col>
                      
  
                    </Row>
                </Card>
                
                {
                    _facilityRanges.length > 0 && (
                        <Card>    
                            <Row>   
                                                    
                                <Col
                                column={3}
                                withPadding
                                mobileFullWidth
                                >
                                    <h5>Fasilitas</h5>

                                    {
                                        _facilityRanges.map(function(val, key){
                                            return (
                                                <Row
                                                spaceBetween
                                                withPadding
                                                >
                                                    <div
                                                    style={{"display": "grid"}}
                                                    >
                                                        <img
                                                        style={{"margin": "auto"}}
                                                        src={val.link+"?option=thumbnail&size=10"} 
                                                        width="50" 
                                                        height="50"
                                                        />
                                                    </div>

                                                    <span>{val.name}</span>

                                                    <SwitchButton
                                                    checked={val.status}
                                                    onClick={() => {
                                                        _updateQuery(key, "update-facility")
                                                    }}
                                                    />
                                                </Row>
                                            )
                                        })
                                    }

                                </Col>
                            </Row>
                            
                            <Row>
                                <Col
                                column={1}
                                >
                                    <Button
                                    title={'Simpan'}
                                    styles={Button.primary}
                                    onClick={_submitData}
                                    onProcess={_isProcessing}
                                    />  
                                </Col>
                            
                            </Row>
                            
                        </Card>
                    )
                }

                
            </AdminLayout>
        </Main>
    )

}