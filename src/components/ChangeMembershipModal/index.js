import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import Table from '../Table'
import AppContext from '../../context/app'
import { Col, Row } from '../Layout'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    membership: [],
    onSuccess: () => null,
}

export default function ChangeMembershipModal(props = defaultProps){

    const appContext = useContext(AppContext)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_formMember, _setFormMember] = useState({
        "memberName": "",
        "memberId": ""
    })
    const [_settingMember, _setSettingMember] = useState([])


    async function _saveMember(){

        _setIsProcessing(true)
        
        const params = {
           ..._formMember
        }

        if(params.phoneNumber == "null") params.phoneNumber = null

        delete params.memberName
        // delete params.phoneNumber

        try {

            const result = await postJSON(`/masterData/userRoleAkses/user/update`, params, appContext.authData.token)
            
            if(result){
                props.onSuccess()
            }

        } catch (e) {
            popAlert({ message : e.message })

        } finally{

            _setIsProcessing(false)
        }
    }

    function _updateQuery(data = {}){
        _setFormMember(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    useEffect(() => {
        if(props.visible){
            let data = []

            for (let x in props.membership){
                data.push({
                    "value": x,
                    "title": props.membership[x]
                })

                if(x == props.data?.memberId){
                    _updateQuery({
                        "memberName": props.membership[x],
                        "memberId": x
                    })
                }
            }

            _setSettingMember(data)
            _updateQuery({
                "email": props.data?.email,
                "phoneNumber": `${props.data?.phoneNumber}`,
                "idUser": props.data?.idUser,
                "name": props.data?.name,
                "isLogin": props.data?.isLogin,
                "isBanned": props.data?.isBanned,
                "roleId": props.data?.roleId
            })

        }

    }, [props.visible])
 
    return (
        <Modal
        visible={props.visible}
        centeredContent
        >

            <ModalContent
            header={{
                title: "Ubah Keanggotaan",
                closeModal: () => {
                    props.closeModal()
                },
            }}
            >

                <Col
                withPadding
                column={3}
                style={{
                    marginBottom: "6rem"
                }}
                >
                    <Input
                    title={"Pilih Keanggotaan"}
                    value={_formMember.memberName}
                    suggestions={_settingMember}
                    suggestionField={'title'}
                    onSuggestionSelect={(value) => {
                        _updateQuery({
                            "memberName": value.title,
                            "memberId": value.value
                        })
                    }}
                    />
                </Col>


                <Col
                withPadding
                column={3}
                >
                    <Button
                    title={'Simpan'}
                    styles={Button.secondary}
                    onClick={() => {
                        _saveMember()
                    }}
                    small
                    />                  
                </Col>

            </ModalContent>

        </Modal>
    )
}