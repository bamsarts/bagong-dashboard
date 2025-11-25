import { useEffect, useState, useContext} from 'react'
import Modal, { ModalContent } from '../Modal'
import Input from '../Input'
import { popAlert } from '../Main'
import styles from './AccessRoleModal.module.scss'
import Button from '../Button'
import { postJSON, postFormData } from '../../api/utils'
import AppContext from '../../context/app'
import generateClasses from '../../utils/generateClasses'
import Label from '../Label'
import { useRouter } from 'next/router'
import Table from '../Table'

const defaultProps = {
    visible: false,
    closeModal: null,
    data: {},
    onSuccess: () => null,
    isUserRole: false,
    users: [],
    isMenuAccess: false,
    menuAccessExisting: {}
}

AccessRoleModal.defaultProps = defaultProps

export default function AccessRoleModal(props = defaultProps){
    const router = useRouter()
    const _pathArray = router.asPath.split("/")

    const CONFIG_PARAM = {
        "namaGroup": ""
    }

    const CONFIG_PARAM_USER = {
        "userName": "",
        "idUser": "",
    }

    const [_formUser, _setFormUser] = useState(CONFIG_PARAM_USER)
    const [_form, _setForm] = useState(CONFIG_PARAM)
    const [_isProcessing, _setIsProcessing] = useState(false)
    const appContext = useContext(AppContext)
    const titleModalAccessRole = props.data.id ? 'Ubah Role Akses' : 'Tambah Role Akses'
    const titleModalUserRole = props.data.id ? 'Ubah User' : 'Tambah User'
    const [_menuRange, _setMenuRange] = useState([])
    
    const _handleChecked = (position, field, check) => {
       
        let updateMenu = []

        _menuRange.forEach(function(val, key){
            if(key == position){
                val[field] = check ? false : true
            }
            updateMenu.push(val)
        })

        _setMenuRange(updateMenu);
    }

    useEffect(() => {
        // menuAccessExisting
        _setMenuRange(props.menuAccessExisting.accessData)
        _setForm(props.menuAccessExisting)
    }, [props.menuAccessExisting])

    useEffect(() => {
        _setMenuRange(props.menuAccessExisting.accessData)
    }, [])

    const __COLUMNS_MENU = [
        {
            title : 'Menu',
            field : 'menu',
            textAlign: 'left'
        },
        {
            title : 'Tambah',
            field : 'addRole',
            customCell : (val, row, key) => {
                return <Input
                type={"checkbox"}
                checked={_menuRange[key].addRole}
                value={"addRole"}
                onChange={(value) => {
                    _handleChecked(key, value, _menuRange[key].addRole)
                }}
                />
            }
        },
        {
            title : 'Ubah',
            field : 'updateRole',
            customCell : (val, row, key) => {
                return <Input
                type={"checkbox"}
                checked={_menuRange[key].updateRole}
                value={"updateRole"}
                onChange={(value) => {
                    _handleChecked(key, value, _menuRange[key].updateRole)
                }}
                />
            }
        },
        {
            title : 'Lihat',
            field : 'viewRole',
            customCell : (val, row, key) => {
                return <Input
                type={"checkbox"}
                checked={_menuRange[key].viewRole}
                value={"viewRole"}
                onChange={(value) => {
                    _handleChecked(key, value, _menuRange[key].viewRole)
                }}
                />
            }
        },
        {
            title : 'Hapus',
            field : 'deleteRole',
            customCell : (val, row, key) => {
                return <Input
                type={"checkbox"}
                checked={_menuRange[key].deleteRole}
                value={"deleteRole"}
                onChange={(value) => {
                    _handleChecked(key, value, _menuRange[key].deleteRole)
                }}
                />
            }
        }
    ]

    function _clearForm(){
        _setForm(CONFIG_PARAM)
        _setFormUser(CONFIG_PARAM_USER)
    }

    function _updateQuery(data = {}){
        _setForm(oldQuery => {
            return {
                ...oldQuery,
                ...data
            }
        })
    }

    async function _submitRole(){
        
        delete _form.failCount
        delete _form.id
        delete _form.lastLogin
        
        for(const prop in _form){
            if(_form[prop] == ""){
                popAlert({"message": "Semua form wajib terisi"})
                return false
            }
        }
        
        _setIsProcessing(true)

        try{
            let query  = {
                ..._form
            }

            let typeSubmit = 'add'
            let accessMenu = []
            let resultMessage = 'Berhasil ditambahkan'

            if(props.isMenuAccess){
                typeSubmit = "update"
                resultMessage = "Berhasil diubah"
                _menuRange.forEach(function(val, key){
                    accessMenu.push({
                        idAccessModuleData: val.idAccessModuleData,
                        addRole: val.addRole,
                        updateRole: val.updateRole,
                        viewRole: val.viewRole,
                        deleteRole: val.deleteRole
                    })
                })
                query.accessModuleData = accessMenu
                delete query.accessData
                delete query.kodeGroup
            }

            const result = await postJSON('/masterData/userRoleAkses/aksesModulGrup/'+typeSubmit, query, appContext.authData.token)
            
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": resultMessage, "type": "success"})
            props.onSuccess()
        } catch(e){
            popAlert({ message : e.message })       
        } finally{
            _setIsProcessing(false)
        }
    }

    async function _submitUser(){
            
        delete _formUser.userName
        
        for(const prop in _formUser){
            if(_formUser[prop] == ""){
                popAlert({"message": "Semua form wajib terisi"})
                return false
            }
        }

        let query  = {
            ..._formUser,
            "idAccessModuleGroup": _pathArray[5]
        }
        
        _setIsProcessing(true)

        try{
            
            const result = await postJSON('/masterData/userRoleAkses/aksesModulGrup/userAdd', query, appContext.authData.token)
            
            if(result) props.closeModal()
            _clearForm()
            popAlert({"message": "Berhasil ditambahkan", "type": "success"})
            props.onSuccess()
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
                title: props.isUserRole ? titleModalUserRole : titleModalAccessRole,
                closeModal: () => {
                    props.closeModal()
                    _clearForm()
                },
            }}
            >
                {
                    (!props.isUserRole) && (
                        <Input
                        withMargin
                        title={"Nama Role"}
                        placeholder={'ADMIN'}
                        value={_form.namaGroup}
                        onChange={(value) => {
                            _updateQuery({
                                "namaGroup": value
                            })
                        }}
                        />
                    )
                }

                {
                    props.isUserRole && (
                        <div
                        className={styles.marginbottom_xl}
                        >
                            <Input
                            withMargin
                            title={"Nama User"}
                            placeholder={'Nama User'}
                            value={_formUser.userName}
                            suggestions={props.users}
                            suggestionField={'title'}
                            onSuggestionSelect={(value) => {
                                _setFormUser(oldQuery => {
                                    return {
                                        userName: value.title,
                                        idUser: value.value
                                    }
                                })
                            }}
                            />
                        </div>   
                    )
                }
               
                {
                    !props.isMenuAccess && (
                        
                        <div className={styles.container}>

                            {/* for access role */}
                            {
                                (!props.data.idAccessModuleGroup && !props.isUserRole) && (
                                    <Button
                                    title={'Tambahkan'}
                                    styles={Button.secondary}
                                    onClick={_submitRole}
                                    onProcess={_isProcessing}
                                    />
                                )
                            }

                            {
                                props.data.idAccessModuleGroup && (
                                    <Button
                                    title={'Simpan Perubahan'}
                                    styles={Button.secondary}
                                    onClick={_submitRole}
                                    onProcess={_isProcessing}
                                    />
                                )
                            }

                            {/* for user by role */}
                            {
                                props.isUserRole && (
                                    <Button
                                    title={'Tambahkan'}
                                    styles={Button.secondary}
                                    onClick={_submitUser}
                                    onProcess={_isProcessing}
                                    />
                                )
                            }

                        </div>
                    )
                }

                {
                    props.isMenuAccess && (
                        <>
                            <Table
                            columns={__COLUMNS_MENU}
                            records={_menuRange}
                            />

                            <Button
                            title={'Simpan'}
                            styles={Button.secondary}
                            onClick={_submitRole}
                            onProcess={_isProcessing}
                            />
                        </>
                    )
                }
                
            </ModalContent>
            
        </Modal>
    )
}