import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { useEffect, useState, useContext } from 'react'
import styles from './CounterTrajectModal.module.scss'
import Button from '../Button'
import { postJSON } from '../../api/utils'
import AppContext from '../../context/app'
import { popAlert } from '../Main'
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
        "trajectId": "",
        "counterId": router.query.counter,
        "traject": {
            "title": ""
        },
        "segment": {
            "title": "Pemadumoda",
            "value": "COMMUTER",
        }
    }
    const [_form, _setForm] = useState(FORM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_trajectRanges, _setTrajectRanges] = useState([]);
    const [_segmentRanges, _setSegmentRanges] = useState([
        {
            "title": "Pemadumoda",
            "value": "COMMUTER"
        },
        {
            "title": "AKAP",
            "value": "INTERCITY"
        }
    ])

    useEffect(() => {
        _getTraject()        
    }, [_form.segment])

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _getTraject() {
        const params = {
            "startFrom": 0,
            "length": 400,
            "companyId": appContext.authData.companyId,
            "categoryName": _form.segment.value
        }
        
        try {
            const traject = await postJSON(`/masterData/trayek/list`, params, appContext.authData.token)
            let trajectRange = [];
            traject.data.forEach(function(val, key){
                trajectRange.push({
                    "title": val.name,
                    "value": val.id
                })
            })
            _setTrajectRanges(trajectRange)
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

            delete query.traject
            delete query.segment

            const result = await postJSON('/masterData/counter/trayek/add', query, appContext.authData.token)
            
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

    return (
        <Modal
        large
        visible={props.visible}
        centeredContent
        >
            <ModalContent
            header={{
                title: 'Tambah Trayek',
                closeModal: props.closeModal
            }}
            >

                <Input
                withMargin
                title={"Segmentasi"}
                placeholder={'Pilih Segmentasi'}
                value={_form.segment.title}
                suggestions={_segmentRanges}
                suggestionField={'title'}
                onSuggestionSelect={(value) => {
                    _updateQuery({
                        "segment": value
                    })
                }}
                />

                <Input
                withMargin
                title={"Trayek"}
                placeholder={'Pilih Trayek'}
                value={_form.traject.title}
                suggestions={_trajectRanges}
                suggestionField={'title'}
                onSuggestionSelect={(value) => {
                    _updateQuery({
                        "trajectId": value.value,
                        "traject": value
                    })
                }}
                />

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
