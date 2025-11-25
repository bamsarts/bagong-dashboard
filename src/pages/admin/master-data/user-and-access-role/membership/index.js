import { useEffect, useState } from 'react'

import { postJSON } from '../../../../../api/utils'

import Main, { popAlert } from '../../../../../components/Main'
import AdminLayout from '../../../../../components/AdminLayout'
import Card from '../../../../../components/Card'
import Input from '../../../../../components/Input'
import Table from '../../../../../components/Table'
import Tabs from '../../../../../components/Tabs'
import { Col, Row } from '../../../../../components/Layout'
import throttle from '../../../../../utils/throttle'
import Label from '../../../../../components/Label'
import { dateFilter } from '../../../../../utils/filters'
import { compile } from 'sass'
import Button from '../../../../../components/Button'
import SettingMembershipModal from '../../../../../components/SettingMembershipModal'
import ChangeMembershipModal from '../../../../../components/ChangeMembershipModal'
import { getLocalStorage, setLocalStorage } from '../../../../../utils/local-storage'

export default function Membership(props) {

    const [_activeIndex, _setActiveIndex] = useState("2")

    const __COLUMNS_USER = [
        {
            title : 'Nama',
            field : 'name',
            textAlign: "left",
            customCell: (value, row) => {
                return value || row?.full_name
            }
        },
        {
            title : 'Email',
            field : 'email',
            textAlign: "left",
        },
        {
            title : 'Telepon',
            field : 'phoneNumber',
            customCell: (value, row) => {
                return value || row?.phone_number
            }
        },
        {
            title : 'Jenis Kelamin',
            field : 'gender',
            customCell: (value) => {
                if(value == "MALE"){
                    return "Laki-laki"
                }else if(value == "FEMALE"){
                    return 'Perempuan'
                }else{
                    return ''
                }
            }
        },
        {
            title : 'Keanggotaan',
            field : 'memberId',
            customCell: (value, row) => {
            
                return (
                    <Label
                    activeIndex={true}
                    labels={[
                        {
                          "class": 'primary',
                          "title": _membershipCategory[row?.memberId || row?.member_id],
                          "value": true
                        }
                    ]}
                    />
                )
            }
        },
        {
            title : '',
            field : 'id',
            hide: _activeIndex == "eks" ? true : false,
            customCell: (value, row) => {
                
                return (
                    <Button
                    title={'Ubah Keanggotaan'}
                    styles={Button.secondary}
                    onClick={() => {
                        _setSelectedUser(row)
                    }}
                    onProcess={_isProcessing}
                    />
                )
            }
        }
    ]

    const [_userLists, _setUserLists] = useState([])
    const [_roleSelected, _setRoleSelected] = useState({
        "title": "DAMRI Apps",
        "value": "1"
    })

    const [_roleRange, _setRoleRange] = useState([
        {
            "title": "DAMRI Apps",
            "value": "1"
        },
        {
            "title": "Operasional",
            "value": "10"
        }
    ])
    
    let [_paginationConfig, _setPaginationConfig] = useState({
        recordLength: 0,
        recordsPerPage: 0,
        activePage: 1,
        totalPages: 0
    })

    const [_pageUser, _setPageUser] = useState({
        length : Table.defaultProps.recordsPerPageValues[0],
        startFrom : 0
    })
   
    const [_searchQuery, _setSearchQuery] = useState('')
    const [_isProcessing, _setIsProcessing] = useState(false)
    const [_isOpenModal, _setIsOpenModal] = useState(false)
    const [_membershipCategory, _setMembershipCategory] = useState({})
    const [_selectedUser, _setSelectedUser] = useState({})
    const [_settingMember, _setSettingMember] = useState([])
    const [_selectedMembership, _setSelectedMembership] = useState({
        "value": "",
        "title": ""
    })
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const [_memberId, _setMemberId] = useState(1)

    const [_accessMenu, _setAccessMenu] = useState({
        "Master Data>User & Role Akses>User": false,
        "Master Data>User & Role Akses>Keanggotaan": false,
        "Korporasi": false
    })

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(_searchQuery);
          }, 500); // debounce delay (ms)
      
          return () => clearTimeout(handler); // cancel the timeout on value change
    }, [_searchQuery])

    useEffect(() => {
        if(debouncedQuery){
            throttle(() => _getUser(_pageUser, _searchQuery), 3000)()
        }
    }, [debouncedQuery])

    useEffect(() => {

        if (typeof window !== 'undefined') {
            // Perform localStorage action
            
            let storage = getLocalStorage("access_menu_damri")
            
            if( storage == null){
                // window.location.href = "/sign-in"
            }else{
                const item = JSON.parse(storage)
                let access = {}
              
                if(props.role_id != "2"){
                    if(item.length > 0){
                        item.forEach(function(val, idx){
                            for (const menuKey in _accessMenu) {
                                if (val.menu === menuKey) {
                                    access[menuKey] = val.viewRole;
                                }
                            }
                        })
                    }
                }else{
                    for (const menuKey in _accessMenu) {
                        access[menuKey] = true
                    }
                }
               
                _setAccessMenu(access)
                _getMembership()   

            }
        }

    }, [])

    useEffect(() => {
        console.log("menu")
        console.log(_accessMenu)
    }, [_accessMenu])

    useEffect(() => {

        if(_activeIndex == "eks"){
            _getUser(_pageUser, "", true)
        }else{

            if(_accessMenu['Master Data>User & Role Akses>User'] || _accessMenu['Korporasi']){
                _getUser(_pageUser)
            }
        }
    }, [_activeIndex, _memberId, _roleSelected.value])



    function _setPagination(pagination) {
    
        _setPageUser(oldData => {
            return {
                ...oldData,
                ...pagination
            }
        })

        _getUser(pagination, _searchQuery, _activeIndex == "eks" ? true : false)
    }
  
    async function _getUser(pagination, query = '', isExternal = false) {
        const params = {
            ...pagination
        }


        if(!isExternal){
            params.member_id = _memberId
            params.role_id = _roleSelected.value;
        }else{
            params.orderBy = "id"
            params.sortMode = "desc"
        }  
        

        if(query) params.query = query

        if(query != ""){
            params.startFrom = 0
        }

        try {
            let url = "/masterData/userRoleAkses/user/list"

            if(isExternal) url = "/member/data/list"

            const userList = await postJSON(url, params, props.authData.token)
            
            _setUserLists(userList)

            _setPaginationConfig({
                recordLength : userList.totalFiltered,
                recordsPerPage : pagination.length,
                activePage : (pagination.startFrom / pagination.length) + 1,
                totalPages : Math.ceil(userList.totalFiltered / pagination.length)  
            })
        } catch (e) {
            popAlert({ message : e.message })
        }
    }

    async function _getMembership() {
        const params = {
            startFrom: 0,
            length: 320
        }

        try {
           
            const memberList = await postJSON(`/masterData/userRoleAkses/member/list`, params, props.authData.token)
            let data = {}
            let memberFilter = []

            memberList.data.forEach(function(val, key){
                data[val.id] = val.name

                if(val.id == 2){
                    _setSelectedMembership({
                        "value": val.id,
                        "title": val.name
                    })
                }

                if(val.id != 1){
                    memberFilter.push({
                        "value": val.id,
                        "title": val.name
                    })
                }
                
            })

            _setSettingMember(memberFilter)
            _setMembershipCategory(data)

            if(!_accessMenu['Master Data>User & Role Akses>Keanggotaan']){
                // _setActiveIndex("eks")
            }else{
                _getUser(_pageUser)
            }
        } catch (e) {
            popAlert({ message : e.message })
        }
    }


    return (
        <Main>

            <SettingMembershipModal
            type={_activeIndex}
            visible={_isOpenModal}
            closeModal={() => {
                _setIsOpenModal(false)
            }}
            onSuccess={() => {
                _getUser(_pageUser, "", true)
            }}
            />

            <ChangeMembershipModal
            membership={_membershipCategory}
            data={_selectedUser}
            visible={_selectedUser?.idUser}
            closeModal={() => {
                _setSelectedUser({})
            }}
            onSuccess={() => {
                _setSelectedUser({})
                _getUser(_pageUser)
            }}
            />
            
            <AdminLayout
            headerContent={
                <Tabs
                activeIndex={_activeIndex}
                tabs={[
                    {
                        title : 'Publik',
                        value : '1',
                        isHide: props.role_id == "2" ? false : !_accessMenu['Publik'],
                        onClick : () => {
                            _setActiveIndex('1')
                            _setMemberId(1)
                        }
                    },
                    {
                        title : 'Korporasi',
                        value : '2',
                        isHide: props.role_id == "2" ? false : !_accessMenu['Master Data>User & Role Akses>Keanggotaan'],
                        onClick : () => {
                            _setActiveIndex('2')
                            _setMemberId(2)
                        }
                    },
                    {
                        title : 'Eksternal',
                        value : 'eks',
                        isHide: props.role_id == "2" ? false : !_accessMenu['Eksternal'],
                        onClick : () => {
                            _setActiveIndex('eks')
                        }
                    }
                ]}
                />
            }
            >  

        
            <Card
            noPadding
            >
                <Table
                exportToXls={false}
                headerContent={(

                    <Row
                    verticalEnd
                    spaceBetween
                    >

                        {
                            (_activeIndex == "2") && (
                                <Col
                                withPadding
                                column={1}
                                >
                                    <Input
                                    title={"Keanggotaan"}
                                    value={_selectedMembership.title}
                                    suggestions={_settingMember}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _setSelectedMembership({
                                            "title": value.title,
                                            "value": value.value
                                        })

                                        _setMemberId(value.value)
                                    }}
                                    />
                                </Col>
                            )
                        }

                        {
                            (_activeIndex != "eks") && (
                                <Col
                                column={1}
                                mobileFullWidth
                                withPadding
                                >
                                    <Input
                                    title={"Role"}
                                    placeholder={'Pilih ROle'}
                                    value={_roleSelected.title}
                                    suggestions={_roleRange}
                                    suggestionField={'title'}
                                    onSuggestionSelect={(value) => {
                                        _setRoleSelected(value)
                                    }}
                                    />
                                </Col>
                            )
                        }
                        

                        {
                            _activeIndex != "eks" && (
                                <Col
                                withPadding
                                column={2}
                                >
                                    <Input
                                    placeholder={'Cari'}
                                    value={_searchQuery}
                                    onChange={(query) => {
                                        _setSearchQuery(query)
                                        if(query.length < 2){
                                            _getUser(_pageUser, query)  
                                        }
                                    }}
                                    />
                                </Col>
                            )
                        }
                       
                        
                        {
                            _activeIndex != "1" && (
                                <Col
                                withPadding
                                column={2}
                                >
                                    <Button
                                    title={_activeIndex == "2" ? "Pengaturan" : "Tambah"}
                                    onClick={() => {
                                        _setIsOpenModal(true)
                                    }}
                                    small
                                    />
                                </Col>
                            )
                        }               

                    </Row>
                )}
                columns={__COLUMNS_USER}
                records={_userLists.data}
                config={_paginationConfig}
                onRecordsPerPageChange={perPage => _setPagination({ length : perPage, startFrom : 0 })}
                onPageChange={page => _setPagination({ ..._pageUser, startFrom : (page - 1) * _pageUser.length })}
                />
            </Card>
              

           
                  
            </AdminLayout>
        </Main>
    )

}