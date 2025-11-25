import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import { Row, Col } from '../Layout'
import styles from './CounterUserTrajectModal.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
import SelectArea from '../SelectArea'
import { useRouter } from 'next/router'

const defaultProps = {
    visible : false,
    closeModal : null,
    data: {}
}

CounterUserTrajectModal.defaultProps = defaultProps

export default function CounterUserTrajectModal(props = defaultProps) {

    const router = useRouter()

    const appContext = useContext(AppContext)
    const FORM = {
        "counterId": router.query.counter,
        "userId": "",
        "isView": false,
        "isAdd": false,
        "isCancel": false,
        "isReschedule": false,
        "counter": {
            "title": ""
        }
    }
    const [_form, _setForm] = useState(FORM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_userRanges, _setUserRanges] = useState([]);
    const [_isView, _setIsView] = useState(false)
    const [_isAdd, _setIsAdd] = useState(false)
    const [_isCancel, _setIsCancel] = useState(false)
    const [_isReschedule, _setIsReschedule] = useState(false)

    useEffect(() => {
        _getUser()        
    }, [])

    useEffect(() => {
        if(props.data?.id){
            _setForm({
                ...props.data,
                "isView": props.data.isVew
            })

            _setIsAdd(props.data.isAdd)
            _setIsCancel(props.data.isCancel)
            _setIsReschedule(props.data.isReschedule)
            _setIsView(props.data.isVew)
        
        }else{
            _setIsAdd(false)
            _setIsCancel(false)
            _setIsReschedule(false)
            _setIsView(false)
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

    async function _getUserBranchAdmin(userCounter){
        const params = {
            "startFrom": 0,
            "length": 310,
            "role_id": 10
        }
        
        try {
            const user = await postJSON(`/masterData/userRoleAkses/user/list`, params, appContext.authData.token)
            let userRange = [...userCounter];

            user.data.forEach(function(val, key){
                userRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setUserRanges(userRange)
        } catch (e) {
            console.log(e)
        }
    }

    async function _getUser() {
        const params = {
            "startFrom": 0,
            "length": 570,
            "role_id": 9
        }
        
        try {
            const user = await postJSON(`/masterData/userRoleAkses/user/list`, params, appContext.authData.token)
            let userRange = [];
            user.data.forEach(function(val, key){
                userRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })

            _getUserBranchAdmin(userRange)
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

            if(props.data?.id){
                url = "update"
            }else{
                delete query.id
            }

            delete query.isVew
            delete query.userName
            delete query.counterName
            query.counterId = router.query.counter
            if(!query.isCancel) query.isCancel = false
            if(!query.isReschedule) query.isReschedule = false

            delete query.counter

            const result = await postJSON('/masterData/counter/user/'+url, query, appContext.authData.token)
            
            if(result) props.closeModal()
            _setForm(FORM)
            popAlert({"message": "Berhasil disimpan", "type": "success"})
            props.onSuccess()
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    const handleChange = (param) => {
        _updateQuery({
            param: !_checked[param]
        })
    };

    return (
        <Modal
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: (props.data?.id ? 'Ubah' : 'Tambah') + ' Petugas',
                closeModal: props.closeModal
            }}
            >
                {
                    !props.data?.id && (
                        <Input
                        withMargin
                        title={"Petugas"}
                        placeholder={'Pilih Petugas'}
                        value={_form.counter?.title}
                        suggestions={_userRanges}
                        suggestionField={'title'}
                        onSuggestionSelect={(value) => {
                            _updateQuery({
                                "userId": value.value,
                                "counter": value
                            })
                        }}
                        />
                    )
                }
                
                <div className={styles.container}>
                    <strong>Hak Akses</strong>
                </div>

                <Row>
                    <Col
                    column={1}
                    >
                        <Input
                        withMargin
                        title={"Lihat"}
                        type={"checkbox"}
                        checked={_isView}
                        value={_form.isView}
                        onChange={(value) => {
                            _setIsView(!_isView)
                            _updateQuery({
                                isView: !_isView
                            })
                        }}
                        />
                    </Col>

                    <Col
                    column={1}
                    >
                        <Input
                        withMargin
                        title={"Tambah"}
                        type={"checkbox"}
                        checked={_isAdd}
                        value={_form.isAdd}
                        onChange={(value) => {
                            _setIsAdd(!_isAdd)
                            _updateQuery({
                                isAdd: !_isAdd
                            })
                        }}
                        />
                    </Col>

                    <Col
                    column={1}
                    >
                        <Input
                        withMargin
                        title={"Cancel"}
                        type={"checkbox"}
                        checked={_isCancel}
                        value={_form.isCancel}
                        onChange={(value) => {
                            _setIsCancel(!_isCancel)
                            _updateQuery({
                                isCancel: !_isCancel
                            })
                        }}
                        />
                    </Col>

                    <Col
                    column={2}
                    >
                        <Input
                        withMargin
                        title={"Reschedule"}
                        type={"checkbox"}
                        checked={_isReschedule}
                        value={_form.isReschedule}
                        onChange={(value) => {
                            _setIsReschedule(!_isReschedule)
                            _updateQuery({
                                isReschedule: !_isReschedule
                            })
                        }}
                        />
                    </Col>
                </Row>

                <div className={styles.container}>
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
